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
