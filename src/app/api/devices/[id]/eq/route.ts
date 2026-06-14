import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, guard } from "@/lib/api";
import { parseBody } from "@/lib/validate";
import { resolveDevice, runDevice } from "@/lib/device-route";
import { setEq } from "@/lib/wiim/commands";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const Schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("on") }),
  z.object({ action: z.literal("off") }),
  z.object({ action: z.literal("load"), preset: z.string().trim().min(1).max(64) }),
]);

/** EQ control: enable/disable or load a named preset. */
export async function POST(req: Request, { params }: Params) {
  const g = await guard(req, { mutation: true });
  if (g instanceof NextResponse) return g;
  const r = resolveDevice((await params).id);
  if ("res" in r) return r.res;

  const parsed = await parseBody(req, Schema);
  if (!parsed.ok) return parsed.res;
  const data = parsed.data;

  if (data.action === "load") {
    // Preset names contain letters/digits/spaces/&/- only (e.g. "Bass Booster").
    if (!/^[\w &+'/.-]{1,64}$/.test(data.preset)) {
      return apiError(400, "Invalid preset name", "BAD_PRESET");
    }
    return runDevice(() => setEq(r.device.host, { type: "load", preset: data.preset }));
  }
  return runDevice(() => setEq(r.device.host, { type: data.action }));
}
