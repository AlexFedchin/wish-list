import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input } from "../ui/Field";

const NAME_KEY = "wishly.guestName";

export default function ClaimDialog({ open, onClose, item, onConfirm }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    try {
      setName(localStorage.getItem(NAME_KEY) || "");
    } catch {
      setName("");
    }
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const trimmed = name.trim();
      try {
        if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
      } catch {
        /* nothing to remember if storage is blocked */
      }
      await onConfirm(trimmed);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Claim this gift"
      description={item ? `"${item.title}" gets marked as taken so nobody buys it twice.` : ""}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy} className="sm:min-w-24">
            Cancel
          </Button>
          <Button onClick={confirm} loading={busy} className="sm:min-w-32">
            Yes, I'll get it
          </Button>
        </>
      }
    >
      <div className="space-y-4 pb-4">
        <Input
          label="Your name"
          hint="Optional"
          data-autofocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="So other guests know who's got it"
          maxLength={60}
        />
        <p className="rounded-xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-sm leading-relaxed text-ink-400">
          You can release it later from this device if you change your mind.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}
