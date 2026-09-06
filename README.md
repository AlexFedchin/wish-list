# Wishstand

A wish list you can actually send to people. Add what you'd love to get, share one
link, and let your friends quietly claim gifts so nobody buys the same thing twice.

Deploys to Netlify's free tier end to end, with no database to provision and no third-party
services to sign up for.

## Stack

| Piece      | Choice                                                                       |
| ---------- | ---------------------------------------------------------------------------- |
| Frontend   | React 19 + Vite + Tailwind CSS v4                                            |
| Animation  | Framer Motion, plus [React Bits](https://reactbits.dev/) components in `src/components/reactbits/` |
| Icons      | `react-icons`, Phosphor set (`react-icons/pi`)                                |
| Backend    | Netlify Functions (v2 syntax, `netlify/functions/*.mjs`)                     |
| Storage    | Netlify Blobs, built into Netlify, nothing to configure                      |
| Auth       | Email + password, scrypt hashing, HMAC-SHA256 session tokens (no dependency) |

## Deploying

1. Push this repo to GitHub/GitLab.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   The build command (`npm run build`) and publish directory (`dist`) come from
   `netlify.toml`, so leave the defaults.
3. Set one environment variable under **Site configuration → Environment variables**:

   ```
   JWT_SECRET = <a long random string>
   ```

   Generate one with:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

   Without it the app still runs, but every session token is signed with a known
   fallback secret, so set it before you share anything.
4. Deploy. Netlify Blobs is enabled automatically; there is no database step.

## Running locally

```bash
npm install
npm run dev        # netlify dev serves Vite and the functions on http://localhost:8888
```

Use `npm run dev`, not `npm run dev:vite`. Vite alone serves the UI but not `/api/*`,
so nothing will load.

> **One local-only wrinkle:** `netlify dev` retries requests as `<path>.html` and
> `<path>/index.html` whenever a handler answers `403` or `404`, and returns the last
> attempt's response. So permission errors can surface locally with the wrong status
> ("this link is view-only" showing up as "link no longer works"). The functions
> themselves return the correct codes. This is netlify-cli's dev proxy, not the API.

## API

All routes are declared with literal path segments in each function's `config.path`,
which is what keeps the dev proxy's `.html` probing from re-entering them.

| Method   | Path                             | Who        |
| -------- | -------------------------------- | ---------- |
| `POST`   | `/api/auth/register`             | anyone     |
| `POST`   | `/api/auth/login`                | anyone     |
| `GET`    | `/api/auth/me`                   | author     |
| `GET`    | `/api/lists`                     | author     |
| `POST`   | `/api/lists`                     | author     |
| `GET`    | `/api/lists/:id`                 | author     |
| `PATCH`  | `/api/lists/:id`                 | author     |
| `DELETE` | `/api/lists/:id`                 | author     |
| `POST`   | `/api/lists/:id/share`           | author     |
| `POST`   | `/api/lists/:id/items`           | author     |
| `PATCH`  | `/api/lists/:id/items/:itemId`   | author     |
| `DELETE` | `/api/lists/:id/items/:itemId`   | author     |
| `GET`    | `/api/share/:token`              | link       |
| `POST`   | `/api/share/:token/items`        | editor link |
| `PATCH`  | `/api/share/:token/items/:itemId` | editor link (edits) / any link (claim) |
| `DELETE` | `/api/share/:token/items/:itemId` | editor link |

## How the pieces fit

**Two links per list.** Creating a list mints two unguessable tokens (24 random
bytes each). `/s/<guestToken>` lets people view and claim; `/s/<editorToken>` also
lets them add, edit and delete. The role comes from which token was used, so the
same page serves both.

**Regenerating a link** mints a new token and deletes the old one's lookup record,
so previously shared URLs stop resolving immediately. Claims already made survive.

**Surprise mode** is enforced on the server, not hidden in the UI. When an author
turns off "show me which gifts have been claimed", `serializeList` strips `taken`
from everything the author receives and reports `takenCount: null`. Guests keep
seeing claims, so coordination still works. The author literally cannot see them.

**Claiming without accounts.** Guests never sign in. Each browser generates a random
`claimerId` kept in `localStorage`; it is what proves "this claim is mine" so a guest
can release a gift they claimed. That id is never returned to other visitors, only the
API only tells you whether a claim is yours (`taken.mine`).

**Concurrent claims.** Two guests claiming different gifts at the same moment would
otherwise clobber each other, since a list is one blob. `updateList` reads with
strong consistency and writes with `onlyIfMatch: <etag>`, retrying on a mismatch, so
neither write is lost. A second guest claiming the *same* gift gets a `409`.

### Data model

Four Netlify Blobs stores, all read with strong consistency:

- `wl_users`, key: email → `{ id, email, passwordHash, createdAt }`
- `wl_lists`, key: list id → the list, items included
- `wl_user_lists`, key: user id → `{ listIds }`
- `wl_share_tokens`, key: share token → `{ listId, role }`

Token lookups double-check that the list still names that token, so a rotated link
can't be resurrected by a stale record.

## Project layout

```
netlify/
  lib/          http helpers, crypto, blob access, serialization
  functions/    auth.mjs, lists.mjs, share.mjs
src/
  components/
    reactbits/  Aurora, DotGrid, SpotlightCard, BlurText, ClickSpark, Magnet, StarBorder, AnimatedContent
    ui/         Button, Field, Modal, Switch, ConfirmDialog, EmptyState, Loader, Logo
    wishlist/   WishItem, ItemGrid, ItemForm, ClaimDialog, ShareLinks, ViewToggle
  pages/        Landing, AuthShell, Dashboard, ListPage, SharePage, NotFound
  lib/          api client, auth context, toasts
```
