"use client";

import { Cpu, Wifi, Globe, Tag } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import type { DeviceInfo } from "@/lib/wiim/types";

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

export function DeviceInfoCard({ info }: { info: DeviceInfo }) {
  return (
    <Card className="pb-5">
      <CardHeader icon={<Cpu className="size-4" />} title="Device" />
      <div className="divide-y divide-border/60 px-5 pt-2">
        <Row icon={<Tag className="size-4" />} label="Model" value={info.model || "—"} />
        <Row icon={<Cpu className="size-4" />} label="Firmware" value={info.firmware || "—"} />
        <Row icon={<Globe className="size-4" />} label="IP" value={info.ip || "—"} />
        <Row
          icon={<Wifi className="size-4" />}
          label="Signal"
          value={info.rssi != null ? `${info.rssi} dBm` : info.internet ? "Online" : "—"}
        />
      </div>
    </Card>
  );
}
