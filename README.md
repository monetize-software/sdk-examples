# `@monetize.software` SDK — example apps

Working reference apps for the `@monetize.software/sdk` family. Each folder is
a **standalone project** — clone the repo, `cd` into the one you care about,
`npm install`, and run.

## Examples

| Channel | Path | What it shows |
| --- | --- | --- |
| **Next.js 16** (App Router) | [`nextjs/`](nextjs/) — [live demo](https://monetize-software-sdk-nextjs-example.vercel.app) | Full FocusFlow demo: Provider, every public hook (`usePaywall`, `usePaywallUser`, `usePaywallAccess`, `usePaywallPrices`, `usePaywallOffer`, `usePaywallTrial`, `usePaywallVisibility`, `usePaywallEvent`, `usePaywallState`), every declarative component (`PaywallGate`, `PaywallButton`, `PaywallSupportButton`), managed-auth flows (signin / signup / anonymous), and direct `PaywallUI` methods (`track`, `auth.signOut`, `getUserLanguage`). |
| **MV3 Chrome extension** | [`browser-extension/`](browser-extension/) | Offscreen-backed paywall shared across SW, popup and every tab's content-script. Floating widget, ApiGatewayClient with auto-open on 402 quota errors, DeepSeek text + Replicate image / upscale demos. Uses `@monetize.software/sdk-extension`. |

More channels coming. Each example is pinned to a published SDK alpha so it stays runnable as the SDK evolves.

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
