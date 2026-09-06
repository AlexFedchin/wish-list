import { useState } from "react";
import {
  PiArrowsClockwiseBold,
  PiCheckBold,
  PiCopyBold,
  PiEyeBold,
  PiPencilSimpleBold,
  PiShareNetworkBold,
} from "react-icons/pi";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";
import { useToast } from "../../lib/toast";

const shareUrl = (token) => `${window.location.origin}/s/${token}`;

function LinkPanel({ variant, token, listTitle, onRegenerate }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isGuest = variant === "guest";
  const url = shareUrl(token);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy it manually");
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: listTitle,
        text: isGuest ? `Here's my wish list: ${listTitle}` : `Help me edit "${listTitle}"`,
        url,
      });
    } catch {
      /* the sheet was dismissed, nothing to report */
    }
  };

  return (
    <div
      className={`rounded-card border p-5 ${
        isGuest ? "border-brand-600/35 bg-brand-950/20" : "border-ink-700 bg-ink-850/50"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isGuest
              ? "bg-brand-600/20 text-brand-300 shadow-[0_0_20px_-6px_rgba(211,130,26,0.9)]"
              : "bg-ink-800 text-ink-300"
          }`}
        >
          {isGuest ? <PiEyeBold /> : <PiPencilSimpleBold />}
        </span>
        <div>
          <h3 className="text-[0.9375rem] font-semibold text-ink-50">
            {isGuest ? "Guest link" : "Editor link"}
          </h3>
          <p className="text-xs text-ink-400">
            {isGuest ? "View the list and claim gifts" : "Add, edit and remove gifts"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-950/70 py-2 pl-3 pr-2">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-300">{url}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy link"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            copied ? "bg-brand-600/20 text-brand-300" : "text-ink-400 hover:bg-ink-800 hover:text-ink-100"
          }`}
        >
          {copied ? <PiCheckBold /> : <PiCopyBold />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={isGuest ? "primary" : "secondary"} icon={PiCopyBold} onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </Button>
        {typeof navigator !== "undefined" && navigator.share && (
          <Button size="sm" variant="ghost" icon={PiShareNetworkBold} onClick={share}>
            Share
          </Button>
        )}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-ink-100"
        >
          <PiArrowsClockwiseBold /> Regenerate
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={onRegenerate}
        title={`Regenerate the ${isGuest ? "guest" : "editor"} link?`}
        description={`The current link stops working immediately. Anyone you already sent it to will need the new one.${
          isGuest ? " Gifts already claimed stay claimed." : ""
        }`}
        confirmLabel="Regenerate"
      />
    </div>
  );
}

export default function ShareLinks({ list, onRegenerate }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LinkPanel
        variant="guest"
        token={list.share.guestToken}
        listTitle={list.title}
        onRegenerate={() => onRegenerate("guest")}
      />
      <LinkPanel
        variant="editor"
        token={list.share.editorToken}
        listTitle={list.title}
        onRegenerate={() => onRegenerate("editor")}
      />
    </div>
  );
}
