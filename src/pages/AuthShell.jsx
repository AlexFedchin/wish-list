import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PiArrowLeftBold } from "react-icons/pi";
import Aurora from "../components/reactbits/Aurora";
import DotGrid from "../components/reactbits/DotGrid";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import { Input } from "../components/ui/Field";
import { useAuth } from "../lib/auth";

/**
 * Sign in and sign up differ only in copy and which auth call they make, so
 * they share one screen.
 */
export default function AuthShell({ mode }) {
  const isSignUp = mode === "signup";
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await (isSignUp ? signUp(email, password) : signIn(email, password));
      navigate(location.state?.from || "/app", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink-950">
      <Aurora intensity={0.8} />
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <DotGrid className="h-full w-full" gap={32} proximity={120} />
      </div>

      <div className="relative flex items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-ink-100"
        >
          <PiArrowLeftBold className="text-xs" /> Home
        </Link>
      </div>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-16 pt-6 sm:px-6">
        <div className="w-full max-w-md">
          <div className="rounded-[1.5rem] border border-ink-700 bg-ink-900/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8">
            <h1 className="text-2xl font-semibold text-ink-50 sm:text-[1.75rem]">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              {isSignUp
                ? "You only need an account to build and manage lists."
                : "Sign in to manage your wish lists."}
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <Input
                label="Email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />

              <Input
                label="Password"
                hint={isSignUp ? "At least 8 characters" : undefined}
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" loading={busy} className="w-full">
                {isSignUp ? "Create account" : "Sign in"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-ink-400">
            {isSignUp ? "Already have an account?" : "New here?"}{" "}
            <Link
              to={isSignUp ? "/login" : "/register"}
              className="font-medium text-brand-400 transition-colors hover:text-brand-300"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
