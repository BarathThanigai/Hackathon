import { useState } from "react"
import AbstractConnection from "./components/AbstractConnection"
import AuthScreen from "./components/AuthScreen"
import { Logo, PrimaryButton, GhostButton } from "./components/ui"

type Screen = "home" | "login" | "signup"

const NAV = ["Product", "Features", "Docs", "Pricing"]

const FEATURES = [
  {
    tag: "01",
    title: "Knowledge Graph",
    desc: "Every entity, relationship and source mapped in one living structure that grows with your work.",
    icon: (
      <>
        <circle cx="7" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="16" cy="16" r="2.4" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17" cy="6" r="1.6" fill="currentColor" />
        <path d="M9 8.5l5 5M8.5 6.5L15 6" stroke="currentColor" strokeWidth="1.2" />
      </>
    ),
  },
  {
    tag: "02",
    title: "Semantic Search",
    desc: "Ask in plain language and traverse context, not just keywords.",
    icon: (
      <>
        <circle cx="9" cy="9" r="5.2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M13 13l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    tag: "03",
    title: "Persistent Memory",
    desc: "Context persists across projects, people and time — nothing is ever lost or forgotten.",
    icon: (
      <>
        <path
          d="M12 3a6 6 0 0 0-6 6c0 2 1 3 1 5v3h10v-3c0-2 1-3 1-5a6 6 0 0 0-6-6Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M9 20h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
]

function Home({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="animate-fade-in relative min-h-screen bg-ink">
      {/* Grid backdrop, fades out downward */}
      <div className="grid-bg pointer-events-none absolute inset-0 h-[640px] opacity-45 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" />

      {/* ── Navbar ── */}
      <header className="relative mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((item) => (
            <a
              key={item}
              href="#"
              className="rounded-md px-3.5 py-1.5 text-sm text-muted transition-colors duration-150 hover:bg-panel hover:text-fg"
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => go("login")}
            className="rounded-md px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            Log in
          </button>
          <button
            onClick={() => go("signup")}
            className="rounded-lg bg-teal px-4 py-1.5 text-sm font-semibold text-ink transition-all duration-200 hover:bg-[#5eead4] hover:shadow-[0_0_20px_-4px_rgba(45,212,191,0.55)] active:scale-[0.98]"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative mx-auto max-w-[1200px] px-6">
        <div className="grid items-center gap-10 pt-10 lg:grid-cols-[0.9fr_1.1fr] lg:pt-14">

          {/* Left copy */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-line-2 bg-panel px-3 py-1">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-teal"
                style={{ animation: "blink 1.8s ease-in-out infinite" }}
              />
              <span className="mono text-[10px] uppercase tracking-widest text-muted">
                Now in public beta
              </span>
            </div>

            <h1 className="mt-5 text-[42px] font-semibold leading-[1.06] tracking-[-0.02em] text-fg lg:text-[54px]">
              Connect Your
              <br />
              Knowledge.
              <br />
              <span className="text-teal">Discover What</span>
              <br />
              <span className="text-teal">Matters.</span>
            </h1>

            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
              Turn scattered information into connected knowledge — entities, relationships, and context in one living graph.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <PrimaryButton onClick={() => go("signup")} className="px-6">
                Get Started
                <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M3 7.5h8M7.5 4l3.5 3.5L7.5 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </PrimaryButton>
              <GhostButton className="px-6">View Demo</GhostButton>
            </div>
          </div>

          {/* Right — graph panel */}
          <div
            className="animate-fade-up relative h-[430px] overflow-hidden rounded-2xl border border-line bg-panel/60 lg:h-[490px]"
            style={{ animationDelay: "0.08s" }}
          >
            {/* Panel chrome bar */}
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="mono text-[10px] uppercase tracking-widest text-muted">
                knowledge_graph.view
              </span>
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-line-2" />
                <span className="h-2 w-2 rounded-full bg-line-2" />
                <span className="h-2 w-2 rounded-full bg-teal/60" />
              </div>
            </div>
            <div className="relative h-[calc(100%-42px)]">
              <AbstractConnection />
            </div>
          </div>
        </div>

        {/* ── Feature cards ── */}
        <div className="relative z-10 mt-14 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up group rounded-xl border border-line bg-panel p-5 transition-all duration-300 hover:border-teal/35 hover:bg-panel-2"
              style={{ animationDelay: `${0.12 + i * 0.07}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-2 bg-ink text-teal transition-colors duration-300 group-hover:border-teal/40">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    {f.icon}
                  </svg>
                </span>
                <span className="mono text-[10px] tracking-widest text-faint">
                  {f.tag}
                </span>
              </div>
              <h3 className="mt-4 text-[14px] font-semibold tracking-tight text-fg">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <footer className="flex items-center justify-between py-8 mt-2">
          <Logo />
          <span className="mono text-[10px] tracking-wide text-faint">
            © 2026 MemoryMap · all systems operational
          </span>
        </footer>
      </main>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")

  if (screen === "home") return <Home go={setScreen} />

  return (
    <AuthScreen
      mode={screen}
      onSwitch={() => setScreen(screen === "login" ? "signup" : "login")}
      onSuccess={() => setScreen("home")}
    />
  )
}
