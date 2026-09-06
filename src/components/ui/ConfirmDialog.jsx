import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy} className="sm:min-w-28">
            Cancel
          </Button>
          <Button variant={tone} onClick={confirm} loading={busy} data-autofocus className="sm:min-w-28">
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="h-1" />
    </Modal>
  );
}
