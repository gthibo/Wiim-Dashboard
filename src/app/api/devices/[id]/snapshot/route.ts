import { NextResponse } from "next/server";
import { guard, json } from "@/lib/api";
import { resolveDevice } from "@/lib/device-route";
import { getDeviceSnapshot } from "@/lib/wiim/snapshot";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Full live snapshot (player, sub, output, eq, temp) for one device. */
export async function GET(req: Request, { params }: Params) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;
  const r = resolveDevice((await params).id);
  if ("res" in r) return r.res;

  const snapshot = await getDeviceSnapshot({
    id: r.device.id,
    ip: r.device.host,
    capabilities: r.device.capabilities,
  });
  return json({ snapshot });
}
