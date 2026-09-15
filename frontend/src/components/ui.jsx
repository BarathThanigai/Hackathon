import { useState } from 'react';

export function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="5" cy="6" r="2.4" fill="#2dd4bf" />
        <circle cx="17" cy="5" r="1.8" stroke="#2dd4bf" strokeWidth="1.2" />
        <circle cx="16" cy="16" r="2.4" stroke="#2dd4bf" strokeWidth="1.2" />
        <circle cx="7" cy="15" r="1.6" fill="#22d3ee" />
        <line x1="5" y1="6" x2="16" y2="16" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="5" y1="6" x2="7" y2="15" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.6" />
        <line x1="17" y1="5" x2="16" y2="16" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.6" />
      </svg>
      <span className="text-[15px] font-semibold tracking-tight text-fg">
        Memory<span className="text-teal">Map</span>
      </span>
    </div>
  );
}

export function PrimaryButton({ children, onClick, className = '', type = 'button', loading = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`group relative flex h-11 items-center justify-center gap-2 rounded-lg bg-teal px-5 text-sm font-semibold text-ink transition-all duration-200 hover:bg-[#5eead4] hover:shadow-[0_0_24px_-4px_rgba(45,212,191,0.6)] active:scale-[0.98] disabled:opacity-80 ${className}`}
    >
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />}
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 items-center justify-center gap-2 rounded-lg border border-line-2 bg-panel px-5 text-sm font-medium text-fg transition-all duration-200 hover:border-teal/50 hover:bg-panel-2 active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, type = 'text', placeholder, value, onChange, toggleable = false, right }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputType = toggleable ? (show ? 'text' : 'password') : type;

  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
        {right}
      </div>
      <div className={`flex items-center rounded-lg border bg-ink/60 px-3 transition-all duration-200 ${focused ? 'border-teal shadow-[0_0_0_3px_rgba(45,212,191,0.12)]' : 'border-line-2'}`}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-10 w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
        />
        {toggleable && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="ml-2 text-faint transition-colors hover:text-teal"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff /> : <Eye />}
          </button>
        )}
      </div>
    </label>
  );
}

function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6.2 3.3A6.6 6.6 0 0 1 8 3.5c4.5 0 7 4.5 7 4.5a12 12 0 0 1-2 2.5M3.5 4.6A12 12 0 0 0 1 8s2.5 4.5 7 4.5a6.6 6.6 0 0 0 2.3-.4" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M15.7 8.2c0-.5 0-1-.1-1.5H8v2.9h4.3a3.7 3.7 0 0 1-1.6 2.4v2h2.6c1.5-1.4 2.4-3.5 2.4-5.8Z" fill="#4285F4" />
      <path d="M8 16c2.2 0 4-.7 5.3-2l-2.6-2c-.7.5-1.6.8-2.7.8-2 0-3.8-1.4-4.4-3.3H.9v2C2.3 14.3 5 16 8 16Z" fill="#34A853" />
      <path d="M3.6 9.5A4.8 4.8 0 0 1 3.3 8c0-.5.1-1 .3-1.5v-2H.9A8 8 0 0 0 0 8c0 1.3.3 2.5.9 3.5l2.7-2Z" fill="#FBBC05" />
      <path d="M8 3.2c1.2 0 2.2.4 3 1.2l2.3-2.3A8 8 0 0 0 .9 4.5l2.7 2C4.2 4.6 6 3.2 8 3.2Z" fill="#EA4335" />
    </svg>
  );
}

export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="mono text-[10px] uppercase tracking-widest text-faint">{label}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
