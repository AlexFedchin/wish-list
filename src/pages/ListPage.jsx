import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  PiArrowLeftBold,
  PiArrowsClockwiseBold,
  PiEyeClosedBold,
  PiGearSixBold,
  PiGiftFill,
  PiPlusBold,
  PiShareNetworkBold,
  PiTrashBold,
} from "react-icons/pi";
import AppHeader from "../components/AppHeader";
import Aurora from "../components/reactbits/Aurora";
import Button from "../components/ui/Button";
import Switch from "../components/ui/Switch";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import { Loader } from "../components/ui/Loader";
import { Input, Textarea } from "../components/ui/Field";
import ItemForm from "../components/wishlist/ItemForm";
import ItemGrid from "../components/wishlist/ItemGrid";
import ShareLinks from "../components/wishlist/ShareLinks";
import ViewToggle from "../components/wishlist/ViewToggle";
import useStickyState from "../lib/useStickyState";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

const TABS = [
  { id: "gifts", label: "Gifts", Icon: PiGiftFill },
  { id: "sharing", label: "Sharing", Icon: PiShareNetworkBold },
  { id: "settings", label: "Settings", Icon: PiGearSixBold },
];

function Tabs({ active, onChange }) {
  return (
    <div className="scrollbar-none -mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-ink-800 bg-ink-900/60 p-1 sm:min-w-0">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active === id}
            className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors sm:flex-none ${
              active === id
                ? "bg-ink-800 text-ink-50 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.3)]"
                : "text-ink-400 hover:text-ink-100"
            }`}
          >
            <Icon className={active === id ? "text-brand-400" : ""} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Settings({ list, onSave, onRegenerateBoth, onDelete }) {
  const [title, setTitle] = useState(list.title);
  const [note, setNote] = useState(list.note ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingRotate, setConfirmingRotate] = useState(false);

  const dirty =
    title.trim() !== list.title || note.trim() !== (list.note ?? "");

  const save = async () => {
    setBusy(true);
    try {
      await onSave({ title: title.trim(), note: note.trim() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-card border border-ink-700 bg-ink-850/50 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink-50">List details</h2>
        <div className="mt-5 space-y-4">
          <Input
            label="Name"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
          />
          <Textarea
            label="Note for guests"
            hint="Optional"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={300}
            placeholder="Shown at the top of the shared page."
          />
          <Button
            onClick={save}
            loading={busy}
            disabled={!dirty || !title.trim()}
          >
            Save changes
          </Button>
        </div>
      </section>

      <section className="rounded-card border border-ink-700 bg-ink-850/50 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink-50">Surprise</h2>
        <div className="mt-5">
          <Switch
            checked={list.showTaken}
            onChange={(value) => onSave({ showTaken: value })}
            label="Show me which gifts have been claimed"
            description="Turn this off and claims stay hidden from you. Your guests still see them, so nobody buys the same gift twice."
          />
        </div>
        {!list.showTaken && (
          <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-ink-700 bg-ink-900/70 px-4 py-3 text-sm leading-relaxed text-ink-400">
            <PiEyeClosedBold className="mt-0.5 shrink-0 text-brand-400" />
            Surprise mode is on. Claim badges are hidden from you everywhere in
            this app.
          </p>
        )}
      </section>

      <section className="rounded-card border border-ink-700 bg-ink-850/50 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink-50">Sharing links</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">
          Regenerating both links at once retires the old ones immediately.
        </p>
        <Button
          variant="secondary"
          icon={PiArrowsClockwiseBold}
          className="mt-4"
          onClick={() => setConfirmingRotate(true)}
        >
          Regenerate both links
        </Button>
      </section>

      <section className="rounded-card border border-red-500/25 bg-red-500/[0.04] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-ink-50">
          Delete this list
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">
          The gifts and both sharing links are removed for good.
        </p>
        <Button
          variant="danger"
          icon={PiTrashBold}
          className="mt-4"
          onClick={() => setConfirmingDelete(true)}
        >
          Delete list
        </Button>
      </section>

      <ConfirmDialog
        open={confirmingRotate}
        onClose={() => setConfirmingRotate(false)}
        onConfirm={onRegenerateBoth}
        title="Regenerate both links?"
        description="Everyone you've already shared this list with will lose access until you send the new links."
        confirmLabel="Regenerate both"
      />
      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={onDelete}
        title={`Delete "${list.title}"?`}
        description="This can't be undone."
        confirmLabel="Delete forever"
      />
    </div>
  );
}

export default function ListPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [list, setList] = useState(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState("gifts");
  const [view, setView] = useStickyState("wishly.view", "grid");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .list(id)
      .then(({ list }) => {
        if (cancelled) return;
        if (list) setList(list);
        else setMissing(true);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) setMissing(true);
        else toast.error(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  const save = useCallback(
    async (patch) => {
      try {
        const { list } = await api.updateList(id, patch);
        setList(list);
        toast.success("Saved");
      } catch (err) {
        toast.error(err.message);
      }
    },
    [id, toast],
  );

  const submitItem = async (values) => {
    const { list } = editing
      ? await api.updateItem(id, editing.id, values)
      : await api.addItem(id, values);
    setList(list);
    toast.success(editing ? "Gift updated" : "Added to your list");
  };

  const removeItem = async () => {
    try {
      const { list } = await api.deleteItem(id, deletingItem.id);
      setList(list);
      toast.success("Gift removed");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const regenerate = async (target) => {
    try {
      const { list } = await api.rotateLink(id, target);
      setList(list);
      toast.success(
        target === "both" ? "Both links regenerated" : "Link regenerated",
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeList = async () => {
    try {
      await api.deleteList(id);
      toast.success("List deleted");
      navigate("/app", { replace: true });
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (missing) {
    return (
      <div className="min-h-dvh bg-ink-950">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
          <EmptyState
            icon={PiGiftFill}
            title="This list isn't available"
            description="It may have been deleted, or it belongs to another account."
            action={
              <Link to="/app">
                <Button variant="secondary" icon={PiArrowLeftBold}>
                  Back to my lists
                </Button>
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-dvh bg-ink-950">
        <AppHeader />
        <Loader label="Opening your list" />
      </div>
    );
  }

  const openForm = (item = null) => {
    setEditing(item);
    setFormOpen(true);
  };

  return (
    <div className="relative min-h-dvh bg-ink-950">
      <Aurora intensity={0.5} />
      <AppHeader />

      <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-ink-100"
        >
          <PiArrowLeftBold className="text-xs" /> My wish lists
        </Link>

        <div className="mt-4">
          <h1 className="text-[1.75rem] font-semibold leading-tight text-ink-50 sm:text-4xl">
            {list.title}
          </h1>
          {list.note && (
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-400">
              {list.note}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-850/70 px-2.5 py-1 text-ink-300">
              <PiGiftFill className="text-brand-400" />
              {list.itemCount} {list.itemCount === 1 ? "gift" : "gifts"}
            </span>
            {list.showTaken ? (
              list.takenCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-brand-600/35 bg-brand-600/10 px-2.5 py-1 text-brand-300">
                  {list.takenCount} claimed
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-850/70 px-2.5 py-1 text-ink-400">
                <PiEyeClosedBold /> Surprise mode
              </span>
            )}
          </div>
        </div>

        <Tabs active={tab} onChange={setTab} />

        {tab === "gifts" && (
          <div className="mt-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <ViewToggle view={view} onChange={setView} />
              <Button
                icon={PiPlusBold}
                onClick={() => openForm()}
                className="hidden sm:inline-flex"
              >
                Add gift
              </Button>
            </div>

            {list.items.length === 0 ? (
              <EmptyState
                icon={PiGiftFill}
                title="Add your first gift"
                description="A title is all you need. Add a link and a note so nobody has to guess."
                action={
                  <Button
                    icon={PiPlusBold}
                    size="lg"
                    onClick={() => openForm()}
                  >
                    Add a gift
                  </Button>
                }
              />
            ) : (
              <ItemGrid
                items={list.items}
                view={view}
                canEdit
                onEdit={openForm}
                onDelete={setDeletingItem}
              />
            )}
          </div>
        )}

        {tab === "sharing" && (
          <div className="mt-6 space-y-4">
            <ShareLinks list={list} onRegenerate={regenerate} />
            <p className="rounded-card border border-ink-800 bg-ink-900/40 px-5 py-4 text-sm leading-relaxed text-ink-400">
              Anyone with a link can open it — treat them like passwords. If a
              link ends up somewhere it shouldn't, regenerate it and the old one
              stops working.
            </p>
          </div>
        )}

        {tab === "settings" && (
          <Settings
            list={list}
            onSave={save}
            onRegenerateBoth={() => regenerate("both")}
            onDelete={removeList}
          />
        )}
      </main>

      {tab === "gifts" && list.items.length > 0 && (
        <button
          type="button"
          onClick={() => openForm()}
          aria-label="Add gift"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white shadow-[0_16px_40px_-12px_rgba(124,58,237,1)] transition-transform active:scale-95 sm:hidden"
        >
          <PiPlusBold />
        </button>
      )}

      <ItemForm
        open={formOpen}
        item={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={submitItem}
      />

      <ConfirmDialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={removeItem}
        title={deletingItem ? `Remove "${deletingItem.title}"?` : ""}
        description="It disappears from the shared list too."
        confirmLabel="Remove"
      />
    </div>
  );
}
