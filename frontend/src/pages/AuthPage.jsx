import AbstractConnection from '../components/AbstractConnection';
import { Logo } from '../components/ui';
import '../styles/global.css';

export default function AuthPage({ mode }) {
  const isSignIn = mode === 'sign-in';

  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] bg-ink">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-panel p-10 lg:flex">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative"><Logo /></div>
        <div className="relative -mx-4 h-[440px]"><AbstractConnection /></div>
        <div className="relative max-w-xs">
          <p className="mono text-[10px] uppercase tracking-widest text-teal">{isSignIn ? '// resume session' : '// map your knowledge'}</p>
          <h1 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-fg">{isSignIn ? 'Your knowledge, connected and always in reach.' : 'Turn scattered information into a living knowledge graph.'}</h1>
        </div>
      </section>
      <section className="flex items-center justify-center bg-ink px-6 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <div className="rounded-lg border border-line bg-panel p-6 text-center text-fg">
            Auth screen is now handled by the unified app. Use the main login flow from the home page.
          </div>
        </div>
      </section>
    </main>
  );
}
