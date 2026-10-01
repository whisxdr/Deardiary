import { Button, Input } from '@/components/ui';
import { CODE_MIN, useSyncSignIn } from './useSyncSignIn';

/** Sign-in form: an email, then a one-time code. See `useSyncSignIn` for the flow notes. */
export function SyncSignIn() {
  const { email, setEmail, code, changeCode, stage, busy, message, sendCode, confirmCode, backToEmail } =
    useSyncSignIn();

  return (
    <>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        The diary works without an account. Sign in to keep the same entries on your phone and your laptop. Signing in
        uploads your entries to the Supabase server as plain text, not encrypted.
      </p>
      {stage === 'email' ? (
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          hint="No code arriving? The Supabase Confirm signup and Magic Link email templates must both include {{ .Token }}."
        />
      ) : (
        <Input
          label="Sign-in code"
          inputMode="numeric"
          value={code}
          onChange={(event) => changeCode(event.target.value)}
          placeholder="000000"
          autoComplete="one-time-code"
          error={message || undefined}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {stage === 'email' ? (
          <Button variant="gold" onClick={() => void sendCode()} disabled={busy || !email.includes('@')}>
            {busy ? 'Sending…' : 'Send me a code'}
          </Button>
        ) : (
          <>
            <Button variant="gold" onClick={() => void confirmCode()} disabled={busy || code.length < CODE_MIN}>
              {busy ? 'Checking…' : 'Sign in'}
            </Button>
            <Button variant="ghost" onClick={backToEmail} disabled={busy}>
              Use a different email
            </Button>
            <Button variant="ghost" onClick={() => void sendCode()} disabled={busy}>
              Send a new code
            </Button>
          </>
        )}
      </div>
    </>
  );
}
