"use client";

import { useEffect, useState } from "react";
import { Waves } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StepperSlider } from "@/components/ui/stepper-slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/toast";
import { apiSend, ApiError } from "@/lib/client/api";
import { SUB_RANGES } from "@/lib/wiim/constants";
import { cn } from "@/lib/utils";
import type { SubwooferStatus } from "@/lib/wiim/types";

export function SubCard({
  deviceId,
  sub,
  onChanged,
}: {
  deviceId: string;
  sub: SubwooferStatus;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [level, setLevel] = useState(sub.level);
  const [cross, setCross] = useState(sub.crossover);
  const [enabled, setEnabled] = useState(sub.enabled);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) {
      setLevel(sub.level);
      setCross(sub.crossover);
    }
    setEnabled(sub.enabled);
  }, [sub.level, sub.crossover, sub.enabled, dragging]);

  async function set(param: string, value: number, revert?: () => void) {
    try {
      await apiSend(`/api/devices/${deviceId}/sub`, "POST", { param, value });
      onChanged();
    } catch (e) {
      toast((e as ApiError).message || "Sub-out command failed", "error");
      revert?.();
    }
  }

  return (
    <Card className="pb-5">
      <CardHeader
        icon={<Waves className="size-4" />}
        title="Sub-out"
        action={
          <div className="flex items-center gap-3">
            {sub.connected && (
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                connected
              </span>
            )}
            <Switch
              checked={enabled}
              onChange={(v) => {
                setEnabled(v);
                void set("status", v ? 1 : 0, () => setEnabled(!v));
              }}
              aria-label="Toggle sub-out"
            />
          </div>
        }
      />

      <div className={cn("space-y-5 px-5 pt-4 transition-opacity", !enabled && "pointer-events-none opacity-50")}>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Level</span>
            <span className="tabular-nums font-medium">
              {level > 0 ? `+${level}` : level} {SUB_RANGES.level.unit}
            </span>
          </div>
          <StepperSlider
            value={level}
            min={SUB_RANGES.level.min}
            max={SUB_RANGES.level.max}
            step={SUB_RANGES.level.step}
            bigStep={1}
            onChange={(v) => {
              setDragging(true);
              setLevel(v);
            }}
            onCommit={(v) => {
              setDragging(false);
              void set("level", v);
            }}
            ariaLabel="Sub level"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Crossover</span>
            <span className="tabular-nums font-medium">
              {cross} {SUB_RANGES.cross.unit}
            </span>
          </div>
          <StepperSlider
            value={cross}
            min={SUB_RANGES.cross.min}
            max={SUB_RANGES.cross.max}
            step={SUB_RANGES.cross.step}
            bigStep={SUB_RANGES.cross.step}
            onChange={(v) => {
              setDragging(true);
              setCross(v);
            }}
            onCommit={(v) => {
              setDragging(false);
              void set("cross", v);
            }}
            ariaLabel="Crossover frequency"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Phase</span>
          <div className="flex overflow-hidden rounded-xl border border-border">
            {SUB_RANGES.phase.values.map((p) => (
              <button
                key={p}
                onClick={() => void set("phase", p)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium transition",
                  sub.phase === p
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/5",
                )}
              >
                {p}°
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
