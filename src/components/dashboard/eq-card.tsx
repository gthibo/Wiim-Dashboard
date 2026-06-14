"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/toast";
import { apiSend, ApiError } from "@/lib/client/api";
import { EQ_PRESETS_FALLBACK } from "@/lib/wiim/constants";
import type { EqStatus } from "@/lib/wiim/types";

export function EqCard({
  deviceId,
  eq,
  onChanged,
}: {
  deviceId: string;
  eq: EqStatus;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(eq.enabled);
  const [selected, setSelected] = useState<string | null>(eq.current);
  const [busy, setBusy] = useState(false);

  const presets = eq.presets.length > 0 ? eq.presets : EQ_PRESETS_FALLBACK;

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await apiSend(`/api/devices/${deviceId}/eq`, "POST", body);
      onChanged();
    } catch (e) {
      toast((e as ApiError).message || "EQ command failed", "error");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function toggle(on: boolean) {
    setEnabled(on);
    try {
      await call({ action: on ? "on" : "off" });
    } catch {
      setEnabled(!on);
    }
  }

  async function pick(preset: string) {
    setSelected(preset);
    setEnabled(true);
    try {
      await call({ action: "load", preset });
    } catch {
      /* toast already shown */
    }
  }

  return (
    <Card className="pb-5">
      <CardHeader
        icon={<SlidersHorizontal className="size-4" />}
        title="Equalizer"
        action={<Switch checked={enabled} onChange={toggle} disabled={busy} aria-label="Toggle EQ" />}
      />
      <div className="px-5 pt-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              disabled={busy}
              className="focus-ring flex w-full items-center justify-between rounded-2xl border border-border bg-white/[0.03] px-4 py-3 text-sm transition hover:bg-white/[0.06] disabled:opacity-50"
            >
              <span className={selected ? "text-foreground" : "text-muted-foreground"}>
                {selected ?? "Select preset"}
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="glass z-50 max-h-72 min-w-[--radix-dropdown-menu-trigger-width] overflow-y-auto rounded-2xl p-1.5 shadow-2xl"
            >
              {presets.map((p) => (
                <DropdownMenu.Item
                  key={p}
                  onSelect={() => void pick(p)}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm outline-none transition data-[highlighted]:bg-white/8"
                >
                  {p}
                  {p === selected && <Check className="size-4 text-primary" />}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <p className="mt-2 text-xs text-muted-foreground">
          {enabled ? "EQ is on" : "EQ is off"}
        </p>
      </div>
    </Card>
  );
}
