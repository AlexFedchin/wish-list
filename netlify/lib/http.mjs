const BASE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...BASE_HEADERS, ...headers },
  });
}

export function fail(message, status = 400, extra = {}) {
  return json({ error: message, ...extra }, status);
}

/** Thrown by helpers to short-circuit a handler with a specific status. */
export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readJson(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new HttpError("Request body must be a JSON object", 400);
    }
    return body;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError("Invalid JSON body", 400);
  }
}

/** Wraps a handler so thrown HttpErrors become clean JSON responses. */
export function handle(fn) {
  return async (req, context) => {
    try {
      return await fn(req, context);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.message, err.status);
      console.error("Unhandled function error:", err);
      return fail("Something went wrong on our end", 500);
    }
  };
}

/**
 * Path segments after `/api`, e.g. ["lists", "<id>", "items"].
 * Routes are declared with literal segments rather than catch-all params, so
 * Netlify's static-file probing (which retries `<path>.html` and
 * `<path>/index.html`) can never re-enter a function and overwrite its reply.
 */
export function segments(req) {
  return new URL(req.url).pathname.split("/").filter(Boolean).slice(1);
}

export function str(value, { max = 200, trim = true } = {}) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new HttpError("Expected a string value", 400);
  const out = trim ? value.trim() : value;
  return out.slice(0, max);
}
