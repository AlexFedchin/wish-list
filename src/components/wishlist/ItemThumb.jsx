import { useState } from "react";
import { PiGiftFill } from "react-icons/pi";
import useLinkImage from "../../lib/linkImage";

// A quiet hatch rather than an empty box, so a gift with no picture still reads
// as a deliberate part of the layout instead of a hole in it.
const HATCH = {
  backgroundImage:
    "repeating-linear-gradient(135deg, var(--color-ink-800) 0 7px, var(--color-ink-850) 7px 14px)",
};

const SHAPES = {
  grid: "aspect-[4/3] w-full border-b border-ink-700",
  list: "h-16 w-16 rounded-lg border border-ink-700 sm:h-[4.5rem] sm:w-[4.5rem]",
};

export default function ItemThumb({ item, view = "grid" }) {
  const { image } = useLinkImage(item.link || "");

  // Both states hold a URL rather than a flag. A picture already in the browser
  // cache fires `load` before React can listen, so the ref below catches it;
  // comparing URLs means a card that swaps pictures can never inherit the
  // previous one's state.
  const [shown, setShown] = useState(null);
  const [failed, setFailed] = useState(null);

  const src = image && image !== failed ? image : null;

  return (
    <div className={`relative shrink-0 overflow-hidden bg-ink-850 ${SHAPES[view]}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center"
        style={HATCH}
      >
        <PiGiftFill className={view === "grid" ? "text-2xl text-ink-600" : "text-base text-ink-600"} />
      </div>

      {src && (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0) setShown(src);
          }}
          onLoad={() => setShown(src)}
          onError={() => setFailed(src)}
          className={`relative h-full w-full object-cover transition-opacity duration-500 ${
            shown === src ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
