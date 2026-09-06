import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  PiEyeBold,
  PiGiftFill,
  PiHandbagFill,
  PiLinkBreakBold,
  PiPencilSimpleBold,
  PiPlusBold,
} from "react-icons/pi";
import Aurora from "../components/reactbits/Aurora";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Logo from "../components/ui/Logo";
import { Loader } from "../components/ui/Loader";
import ClaimDialog from "../components/wishlist/ClaimDialog";
import ItemForm from "../components/wishlist/ItemForm";
import ItemGrid from "../components/wishlist/ItemGrid";
import ViewToggle from "../components/wishlist/ViewToggle";
import useStickyState from "../lib/useStickyState";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

function RoleBanner({ role }) {
  const editor = role === "editor";
  return (
    <div
      className={`flex items-start gap-3 rounded-card border px-4 py-3.5 sm:px-5 ${
        editor
          ? "border-ink-700 bg-ink-850/60"
          : "border-brand-600/30 bg-brand-950/20"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          editor ? "bg-ink-800 text-ink-300" : "bg-brand-600/20 text-brand-300"
        }`}
      >
        {editor ? <PiPencilSimpleBold /> : <PiEyeBold />}
      </span>
      <p className="text-sm leading-relaxed text-ink-300">
        {editor ? (
          <>
            You have an{" "}
            <span className="font-medium text-ink-100">editor link</span>, so you
            can add, change or remove gifts on the owner's behalf.
          </>
        ) : (
          <>
            Claim anything you plan to buy and the other guests will see it's{" "}
            <span className="font-medium text-ink-100">already taken</span>.
          </>
        )}
      </p>
    </div>
  );
}

export default function SharePage() {
  const { token } = useParams();
  const toast = useToast();

  const [list, setList] = useState(null);
  const [broken, setBroken] = useState(false);
  const [view, setView] = useStickyState("wishstand.view", "grid");
  const [hideTaken, setHideTaken] = useState(false);
  const [claiming, setClaiming] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .shared(token)
      .then(({ list }) => {
        if (cancelled) return;
        if (list) setList(list);
        else setBroken(true);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 404) setBroken(true);
        else toast.error(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token, toast]);

  const visible = useMemo(() => {
    if (!list) return [];
    return hideTaken
      ? list.items.filter((item) => !item.taken || item.taken.mine)
      : list.items;
  }, [list, hideTaken]);

  const claim = async (name) => {
    const { list } = await api.claim(token, claiming.id, name);
    setList(list);
    toast.success("Claimed. Thank you!");
  };

  const unclaim = async (item) => {
    setBusyId(item.id);
    try {
      const { list } = await api.unclaim(token, item.id);
      setList(list);
      toast.toast("Released. It's up for grabs again");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const submitItem = async (values) => {
    const { list } = editing
      ? await api.sharedUpdateItem(token, editing.id, values)
      : await api.sharedAddItem(token, values);
    setList(list);
    toast.success(editing ? "Gift updated" : "Gift added");
  };

  const removeItem = async () => {
    try {
      const { list } = await api.sharedDeleteItem(token, deletingItem.id);
      setList(list);
      toast.success("Gift removed");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (broken) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
        <Aurora intensity={0.6} />
        <div className="relative max-w-md">
          <Logo className="mb-10" />
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-ink-700 bg-ink-850 text-2xl text-ink-400">
            <PiLinkBreakBold />
          </span>
          <h1 className="mt-6 text-2xl font-semibold text-ink-50 sm:text-3xl">
            This link no longer works
          </h1>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-400">
            The owner regenerated it, or the list was deleted. Ask them for a
            fresh link.
          </p>
          <Link to="/" className="mt-8 inline-block">
            <Button variant="secondary">About Wishstand</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-dvh bg-ink-950">
        <Loader label="Opening the wish list" />
      </div>
    );
  }

  const isEditor = list.role === "editor";
  const openForm = (item = null) => {
    setEditing(item);
    setFormOpen(true);
  };

  return (
    <div className="relative min-h-dvh bg-ink-950">
      <Aurora intensity={0.5} />

      <header className="relative border-b border-ink-800/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <Link to="/register">
            <Button size="sm" variant="secondary">
              Make your own
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
        <h1 className="text-[1.75rem] font-semibold leading-tight text-ink-50 sm:text-4xl">
          {list.title}
        </h1>
        {list.note && (
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-300">
            {list.note}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-850/70 px-2.5 py-1 text-ink-300">
            <PiGiftFill className="text-brand-400" />
            {list.itemCount} {list.itemCount === 1 ? "gift" : "gifts"}
          </span>
          {list.takenCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-850/70 px-2.5 py-1 text-ink-300">
              <PiHandbagFill /> {list.takenCount} taken
            </span>
          )}
        </div>

        <div className="mt-6">
          <RoleBanner role={list.role} />
        </div>

        {list.items.length > 0 && (
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ViewToggle view={view} onChange={setView} />
              {list.takenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setHideTaken((value) => !value)}
                  aria-pressed={hideTaken}
                  className={`h-9 rounded-xl border px-3.5 text-sm font-medium transition-colors ${
                    hideTaken
                      ? "border-brand-500/50 bg-brand-600/15 text-brand-300"
                      : "border-ink-700 bg-ink-900/70 text-ink-400 hover:text-ink-100"
                  }`}
                >
                  Hide taken
                </button>
              )}
            </div>
            {isEditor && (
              <Button
                icon={PiPlusBold}
                onClick={() => openForm()}
                className="hidden sm:inline-flex"
              >
                Add gift
              </Button>
            )}
          </div>
        )}

        <div className="mt-5">
          {list.items.length === 0 ? (
            <EmptyState
              icon={PiGiftFill}
              title="Nothing on this list yet"
              description={
                isEditor
                  ? "Add the first gift so guests have something to pick from."
                  : "Check back soon. The owner hasn't added anything."
              }
              action={
                isEditor ? (
                  <Button
                    icon={PiPlusBold}
                    size="lg"
                    onClick={() => openForm()}
                  >
                    Add a gift
                  </Button>
                ) : null
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={PiHandbagFill}
              title="Every gift is taken"
              description="Your friends were quick. Show the full list to see who claimed what."
              action={
                <Button variant="secondary" onClick={() => setHideTaken(false)}>
                  Show all gifts
                </Button>
              }
            />
          ) : (
            <ItemGrid
              items={visible}
              view={view}
              busyId={busyId}
              canClaim
              canEdit={isEditor}
              onClaim={setClaiming}
              onUnclaim={unclaim}
              onEdit={openForm}
              onDelete={setDeletingItem}
            />
          )}
        </div>
      </main>

      {isEditor && list.items.length > 0 && (
        <button
          type="button"
          onClick={() => openForm()}
          aria-label="Add gift"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white shadow-[0_16px_40px_-12px_rgba(124,58,237,1)] transition-transform active:scale-95 sm:hidden"
        >
          <PiPlusBold />
        </button>
      )}

      <ClaimDialog
        open={Boolean(claiming)}
        item={claiming}
        onClose={() => setClaiming(null)}
        onConfirm={claim}
      />

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
        description="This removes it for the owner and every other guest."
        confirmLabel="Remove"
      />
    </div>
  );
}
