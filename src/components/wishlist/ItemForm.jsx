import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input, Textarea } from "../ui/Field";

const EMPTY = { title: "", description: "", link: "", priority: "normal" };

export default function ItemForm({ open, onClose, onSubmit, item }) {
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      item
        ? {
            title: item.title ?? "",
            description: item.description ?? "",
            link: item.link ?? "",
            priority: item.priority ?? "normal",
          }
        : EMPTY,
    );
    setError("");
  }, [open, item]);

  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event) => {
    event?.preventDefault();
    if (!values.title.trim()) {
      setError("Give the gift a name");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onSubmit(values);
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
      title={item ? "Edit gift" : "Add a gift"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy} className="sm:min-w-24">
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} className="sm:min-w-32">
            {item ? "Save changes" : "Add to list"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4 pb-4">
        <Input
          label="What is it?"
          data-autofocus
          value={values.title}
          onChange={set("title")}
          placeholder="Noise-cancelling headphones"
          maxLength={120}
          error={error && !values.title.trim() ? error : ""}
        />

        <Textarea
          label="Details"
          hint="Optional"
          value={values.description}
          onChange={set("description")}
          placeholder="Colour, size, which model, anything that helps."
          maxLength={600}
          rows={3}
        />

        <Input
          label="Link"
          hint="Optional"
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          value={values.link}
          onChange={set("link")}
          placeholder="https://shop.example.com/item"
          maxLength={800}
        />

        <div>
          <span className="mb-2 block text-sm font-medium text-ink-200">How much do you want it?</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "normal", label: "Would be nice" },
              { value: "high", label: "Really wants it" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValues((current) => ({ ...current, priority: option.value }))}
                className={`h-11 rounded-xl border px-3 text-sm font-medium transition-colors ${
                  values.priority === option.value
                    ? "border-brand-500 bg-brand-600/15 text-brand-200"
                    : "border-ink-700 bg-ink-900/70 text-ink-300 hover:border-ink-650 hover:text-ink-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && values.title.trim() && <p className="text-sm text-red-400">{error}</p>}

        {/* Lets Enter submit from any field without a visible duplicate button. */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
