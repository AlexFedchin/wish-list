import { createHash } from "node:crypto";
import { fail, handle, json } from "../lib/http.mjs";
import { linkPreviewStore } from "../lib/db.mjs";
import { publicUrl, scrapeImage } from "../lib/linkpreview.mjs";

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
// A page that gave us nothing is retried sooner: it may just have been slow.
const MISS_TTL_MS = 1000 * 60 * 60 * 12;

const CACHE_HEADERS = { "cache-control": "private, max-age=86400" };

/**
 * Looks up the picture behind a gift link so the wish list can show it.
 * Answers are cached in blobs, because the same shop link turns up on plenty of
 * lists and scraping it once is enough.
 */
export default handle(async (req) => {
  if (req.method !== "GET") return fail("Method not allowed", 405);

  const target = publicUrl(new URL(req.url).searchParams.get("url") || "");
  if (!target) return json({ image: null });

  const key = createHash("sha256").update(target.toString()).digest("hex").slice(0, 40);
  const store = linkPreviewStore();

  const cached = await store.get(key, { type: "json" }).catch(() => null);
  if (cached && Date.now() - cached.at < (cached.image ? CACHE_TTL_MS : MISS_TTL_MS)) {
    return json({ image: cached.image || null }, 200, CACHE_HEADERS);
  }

  let image = "";
  try {
    image = await scrapeImage(target);
  } catch (err) {
    // A dead host, a timeout or a page that refuses bots all mean the same
    // thing to the caller: there is no picture to show.
    console.warn("preview failed for", target.hostname, err?.name || err);
  }

  await store.setJSON(key, { image, at: Date.now() }).catch(() => {});
  return json({ image: image || null }, 200, CACHE_HEADERS);
});

export const config = { path: "/api/preview" };
