# `@monetize.software` SDK — example apps

Working reference apps for the `@monetize.software/sdk` family. Each folder is
a **standalone project** — clone the repo, `cd` into the one you care about,
`npm install`, and run.

## Examples

| Framework | Path | What it shows |
| --- | --- | --- |
| **Next.js 16** (App Router) | [`nextjs/`](nextjs/) | Full FocusFlow demo: Provider, every public hook (`usePaywall`, `usePaywallUser`, `usePaywallAccess`, `usePaywallPrices`, `usePaywallOffer`, `usePaywallTrial`, `usePaywallVisibility`, `usePaywallEvent`, `usePaywallState`), every declarative component (`PaywallGate`, `PaywallButton`, `PaywallSupportButton`), managed-auth flows (signin / signup / anonymous), and direct `PaywallUI` methods (`track`, `auth.signOut`, `getUserLanguage`). |

More frameworks coming. Each example is pinned to a published `@monetize.software/sdk-react` alpha so it stays runnable as the SDK evolves.

## Common setup

Every example expects two env vars pointing at your paywall:

```bash
NEXT_PUBLIC_PAYWALL_ID=...
NEXT_PUBLIC_PAYWALL_API_ORIGIN=https://pay.your-domain.com
```

Get them from the [monetize.software](https://monetize.software) dashboard.
The `apiOrigin` must match the `custom_domain` configured for your paywall.

## Related

- [`@monetize.software/sdk`](https://www.npmjs.com/package/@monetize.software/sdk) — core SDK.
- [`@monetize.software/sdk-react`](https://www.npmjs.com/package/@monetize.software/sdk-react) — React bindings used by the examples here.
- [`@monetize.software/sdk-extension`](https://www.npmjs.com/package/@monetize.software/sdk-extension) — extension-channel SDK (separate examples will live here later).
