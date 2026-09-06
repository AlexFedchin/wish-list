import { useEffect, useState } from "react";

/** useState that remembers its value across visits (layout choice, etc). */
export default function useStickyState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage blocked — the choice just won't persist */
    }
  }, [key, value]);

  return [value, setValue];
}
