import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PiCaretRightBold,
  PiGiftFill,
  PiPlusBold,
  PiSparkleFill,
} from "react-icons/pi";
import AppHeader from "../components/AppHeader";
import Aurora from "../components/reactbits/Aurora";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import { CardSkeleton } from "../components/ui/Loader";
import { Input, Textarea } from "../components/ui/Field";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

function NewListModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setNote("");
      setError("");
    }
  }, [open]);

  const submit = async (event) => {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { list } = await api.createList({ title: title.trim(), note: note.trim() });
      onCreated(list);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New wish list"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy} className="sm:min-w-24">
            Cancel
          </Button>
          <Button onClick={submit} loading={busy} className="sm:min-w-32">
            Create list
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4 pb-4">
        <Input
          label="Name it"
          data-autofocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="My 30th birthday"
          maxLength={80}
        />
        <Textarea
          label="A note for your guests"
          hint="Optional"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Party's on the 14th. Anything here would make me happy."
          maxLength={300}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}

function ListCard({ list }) {
  const claimed = list.showTaken ? list.takenCount : null;

  return (
    <Link to={`/app/list/${list.id}`} className="block">
      <SpotlightCard className="h-full p-5 transition-transform duration-200 active:scale-[0.99]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-medium leading-snug text-ink-50">{list.title}</h2>
          <PiCaretRightBold className="mt-1 shrink-0 text-ink-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-400" />
        </div>

        {list.note && (
          <p className="mt-2 text-sm leading-relaxed text-ink-400 line-clamp-2">{list.note}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800/70 px-2.5 py-1 text-ink-300">
            <PiGiftFill className="text-brand-400" />
            {list.itemCount} {list.itemCount === 1 ? "gift" : "gifts"}
          </span>
          {claimed !== null && claimed > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-600/35 bg-brand-600/10 px-2.5 py-1 text-brand-300">
              {claimed} claimed
            </span>
          )}
          {!list.showTaken && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800/70 px-2.5 py-1 text-ink-400">
              Surprise mode
            </span>
          )}
        </div>
      </SpotlightCard>
    </Link>
  );
}

export default function Dashboard() {
  const [lists, setLists] = useState(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const { lists } = await api.lists();
      setLists(lists);
    } catch (err) {
      toast.error(err.message);
      setLists([]);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative min-h-dvh bg-ink-950">
      <Aurora intensity={0.55} />
      <AppHeader />

      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[1.75rem] font-semibold text-ink-50 sm:text-3xl">My wish lists</h1>
            {lists?.length > 0 && (
              <p className="mt-1.5 text-sm text-ink-400">
                {lists.length} {lists.length === 1 ? "list" : "lists"}
              </p>
            )}
          </div>
          {lists?.length > 0 && (
            <Button icon={PiPlusBold} onClick={() => setCreating(true)} className="hidden sm:inline-flex">
              New list
            </Button>
          )}
        </div>

        <div className="mt-8">
          {lists === null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : lists.length === 0 ? (
            <EmptyState
              icon={PiSparkleFill}
              title="Nothing here yet"
              description="Create your first wish list, add a few things you'd love, and share the link."
              action={
                <Button icon={PiPlusBold} size="lg" onClick={() => setCreating(true)}>
                  Create a wish list
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Thumb-reachable on phones, where the header button is hidden. */}
      {lists?.length > 0 && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          aria-label="New wish list"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-ink-950 shadow-[0_16px_38px_-14px_rgba(211,130,26,0.85)] transition-transform active:scale-95 sm:hidden"
        >
          <PiPlusBold />
        </button>
      )}

      <NewListModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(list) => navigate(`/app/list/${list.id}`)}
      />
    </div>
  );
}
