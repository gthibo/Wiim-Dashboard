import { NextResponse } from "next/server";
import { guard, apiError } from "@/lib/api";
import { resolveDevice } from "@/lib/device-route";
import { fetchPresetArtUrl } from "@/lib/wiim/commands";
import { wiimFetchRaw } from "@/lib/wiim/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const TRANSPARENT = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
function fallback(): Response {
  return new Response(TRANSPARENT, {
    headers: { "content-type": "image/png", "cache-control": "private, max-age=60" },
  });
}

// Server-side artwork cache so images are instant on every load (not just the
// browser cache) and the device is hit at most once per image per hour.
const artCache = new Map<string, { at: number; body: Buffer; contentType: string }>();
const ART_TTL_MS = 60 * 60 * 1000;

function serveImage(body: Buffer, contentType: string): Response {
  // Short browser cache: the bytes are already cached server-side (keyed on the
  // resolved art URL), so the browser doesn't need a long TTL — and a long one
  // would let a stale image outlive a preset re-point made from the WiiM app.
  return new Response(new Uint8Array(body), {
    headers: { "content-type": contentType, "cache-control": "private, max-age=60" },
  });
}

/** Proxy a preset's artwork. The client passes only the slot index; the URL is
 *  resolved server-side from getPresetInfo so this can't be an open proxy. */
export async function GET(req: Request, { params }: Params) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;
  const r = resolveDevice((await params).id);
  if ("res" in r) return r.res;

  const index = Number(new URL(req.url).searchParams.get("index"));
  if (!Number.isInteger(index) || index < 1 || index > 50) {
    return apiError(400, "Bad preset index", "BAD_INDEX");
  }

  // Resolve the slot's current art URL FIRST (cheap — behind getPresetList's
  // 30s cache) and key the byte cache on that URL, not on the slot index. When
  // a preset is re-pointed from the WiiM app the URL changes, so the key
  // changes and the stale bytes are simply never requested again — the old
  // index-keyed cache kept serving the previous image for up to an hour.
  let url: string | null;
  try {
    url = await fetchPresetArtUrl(r.device.host, index);
  } catch {
    return fallback();
  }
  if (!url) return fallback();

  const cacheKey = `${r.device.id}:${url}`;
  const hit = artCache.get(cacheKey);
  if (hit && Date.now() - hit.at < ART_TTL_MS) return serveImage(hit.body, hit.contentType);

  try {
    const res = await wiimFetchRaw(url, { deviceHost: r.device.host, timeoutMs: 7000 });
    if (res.status >= 400 || !res.contentType.startsWith("image/")) return fallback();
    if (artCache.size > 200) artCache.clear();
    artCache.set(cacheKey, { at: Date.now(), body: res.body, contentType: res.contentType });
    return serveImage(res.body, res.contentType);
  } catch {
    return fallback();
  }
}
