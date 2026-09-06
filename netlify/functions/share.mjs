import { fail, handle, json, readJson, segments, str, HttpError } from "../lib/http.mjs";
import { resolveShareToken, updateList } from "../lib/db.mjs";
import {
  applyItemEdits,
  LIMITS,
  newItem,
  serializeList,
} from "../lib/model.mjs";

/**
 * Guests are anonymous, so "who claimed this" is an opaque id the browser keeps
 * in localStorage. It only ever proves "this claim is mine" for un-claiming.
 */
function claimerFrom(value) {
  const id = str(value, { max: 64 });
  return /^[A-Za-z0-9_-]{8,64}$/.test(id) ? id : null;
}

function requireEditor(role) {
  if (role !== "editor") throw new HttpError("This link is view-only", 403);
}

async function claim(listId, itemId, body, role) {
  const claimerId = claimerFrom(body.claimerId);
  if (!claimerId) throw new HttpError("Missing claim identity", 400);
  const name = str(body.name, { max: LIMITS.name });

  const { list } = await updateList(listId, (draft) => {
    const item = draft.items.find((entry) => entry.id === itemId);
    if (!item) throw new HttpError("Item not found", 404);
    if (item.taken && item.taken.by !== claimerId) {
      throw new HttpError("Someone else just claimed this gift", 409);
    }
    item.taken = { by: claimerId, name, at: new Date().toISOString() };
  });

  return json({ list: serializeList(list, role, claimerId) });
}

async function unclaim(listId, itemId, body, role) {
  const claimerId = claimerFrom(body.claimerId);
  if (!claimerId) throw new HttpError("Missing claim identity", 400);

  const { list } = await updateList(listId, (draft) => {
    const item = draft.items.find((entry) => entry.id === itemId);
    if (!item) throw new HttpError("Item not found", 404);
    // Editors can release a stuck claim; guests can only release their own.
    if (item.taken && item.taken.by !== claimerId && role !== "editor") {
      throw new HttpError("Only the person who claimed this can release it", 403);
    }
    item.taken = null;
  });

  return json({ list: serializeList(list, role, claimerId) });
}

export default handle(async (req, context) => {
  const { token, itemId } = context.params;
  const [, , section] = segments(req);

  const resolved = await resolveShareToken(token);
  if (!resolved) throw new HttpError("This sharing link is no longer active", 404);
  const { list, role } = resolved;

  if (!section) {
    if (req.method !== "GET") return fail("Method not allowed", 405);
    const claimerId = claimerFrom(new URL(req.url).searchParams.get("claimerId"));
    return json({ list: serializeList(list, role, claimerId) });
  }

  if (!itemId && req.method === "POST") {
    requireEditor(role);
    const body = await readJson(req);
    const { list: updated } = await updateList(list.id, (draft) => {
      if (draft.items.length >= LIMITS.itemsPerList) {
        throw new HttpError(`A list can hold up to ${LIMITS.itemsPerList} items`, 400);
      }
      draft.items.push(newItem(body));
    });
    return json({ list: serializeList(updated, role, claimerFrom(body.claimerId)) }, 201);
  }

  if (itemId && req.method === "PATCH") {
    const body = await readJson(req);

    if (body.action === "claim") return claim(list.id, itemId, body, role);
    if (body.action === "unclaim") return unclaim(list.id, itemId, body, role);

    requireEditor(role);
    const { list: updated } = await updateList(list.id, (draft) => {
      const item = draft.items.find((entry) => entry.id === itemId);
      if (!item) throw new HttpError("Item not found", 404);
      applyItemEdits(item, body);
    });
    return json({ list: serializeList(updated, role, claimerFrom(body.claimerId)) });
  }

  if (itemId && req.method === "DELETE") {
    requireEditor(role);
    const { list: updated } = await updateList(list.id, (draft) => {
      const index = draft.items.findIndex((entry) => entry.id === itemId);
      if (index === -1) throw new HttpError("Item not found", 404);
      draft.items.splice(index, 1);
    });
    return json({ list: serializeList(updated, role) });
  }

  return fail("Method not allowed", 405);
});

export const config = {
  path: ["/api/share/:token", "/api/share/:token/items", "/api/share/:token/items/:itemId"],
};
