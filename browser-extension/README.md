# MV3 demo extension — `@monetize.software/sdk-extension`

A minimal Chrome MV3 extension that uses the **offscreen-document** pattern
to share a single paywall session across the popup and every tab's
content-script — sign in once, all surfaces update live.

## What's in it

- **Service worker** (`sw.ts`) — installs the cross-surface router via
  `installRouter` from `@monetize.software/sdk-extension/sw`. Picks
  `paywallId` / `apiOrigin` from `chrome.storage.local` (defaults to the
  test paywall `id=3` on `https://onlineapp.stream`).
- **Offscreen document** (`offscreen-bootstrap.ts` + `offscreen.html`) —
  hosts the real `BillingClient` + `AuthClient` and a `localStorage`-backed
  session. The SW can't have `localStorage`; the offscreen doc can.
- **Content script** (`content.ts`) — floating widget bottom-right of every
  page. Shows account state, lets you sign in / open paywall / consume
  demo AI quotas (DeepSeek text + Replicate image / upscale).
- **Popup** (`popup.ts` + `popup.html`) — same SDK, separate React-less
  UI. Lets you switch test paywall config and inspect cached session.

## Run it

```bash
npm install
npm run build
```

Then in Chrome:

1. Go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `extension/dist/`.
4. Open any tab — the widget shows up bottom-right.

To point the demo at a different paywall, open the popup and use the
config inputs (they write to `chrome.storage.local`), or set them in DevTools:

```js
chrome.storage.local.set({
  __demo_paywall_id: 'YOUR_PAYWALL_ID',
  __demo_api_origin: 'https://YOUR_DOMAIN'
});
```

The SW reads these on every offscreen launch, so a `chrome://extensions →
Reload` picks them up.

## Watch mode

```bash
npm run dev
```

Vite rebuilds `dist/` on each save. After the SW or content script
changes, click **Reload** on the extension card in `chrome://extensions`.

## Pinning

This example uses:

- `@monetize.software/sdk-extension@3.0.0-alpha.14`
- `@monetize.software/sdk@3.0.0-alpha.11`

## Notes

- **CWS compliance**: this template doesn't load any remote code. Every
  script ships from the extension bundle. The PaywallUI modal is rendered
  via Preact inside a Shadow DOM in the content script — no iframe, no CDN.
- **Offscreen lifecycle**: the SW lazily creates the offscreen document
  on the first `chrome.runtime.connect` from any surface and keeps it
  alive while at least one connection is open. See
  `@monetize.software/sdk-extension/sw` source for the exact router logic.
- **Identity**: this demo uses `auth: true` (managed Supabase auth). To
  drive identity from your own server instead, drop `auth` and pass
  `identity` per-call.
