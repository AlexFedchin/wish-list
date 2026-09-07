const TOKEN_KEY = "wishstand.token";
const CLAIMER_KEY = "wishstand.claimer";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode, the session just won't persist */
  }
};

/**
 * Anonymous, per-browser id. It is the only thing proving a guest owns the
 * claim they made, so it never leaves this device except as a claim receipt.
 */
export function getClaimerId() {
  try {
    let id = localStorage.getItem(CLAIMER_KEY);
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(CLAIMER_KEY, id);
    }
    return id;
  } catch {
    return "anon" + Math.random().toString(36).slice(2, 14);
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["content-type"] = "application/json";

  const token = auth ? getToken() : null;
  if (token) headers.authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the server. Check your connection.", 0);
  }

  // A non-JSON body here means the request never reached the API. A proxy or
  // the SPA fallback answered instead. Treat it as an error rather than letting
  // an empty payload look like a successful, empty result.
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new ApiError(
      response.ok ? "Unexpected response from the server" : "Something went wrong",
      response.ok ? 502 : response.status,
    );
  }

  const payload = await response.json().catch(() => null);
  if (!payload) throw new ApiError("Unexpected response from the server", 502);

  if (!response.ok) {
    throw new ApiError(payload.error || "Something went wrong", response.status);
  }
  return payload;
}

export const api = {
  register: (email, password) =>
    request("/auth/register", { method: "POST", body: { email, password }, auth: false }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => request("/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    request("/auth/password", { method: "POST", body: { currentPassword, newPassword } }),

  lists: () => request("/lists"),
  createList: (data) => request("/lists", { method: "POST", body: data }),
  list: (id) => request(`/lists/${id}`),
  updateList: (id, data) => request(`/lists/${id}`, { method: "PATCH", body: data }),
  deleteList: (id) => request(`/lists/${id}`, { method: "DELETE" }),
  rotateLink: (id, target) =>
    request(`/lists/${id}/share`, { method: "POST", body: { target } }),

  addItem: (id, data) => request(`/lists/${id}/items`, { method: "POST", body: data }),
  updateItem: (id, itemId, data) =>
    request(`/lists/${id}/items/${itemId}`, { method: "PATCH", body: data }),
  deleteItem: (id, itemId) => request(`/lists/${id}/items/${itemId}`, { method: "DELETE" }),

  shared: (token) =>
    request(`/share/${token}?claimerId=${getClaimerId()}`, { auth: false }),
  sharedAddItem: (token, data) =>
    request(`/share/${token}/items`, {
      method: "POST",
      body: { ...data, claimerId: getClaimerId() },
      auth: false,
    }),
  sharedUpdateItem: (token, itemId, data) =>
    request(`/share/${token}/items/${itemId}`, {
      method: "PATCH",
      body: { ...data, claimerId: getClaimerId() },
      auth: false,
    }),
  sharedDeleteItem: (token, itemId) =>
    request(`/share/${token}/items/${itemId}`, { method: "DELETE", auth: false }),

  claim: (token, itemId, name) =>
    request(`/share/${token}/items/${itemId}`, {
      method: "PATCH",
      body: { action: "claim", name, claimerId: getClaimerId() },
      auth: false,
    }),
  unclaim: (token, itemId) =>
    request(`/share/${token}/items/${itemId}`, {
      method: "PATCH",
      body: { action: "unclaim", claimerId: getClaimerId() },
      auth: false,
    }),
};
