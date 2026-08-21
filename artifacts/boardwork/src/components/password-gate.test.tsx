/**
 * Integration smoke tests for PasswordGate.
 *
 * Verifies:
 * - Unauthenticated load (passwordRequired: true, authenticated: false)
 *   shows the password form, not the app.
 * - Correct password → form disappears, app content is shown.
 * - Network failure on /api/auth/status shows an error state (fail closed).
 * - No password required → children rendered without a gate.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PasswordGate } from './password-gate';

// ── MSW server ───────────────────────────────────────────────────────────────

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── helpers ──────────────────────────────────────────────────────────────────

function useHandlers(handlers: Parameters<typeof server.use>) {
  server.use(...handlers);
}

const APP_CONTENT = 'App is loaded';

// ── tests ────────────────────────────────────────────────────────────────────

describe('PasswordGate', () => {
  it('shows the password form when auth is required and not authenticated', async () => {
    useHandlers([
      http.get('/api/auth/status', () =>
        HttpResponse.json({ passwordRequired: true, authenticated: false }),
      ),
    ]);

    render(
      <PasswordGate>
        <div>{APP_CONTENT}</div>
      </PasswordGate>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(APP_CONTENT)).not.toBeInTheDocument();
  });

  it('renders children directly when no password is required', async () => {
    useHandlers([
      http.get('/api/auth/status', () =>
        HttpResponse.json({ passwordRequired: false, authenticated: true }),
      ),
    ]);

    render(
      <PasswordGate>
        <div>{APP_CONTENT}</div>
      </PasswordGate>,
    );

    await waitFor(() => {
      expect(screen.getByText(APP_CONTENT)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });

  it('renders children when already authenticated', async () => {
    useHandlers([
      http.get('/api/auth/status', () =>
        HttpResponse.json({ passwordRequired: true, authenticated: true }),
      ),
    ]);

    render(
      <PasswordGate>
        <div>{APP_CONTENT}</div>
      </PasswordGate>,
    );

    await waitFor(() => {
      expect(screen.getByText(APP_CONTENT)).toBeInTheDocument();
    });
  });

  it('shows error state (not the app) when /api/auth/status is unreachable', async () => {
    useHandlers([
      http.get('/api/auth/status', () => HttpResponse.error()),
    ]);

    render(
      <PasswordGate>
        <div>{APP_CONTENT}</div>
      </PasswordGate>,
    );

    await waitFor(() => {
      // Should not show the app content
      expect(screen.queryByText(APP_CONTENT)).not.toBeInTheDocument();
    });
    // Should show a retry option, not the app
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows an error message on wrong password without exposing the app', async () => {
    useHandlers([
      http.get('/api/auth/status', () =>
        HttpResponse.json({ passwordRequired: true, authenticated: false }),
      ),
      http.post('/api/auth/login', () =>
        HttpResponse.json({ error: 'invalid_password' }, { status: 401 }),
      ),
    ]);

    render(
      <PasswordGate>
        <div>{APP_CONTENT}</div>
      </PasswordGate>,
    );

    const user = userEvent.setup();
    await waitFor(() => screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(APP_CONTENT)).not.toBeInTheDocument();
  });

  it('dismisses the gate and shows the app after successful login', async () => {
    useHandlers([
      http.get('/api/auth/status', () =>
        HttpResponse.json({ passwordRequired: true, authenticated: false }),
      ),
      http.post('/api/auth/login', () => HttpResponse.json({ ok: true })),
    ]);

    render(
      <PasswordGate>
        <div>{APP_CONTENT}</div>
      </PasswordGate>,
    );

    const user = userEvent.setup();
    await waitFor(() => screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), 'correctpassword');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(APP_CONTENT)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
  });
});
