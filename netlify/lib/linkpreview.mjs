/**
 * Pulls the picture a page advertises to link unfurlers (Open Graph, Twitter
 * cards, schema.org). Kept free of storage and HTTP plumbing so it can be
 * exercised on its own.
 *
 * Shop pages are hostile in specific ways, and each rule here answers one:
 * they block unknown user agents, they answer product URLs with a 404 status
 * while still serving a complete page, they leave `og:image` present but empty
 * and put the real picture in JSON-LD, and they are slow.
 *
 * The one thing a plain fetch cannot answer is bot management. Cloudflare and
 * friends decide by IP reputation and TLS fingerprint, not by user agent, so a
 * shop like notino.fi hands Telegram its Open Graph tags and hands us a 403
 * challenge page no matter what headers we send. That is what READER_ENDPOINT
 * below is for: a rendering proxy that fetches the page from an address the
 * shop trusts and hands back the finished HTML. It is only ever reached for
 * pages a direct fetch could not read, and answers are cached like any other.
 */

const HTML_BUDGET_BYTES = 384 * 1024;
// Netlify gives a synchronous function 10s in total, and a blocked page costs
// two fetches, so neither leg may spend more than about half of it.
const FETCH_TIMEOUT_MS = 4000;
const READER_TIMEOUT_MS = 4000;

// Jina's reader. No account needed; JINA_API_KEY only raises the rate limit.
// Set PREVIEW_READER to "off" to keep every gift link on this site.
const READER_ENDPOINT = "https://r.jina.ai/";

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

// Bot walls: an interstitial that is HTML, is not the product page, and often
// carries a logo we would otherwise mistake for the gift. Recognising one is
// what sends the request to the reader instead of trusting what came back.
const BLOCKED_MARKERS =
  /Just a moment\.\.\.|__cf_chl|cf-browser-verification|Checking your browser|Attention Required!|Enable JavaScript and cookies to continue|Access Denied|Request unsuccessful\. Incapsula|px-captcha|Pardon Our Interruption|are you a robot/i;

const looksBlocked = (status, html) =>
  (status === 401 || status === 403 || status === 429 || status === 503) &&
  BLOCKED_MARKERS.test(html.slice(0, 8 * 1024));

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

/**
 * Asks the reader proxy for the rendered page. Used only after a direct fetch
 * came back with nothing, which is either a bot wall or a page that paints its
 * meta tags in the browser.
 */
async function fetchThroughReader(url) {
  if ((process.env.PREVIEW_READER || "").toLowerCase() === "off") return "";

  const key = process.env.JINA_API_KEY;
  const response = await fetch(READER_ENDPOINT + url.toString(), {
    redirect: "follow",
    signal: AbortSignal.timeout(READER_TIMEOUT_MS),
    headers: {
      // Markdown is the reader's default and drops <meta>, which is the part
      // we came for.
      "x-return-format": "html",
      accept: "text/html,*/*;q=0.8",
      ...(key ? { authorization: `Bearer ${key}` } : {}),
    },
  });

  // A rate-limited or failing proxy is just another way of having no picture.
  if (!response.ok) return "";
  return readCapped(response);
}

/** First absolute, public image URL in `html`, resolved against `base`. */
function imageFrom(html, base) {
  const candidate = findImage(html);
  if (!candidate) return "";
  return publicUrl(candidate, base)?.toString() ?? "";
}

/** Resolves the image behind a page URL, or "" when there is nothing to show. */
export async function scrapeImage(url) {
  if (LOOKS_LIKE_IMAGE.test(url.pathname)) return url.toString();

  let landed = url.toString();

  try {
    const response = await fetchPage(url);

    const type = response.headers.get("content-type") || "";
    if (type.startsWith("image/")) return response.url || landed;
    if (!type || type.includes("html") || type.includes("xml")) {
      // Relative paths resolve against the page we actually landed on, which
      // may differ from the requested URL after redirects.
      landed = response.url || landed;
      const html = await readCapped(response);
      // Deliberately not gated on response.ok: several retailers answer a
      // perfectly good product page with a 404 or 410 status, tags and all.
      // A challenge page is the exception — whatever picture it carries is the
      // bot wall's, not the gift's.
      if (!looksBlocked(response.status, html)) {
        const found = imageFrom(html, landed);
        if (found) return found;
      }
    } else {
      // A PDF, a zip, something we can't read a picture out of. The reader
      // proxy would not do any better.
      return "";
    }
  } catch (err) {
    // A refused connection or a timeout still leaves the reader worth a try.
    console.warn("direct fetch failed for", url.hostname, err?.name || err);
  }

  try {
    const html = await fetchThroughReader(url);
    return html ? imageFrom(html, landed) : "";
  } catch (err) {
    console.warn("reader failed for", url.hostname, err?.name || err);
    return "";
  }
}
