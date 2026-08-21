/**
 * Password gate — shown when APP_PASSWORD is configured and the visitor has
 * not yet authenticated.  Uses the server-side /api/auth/* endpoints; no
 * password ever touches client-side storage or logs.
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandMark } from '@/components/brand-mark';

interface AuthStatus {
  passwordRequired: boolean;
  authenticated: boolean;
}

async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch('/api/auth/status', { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Could not reach auth endpoint');
  return res.json() as Promise<AuthStatus>;
}

async function submitPassword(password: string): Promise<{ ok: boolean }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.status === 401) return { ok: false };
  if (!res.ok) throw new Error('Login request failed');
  return res.json() as Promise<{ ok: boolean }>;
}

type GateState =
  | { phase: 'loading' }
  | { phase: 'open' }                    // no password required
  | { phase: 'prompt'; error?: string }
  | { phase: 'submitting' }
  | { phase: 'status_error' };           // /api/auth/status unreachable — fail closed

interface Props {
  children: React.ReactNode;
}

export function PasswordGate({ children }: Props) {
  const [state, setState] = useState<GateState>({ phase: 'loading' });
  const [password, setPassword] = useState('');

  const checkStatus = useCallback(async () => {
    try {
      const status = await fetchAuthStatus();
      if (!status.passwordRequired || status.authenticated) {
        setState({ phase: 'open' });
      } else {
        setState({ phase: 'prompt' });
      }
    } catch {
      // Fail closed: if we can't reach the auth endpoint, show a retry
      // screen.  Never silently open the app behind a password gate.
      setState({ phase: 'status_error' });
    }
  }, []);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setState({ phase: 'submitting' });
    try {
      const result = await submitPassword(password);
      if (result.ok) {
        setPassword('');
        setState({ phase: 'open' });
      } else {
        setPassword('');
        setState({ phase: 'prompt', error: 'Incorrect password. Try again.' });
      }
    } catch {
      setState({ phase: 'prompt', error: 'Something went wrong. Try again.' });
    }
  };

  if (state.phase === 'open') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
      <div className="w-full max-w-sm px-8 py-10 bg-white rounded-xl border border-[#E5E2DB] shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <BrandMark />
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1C1C]">
            Boardwork
          </h1>
        </div>

        {state.phase === 'status_error' ? (
          <>
            <p className="text-sm text-[#6B6B6B] mb-8">
              Couldn&apos;t reach the server. Check your connection and try again.
            </p>
            <Button
              className="w-full"
              onClick={() => {
                setState({ phase: 'loading' });
                void checkStatus();
              }}
            >
              Retry
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#6B6B6B] mb-8">
              Enter the access password to continue.
            </p>

            {state.phase === 'loading' ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#6B6B6B]" />
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bw-password" className="text-[#1C1C1C]">
                    Password
                  </Label>
                  <Input
                    id="bw-password"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={state.phase === 'submitting'}
                    className="h-10"
                    placeholder="Enter password"
                  />
                  {state.phase === 'prompt' && state.error && (
                    <p className="text-sm text-red-600">{state.error}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={state.phase === 'submitting' || !password.trim()}
                >
                  {state.phase === 'submitting' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
