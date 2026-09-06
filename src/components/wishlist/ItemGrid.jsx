import { AnimatePresence } from "framer-motion";
import WishItem from "./WishItem";

export default function ItemGrid({ items, view, busyId, ...handlers }) {
  return (
    <ul
      className={
        view === "grid"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          : "flex flex-col gap-3"
      }
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item) => (
          <WishItem
            key={item.id}
            item={item}
            view={view}
            busy={busyId === item.id}
            onEdit={() => handlers.onEdit?.(item)}
            onDelete={() => handlers.onDelete?.(item)}
            onClaim={() => handlers.onClaim?.(item)}
            onUnclaim={() => handlers.onUnclaim?.(item)}
            canEdit={handlers.canEdit}
            canClaim={handlers.canClaim}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}
