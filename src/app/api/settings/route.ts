import { NextResponse } from "next/server";
import { z } from "zod";
import { guard, json } from "@/lib/api";
import { parseBody } from "@/lib/validate";
import {
  getSetting,
  setSetting,
  SettingKeys,
  type TurnstileSettings,
  type AppSettings,
} from "@/lib/db/settings";

export const dynamic = "force-dynamic";

const DEFAULT_APP: AppSettings = { pollIntervalMs: 3000 };

const PatchSchema = z.object({
  turnstile: z
    .object({
      enabled: z.boolean(),
      siteKey: z.string().trim().max(256),
      // omit/empty secretKey = keep existing
      secretKey: z.string().trim().max(256).optional(),
    })
    .optional(),
  app: z
    .object({
      pollIntervalMs: z.number().int().min(1000).max(60000),
    })
    .optional(),
});

/** Return settings with the Turnstile secret redacted. */
export async function GET(req: Request) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const turnstile = getSetting<TurnstileSettings | null>(SettingKeys.turnstile, null);
  const app = getSetting<AppSettings>(SettingKeys.app, DEFAULT_APP);
  return json({
    turnstile: {
      enabled: turnstile?.enabled ?? false,
      siteKey: turnstile?.siteKey ?? "",
      hasSecret: !!turnstile?.secretKey,
    },
    app,
  });
}

export async function PATCH(req: Request) {
  const g = await guard(req, { mutation: true });
  if (g instanceof NextResponse) return g;

  const parsed = await parseBody(req, PatchSchema);
  if (!parsed.ok) return parsed.res;

  if (parsed.data.turnstile) {
    const existing = getSetting<TurnstileSettings | null>(SettingKeys.turnstile, null);
    const t = parsed.data.turnstile;
    const next: TurnstileSettings = {
      enabled: t.enabled,
      siteKey: t.siteKey,
      // keep existing secret when not provided
      secretKey: t.secretKey && t.secretKey.length > 0 ? t.secretKey : existing?.secretKey ?? "",
    };
    setSetting(SettingKeys.turnstile, next);
  }

  if (parsed.data.app) {
    setSetting(SettingKeys.app, parsed.data.app);
  }

  return json({ ok: true });
}
