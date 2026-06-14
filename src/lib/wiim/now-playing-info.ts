import "server-only";
import type { StreamService, AudioFormat } from "./types";

/**
 * Now-playing service + audio-format detection.
 *
 * The WiiM HTTP API has NO `vendor` field and NO codec field, so:
 *  - the streaming SERVICE is derived from getPlayerStatusEx `mode` (Connect/
 *    cast sessions have dedicated codes; in-app network playback is mode 10/20
 *    and is named by sniffing the album-art URL host);
 *  - the CODEC is *inferred* from the bit-depth/sample-rate quality tier plus
 *    the known service (e.g. Tidal/Qobuz lossless = FLAC, Spotify = OGG).
 * Both are best-effort and clearly marked as inferred in the UI types.
 */

interface SvcDef {
  key: string;
  name: string;
  logo: string | null;
}

/** Dedicated mode codes (Connect / cast sessions + protocols). */
const SERVICE_BY_MODE: Record<string, SvcDef> = {
  "1": { key: "airplay", name: "AirPlay", logo: "airplay" },
  "2": { key: "dlna", name: "DLNA", logo: null },
  "3": { key: "qplay", name: "QPlay", logo: null },
  "31": { key: "spotify", name: "Spotify Connect", logo: "spotify" },
  "32": { key: "tidal", name: "TIDAL Connect", logo: "tidal" },
  "36": { key: "qobuz", name: "Qobuz Connect", logo: "qobuz" },
  "41": { key: "bluetooth", name: "Bluetooth", logo: "bluetooth" },
};

/** Generic network modes (in-app streaming) — service guessed from art host. */
const NETWORK_MODES = new Set(["10", "11", "12", "13", "14", "16", "20", "21", "30"]);

/** Album-art host substrings → service (for the generic network path). */
const SERVICE_BY_HOST: { match: string; def: SvcDef }[] = [
  { match: "tidal", def: { key: "tidal", name: "TIDAL", logo: "tidal" } },
  { match: "dzcdn", def: { key: "deezer", name: "Deezer", logo: "deezer" } },
  { match: "deezer", def: { key: "deezer", name: "Deezer", logo: "deezer" } },
  { match: "qobuz", def: { key: "qobuz", name: "Qobuz", logo: "qobuz" } },
  { match: "media-amazon", def: { key: "amazon", name: "Amazon Music", logo: "amazon" } },
  { match: "amazon", def: { key: "amazon", name: "Amazon Music", logo: "amazon" } },
  { match: "scdn", def: { key: "spotify", name: "Spotify", logo: "spotify" } },
  { match: "spotify", def: { key: "spotify", name: "Spotify", logo: "spotify" } },
  { match: "sndcdn", def: { key: "soundcloud", name: "SoundCloud", logo: "soundcloud" } },
  { match: "soundcloud", def: { key: "soundcloud", name: "SoundCloud", logo: "soundcloud" } },
  { match: "ytimg", def: { key: "youtubemusic", name: "YouTube Music", logo: "youtubemusic" } },
  { match: "googleusercontent", def: { key: "youtubemusic", name: "YouTube Music", logo: "youtubemusic" } },
  { match: "tunein", def: { key: "tunein", name: "TuneIn", logo: "tunein" } },
  { match: "radiotime", def: { key: "tunein", name: "TuneIn", logo: "tunein" } },
];

/** Resolve the streaming service for the given player `mode` + art URL. */
export function detectService(mode: string, albumArtURI: string | null): StreamService | null {
  const direct = SERVICE_BY_MODE[mode];
  if (direct) return { ...direct };

  if (NETWORK_MODES.has(mode)) {
    if (albumArtURI) {
      let host = albumArtURI.toLowerCase();
      try {
        host = new URL(albumArtURI).host.toLowerCase();
      } catch {
        /* not a URL — match against the raw string */
      }
      for (const { match, def } of SERVICE_BY_HOST) {
        if (host.includes(match)) return { ...def };
      }
    }
    return { key: "network", name: "Network", logo: null };
  }
  return null; // physical inputs etc. — no info block
}

/** Inferred codec name from the service + quality tier (best effort). */
function inferCodec(service: string | null, lossless: boolean): string | null {
  switch (service) {
    case "tidal":
      return lossless ? "FLAC" : "AAC";
    case "qobuz":
      return "FLAC";
    case "amazon":
      return lossless ? "FLAC" : "AAC";
    case "deezer":
      return lossless ? "FLAC" : "MP3";
    case "spotify":
      return "OGG";
    case "youtubemusic":
      return "AAC";
    case "soundcloud":
      return lossless ? "FLAC" : "AAC";
    case "airplay":
      return "ALAC"; // AirPlay streams ALAC
    case "qplay":
      return lossless ? "FLAC" : "AAC";
    case "dlna":
    case "network":
    case "roon":
      return lossless ? "FLAC" : null; // unknown lossy container — don't guess
    case "bluetooth":
      return null; // codec not exposed for the BT sink
    default:
      return lossless ? "FLAC" : null;
  }
}

/** Build the AudioFormat from raw getMetaInfo numbers + the detected service. */
export function inferAudioFormat(
  serviceKey: string | null,
  sampleRate: number | null,
  bitDepth: number | null,
  bitRate: number | null,
): AudioFormat | null {
  let tier: AudioFormat["tier"] = null;
  const lossless = bitDepth != null && bitDepth >= 16;
  if (lossless) {
    tier = bitDepth! >= 24 || (sampleRate != null && sampleRate > 48000) ? "hires" : "lossless";
  } else if ((bitRate != null && bitRate > 0) || (sampleRate != null && sampleRate > 0)) {
    // A sample-rate/bitrate but no bit-depth ⇒ a lossy codec (MP3/AAC/OGG).
    tier = "lossy";
  }

  const codec = tier == null ? null : inferCodec(serviceKey, lossless);

  if (tier == null && codec == null && sampleRate == null && bitDepth == null && bitRate == null) {
    return null;
  }
  return { codec, tier, sampleRate, bitDepth, bitRate };
}
