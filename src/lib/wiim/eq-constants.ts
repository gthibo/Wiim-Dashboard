import type { EqType } from "./types";

/**
 * WiiM "EQ v2" (LV2) constants — graphic (Eq10HP) + parametric (EqNp).
 * Verified live on WiiM Ultra fw 5.2.x. All values are real dB/Hz via the
 * LV2 endpoints. These commands are UNDOCUMENTED; the EQ feature self-disables
 * if a device/firmware stops answering them.
 */

export const EQ_PLUGIN: Record<EqType, string> = {
  graphic: "http://moddevices.com/plugins/caps/Eq10HP",
  parametric: "http://moddevices.com/plugins/caps/EqNp",
};

export const EQ_PLUGIN_TO_TYPE: Record<string, EqType> = {
  [EQ_PLUGIN.graphic]: "graphic",
  [EQ_PLUGIN.parametric]: "parametric",
};

/** Fixed 10-band graphic frequencies (device param name → display label). */
export const GRAPHIC_BANDS: { param: string; label: string }[] = [
  { param: "band31hz", label: "31" },
  { param: "band63hz", label: "63" },
  { param: "band125hz", label: "125" },
  { param: "band250hz", label: "250" },
  { param: "band500hz", label: "500" },
  { param: "band1khz", label: "1k" },
  { param: "band2khz", label: "2k" },
  { param: "band4khz", label: "4k" },
  { param: "band8khz", label: "8k" },
  { param: "band16khz", label: "16k" },
];

export const GRAPHIC_GAIN = { min: -12, max: 12, step: 0.5 } as const;

/** Parametric: 12 bands a–l in firmware, 10 (a–j) shown in the UI. */
export const PEQ_LETTERS_ALL = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"] as const;
export const PEQ_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"] as const;

/**
 * Per-band colour ramp for the visible bands a–j, warm→cool. Faceplate-
 * harmonised rather than a spectrum: it walks from velvet-red through the rust
 * primary and an amber/olive middle into tape-teal, all at moderate saturation
 * and mid lightness so the set reads as one family against the walnut. Anchored
 * on the locked tokens — rust #C64C1A (hsl 17 77 44), tape teal #2E7D7A
 * (hsl 178 46 33), velvet #7A2424 (hsl 0 54 31). Indexed to PEQ_LETTERS so a
 * given letter is ALWAYS the same colour. Shared by the response-curve plot
 * (lines + dots) and the parametric row letters, so the panel reads as one
 * legend. Off/disabled rows deliberately do NOT use these — see bandColor().
 */
export const BAND_COLORS: string[] = [
  "hsl(0 52% 42%)", // a — velvet red
  "hsl(12 68% 46%)", // b — red-rust
  "hsl(20 74% 48%)", // c — rust (primary neighbourhood)
  "hsl(32 66% 50%)", // d — amber
  "hsl(44 52% 52%)", // e — warm ochre
  "hsl(62 34% 50%)", // f — olive
  "hsl(120 26% 44%)", // g — muted green
  "hsl(160 34% 42%)", // h — green-teal
  "hsl(178 46% 40%)", // i — tape teal
  "hsl(196 44% 46%)", // j — cool blue-teal
];

/** Colour for a band letter, stable regardless of array order. Returns the
 *  ramp colour for a–j; anything else (k/l/unknown) falls back to rust. */
export function bandColor(letter: string): string {
  const idx = (PEQ_LETTERS as readonly string[]).indexOf(letter);
  return idx >= 0 ? BAND_COLORS[idx] : "hsl(var(--primary))";
}

export const PEQ_DEFAULT_FREQ: Record<string, number> = {
  a: 31.25, b: 62.5, c: 125, d: 250, e: 500, f: 1000, g: 2000, h: 4000, i: 8000, j: 16000,
  k: 18000, l: 20000,
};

export const PEQ_RANGE = {
  freqMin: 20,
  freqMax: 20000,
  qMin: 0.1,
  qMax: 24,
  gainMin: -12,
  gainMax: 12,
} as const;

export const PEQ_MODES: { value: number; label: string }[] = [
  { value: -1, label: "Off" },
  { value: 0, label: "Low Shelf" },
  { value: 1, label: "Peak" },
  { value: 2, label: "High Shelf" },
  { value: 3, label: "Low Pass" },
  { value: 5, label: "High Pass" },
];

export const CHANNEL_MODE_STEREO = "Stereo";

/** EQ commands. */
export const EqCmd = {
  // reads (LV2, return real dB/Hz)
  getBand: (pluginURI: string) => `EQGetLV2BandEx:${enc(pluginURI)}`,
  getSourceBand: (source: string, pluginURI: string) =>
    `EQGetLV2SourceBandEx:${json({ source_name: source, pluginURI })}`,
  // writes
  setSourceBand: (payload: Record<string, unknown>) => `EQSetLV2SourceBand:${json(payload)}`,
  // enable/disable per source
  changeSourceFx: (source: string, pluginURI: string) =>
    `EQChangeSourceFX:${json({ source_name: source, pluginURI })}`,
  sourceOff: (source: string, pluginURI: string) =>
    `EQSourceOff:${json({ source_name: source, pluginURI })}`,
  // presets
  list: (pluginURI: string) => `EQv2GetList:${enc(pluginURI)}`,
  sourceLoad: (source: string, pluginURI: string, name: string) =>
    `EQv2SourceLoad:${json({ source_name: source, pluginURI, Name: name })}`,
  sourceSave: (source: string, pluginURI: string, name: string) =>
    `EQSourceSave:${json({ source_name: source, pluginURI, Name: name })}`,
  delete: (pluginURI: string, name: string) => `EQv2Delete:${json({ pluginURI, Name: name })}`,
  rename: (pluginURI: string, name: string, newName: string) =>
    `EQv2Rename:${json({ pluginURI, Name: name, newName })}`,
} as const;

function enc(s: string): string {
  return encodeURIComponent(s);
}
function json(payload: Record<string, unknown>): string {
  return encodeURIComponent(JSON.stringify(payload));
}
