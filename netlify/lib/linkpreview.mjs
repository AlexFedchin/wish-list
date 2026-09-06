/**
 * Pulls the picture a page advertises to link unfurlers (Open Graph and
 * friends). Kept free of storage and HTTP plumbing so it can be exercised on
 * its own.
 */

const HTML_BUDGET_BYTES = 256 * 1024;
const FETCH_TIMEOUT_MS = 6000;

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

// Ordered best-first. Open Graph is what shops actually publish; the rest are
// fallbacks for older or hand-rolled pages.
const META_KEYS = [
  "og:image:secure_url",
  "og:image:url",
  "og:image",
  "twitter:image",
  "twitter:image:src",
  "image",
];

export function findImage(html) {
  const found = new Map();

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (
      attribute(tag, "property") ||
      attribute(tag, "name") ||
      attribute(tag, "itemprop")
    ).toLowerCase();
    const content = attribute(tag, "content");
    if (key && content && !found.has(key)) found.set(key, content);
  }

  for (const key of META_KEYS) {
    if (found.has(key)) return found.get(key);
  }

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = attribute(tag, "rel").toLowerCase();
    if (rel === "image_src" || rel === "apple-touch-icon") {
      const href = attribute(tag, "href");
      if (href) return href;
    }
  }

  return "";
}

/** Reads just enough of the response to cover <head>, then drops the rest. */
async function readHead(response) {
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
      if (/<\/head>/i.test(html)) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  return html;
}

/** Resolves the image behind a page URL, or "" when there is nothing to show. */
export async function scrapeImage(url) {
  if (LOOKS_LIKE_IMAGE.test(url.pathname)) return url.toString();

  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      // Some shops serve a stripped page to unknown agents and a full one with
      // Open Graph tags to anything that looks like a link unfurler.
      "user-agent":
        "Mozilla/5.0 (compatible; WishstandBot/1.0; +https://wishstand.app)",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en",
    },
  });

  if (!response.ok) return "";

  const type = response.headers.get("content-type") || "";
  if (type.startsWith("image/")) return response.url || url.toString();
  if (!type.includes("html")) return "";

  const candidate = findImage(await readHead(response));
  if (!candidate) return "";

  // Relative paths resolve against the page we actually landed on, which may
  // differ from the requested URL after redirects.
  return publicUrl(candidate, response.url || url.toString())?.toString() ?? "";
}
