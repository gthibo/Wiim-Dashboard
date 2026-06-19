"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  onCommit,
  disabled,
  className,
  ...rest
}: Props) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex h-6 w-full touch-none select-none items-center", className)}
      value={[value]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={(v) => onChange(v[0]!)}
      onValueCommit={(v) => onCommit?.(v[0]!)}
      aria-label={rest["aria-label"]}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/10">
        {/* Explicit gradient (not Tailwind's bg-gradient-* helper, which iOS
            WebKit fails to parse → the fill rendered dark on iPad). */}
        <SliderPrimitive.Range
          className="absolute h-full rounded-full"
          style={{
            backgroundImage: "linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))",
          }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block size-5 rounded-full border-2 border-primary bg-white shadow-lg shadow-primary/30 transition-transform focus-ring active:scale-110 disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  );
}
