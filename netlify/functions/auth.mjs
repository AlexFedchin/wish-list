import { fail, handle, json, readJson, segments, str, HttpError } from "../lib/http.mjs";
import { createSession, hashPassword, newId, verifyPassword } from "../lib/crypto.mjs";
import { emailKey, getUserByEmail, usersStore } from "../lib/db.mjs";
import { requireUser } from "../lib/model.mjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const publicUser = (user) => ({ id: user.id, email: user.email, createdAt: user.createdAt });

/**
 * `ver` pins the session to the account's current password. Bumping
 * `tokenVersion` on a password change is what makes every session minted
 * before it stop working, here and on every other device.
 */
const sessionFor = (user) =>
  createSession({ sub: user.id, email: user.email, ver: user.tokenVersion ?? 0 });

function checkPassword(value, field = "Password") {
  const password = typeof value === "string" ? value : "";
  if (password.length < 8) throw new HttpError(`${field} must be at least 8 characters`, 400);
  if (password.length > 200) throw new HttpError(`${field} is too long`, 400);
  return password;
}

function credentials(body) {
  const email = emailKey(str(body.email, { max: 254 }));
  if (!EMAIL_RE.test(email)) throw new HttpError("Enter a valid email address", 400);
  return { email, password: checkPassword(body.password) };
}

async function register(req) {
  const { email, password } = credentials(await readJson(req));

  const existing = await getUserByEmail(email);
  if (existing) throw new HttpError("An account with this email already exists", 409);

  const user = {
    id: newId(),
    email,
    passwordHash: await hashPassword(password),
    tokenVersion: 0,
    createdAt: new Date().toISOString(),
  };

  // onlyIfNew closes the window where two signups race for the same address.
  const { modified } = await usersStore().setJSON(email, user, { onlyIfNew: true });
  if (!modified) throw new HttpError("An account with this email already exists", 409);

  return json({ token: sessionFor(user), user: publicUser(user) }, 201);
}

async function login(req) {
  const { email, password } = credentials(await readJson(req));

  const user = await getUserByEmail(email);
  // Same message either way, so this endpoint can't be used to enumerate accounts.
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!ok) throw new HttpError("Email or password is incorrect", 401);

  return json({ token: sessionFor(user), user: publicUser(user) });
}

/**
 * Changing a password signs out everywhere: the version bump invalidates the
 * caller's own token too, so a freshly signed one comes back with the reply.
 */
async function changePassword(req) {
  const user = await requireUser(req);
  const body = await readJson(req);

  const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
  if (!(await verifyPassword(current, user.passwordHash))) {
    throw new HttpError("Your current password is incorrect", 400);
  }

  const next = checkPassword(body.newPassword, "New password");
  if (await verifyPassword(next, user.passwordHash)) {
    throw new HttpError("That's already your password", 400);
  }

  const updated = {
    ...user,
    passwordHash: await hashPassword(next),
    tokenVersion: (user.tokenVersion ?? 0) + 1,
    passwordChangedAt: new Date().toISOString(),
  };
  await usersStore().setJSON(emailKey(user.email), updated);

  return json({ token: sessionFor(updated), user: publicUser(updated) });
}

export default handle(async (req) => {
  const [, action] = segments(req);

  if (action === "register" && req.method === "POST") return register(req);
  if (action === "login" && req.method === "POST") return login(req);
  if (action === "password" && req.method === "POST") return changePassword(req);
  if (action === "me" && req.method === "GET") {
    return json({ user: publicUser(await requireUser(req)) });
  }

  return fail("Method not allowed", 405);
});

export const config = {
  path: ["/api/auth/register", "/api/auth/login", "/api/auth/me", "/api/auth/password"],
};
