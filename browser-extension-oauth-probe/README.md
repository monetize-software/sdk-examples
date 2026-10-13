# OAuth probe — action popup

Diagnostic rig for the report on paywall #797 ("after Google sign-in the popup
closes, auth never finishes; with DevTools open it works").

## What it settles

The same Google sign-in runs three ways in one extension, switchable at runtime:

| Variant | What it does | Why |
|---|---|---|
| `plain sdk` | `@monetize.software/sdk` → `AuthClient.signInWithOAuth` — awaits `POST /oauth/init`, **then** `window.open` | exactly what the reporting client runs (their stack trace names `@monetize__software_sdk.js`) |
| `plain sdk + sync-open` | opens `about:blank` **synchronously in the click handler**, then `/oauth/init`, then navigates the open window — assembled from the public `startOAuthFlow` / `completeOAuthFlow` | the proposed fix, proven before it goes into the SDK |
| `plain sdk + tab` | plain SDK, but the provider page opens as a **tab** instead of a separate OS window — injected through the public `auth: { openPopup }` hook | on Linux the window manager decides whether a new OS window steals focus and kills the action popup; a tab stays inside the browser window. Needs no SDK change, so if this one survives the client has a fix today |
| `sdk-extension` | `@monetize.software/sdk-extension` → `RemoteAuthClient` — already opens synchronously | our demo, the one that was tested and reported working |

## Why not just watch the console

An action popup dies when it loses focus, taking its console with it — and
attaching DevTools keeps it alive, which is precisely why the bug disappears
under observation. So nothing here logs: every step is written to
`chrome.storage.local` under a unique key (never read-modify-write, so a dying
popup cannot truncate the log), plus a heartbeat key overwritten every 250 ms
whose last value is the moment the popup was still alive. Reopen the popup and
the previous run is rendered at the bottom, verdict first.

`window.open` is patched at popup start — same synchronous call, only observed —
so both packages are measured identically. Each call records
`navigator.userActivation.isActive`, the transient activation Chrome consumes
when a script opens a window.

## Surfaces

The same page is registered twice: as the toolbar action popup and as the side
panel (`sidepanel.html`). Every run records which surface it ran in, so the log
separates "which SDK" from "which surface" — and the surface is the likelier
variable, since an action popup is destroyed when it loses focus while a side
panel is a persistent browser surface. Use the **Open in side panel ▸** button
and re-run the same variants there.

## Run it

```bash
npm run build          # already built into dist/
```

1. `chrome://extensions` → Developer mode → **Load unpacked** → pick this
   directory's `dist/`.
2. Click the toolbar icon — **the real action popup, not `popup.html` in a tab**.
   Opening it as a tab cannot reproduce the report: a tab does not auto-close on
   blur. This is also why the extension e2e suite never caught this.
3. **Do not open DevTools on the popup** — it changes the outcome.
4. Pick a variant, click *Sign in with Google (direct)*, finish Google.
5. Reopen the popup and read the verdict. Repeat for the other variants.

Defaults are paywall `3` on `https://onlineapp.stream`; override by setting
`__demo_paywall_id` / `__demo_api_origin` in `chrome.storage.local`.

## Reading the result

- **`SIGN-IN COMPLETED`** — that variant works on this machine.
- **`NO CODE RETURNED`** — the callback's `postMessage` never arrived. Compare
  `popup last alive at +Nms` against when the window opened: if the popup died
  first, its listener died with it, which is the reported failure.
- **`POPUP BLOCKED`** — `window.open` returned null, i.e. the gesture was gone.
- `window.open Nms after the click` plus `activation at open` separate the two
  candidate mechanisms: a lost user gesture versus the popup being killed on
  blur.

## Baseline measured on macOS / Chrome, 29 Jul 2026

Both packages **complete the sign-in**, so the failure is not in the SDK:

```
plain sdk      CLICK          +1596ms  activation=true
               window.open    +1899ms  activation=true   (303ms gap = /oauth/init)
               document hidden +3259ms                   ← popup backgrounded but SURVIVED
               pw-oauth msg   +3353ms  hasCode=true
               RESOLVED       +4094ms  ✅

sdk-extension  window.open 0ms after the click, RESOLVED ✅
```

The 303 ms gap sits well inside Chrome's 5 s transient-activation budget, and
activation was still live at `window.open` — so "the await ate the user gesture"
is ruled out on a normal connection. What differs on the reporting machine is
that the action popup is killed when the provider window takes focus; here it
merely went hidden. That is what this rig is for: run it there and the log says
exactly when the popup died relative to the code coming back.

`node_modules` is a symlink to `../browser-extension/node_modules` (both SDK
packages are 3.4.0 there — the client's exact versions). The working demo in
`../browser-extension` is untouched.
