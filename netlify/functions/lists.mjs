import { fail, handle, json, readJson, segments, str, HttpError } from "../lib/http.mjs";
import { newShareToken } from "../lib/crypto.mjs";
import { getList, getUserListIds, listsStore, setUserListIds, updateList } from "../lib/db.mjs";
import {
  applyItemEdits,
  LIMITS,
  listSummary,
  newItem,
  newList,
  registerShareToken,
  releaseShareToken,
  requireUser,
  serializeList,
} from "../lib/model.mjs";

async function ownedList(id, user) {
  const list = await getList(id);
  if (!list || list.ownerId !== user.id) throw new HttpError("Wish list not found", 404);
  return list;
}

async function collection(req, user) {
  if (req.method === "GET") {
    const ids = await getUserListIds(user.id);
    const lists = (await Promise.all(ids.map(getList))).filter(Boolean);
    lists.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return json({ lists: lists.map(listSummary) });
  }

  if (req.method === "POST") {
    const ids = await getUserListIds(user.id);
    if (ids.length >= LIMITS.listsPerUser) {
      throw new HttpError(`You can keep up to ${LIMITS.listsPerUser} wish lists`, 400);
    }

    const list = newList(user.id, await readJson(req));
    await listsStore().setJSON(list.id, list);
    await Promise.all([
      registerShareToken(list.guestToken, list.id, "guest"),
      registerShareToken(list.editorToken, list.id, "editor"),
      setUserListIds(user.id, [list.id, ...ids]),
    ]);
    return json({ list: serializeList(list, "owner") }, 201);
  }

  return fail("Method not allowed", 405);
}

async function single(req, user, id) {
  if (req.method === "GET") {
    return json({ list: serializeList(await ownedList(id, user), "owner") });
  }

  if (req.method === "PATCH") {
    await ownedList(id, user);
    const body = await readJson(req);
    const { list } = await updateList(id, (draft) => {
      if (body.title !== undefined) {
        draft.title = str(body.title, { max: LIMITS.listTitle }) || draft.title;
      }
      if (body.note !== undefined) draft.note = str(body.note, { max: LIMITS.listNote });
      if (body.ownerName !== undefined) {
        draft.ownerName = str(body.ownerName, { max: LIMITS.name });
      }
      if (body.showTaken !== undefined) draft.showTaken = Boolean(body.showTaken);
    });
    return json({ list: serializeList(list, "owner") });
  }

  if (req.method === "DELETE") {
    const list = await ownedList(id, user);
    await Promise.all([
      listsStore().delete(id),
      releaseShareToken(list.guestToken),
      releaseShareToken(list.editorToken),
    ]);
    const ids = await getUserListIds(user.id);
    await setUserListIds(
      user.id,
      ids.filter((listId) => listId !== id),
    );
    return json({ ok: true });
  }

  return fail("Method not allowed", 405);
}

/** Rotating a link mints a new token and drops the old one, killing shared URLs. */
async function rotate(req, user, id) {
  if (req.method !== "POST") return fail("Method not allowed", 405);

  await ownedList(id, user);
  const { target } = await readJson(req);
  if (!["guest", "editor", "both"].includes(target)) {
    throw new HttpError("Choose which link to regenerate", 400);
  }

  const retired = [];
  const { list } = await updateList(id, (draft) => {
    if (target === "guest" || target === "both") {
      retired.push(draft.guestToken);
      draft.guestToken = newShareToken();
    }
    if (target === "editor" || target === "both") {
      retired.push(draft.editorToken);
      draft.editorToken = newShareToken();
    }
  });

  await Promise.all(retired.map(releaseShareToken));
  await Promise.all([
    target !== "editor" ? registerShareToken(list.guestToken, id, "guest") : null,
    target !== "guest" ? registerShareToken(list.editorToken, id, "editor") : null,
  ]);

  return json({ list: serializeList(list, "owner") });
}

async function items(req, user, id, itemId) {
  await ownedList(id, user);

  if (!itemId && req.method === "POST") {
    const body = await readJson(req);
    const { list } = await updateList(id, (draft) => {
      if (draft.items.length >= LIMITS.itemsPerList) {
        throw new HttpError(`A list can hold up to ${LIMITS.itemsPerList} items`, 400);
      }
      draft.items.push(newItem(body));
    });
    return json({ list: serializeList(list, "owner") }, 201);
  }

  if (itemId && req.method === "PATCH") {
    const body = await readJson(req);
    const { list } = await updateList(id, (draft) => {
      const item = draft.items.find((entry) => entry.id === itemId);
      if (!item) throw new HttpError("Item not found", 404);
      applyItemEdits(item, body);
    });
    return json({ list: serializeList(list, "owner") });
  }

  if (itemId && req.method === "DELETE") {
    const { list } = await updateList(id, (draft) => {
      const index = draft.items.findIndex((entry) => entry.id === itemId);
      if (index === -1) throw new HttpError("Item not found", 404);
      draft.items.splice(index, 1);
    });
    return json({ list: serializeList(list, "owner") });
  }

  return fail("Method not allowed", 405);
}

export default handle(async (req, context) => {
  const user = await requireUser(req);
  const { id, itemId } = context.params;
  const [, , section] = segments(req);

  if (!id) return collection(req, user);
  if (!section) return single(req, user, id);
  if (section === "share") return rotate(req, user, id);
  return items(req, user, id, itemId);
});

export const config = {
  path: [
    "/api/lists",
    "/api/lists/:id",
    "/api/lists/:id/share",
    "/api/lists/:id/items",
    "/api/lists/:id/items/:itemId",
  ],
};
