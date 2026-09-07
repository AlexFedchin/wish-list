import { useState } from "react";
import { Link } from "react-router-dom";
import { PiArrowLeftBold, PiCheckBold, PiEyeBold, PiEyeSlashBold } from "react-icons/pi";
import AppHeader from "../components/AppHeader";
import Aurora from "../components/reactbits/Aurora";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";

const MIN_LENGTH = 8;
const EMPTY = { current: "", next: "", confirm: "" };

/** Reveal toggle sits inside the field, so the row keeps one control height. */
function PasswordField({ label, hint, value, onChange, autoComplete, name, error }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        label={label}
        hint={hint}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        value={value}
        error={error}
        onChange={(event) => onChange(event.target.value)}
        className="[&_input]:pr-12"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        className="absolute right-1 top-8 flex h-10 w-10 items-center justify-center rounded-lg text-ink-400 transition-colors hover:text-ink-100 focus-visible:text-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/50"
      >
        {visible ? <PiEyeSlashBold /> : <PiEyeBold />}
      </button>
    </div>
  );
}

export default function Account() {
  const { user, changePassword } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (field) => (value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setError("");
    setDone(false);
  };

  const mismatch = form.confirm.length > 0 && form.next !== form.confirm;
  const ready =
    form.current.length > 0 && form.next.length >= MIN_LENGTH && form.next === form.confirm;

  const submit = async (event) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError("");
    try {
      await changePassword(form.current, form.next);
      setForm(EMPTY);
      setDone(true);
      toast.success("Password changed");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="relative min-h-dvh bg-ink-950">
      <Aurora intensity={0.45} />
      <AppHeader />

      <main className="relative mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-ink-100"
        >
          <PiArrowLeftBold className="text-xs" /> My wish lists
        </Link>

        <h1 className="mt-4 text-[1.75rem] font-semibold leading-tight text-ink-50 sm:text-4xl">
          Account
        </h1>

        {/* Read-only facts sit as a plain rule-separated pair rather than a
            card, so the one thing you can act on below is the only box. */}
        <dl className="mt-6 divide-y divide-ink-800 border-y border-ink-800 text-sm">
          {/* Stacked on phones: a long address next to its label leaves the
              two touching in the middle of the row. */}
          <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-ink-400">Email</dt>
            <dd className="min-w-0 truncate text-ink-100">{user?.email}</dd>
          </div>
          {joined && (
            <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <dt className="text-ink-400">Member since</dt>
              <dd className="text-ink-100">{joined}</dd>
            </div>
          )}
        </dl>

        <section className="mt-8 rounded-card border border-ink-700 bg-ink-850/50 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-ink-50">Change password</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-400">
            You stay signed in here. Anywhere else you're signed in gets signed out.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {/* Password managers use this to know which account is being updated. */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={user?.email ?? ""}
              readOnly
              hidden
            />

            <PasswordField
              label="Current password"
              name="current-password"
              autoComplete="current-password"
              value={form.current}
              onChange={set("current")}
            />
            <PasswordField
              label="New password"
              hint={`At least ${MIN_LENGTH} characters`}
              name="new-password"
              autoComplete="new-password"
              value={form.next}
              onChange={set("next")}
            />
            <PasswordField
              label="Repeat new password"
              name="confirm-password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={set("confirm")}
              error={mismatch ? "Both new passwords need to match" : undefined}
            />

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" loading={busy} disabled={!ready}>
                Change password
              </Button>
              {done && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-300"
                >
                  <PiCheckBold /> Saved
                </span>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
