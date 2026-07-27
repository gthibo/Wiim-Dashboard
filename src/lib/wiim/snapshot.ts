import "server-only";
import { createHash } from "node:crypto";
import {
  fetchDeviceInfo,
  fetchPlayerStatus,
  fetchTrackMeta,
  fetchMetaInfo,
  fetchSubwoofer,
  fetchOutput,
  fetchPresets,
  fetchBtSourceName,
  fetchModeRename,
  fetchAudioInputEnable,
  fetchUsbDac,
  fetchMultiroomSlaves,
} from "./commands";
import { detectService, inferAudioFormat } from "./now-playing-info";
import { getSleep } from "@/lib/sleep/timer";
import type { DeviceSnapshot, DeviceCapabilities } from "./types";

export interface PollableDevice {
  id: string;
  ip: string;
  capabilities: DeviceCapabilities | null;
}

/** Fetch a complete, normalised snapshot for one device in a single round. */
export async function getDeviceSnapshot(device: PollableDevice): Promise<DeviceSnapshot> {
  const caps = device.capabilities;

  const [infoR, playerR, metaR, subR, outR, presetsR, renameR, inputEnR, usbDacR, slavesR] =
    await Promise.allSettled([
      fetchDeviceInfo(device.ip),
      fetchPlayerStatus(device.ip),
      fetchTrackMeta(device.ip),
      caps?.subwoofer ? fetchSubwoofer(device.ip) : Promise.resolve(null),
      caps?.outputSwitch ? fetchOutput(device.ip) : Promise.resolve(null),
      caps?.presetCount ? fetchPresets(device.ip, caps.presetCount) : Promise.resolve(null),
      fetchModeRename(device.ip),
      fetchAudioInputEnable(device.ip),
      fetchUsbDac(device.ip),
      // Not capability-gated like the calls above: whether this device is a
      // master can only be learned by asking, so every device is asked on
      // every poll. Cheap on a LAN; returns [] (not a master) on any failure.
      fetchMultiroomSlaves(device.ip),
    ]);

  // If both core reads failed, the device is offline/unreachable.
  if (infoR.status === "rejected" && playerR.status === "rejected") {
    return {
      id: device.id,
      online: false,
      error: reason(infoR) || reason(playerR) || "unreachable",
      info: null,
      player: null,
      sub: null,
      output: null,
      presets: null,
      capabilities: caps,
    };
  }

  const info = infoR.status === "fulfilled" ? infoR.value : null;
  let player = playerR.status === "fulfilled" ? playerR.value : null;

  // Master role/slave list can only come from multiroom:getSlaveList (see
  // fetchMultiroomSlaves) — getStatusEx never reports it. A non-empty result
  // means this device is a master regardless of what parseDeviceInfo guessed.
  if (info) {
    const slaves = slavesR.status === "fulfilled" ? slavesR.value : [];
    if (slaves.length > 0) {
      info.multiroomRole = "master";
      info.multiroomMasterIp = null;
      info.multiroomSlaves = slaves;
    }
  }

  // Confirmed multiroom slave: its own transport fields aren't trustworthy in
  // general. getPlayerStatusEx on a slave reports the audio it's relaying,
  // but `vendor`/title/artist go blank when the master is a Plex cast, and
  // `curpos` sits completely frozen (no advancing signal at all) when the
  // master is a Spotify Connect target — confirmed on real hardware for both.
  // Rather than infer anything from the slave's own fields, fetch the
  // master's OWN getPlayerStatusEx directly: the master is the one actually
  // playing, so its fields are honest regardless of source. Mirrored
  // verbatim except volume/mute, which stay this device's own (genuinely
  // per-device, not something a master mirrors). `metaIp` tracks which
  // device the meta/quality lookup and the vendor-push heuristic below
  // should also read from — the master's ip once mirroring succeeds.
  let metaIp = device.ip;
  if (player && info?.multiroomRole === "slave" && info.multiroomMasterIp) {
    const masterIp = info.multiroomMasterIp;
    const masterPlayer = await fetchPlayerStatus(masterIp).catch(() => null);
    // On failure (master transiently unreachable), fall back to the slave's
    // own — possibly stale/uninformative — status rather than erroring.
    if (masterPlayer) {
      player = { ...masterPlayer, volume: player.volume, muted: player.muted };
      metaIp = masterIp;
    }
  }

  if (player) {
    const emptyMeta = {
      albumArt: null,
      quality: null,
      sampleRate: null,
      bitDepth: null,
      bitRate: null,
      title: null,
      artist: null,
      album: null,
    };
    // Normal path: fetchTrackMeta already ran in parallel (metaR). Mirror path
    // (slave): re-fetch from the master's ip so metadata comes from the device
    // actually playing. Both yield { meta, transport }.
    const tm =
      metaIp !== device.ip
        ? await fetchTrackMeta(metaIp)
        : metaR.status === "fulfilled"
          ? metaR.value
          : { meta: emptyMeta, transport: null };
    let meta = tm.meta;
    const transport = tm.transport;

    // FORK DELTA (not upstream): our now-playing card shows kbps for ALL
    // sources, but GetInfoEx omits song:bitrate on this firmware. When
    // GetInfoEx supplied the metadata (cast/DLNA) but left bitRate null,
    // backfill it from getMetaInfo — a stable, correct bitrate that agrees
    // with GetInfoEx on the other fields (hardware-verified: Plex FLAC both
    // 16-bit/44.1k, httpapi adds the kbps). Only fires on the GetInfoEx-wins
    // branch; BT/physical already fall through to getMetaInfo inside
    // fetchTrackMeta, so bitRate is present there.
    if (meta.bitRate == null && (meta.albumArt || meta.sampleRate != null)) {
      const h = await fetchMetaInfo(metaIp).catch(() => null);
      if (h?.bitRate != null) {
        meta = {
          ...meta,
          bitRate: h.bitRate,
          quality:
            [
              `${h.bitRate} kbps`,
              meta.bitDepth != null ? `${meta.bitDepth}-bit` : null,
              meta.sampleRate != null
                ? `${(meta.sampleRate / 1000).toFixed(1).replace(/\.0$/, "")} kHz`
                : null,
            ]
              .filter(Boolean)
              .join(" · ") || meta.quality,
        };
      }
    }
    player.quality = meta.quality;
    // Sources like Bluetooth leave Title/Artist empty in getPlayerStatusEx but
    // provide them via getMetaInfo (AVRCP) — fall back to those (only when empty,
    // so streaming is untouched).
    player.title = player.title ?? meta.title;
    player.artist = player.artist ?? meta.artist;
    player.album = player.album ?? meta.album;
    if (player.title) player.title = tidyTrackTitle(player.title);
    // Detect the streaming service (mode + raw art host + vendor) and infer
    // the format. `vendor` lets DLNA/UPnP push sessions (Plex on mode 99) be
    // named and treated as a network source even though their mode isn't a
    // known streaming code.
    player.service = detectService(player.sourceMode, meta.albumArt, player.vendor);
    player.audio = inferAudioFormat(
      player.service?.key ?? null,
      meta.sampleRate,
      meta.bitDepth,
      meta.bitRate,
    );
    // For Bluetooth, also show which device is casting (getbtstatus a2dp_sink).
    if (player.service?.key === "bluetooth") {
      const dev = await fetchBtSourceName(metaIp).catch(() => null);
      if (dev) player.service = { ...player.service, detail: dev };
    }
    // Show art when the device provides it, or when we can look one up by
    // artist + album (local/NAS files often expose no embedded cover). The art
    // route resolves the actual image either way.
    if (meta.albumArt || (player.artist && player.album)) {
      const sig = createHash("sha1")
        .update(`${player.title ?? ""}|${player.artist ?? ""}|${player.album ?? ""}|${meta.albumArt ?? "lookup"}`)
        .digest("hex")
        .slice(0, 12);
      player.albumArt = `/api/devices/${device.id}/art?sig=${sig}`;
    }

    // Honest play state from GetInfoEx's CurrentTransportState, read from the
    // same source as the metadata (metaIp) — so a slave's state reflects the
    // master it mirrors. Gated on sourceKey === "wifi" (network/cast): physical
    // inputs and Bluetooth keep their httpapi-reported state, where GetInfoEx
    // transport is meaningless. Replaces the old mode-99 position-delta
    // heuristic — GetInfoEx reports honest play/pause/stop with no stuck-"stop"
    // bug, so no inference and no one-poll lag.
    if (transport?.state && player.sourceKey === "wifi") {
      player.state = transport.state;
    }
  }

  // Presets: use the parallel result, or fetch now if the cached capabilities
  // predate preset support (preset_key comes from the live device info).
  let presets = presetsR.status === "fulfilled" ? presetsR.value : null;
  if (!presets && info && info.presetCount > 0) {
    presets = await fetchPresets(device.ip, info.presetCount).catch(() => null);
  }

  return {
    id: device.id,
    online: true,
    info,
    player,
    sub: subR.status === "fulfilled" ? subR.value : null,
    output: outR.status === "fulfilled" ? outR.value : null,
    presets,
    capabilities: caps,
    sourceNames: renameR.status === "fulfilled" ? renameR.value : undefined,
    disabledSources:
      inputEnR.status === "fulfilled"
        ? Object.entries(inputEnR.value)
            .filter(([k, on]) => !on && k !== "wifi")
            .map(([k]) => k)
        : undefined,
    usbDac: usbDacR.status === "fulfilled" ? usbDacR.value : null,
    sleepExpiresAt: getSleep(device.id),
  };
}

/** Audio-file extensions used to recognise when a "title" is really a filename. */
const AUDIO_FILE_EXT = /\.(flac|mp3|wav|m4a|aac|ogg|opus|dsf|dff|aif|aiff|wma|alac|ape)$/i;

/**
 * Local/NAS files often report the raw filename as the title (e.g.
 * "01.In_The_Flesh.flac"). When a title is clearly a filename, drop the
 * extension + any leading track number and turn underscores into spaces.
 */
function tidyTrackTitle(title: string): string {
  if (!AUDIO_FILE_EXT.test(title)) return title;
  const cleaned = title
    .replace(AUDIO_FILE_EXT, "")
    .replace(/^\s*\d{1,3}\s*[.\-_)]\s*/, "")
    .replace(/_/g, " ")
    .trim();
  return cleaned || title;
}

function reason(r: PromiseSettledResult<unknown>): string | undefined {
  if (r.status === "rejected") {
    const e = r.reason as { message?: string };
    return e?.message;
  }
  return undefined;
}
