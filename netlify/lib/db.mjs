import { getStore } from "@netlify/blobs";
import { HttpError } from "./http.mjs";

// Strong consistency everywhere: a guest claiming a gift must be visible to the
// next guest immediately, and share-token lookups must never hit a stale value.
const store = (name) => getStore({ name, consistency: "strong" });

export const usersStore = () => store("wl_users");
export const listsStore = () => store("wl_lists");
export const userListsStore = () => store("wl_user_lists");
export const shareTokensStore = () => store("wl_share_tokens");

export const emailKey = (email) => String(email).trim().toLowerCase();

export async function getJSON(s, key) {
  if (!key) return null;
  return (await s.get(key, { type: "json", consistency: "strong" })) ?? null;
}

export async function getUserByEmail(email) {
  return getJSON(usersStore(), emailKey(email));
}

export async function getList(id) {
  return getJSON(listsStore(), id);
}

export async function getUserListIds(userId) {
  const record = await getJSON(userListsStore(), userId);
  return Array.isArray(record?.listIds) ? record.listIds : [];
}

export async function setUserListIds(userId, listIds) {
  await userListsStore().setJSON(userId, { listIds });
}

export async function resolveShareToken(token) {
  if (!token) return null;
  const ref = await getJSON(shareTokensStore(), token);
  if (!ref?.listId || !ref?.role) return null;
  const list = await getList(ref.listId);
  if (!list) return null;
  // Guard against a stale token record pointing at a rotated link.
  const current = ref.role === "editor" ? list.editorToken : list.guestToken;
  if (current !== token) return null;
  return { list, role: ref.role };
}

/**
 * Read-modify-write a list with optimistic concurrency. Two guests claiming
 * different gifts at the same moment must not clobber each other, so we retry
 * on an etag mismatch instead of blindly overwriting.
 */
export async function updateList(id, mutate, attempts = 6) {
  const lists = listsStore();
  for (let attempt = 0; attempt < attempts; attempt++) {
    const entry = await lists.getWithMetadata(id, { type: "json", consistency: "strong" });
    if (!entry?.data) throw new HttpError("Wish list not found", 404);

    const draft = structuredClone(entry.data);
    const result = await mutate(draft);
    draft.updatedAt = new Date().toISOString();

    const { modified } = await lists.setJSON(id, draft, { onlyIfMatch: entry.etag });
    if (modified) return { list: draft, result };
  }
  throw new HttpError("This list is being updated by someone else. Try again.", 409);
}
