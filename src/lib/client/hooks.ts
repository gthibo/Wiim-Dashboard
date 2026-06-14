"use client";

import useSWR from "swr";
import { apiGet } from "./api";
import type { DeviceSnapshot } from "@/lib/wiim/types";

export interface DeviceListItem {
  id: string;
  name: string;
  host: string;
  port: number;
  capabilities: import("@/lib/wiim/types").DeviceCapabilities | null;
  info: import("@/lib/wiim/types").DeviceInfo | null;
  sortOrder: number;
  sourceLabels?: Record<string, string>;
}

export function useDevices(initial?: DeviceListItem[]) {
  const { data, error, isLoading, mutate } = useSWR<{ devices: DeviceListItem[] }>(
    "/api/devices",
    (url: string) => apiGet<{ devices: DeviceListItem[] }>(url),
    { fallbackData: initial ? { devices: initial } : undefined, revalidateOnFocus: false },
  );
  return { devices: data?.devices ?? [], error, isLoading, mutate };
}

type SettingsResponse = {
  turnstile: { enabled: boolean; siteKey: string; hasSecret: boolean };
  app: { pollIntervalMs: number };
};

export function useSettings() {
  const { data, mutate } = useSWR<SettingsResponse>(
    "/api/settings",
    (url: string) => apiGet<SettingsResponse>(url),
    { revalidateOnFocus: false },
  );
  return { settings: data, mutate };
}

export function useSnapshot(deviceId: string | null, intervalMs: number) {
  const { data, error, isLoading, mutate } = useSWR<{ snapshot: DeviceSnapshot }>(
    deviceId ? `/api/devices/${deviceId}/snapshot` : null,
    (url: string) => apiGet<{ snapshot: DeviceSnapshot }>(url),
    {
      refreshInterval: intervalMs,
      keepPreviousData: true,
      revalidateOnFocus: true,
      dedupingInterval: 1000,
    },
  );
  return { snapshot: data?.snapshot ?? null, error, isLoading, mutate };
}
