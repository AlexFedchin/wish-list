import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PiArrowRightBold,
  PiCheckBold,
  PiConfettiBold,
  PiDevicesBold,
  PiEyeClosedBold,
  PiGiftFill,
  PiHandbagFill,
  PiLinkSimpleBold,
  PiListChecksBold,
  PiPencilSimpleBold,
  PiSlidersBold,
  PiUsersThreeBold,
} from "react-icons/pi";
import Aurora from "../components/reactbits/Aurora";
import DotGrid from "../components/reactbits/DotGrid";
import BlurText from "../components/reactbits/BlurText";
import AnimatedContent from "../components/reactbits/AnimatedContent";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import StarBorder from "../components/reactbits/StarBorder";
import Magnet from "../components/reactbits/Magnet";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import { useAuth } from "../lib/auth";

const FEATURES = [
  {
    icon: PiListChecksBold,
    title: "Everything in one place",
    body: "Title, a few details, a link to the exact model. Nothing more to fill in.",
  },
  {
    icon: PiHandbagFill,
    title: "No duplicate gifts",
    body: "A guest claims an item and it shows as taken for everyone else, instantly.",
  },
  {
    icon: PiEyeClosedBold,
    title: "Surprise stays intact",
    body: "Decide whether you get to see what's been claimed. Off by one switch.",
  },
  {
    icon: PiUsersThreeBold,
    title: "Two kinds of links",
    body: "One for people buying gifts, one for whoever helps you keep the list current.",
  },
  {
    icon: PiSlidersBold,
    title: "Cards or a plain list",
    body: "Switch layouts depending on whether you're browsing or scanning quickly.",
  },
  {
    icon: PiDevicesBold,
    title: "Made for phones first",
    body: "Your friends will open the link on a phone. That's the screen it was designed on.",
  },
];

const STEPS = [
  {
    title: "Add what you'd love",
    body: "Drop in gifts as they come to mind. A link makes it unmistakable.",
  },
  {
    title: "Send one link",
    body: "Friends open it in a browser. No account, no app, no sign-up wall.",
  },
  {
    title: "Let them sort it out",
    body: "Whoever claims a gift first gets it. Everyone else sees it's handled.",
  },
];

const PREVIEW = [
  { title: "Sennheiser Momentum 4", detail: "Black, over-ear", host: "sennheiser.com", taken: false, hot: true },
  { title: "Espresso tamper, 58mm", detail: "Wooden handle if possible", host: "baristahustle.com", taken: true },
  { title: "A good film camera book", detail: "Anything on 35mm portraiture", host: null, taken: false },
];

function LandingNav() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-ink-300 md:flex">
          <a href="#how" className="transition-colors hover:text-ink-50">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-ink-50">
            Features
          </a>
          <a href="#sharing" className="transition-colors hover:text-ink-50">
            Sharing
          </a>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/app">
              <Button size="sm">Open app</Button>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden h-9 items-center rounded-lg px-3.5 text-sm text-ink-300 transition-colors hover:text-ink-50 sm:inline-flex"
              >
                Sign in
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function PreviewPanel() {
  return (
    <div className="relative rounded-3xl border border-ink-700 bg-ink-900/70 p-3 shadow-2xl shadow-black/70 backdrop-blur-xl sm:p-4">
      <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-700" />
        </div>
        <span className="truncate rounded-md bg-ink-850 px-3 py-1 font-mono text-[0.6875rem] text-ink-400">
          wishly.app/s/•••••
        </span>
        <span className="w-12" />
      </div>

      <div className="rounded-2xl border border-ink-800 bg-ink-950/80 p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink-50">Alex turns 30</h3>
          <span className="shrink-0 text-xs text-ink-400">3 gifts</span>
        </div>

        <div className="mt-4 space-y-3">
          {PREVIEW.map((item) => (
            <div
              key={item.title}
              className={`rounded-xl border border-ink-800 bg-ink-900/80 p-3.5 ${
                item.taken ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink-50">{item.title}</p>
                {item.hot && (
                  <span className="shrink-0 rounded-full border border-brand-600/40 bg-brand-600/10 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-brand-300">
                    Really wants
                  </span>
                )}
                {item.taken && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink-650 bg-ink-800 px-2 py-0.5 text-[0.625rem] text-ink-300">
                    <PiCheckBold className="text-[0.85em]" /> Taken
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-400">{item.detail}</p>
              {item.host && (
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-850 px-2 py-1 text-[0.6875rem] text-ink-300">
                  <PiLinkSimpleBold /> {item.host}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const primaryHref = user ? "/app" : "/register";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink-950">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 sm:pb-28 sm:pt-40">
        <Aurora />
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <DotGrid className="h-full w-full" gap={30} proximity={140} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-950" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <StarBorder className="mb-7">
              <span className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-ink-200">
                <PiConfettiBold className="text-brand-400" />
                Birthday coming up?
              </span>
            </StarBorder>

            <BlurText
              as="h1"
              text="A wish list your friends will actually enjoy using"
              className="block text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-ink-50 sm:text-6xl lg:text-[4.25rem]"
              delay={0.045}
            />

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
              Put down what you'd love to get, share one link, and let everyone quietly sort out
              who's buying what. No spreadsheet, no group chat archaeology.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Magnet strength={0.25}>
                <Link to={primaryHref} className="block">
                  <Button size="lg" icon={PiGiftFill} className="w-full sm:w-auto">
                    {user ? "Open my lists" : "Create your wish list"}
                  </Button>
                </Link>
              </Magnet>
              <a href="#how" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  How it works
                </Button>
              </a>
            </div>

            <p className="mt-5 text-sm text-ink-500">Free, and your guests never need an account.</p>
          </div>

          <AnimatedContent delay={0.15} className="mx-auto mt-16 max-w-lg sm:mt-20">
            <PreviewPanel />
          </AnimatedContent>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative border-t border-ink-800/60 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <AnimatedContent>
            <h2 className="max-w-xl text-3xl font-semibold text-ink-50 sm:text-4xl">
              Three steps, then you're done
            </h2>
          </AnimatedContent>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <AnimatedContent key={step.title} delay={index * 0.1}>
                <div className="relative h-full rounded-card border border-ink-800 bg-ink-900/40 p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-600/35 bg-brand-600/10 font-mono text-sm text-brand-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-lg font-medium text-ink-50">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-400">{step.body}</p>
                </div>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-4 py-20 sm:px-6 sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-full max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-ink-700 to-transparent" />
        <div className="mx-auto max-w-6xl">
          <AnimatedContent>
            <h2 className="max-w-xl text-3xl font-semibold text-ink-50 sm:text-4xl">
              What you get
            </h2>
          </AnimatedContent>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <AnimatedContent key={feature.title} delay={(index % 3) * 0.08}>
                <SpotlightCard className="h-full p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-xl text-brand-400 transition-shadow duration-300 group-hover:shadow-[0_0_26px_-8px_rgba(124,58,237,0.95)]">
                    <feature.icon />
                  </span>
                  <h3 className="mt-5 text-[1.0625rem] font-medium text-ink-50">{feature.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-400">{feature.body}</p>
                </SpotlightCard>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      {/* Sharing */}
      <section id="sharing" className="relative px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <AnimatedContent>
            <h2 className="max-w-2xl text-3xl font-semibold text-ink-50 sm:text-4xl">
              Two links, so the right people get the right powers
            </h2>
          </AnimatedContent>

          <div className="mt-12 grid gap-4 lg:grid-cols-2">
            <AnimatedContent>
              <div className="h-full rounded-card border border-brand-600/30 bg-brand-950/20 p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600/20 text-xl text-brand-300 shadow-[0_0_28px_-8px_rgba(124,58,237,0.9)]">
                  <PiUsersThreeBold />
                </span>
                <h3 className="mt-5 text-xl font-medium text-ink-50">Guest link</h3>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Browse the list on any device",
                    "Claim a gift so no one doubles up",
                    "Release it again if plans change",
                    "Can't touch the list itself",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-[0.9375rem] text-ink-300">
                      <PiCheckBold className="mt-1 shrink-0 text-brand-400" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContent>

            <AnimatedContent delay={0.1}>
              <div className="h-full rounded-card border border-ink-700 bg-ink-900/50 p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-xl text-ink-200">
                  <PiPencilSimpleBold />
                </span>
                <h3 className="mt-5 text-xl font-medium text-ink-50">Editor link</h3>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "Add gifts on your behalf",
                    "Fix titles, details and links",
                    "Remove anything that's no longer wanted",
                    "Handy for a partner or a sibling",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-[0.9375rem] text-ink-300">
                      <PiCheckBold className="mt-1 shrink-0 text-ink-500" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContent>
          </div>

          <AnimatedContent delay={0.15}>
            <div className="mt-4 flex flex-col gap-5 rounded-card border border-ink-800 bg-ink-900/40 p-7 sm:flex-row sm:items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-xl text-brand-400">
                <PiEyeClosedBold />
              </span>
              <div className="flex-1">
                <h3 className="text-xl font-medium text-ink-50">Keep the surprise, or don't</h3>
                <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-400">
                  One switch decides whether you can see which gifts have been claimed. Turn it off
                  and the claims stay hidden from you while your guests still coordinate perfectly.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-xl border border-ink-700 bg-ink-850 px-4 py-3">
                <span className="text-sm text-ink-300">Show claims</span>
                <span className="relative h-7 w-12 rounded-full border border-ink-650 bg-ink-800">
                  <span className="absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-ink-400" />
                </span>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative px-4 pb-24 sm:px-6 sm:pb-32">
        <AnimatedContent>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[1.75rem] border border-brand-600/30 bg-ink-900/60 px-6 py-16 text-center sm:px-12 sm:py-20">
            <Aurora intensity={0.85} />
            <div className="relative">
              <h2 className="text-3xl font-semibold text-ink-50 sm:text-[2.75rem] sm:leading-tight">
                Your next birthday can be easy
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ink-300">
                Set up a list in under a minute and send it to whoever asks what you want.
              </p>
              <Magnet strength={0.22}>
                <Link to={primaryHref} className="mt-8 inline-block">
                  <Button size="lg" icon={PiArrowRightBold}>
                    {user ? "Open my lists" : "Create your wish list"}
                  </Button>
                </Link>
              </Magnet>
            </div>
          </div>
        </AnimatedContent>
      </section>

      <footer className="border-t border-ink-800/60 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-ink-500">Made for people who hate spreadsheets.</p>
        </div>
      </footer>
    </div>
  );
}
