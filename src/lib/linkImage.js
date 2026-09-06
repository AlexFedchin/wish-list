import { useEffect, useState } from "react";

/**
 * Resolves the picture behind a gift link through /api/preview.
 *
 * Answers are shared across every card in the session: the same shop link in
 * two lists is scraped once. Requests are queued so opening a long list does
 * not fire two hundred lookups at once.
 */

const STORE_PREFIX = "wishstand.img:";
const MAX_PARALLEL = 4;

const answers = new Map();
const pending = new Map();
const waiting = [];
let running = 0;

function remember(link, image) {
  answers.set(link, image);
  try {
    sessionStorage.setItem(STORE_PREFIX + link, image ?? "");
  } catch {
    /* storage blocked, the answer just lives in memory for this page */
  }
}

/** Returns the image, `null` for "looked, found nothing", `undefined` for "unknown". */
function peek(link) {
  if (answers.has(link)) return answers.get(link);
  try {
    const stored = sessionStorage.getItem(STORE_PREFIX + link);
    if (stored === null) return undefined;
    const image = stored || null;
    answers.set(link, image);
    return image;
  } catch {
    return undefined;
  }
}

function pump() {
  while (running < MAX_PARALLEL && waiting.length) {
    const job = waiting.shift();
    running += 1;
    job().finally(() => {
      running -= 1;
      pump();
    });
  }
}

function lookup(link) {
  if (pending.has(link)) return pending.get(link);

  const promise = new Promise((resolve) => {
    waiting.push(async () => {
      let image = null;
      try {
        const response = await fetch(`/api/preview?url=${encodeURIComponent(link)}`);
        if (response.ok) image = (await response.json())?.image || null;
      } catch {
        image = null;
      }
      remember(link, image);
      pending.delete(link);
      resolve(image);
    });
    pump();
  });

  pending.set(link, promise);
  return promise;
}

export default function useLinkImage(link) {
  const [image, setImage] = useState(() => (link ? (peek(link) ?? null) : null));
  const [resolved, setResolved] = useState(() => !link || peek(link) !== undefined);

  useEffect(() => {
    if (!link) {
      setImage(null);
      setResolved(true);
      return;
    }

    const known = peek(link);
    if (known !== undefined) {
      setImage(known);
      setResolved(true);
      return;
    }

    setImage(null);
    setResolved(false);

    let cancelled = false;
    lookup(link).then((found) => {
      if (cancelled) return;
      setImage(found);
      setResolved(true);
    });

    return () => {
      cancelled = true;
    };
  }, [link]);

  return { image, resolved };
}
