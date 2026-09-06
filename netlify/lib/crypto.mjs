import {
  createHmac,
  randomBytes,
  randomUUID,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

const SECRET =
  process.env.JWT_SECRET ||
  process.env.AUTH_SECRET ||
  "insecure-local-dev-secret-set-JWT_SECRET-in-netlify";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const newId = () => randomUUID();

/** URL-safe share token. 24 bytes -> 32 chars, unguessable. */
export const newShareToken = () => randomBytes(24).toString("base64url");

const b64u = (input) => Buffer.from(input).toString("base64url");
const unb64u = (input) => Buffer.from(input, "base64url").toString("utf8");

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== "string") return false;
  const [scheme, saltPart, hashPart] = stored.split("$");
  if (scheme !== "scrypt" || !saltPart || !hashPart) return false;
  const expected = Buffer.from(hashPart, "base64url");
  const derived = await scrypt(password, Buffer.from(saltPart, "base64url"), expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

const sign = (data) => createHmac("sha256", SECRET).update(data).digest("base64url");

/** Minimal HMAC-SHA256 JWT so we don't pull in a dependency for one use. */
export function createSession(payload) {
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const body = b64u(JSON.stringify({ ...payload, exp }));
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

export function readSession(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = sign(`${header}.${body}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(unb64u(body));
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
