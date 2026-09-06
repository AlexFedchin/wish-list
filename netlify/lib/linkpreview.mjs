/**
 * Pulls the picture a page advertises to link unfurlers (Open Graph, Twitter
 * cards, schema.org). Kept free of storage and HTTP plumbing so it can be
 * exercised on its own.
 *
 * Shop pages are hostile in specific ways, and each rule here answers one:
 * they block unknown user agents, they answer product URLs with a 404 status
 * while still serving a complete page, they leave `og:image` present but empty
 * and put the real picture in JSON-LD, and they are slow.
 */

const HTML_BUDGET_BYTES = 384 * 1024;
// Netlify gives a synchronous function 10s in total, so the fetch has to leave
// room for parsing and the cache write behind it.
const FETCH_TIMEOUT_MS = 7000;

const LOOKS_LIKE_IMAGE = /\.(avif|gif|jpe?g|png|webp)(?:[?#]|$)/i;

/**
 * Hostnames that would resolve inside the platform's own network. Gift links
 * are always public pages, so anything internal is refused rather than fetched.
 */
const PRIVATE_HOST =
  /^(?:localhost|\[?::1\]?|.+\.(?:local|internal|localhost)|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/i;

export function publicUrl(raw, base) {
  let url;
  try {
    url = new URL(raw, base);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (PRIVATE_HOST.test(url.hostname)) return null;
  return url;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", "#x27": "'" };
const decode = (value) =>
  value.replace(
    /&(amp|lt|gt|quot|#39|#x27);/gi,
    (whole, name) => ENTITIES[name.toLowerCase()] ?? whole,
  );

function attribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"),
  );
  if (!match) return "";
  return decode(match[1] ?? match[2] ?? match[3] ?? "").trim();
}

// Ordered best-first. Open Graph is what most shops publish; the rest are
// fallbacks for older, hand-rolled or client-rendered pages.
const META_KEYS = [
  "og:image:secure_url",
  "og:image:url",
  "og:image",
  "twitter:image",
  "twitter:image:src",
  "image",
  "thumbnail",
];

/** Pulls the first usable `image` out of a parsed JSON-LD blob. */
function imageFromLd(node, depth = 0) {
  if (!node || depth > 6) return "";
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = imageFromLd(entry, depth + 1);
      if (found) return found;
    }
    return "";
  }
  if (typeof node !== "object") return "";

  const image = node.image ?? node.thumbnailUrl ?? node.logo;
  if (typeof image === "string" && image.trim()) return image.trim();
  if (Array.isArray(image)) {
    const first = imageFromLd(image, depth + 1);
    if (first) return first;
  }
  if (image && typeof image === "object") {
    const url = image.url ?? image.contentUrl;
    if (typeof url === "string" && url.trim()) return url.trim();
  }

  // Products are often nested under @graph or mainEntity.
  for (const key of ["@graph", "mainEntity", "itemListElement", "hasVariant"]) {
    const found = imageFromLd(node[key], depth + 1);
    if (found) return found;
  }
  return "";
}

function imageFromJsonLd(html) {
  const blocks = html.match(
    /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks ?? []) {
    const body = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const found = imageFromLd(JSON.parse(body));
      if (found) return found;
    } catch {
      /* one malformed block should not stop us looking at the next */
    }
  }
  return "";
}

export function findImage(html) {
  const found = new Map();

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (
      attribute(tag, "property") ||
      attribute(tag, "name") ||
      attribute(tag, "itemprop")
    ).toLowerCase();
    const content = attribute(tag, "content");
    // Plenty of shops emit `<meta property="og:image" content="">` and put the
    // real picture elsewhere, so an empty value counts as absent.
    if (key && content && !found.has(key)) found.set(key, content);
  }

  for (const key of META_KEYS) {
    if (found.has(key)) return found.get(key);
  }

  const structured = imageFromJsonLd(html);
  if (structured) return structured;

  for (const rel of ["image_src", "apple-touch-icon", "apple-touch-icon-precomposed"]) {
    for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
      if (attribute(tag, "rel").toLowerCase() !== rel) continue;
      const href = attribute(tag, "href");
      if (href) return href;
    }
  }

  return "";
}

/** Reads the response up to a byte budget, stopping early once it is enough. */
async function readCapped(response) {
  const reader = response.body?.getReader?.();
  if (!reader) return (await response.text()).slice(0, HTML_BUDGET_BYTES);

  const decoder = new TextDecoder("utf-8");
  let html = "";
  let bytes = 0;

  try {
    while (bytes < HTML_BUDGET_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      // Only stop at the end of the head if it actually carried a picture;
      // otherwise keep going, because JSON-LD usually sits in the body.
      if (/<\/head>/i.test(html) && findImage(html)) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  return html;
}

export async function fetchPage(url) {
  return fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      // Retailers serve their unfurl markup to link previewers and something
      // else (a 403, or a script-only shell) to everyone else, so the agent
      // says who we are and carries the token they actually match on.
      "user-agent":
        "Mozilla/5.0 (compatible; WishstandBot/1.0; +https://wishstand.app) facebookexternalhit/1.1",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
  });
}

/** Resolves the image behind a page URL, or "" when there is nothing to show. */
export async function scrapeImage(url) {
  if (LOOKS_LIKE_IMAGE.test(url.pathname)) return url.toString();

  const response = await fetchPage(url);

  const type = response.headers.get("content-type") || "";
  if (type.startsWith("image/")) return response.url || url.toString();
  if (type && !type.includes("html") && !type.includes("xml")) return "";

  // Deliberately not gated on response.ok: several retailers answer a perfectly
  // good product page with a 404 or 410 status, tags and all.
  const candidate = findImage(await readCapped(response));
  if (!candidate) return "";

  // Relative paths resolve against the page we actually landed on, which may
  // differ from the requested URL after redirects.
  return publicUrl(candidate, response.url || url.toString())?.toString() ?? "";
}
