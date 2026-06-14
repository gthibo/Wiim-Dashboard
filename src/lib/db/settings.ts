import "server-only";
import { getDb } from "./index";

/** Generic key/value settings stored as JSON. */
export function getSetting<T>(key: string, fallback: T): T {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function setSetting<T>(key: string, value: T): void {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, JSON.stringify(value));
}

export function deleteSetting(key: string): void {
  getDb().prepare("DELETE FROM settings WHERE key = ?").run(key);
}

// --- typed settings helpers --------------------------------------------------

export interface TurnstileSettings {
  enabled: boolean;
  siteKey: string;
  secretKey: string;
}

export interface AppSettings {
  pollIntervalMs: number;
}

export const SettingKeys = {
  turnstile: "turnstile",
  app: "app",
  sourceLabels: "sourceLabels",
} as const;

/**
 * Per-device custom source names. The WiiM API doesn't expose the input
 * aliases set in the WiiM app, so the dashboard stores its own overrides:
 * { [deviceId]: { [sourceKey]: label } }.
 */
type SourceLabelMap = Record<string, Record<string, string>>;

export function getSourceLabels(deviceId: string): Record<string, string> {
  const all = getSetting<SourceLabelMap>(SettingKeys.sourceLabels, {});
  return all[deviceId] ?? {};
}

export function setSourceLabels(deviceId: string, labels: Record<string, string>): void {
  const all = getSetting<SourceLabelMap>(SettingKeys.sourceLabels, {});
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(labels)) {
    if (typeof v === "string" && v.trim()) clean[k] = v.trim().slice(0, 32);
  }
  all[deviceId] = clean;
  setSetting(SettingKeys.sourceLabels, all);
}

export function deleteSourceLabels(deviceId: string): void {
  const all = getSetting<SourceLabelMap>(SettingKeys.sourceLabels, {});
  if (deviceId in all) {
    delete all[deviceId];
    setSetting(SettingKeys.sourceLabels, all);
  }
}
