import { useEffect, useState } from "react";
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
  const [loaded, setLoaded] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setBroken(false);
  }, [image]);

  const src = broken ? null : image;

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
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
          className={`relative h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
