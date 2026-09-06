import { motion } from "framer-motion";
import {
  PiArrowSquareOutBold,
  PiCheckBold,
  PiDotsThreeOutlineFill,
  PiHandbagFill,
  PiPencilSimpleBold,
  PiTrashBold,
} from "react-icons/pi";
import { useState } from "react";
import SpotlightCard from "../reactbits/SpotlightCard";
import ItemThumb from "./ItemThumb";

const domainOf = (link) => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "Open link";
  }
};

function PriorityMark({ priority }) {
  if (priority !== "high") return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-600/40 bg-brand-600/10 px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-wide text-brand-300">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(242,183,92,0.9)]" />
      Really wants
    </span>
  );
}

function TakenBadge({ taken }) {
  if (!taken) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium ${
        taken.mine
          ? "border border-brand-500/50 bg-brand-600/15 text-brand-300"
          : "border border-ink-650 bg-ink-800 text-ink-300"
      }`}
    >
      <PiCheckBold className="text-[0.85em]" />
      {taken.mine ? "You're getting this" : taken.name ? `Taken by ${taken.name}` : "Taken"}
    </span>
  );
}

function LinkChip({ link }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800/70 px-2.5 py-1.5 text-xs text-ink-200 transition-colors hover:border-brand-600/50 hover:bg-brand-600/10 hover:text-brand-300"
    >
      <span className="truncate">{domainOf(link)}</span>
      <PiArrowSquareOutBold className="shrink-0 text-sm" />
    </a>
  );
}

function Actions({ canEdit, onEdit, onDelete, compact }) {
  if (!canEdit) return null;
  return (
    <div
      className={`flex items-center gap-1 ${
        compact ? "" : "sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit item"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
      >
        <PiPencilSimpleBold />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete item"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <PiTrashBold />
      </button>
    </div>
  );
}

function ClaimButton({ item, busy, onClaim, onUnclaim, full }) {
  const width = full ? "w-full" : "";

  if (item.taken?.mine) {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={onUnclaim}
        className={`${width} inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-brand-500/50 bg-brand-600/15 px-4 text-sm font-medium text-brand-300 transition-colors hover:border-brand-400 hover:bg-brand-600/25 disabled:opacity-50`}
      >
        <PiCheckBold /> Release this gift
      </button>
    );
  }

  if (item.taken) {
    return (
      <span
        className={`${width} inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-ink-700 bg-ink-850 px-4 text-sm text-ink-400`}
      >
        <PiHandbagFill /> Already taken
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClaim}
      className={`${width} inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-ink-950 shadow-[0_10px_28px_-14px_rgba(211,130,26,1)] transition-colors hover:bg-brand-500 disabled:opacity-50`}
    >
      <PiHandbagFill /> I'll get this
    </button>
  );
}

export default function WishItem({
  item,
  view = "grid",
  canEdit = false,
  canClaim = false,
  busy = false,
  onEdit,
  onDelete,
  onClaim,
  onUnclaim,
}) {
  const [expanded, setExpanded] = useState(false);
  const dimmed = Boolean(item.taken) && !item.taken.mine;

  const shared = {
    layout: true,
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
    transition: { type: "spring", stiffness: 380, damping: 34 },
  };

  if (view === "list") {
    return (
      <motion.li {...shared} className="group">
        <div
          className={`flex gap-4 rounded-card border border-ink-700 bg-ink-850/60 p-4 transition-colors hover:border-ink-650 sm:items-center sm:px-5 ${
            dimmed ? "opacity-60" : ""
          }`}
        >
          <ItemThumb item={item} view="list" />

          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[0.9375rem] font-medium text-ink-50">{item.title}</h3>
                <PriorityMark priority={item.priority} />
                <TakenBadge taken={item.taken} />
              </div>
              {item.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-400 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              {item.link && <LinkChip link={item.link} />}
              {canClaim && (
                <ClaimButton item={item} busy={busy} onClaim={onClaim} onUnclaim={onUnclaim} />
              )}
              <Actions canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </div>
        </div>
      </motion.li>
    );
  }

  return (
    <motion.li {...shared} className="group h-full">
      <SpotlightCard
        className={`h-full ${dimmed ? "opacity-65" : ""}`}
        innerClassName="flex h-full flex-col"
        spotlightColor="rgba(231, 156, 49, 0.13)"
      >
        <ItemThumb item={item} view="grid" />

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-medium leading-snug text-ink-50">{item.title}</h3>
            <Actions canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
          </div>

          {(item.priority === "high" || item.taken) && (
            <div className="mt-3 flex flex-wrap gap-2">
              <PriorityMark priority={item.priority} />
              <TakenBadge taken={item.taken} />
            </div>
          )}

          {item.description && (
            <div className="mt-3">
              <p
                className={`text-sm leading-relaxed text-ink-400 ${expanded ? "" : "line-clamp-3"}`}
              >
                {item.description}
              </p>
              {item.description.length > 140 && (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
                >
                  <PiDotsThreeOutlineFill className="text-[0.9em]" />
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          <div className="mt-auto space-y-3 pt-4">
            {item.link && (
              <div className="flex">
                <LinkChip link={item.link} />
              </div>
            )}
            {canClaim && (
              <ClaimButton item={item} busy={busy} onClaim={onClaim} onUnclaim={onUnclaim} full />
            )}
          </div>
        </div>
      </SpotlightCard>
    </motion.li>
  );
}
