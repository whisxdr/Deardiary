import { useState } from 'react';
import { Button, Input, toast } from '@/components/ui';
import { useSyncStore } from '@/store';

/**
 * Sign-in form: an email, then a six-digit code.
 *
 * A code rather than a link, because the owner's case is requesting on a laptop and
 * reading the mail on a phone. A link opened there would sign in the phone instead of the
 * device that asked for it.
 */
export function SyncSignIn() {
  const requestCode = useSyncStore((state) => state.requestCode);
  const verifyCode = useSyncStore((state) => state.verifyCode);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);

  /** Runs an async step with the button disabled and one shared failure message. */
  const run = async (step: () => Promise<void>, failure: string) => {
    setBusy(true);
    try {
      await step();
    } catch {
      toast.error(failure);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      await requestCode(email);
      setStage('code');
      toast.success('Check your email for the six-digit code.');
    }, 'Could not reach the server. Check your connection and try again.');

  const confirmCode = () =>
    run(async () => {
      const ok = await verifyCode(email, code);
      if (ok) {
        toast.success('Signed in. Your entries are syncing.');
        setCode('');
      }
    }, 'Could not reach the server. Check your connection and try again.');

  return (
    <>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        The diary works without an account. Sign in to keep the same entries on your phone and your laptop.
      </p>
      {stage === 'email' ? (
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      ) : (
        <Input
          label="Six-digit code"
          inputMode="numeric"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          autoComplete="one-time-code"
        />
      )}
      <div className="flex flex-wrap gap-2">
        {stage === 'email' ? (
          <Button variant="gold" onClick={() => void sendCode()} disabled={busy || !email.includes('@')}>
            {busy ? 'Sending…' : 'Send me a code'}
          </Button>
        ) : (
          <>
            <Button variant="gold" onClick={() => void confirmCode()} disabled={busy || code.length !== 6}>
              {busy ? 'Checking…' : 'Sign in'}
            </Button>
            <Button variant="ghost" onClick={() => setStage('email')} disabled={busy}>
              Use a different email
            </Button>
          </>
        )}
      </div>
    </>
  );
}
