import { SignIn, SignUp } from '@clerk/clerk-react';
import './AuthPage.css';

export default function AuthPage({ mode }) {
  const isSignIn = mode === 'sign-in';

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <div className="auth-brand"><span>◇</span> MemoryMap</div>
        <div>
          <p className="auth-eyebrow">ORGANIZATIONAL INTELLIGENCE</p>
          <h1>Make knowledge<br />easy to find.</h1>
          <p className="auth-copy">Capture documents, reveal relationships, and keep your team's context connected.</p>
        </div>
      </section>
      <section className="auth-card-wrap">
        {isSignIn ? (
          <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
        ) : (
          <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
        )}
      </section>
    </main>
  );
}
