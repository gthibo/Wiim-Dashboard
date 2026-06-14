/** Normalised, UI-friendly shapes derived from the raw WiiM API responses. */

export type PlaybackState = "playing" | "paused" | "stopped" | "loading";

export interface PlayerStatus {
  state: PlaybackState;
  title: string | null;
  artist: string | null;
  album: string | null;
  albumArt: string | null; // absolute device URL (proxied to the client)
  position: number; // seconds
  duration: number; // seconds
  volume: number; // 0-100
  muted: boolean;
  /** raw numeric source mode (getPlayerStatusEx `mode`). */
  sourceMode: string;
  /** friendly current source label. */
  sourceLabel: string;
  /** which SOURCES.key this maps to, when identifiable. */
  sourceKey: string | null;
  repeat: "off" | "one" | "all";
  shuffle: boolean;
  /** numeric EQ preset index from player status (presentational only). */
  eqIndex: number;
  quality: string | null; // e.g. "44.1 kHz / 16 bit"
}

export interface DeviceInfo {
  name: string;
  model: string; // marketing-ish (project / priv_prj)
  project: string;
  firmware: string;
  mac: string;
  uuid: string;
  ip: string;
  rssi: number | null;
  internet: boolean;
  group: string; // "0" master/standalone, "1" follower
  /** temperatures in °C when the model exposes them (amp models). */
  temperatureCpu: number | null;
  temperatureBoard: number | null;
  /** number of preset slots (preset_key). */
  presetCount: number;
}

export interface SubwooferStatus {
  enabled: boolean;
  connected: boolean;
  level: number; // -15..+15 dB
  crossover: number; // 30..250 Hz
  phase: number; // 0 | 180
  delay: number; // ms
  mainBassFilter: boolean | null;
  subBypass: boolean | null;
}

export interface OutputStatus {
  hardware: number; // current OUTPUTS.id
  bluetoothSource: boolean;
  audioCast: boolean;
}

export interface EqStatus {
  enabled: boolean;
  current: string | null; // current preset name
  presets: string[];
}

export interface PresetItem {
  index: number; // 1-based slot
  name: string | null; // null = empty slot
  hasArt: boolean; // artwork available (served via the preset-art proxy)
}

export interface DeviceCapabilities {
  /** temperature fields present (amp models). */
  temperature: boolean;
  /** number of preset slots (getStatusEx `preset_key`), 0 if unsupported. */
  presetCount: number;
  /** getSubLPF returned a valid payload. */
  subwoofer: boolean;
  /** EQ_support flag / EQ commands work. */
  equalizer: boolean;
  /** getNewAudioOutputHardwareMode works. */
  outputSwitch: boolean;
  /** input source keys this device supports (from plm_support / model). */
  sources: string[];
  /** output ids this device offers. */
  outputs: number[];
  isAmp: boolean;
}

/** Everything the dashboard needs for one device in a single poll. */
export interface DeviceSnapshot {
  id: string;
  online: boolean;
  error?: string;
  info: DeviceInfo | null;
  player: PlayerStatus | null;
  sub: SubwooferStatus | null;
  output: OutputStatus | null;
  eq: EqStatus | null;
  presets: PresetItem[] | null;
  capabilities: DeviceCapabilities | null;
}
