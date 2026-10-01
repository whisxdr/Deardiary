import { useState } from 'react';
import { toast } from '@/components/ui';
import { useSyncStore } from '@/store';

/** Shortest and longest code Supabase's `otp_length` can be configured to. */
export const CODE_MIN = 6;
export const CODE_MAX = 10;

/**
 * Sign-in state: an email, then a one-time code.
 *
 * A code rather than a link, because the owner's case is requesting on a laptop and reading
 * the mail on a phone. A link opened there would sign in the phone instead of the device that
 * asked for it.
 *
 * The code length is not fixed here: Supabase's `otp_length` setting decides it (6 to 10
 * digits), and the mail carries whatever the project configured. Accepting the full range
 * keeps the form working at the default or raised.
 */
export function useSyncSignIn() {
  const requestCode = useSyncStore((state) => state.requestCode);
  const verifyCode = useSyncStore((state) => state.verifyCode);
  const message = useSyncStore((state) => state.message);
  const clearMessage = useSyncStore((state) => state.clearMessage);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);

  /**
   * Runs an async step with the button disabled. The thrown error's own message wins, so a
   * rate limit ("you can only request this after N seconds") is not misreported as a dead
   * connection; the static text is only the fallback when there is no message to show.
   */
  const run = async (step: () => Promise<void>, failure: string) => {
    setBusy(true);
    clearMessage();
    try {
      await step();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : failure);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      await requestCode(email);
      setStage('code');
      toast.success('Check your email for the sign-in code.');
    }, 'Could not reach the server. Check your connection and try again.');

  const confirmCode = () =>
    run(async () => {
      const ok = await verifyCode(email, code);
      if (ok) {
        toast.success('Signed in. Your entries are syncing.');
        setCode('');
      }
      // A wrong or expired code returns false, not an error: `verifyCode` has already set the
      // message the form renders below, so the failure is visible without a toast the user
      // might miss.
    }, 'Could not reach the server. Check your connection and try again.');

  const changeCode = (value: string) => setCode(value.replace(/\D/g, '').slice(0, CODE_MAX));

  const backToEmail = () => {
    clearMessage();
    setStage('email');
  };

  return { email, setEmail, code, changeCode, stage, busy, message, sendCode, confirmCode, backToEmail };
}
