import { HttpError, str } from "./http.mjs";
import { newId, newShareToken, readSession } from "./crypto.mjs";
import { getUserByEmail, shareTokensStore } from "./db.mjs";

export const LIMITS = {
  title: 120,
  description: 600,
  link: 800,
  name: 60,
  listTitle: 80,
  listNote: 300,
  itemsPerList: 200,
  listsPerUser: 50,
};

export const PRIORITIES = ["low", "normal", "high"];

export function requireTitle(value) {
  const title = str(value, { max: LIMITS.title });
  if (!title) throw new HttpError("Title is required", 400);
  return title;
}

/** Only http(s) links; anything else (javascript:, data:) is rejected outright. */
export function cleanLink(value) {
  const link = str(value, { max: LIMITS.link });
  if (!link) return "";
  const withProtocol = /^https?:\/\//i.test(link) ? link : `https://${link}`;
  let url;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new HttpError("That link doesn't look like a valid URL", 400);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new HttpError("Links must start with http:// or https://", 400);
  }
  return url.toString();
}

export function newItem(input) {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title: requireTitle(input.title),
    description: str(input.description, { max: LIMITS.description }),
    link: cleanLink(input.link),
    priority: PRIORITIES.includes(input.priority) ? input.priority : "normal",
    taken: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyItemEdits(item, input) {
  if (input.title !== undefined) item.title = requireTitle(input.title);
  if (input.description !== undefined)
    item.description = str(input.description, { max: LIMITS.description });
  if (input.link !== undefined) item.link = cleanLink(input.link);
  if (input.priority !== undefined && PRIORITIES.includes(input.priority))
    item.priority = input.priority;
  item.updatedAt = new Date().toISOString();
  return item;
}

export function newList(ownerId, input = {}) {
  const now = new Date().toISOString();
  return {
    id: newId(),
    ownerId,
    title: str(input.title, { max: LIMITS.listTitle }) || "My wish list",
    note: str(input.note, { max: LIMITS.listNote }),
    ownerName: str(input.ownerName, { max: LIMITS.name }),
    showTaken: true,
    guestToken: newShareToken(),
    editorToken: newShareToken(),
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function registerShareToken(token, listId, role) {
  await shareTokensStore().setJSON(token, { listId, role });
}

export async function releaseShareToken(token) {
  if (token) await shareTokensStore().delete(token);
}

/**
 * Shapes a list for the audience asking for it.
 * - owner: sees settings + both share tokens, but only sees claims when
 *   `showTaken` is on (the "keep it a surprise" switch).
 * - editor / guest: sees claims, never sees the share tokens.
 * `claimerId` is the anonymous browser id of the visitor asking, so we can tell
 * them which claims are theirs without ever handing out anyone else's id.
 */
export function serializeList(list, role, claimerId = null) {
  const revealTaken = role !== "owner" || list.showTaken;

  const items = list.items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    link: item.link,
    priority: item.priority,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    taken:
      revealTaken && item.taken
        ? {
            name: item.taken.name,
            at: item.taken.at,
            mine: Boolean(claimerId) && item.taken.by === claimerId,
          }
        : null,
  }));

  const base = {
    id: list.id,
    title: list.title,
    note: list.note,
    ownerName: list.ownerName,
    role,
    itemCount: list.items.length,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
    items,
  };

  if (role === "owner") {
    return {
      ...base,
      showTaken: list.showTaken,
      takenCount: list.showTaken ? list.items.filter((i) => i.taken).length : null,
      share: { guestToken: list.guestToken, editorToken: list.editorToken },
    };
  }

  return { ...base, takenCount: list.items.filter((i) => i.taken).length };
}

export function listSummary(list) {
  return {
    id: list.id,
    title: list.title,
    note: list.note,
    itemCount: list.items.length,
    takenCount: list.showTaken ? list.items.filter((i) => i.taken).length : null,
    showTaken: list.showTaken,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

/** Reads the bearer session and confirms the account still exists. */
export async function requireUser(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const session = readSession(token);
  if (!session?.email) throw new HttpError("Please sign in to continue", 401);

  const user = await getUserByEmail(session.email);
  if (!user || user.id !== session.sub) throw new HttpError("Session is no longer valid", 401);
  // Changing the password bumps tokenVersion, which retires every session
  // signed before it. Accounts and tokens from before this existed are both
  // version 0, so they keep working.
  if ((session.ver ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new HttpError("Your password changed. Please sign in again.", 401);
  }
  return user;
}
