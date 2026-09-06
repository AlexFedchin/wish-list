import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { PiCaretDownBold, PiSignOutBold, PiSquaresFourBold } from "react-icons/pi";
import Logo from "./ui/Logo";
import Button from "./ui/Button";
import { useAuth } from "../lib/auth";

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo to={user ? "/app" : "/"} />

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              className="flex h-10 items-center gap-2 rounded-xl border border-ink-700 bg-ink-850/70 pl-2 pr-2.5 text-sm text-ink-200 transition-colors hover:border-ink-650 hover:text-ink-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600/20 text-xs font-semibold uppercase text-brand-300">
                {user.email.slice(0, 2)}
              </span>
              <span className="hidden max-w-[10rem] truncate sm:inline">{user.email}</span>
              <PiCaretDownBold
                className={`text-xs text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div className="absolute right-0 top-12 w-56 origin-top-right animate-pop overflow-hidden rounded-xl border border-ink-700 bg-ink-900 p-1.5 shadow-2xl shadow-black/70">
                <p className="truncate px-3 py-2 text-xs text-ink-400 sm:hidden">{user.email}</p>
                <Link
                  to="/app"
                  onClick={() => setOpen(false)}
                  className="flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-ink-50"
                >
                  <PiSquaresFourBold className="text-ink-400" /> My wish lists
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                  className="flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-ink-200 transition-colors hover:bg-ink-800 hover:text-ink-50"
                >
                  <PiSignOutBold className="text-ink-400" /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => navigate("/register")}>
              Get started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
