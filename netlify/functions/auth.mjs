import { fail, handle, json, readJson, segments, str, HttpError } from "../lib/http.mjs";
import { createSession, hashPassword, newId, verifyPassword } from "../lib/crypto.mjs";
import { emailKey, getUserByEmail, usersStore } from "../lib/db.mjs";
import { requireUser } from "../lib/model.mjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const publicUser = (user) => ({ id: user.id, email: user.email, createdAt: user.createdAt });

function credentials(body) {
  const email = emailKey(str(body.email, { max: 254 }));
  const password = typeof body.password === "string" ? body.password : "";
  if (!EMAIL_RE.test(email)) throw new HttpError("Enter a valid email address", 400);
  if (password.length < 8) throw new HttpError("Password must be at least 8 characters", 400);
  if (password.length > 200) throw new HttpError("Password is too long", 400);
  return { email, password };
}

async function register(req) {
  const { email, password } = credentials(await readJson(req));

  const existing = await getUserByEmail(email);
  if (existing) throw new HttpError("An account with this email already exists", 409);

  const user = {
    id: newId(),
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  // onlyIfNew closes the window where two signups race for the same address.
  const { modified } = await usersStore().setJSON(email, user, { onlyIfNew: true });
  if (!modified) throw new HttpError("An account with this email already exists", 409);

  return json({ token: createSession({ sub: user.id, email }), user: publicUser(user) }, 201);
}

async function login(req) {
  const { email, password } = credentials(await readJson(req));

  const user = await getUserByEmail(email);
  // Same message either way, so this endpoint can't be used to enumerate accounts.
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!ok) throw new HttpError("Email or password is incorrect", 401);

  return json({ token: createSession({ sub: user.id, email }), user: publicUser(user) });
}

export default handle(async (req) => {
  const [, action] = segments(req);

  if (action === "register" && req.method === "POST") return register(req);
  if (action === "login" && req.method === "POST") return login(req);
  if (action === "me" && req.method === "GET") {
    return json({ user: publicUser(await requireUser(req)) });
  }

  return fail("Method not allowed", 405);
});

export const config = {
  path: ["/api/auth/register", "/api/auth/login", "/api/auth/me"],
};
