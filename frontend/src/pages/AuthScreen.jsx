import { useMemo, useState } from 'react';
import AbstractConnection from '../components/AbstractConnection';
import { Logo, PrimaryButton, GhostButton, Field, Divider, GoogleIcon } from '../components/ui';

function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_META = [
  { label: '', color: '' },
  { label: 'Weak', color: '#f87171' },
  { label: 'Fair', color: '#fbbf24' },
  { label: 'Good', color: '#22d3ee' },
  { label: 'Strong', color: '#2dd4bf' },
];

export default function AuthScreen({ mode, onSwitch, onSuccess }) {
  const isLogin = mode === 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleStep, setGoogleStep] = useState(false); // toggles the mini email picker
  const [googleEmail, setGoogleEmail] = useState('');

const startGoogle = () => {
  setGoogleStep(true);
};

const confirmGoogle = () => {
  if (!googleEmail.trim()) return;
  setGoogleLoading(true);
  setTimeout(onSuccess, 700);
};

  const s = useMemo(() => strength(pw), [pw]);

  const submit = () => {
    setLoading(true);
    setTimeout(onSuccess, 1100);
  };

  const submitGoogle = () => {
    setGoogleLoading(true);
    setTimeout(onSuccess, 900);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-panel p-10 lg:flex">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative"><Logo /></div>
        <div className="relative -mx-4 h-[440px]">
          <AbstractConnection />
        </div>
        <div className="relative max-w-xs">
          <p className="mono text-[10px] uppercase tracking-widest text-teal">{isLogin ? '// resume session' : '// map your knowledge'}</p>
          <h2 className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-fg">
            {isLogin ? 'Your knowledge, connected and always in reach.' : 'Turn scattered information into a living knowledge graph.'}
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-center bg-ink px-6 py-10 sm:px-10">
        <div key={mode} className="animate-fade-up w-full max-w-[360px]">
          <div className="mb-8 lg:hidden"><Logo /></div>

          <h1 className="text-[26px] font-semibold tracking-tight text-fg">
            {isLogin ? 'Welcome back' : 'Create your MemoryMap'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{isLogin ? 'Sign in to continue.' : 'Start mapping your knowledge in minutes.'}</p>

          {isLogin && (
            <>
              <div className="mt-7">
                <GhostButton className="w-full gap-2.5" onClick={submitGoogle} disabled={googleLoading}>
                  {googleLoading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-fg/30 border-t-fg" />
                  ) : (
                    <GoogleIcon />
                  )}
                  {googleLoading ? 'Connecting…' : 'Continue with Google'}
                </GhostButton>
              </div>

              <div className="my-6"><Divider label="or with email" /></div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <Field label="Email" type="email" placeholder="you@company.com" value={email} onChange={setEmail} />
                <Field label="Password" placeholder="••••••••" value={pw} onChange={setPw} toggleable right={<button type="button" className="mono text-[10px] tracking-wide text-teal transition-colors hover:text-[#5eead4]">Forgot password?</button>} />

                <label className="flex cursor-pointer items-center gap-2 pt-1 select-none">
                  <span onClick={() => setRemember((r) => !r)} className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${remember ? 'border-teal bg-teal' : 'border-line-2 bg-transparent'}`}>
                    {remember && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4.5" stroke="#07090b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-xs text-muted">Remember me</span>
                </label>

                <PrimaryButton type="submit" loading={loading} className="mt-2 w-full">
                  {loading ? 'Signing in…' : 'Log in'}
                  {!loading && (
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                      <path d="M3 7.5h8M7.5 4l3.5 3.5L7.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </PrimaryButton>
              </form>
            </>
          )}

          {!isLogin && (
            <>
              <form
                className="mt-7 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <Field label="Name" placeholder="Your name" value={name} onChange={setName} />
                <Field label="Email" type="email" placeholder="you@company.com" value={email} onChange={setEmail} />
                <Field label="Password" placeholder="••••••••" value={pw} onChange={setPw} toggleable />
                <Field label="Confirm password" placeholder="••••••••" value={confirm} onChange={setConfirm} toggleable />

                {pw.length > 0 && (
                  <div className="animate-fade-in">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${s >= i ? 'bg-teal' : 'bg-line-2'}`} />
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">
                      Password strength <span style={{ color: STRENGTH_META[s]?.color || '#7d8b93' }}>{STRENGTH_META[s]?.label || ''}</span>
                    </p>
                  </div>
                )}

                <PrimaryButton type="submit" loading={loading} className="mt-2 w-full">
                  {loading ? 'Creating account…' : 'Create account'}
                </PrimaryButton>
              </form>

              <div className="mt-6 text-center text-xs text-muted">
                Already have an account?{' '}
                <button type="button" onClick={onSwitch} className="font-medium text-teal hover:text-[#5eead4]">
                  Log in
                </button>
              </div>
            </>
          )}

          {isLogin && (
            <div className="mt-6 text-center text-xs text-muted">
              Need an account?{' '}
              <button type="button" onClick={onSwitch} className="font-medium text-teal hover:text-[#5eead4]">
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}