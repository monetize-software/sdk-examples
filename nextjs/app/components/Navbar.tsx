'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  usePaywallUser,
  usePaywall,
  PaywallButton
} from '@monetize.software/sdk-react';

/**
 * Demonstrates:
 *  - usePaywallUser()  — discriminated union: loading | guest | signed_in.
 *  - usePaywall()      — direct handle for `auth.signOut()` and
 *                        `billing.getCustomerPortalUrl()` (Manage plan flow).
 *  - PaywallButton     — declarative trigger with `mode="signin"`.
 */
export function Navbar() {
  const account = usePaywallUser();
  const paywall = usePaywall();
  const [portalLoading, setPortalLoading] = useState(false);

  const isPro =
    account.status === 'signed_in' &&
    account.user?.has_active_subscription === true;
  const signedIn = account.status === 'signed_in';

  // Manage plan: open the acquirer's hosted customer portal in a new tab.
  // The SDK already knows the user (Bearer / identity); the backend resolves
  // the matching Stripe/Paddle/Chargebee portal URL and we just window.open it.
  // We deliberately don't go through <PaywallButton> here — Manage is a
  // headless action (no modal needed), and the button needs its own busy
  // state while the URL is being created (200-500ms RTT to the acquirer).
  //
  // returnUrl: the user lands here when they hit "Return to ..." inside the
  // hosted portal. Without it the backend falls back to its own paywall
  // page on the online-service domain — useless for a self-hosted app.
  const onManagePlan = async () => {
    if (!paywall) return;
    setPortalLoading(true);
    try {
      const { url } = await paywall.billing.getCustomerPortalUrl({
        returnUrl:
          typeof window !== 'undefined'
            ? `${window.location.origin}/account`
            : undefined
      });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      // 403 — acquirer doesn't support portal (some Paddle/Chargebee setups)
      // or the user lost their subscription between render and click. Falls
      // back to the regular paywall flow so the user isn't stuck.
      console.error('Failed to open customer portal', err);
      paywall.open();
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <header className="border-b border-stone-200 bg-white/70 backdrop-blur dark:border-stone-800 dark:bg-stone-950/70">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-6 w-6 rounded-md bg-brand-500" />
          <span>FocusFlow</span>
        </Link>

        <div className="hidden gap-4 text-sm md:flex">
          <Link href="/app" className="hover:text-brand-600">
            App
          </Link>
          <Link href="/pricing" className="hover:text-brand-600">
            Pricing
          </Link>
          <Link href="/account" className="hover:text-brand-600">
            Account
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://github.com/monetize-software/sdk-examples/tree/main/nextjs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View this example on GitHub"
            title="View this example on GitHub"
            className="flex items-center rounded-md border border-stone-300 p-1.5 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-900"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>

          {isPro && (
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">
              PRO
            </span>
          )}

          {signedIn ? (
            <button
              type="button"
              onClick={() => paywall?.auth?.signOut()}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
            >
              Sign out
            </button>
          ) : (
            <PaywallButton
              mode="signin"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-900"
            >
              Sign in
            </PaywallButton>
          )}

          {isPro ? (
            <button
              type="button"
              onClick={onManagePlan}
              disabled={portalLoading || !paywall}
              aria-busy={portalLoading ? true : undefined}
              className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {portalLoading ? 'Opening…' : 'Manage plan'}
            </button>
          ) : (
            <PaywallButton className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600">
              Upgrade
            </PaywallButton>
          )}
        </div>
      </nav>
    </header>
  );
}
