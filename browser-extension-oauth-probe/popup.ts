// OAuth probe for the action-popup report on paywall #797.
//
// Question it answers: does OAuth sign-in from an extension action popup behave
// differently between `@monetize.software/sdk` (plain) and
// `@monetize.software/sdk-extension`? The two packages open the provider window
// from different places in the call stack:
//
//   plain sdk     — awaits POST /oauth/init, THEN window.open  (AuthClient.signInWithOAuth)
//   sdk-extension — window.open('about:blank') synchronously in the click handler,
//                   then the RPC, then popup.location.replace  (RemoteAuthClient.signInWithOAuth)
//
// Everything is recorded into chrome.storage.local rather than the console: an
// action popup dies when it loses focus, taking its console with it, and opening
// DevTools keeps the popup alive — which is exactly what makes the bug vanish
// under observation. Breadcrumbs survive the popup; reopen it to read them.
//
// The decisive datum is `navigator.userActivation.isActive` sampled at the click
// and again inside window.open: transient activation is what Chrome checks when
// deciding whether to allow (and how to treat) a script-opened window.

import { PaywallUI as PlainPaywallUI } from '@monetize.software/sdk';
import { PaywallUI as ExtPaywallUI } from '@monetize.software/sdk-extension';

// 'plain-sync' is the proposed fix, assembled from the plain SDK's public split
// API (startOAuthFlow / completeOAuthFlow): open the window synchronously in the
// click handler, hit /oauth/init afterwards, then navigate the already-open
// window. Same shape sdk-extension already uses. Testing it here proves (or
// kills) the fix before it goes into the SDK.
//
// 'plain-tab' keeps the plain SDK untouched and only swaps the surface: the
// provider page opens as a TAB instead of a separate OS-level window, via the
// `openPopup` hook the SDK already exposes publicly. On Linux the window manager
// decides whether a brand-new OS window steals focus (and kills the action
// popup); a tab stays inside the browser window that the popup is anchored to.
// If this variant survives where the others don't, the client has a fix today —
// no SDK release needed.
type Variant = 'plain' | 'plain-sync' | 'plain-tab' | 'ext';

const EV_PREFIX = '__probe_ev_';
const HB_PREFIX = '__probe_hb_';
const VARIANT_KEY = '__probe_variant';
const CFG_ID = '__demo_paywall_id';
const CFG_ORIGIN = '__demo_api_origin';

const runId = Date.now();
let seq = 0;

interface Crumb {
  t: number;
  ev: string;
  [k: string]: unknown;
}

/** Append a breadcrumb under a unique key. Unique (never read-modify-write) so a
 *  popup that dies mid-flight can't corrupt or truncate the log. */
function mark(ev: string, data?: Record<string, unknown>): void {
  const key = `${EV_PREFIX}${runId}_${String(seq++).padStart(4, '0')}`;
  const crumb: Crumb = { t: Date.now() - runId, ev, ...data };
  try {
    void chrome.storage.local.set({ [key]: crumb });
  } catch {
    /* storage gone — nothing we can do from a dying popup */
  }
}

/** Transient user activation — the thing Chrome consumes when a click opens a
 *  window. `undefined` on browsers without the API. */
function activation(): boolean | undefined {
  const ua = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
  return ua ? ua.isActive : undefined;
}

/** Whole-area read. The typings only give the promise overload a key argument,
 *  so the "everything" form goes through the callback. */
function readAllStorage(): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => resolve(items as Record<string, unknown>));
  });
}

function shortUrl(u: unknown): string {
  const s = typeof u === 'string' ? u : String(u ?? '');
  if (!s) return '(empty)';
  // about:blank and friends have no meaningful origin — show them verbatim.
  if (!/^https?:/i.test(s)) return s.slice(0, 48);
  try {
    const parsed = new URL(s);
    return `${parsed.origin}${parsed.pathname.slice(0, 32)}`;
  } catch {
    return s.slice(0, 48);
  }
}

// Patch window.open before any SDK code runs. Same synchronous call, so timing is
// untouched — we only observe. Catches both packages identically.
const nativeOpen = window.open.bind(window);
window.open = function patchedOpen(
  url?: string | URL,
  target?: string,
  features?: string
): Window | null {
  mark('window.open CALLED', {
    url: shortUrl(url),
    target: target ?? '(none)',
    features: features ?? '(none)',
    activation: activation()
  });
  let handle: Window | null = null;
  try {
    handle = nativeOpen(url as string, target as string, features as string);
  } catch (e) {
    mark('window.open THREW', { message: (e as Error)?.message });
    throw e;
  }
  mark('window.open RETURNED', { handle: handle ? 'Window' : 'null (blocked)' });
  return handle;
} as typeof window.open;

async function init(): Promise<void> {
  const app = document.getElementById('app')!;

  const cfg = (await chrome.storage.local.get([VARIANT_KEY, CFG_ID, CFG_ORIGIN])) as {
    [VARIANT_KEY]?: Variant;
    [CFG_ID]?: string;
    [CFG_ORIGIN]?: string;
  };
  const stored = cfg[VARIANT_KEY];
  const variant: Variant =
    stored === 'ext' || stored === 'plain-sync' || stored === 'plain-tab' ? stored : 'plain';
  const paywallId = cfg[CFG_ID] ?? '3';
  const apiOrigin = cfg[CFG_ORIGIN] ?? 'https://onlineapp.stream';

  // sidepanel.html sets this before the module loads; the action popup doesn't.
  // The surface is the whole point of the comparison — a side panel is a
  // persistent browser surface, an action popup is destroyed on blur.
  const surface =
    (window as Window & { __PROBE_SURFACE?: string }).__PROBE_SURFACE ?? 'action-popup';

  mark(`OPENED — surface=${surface} variant=${variant}`, { paywallId, apiOrigin });

  // Logs get compared across machines, so each run states where it ran. The
  // windowing stack (X11 vs Wayland, and the WM's focus-stealing policy) is the
  // prime suspect for why an action popup survives on one OS and dies on another.
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData;
  mark('environment', {
    platform: uaData?.platform ?? (navigator as Navigator & { platform?: string }).platform ?? '?',
    ua: navigator.userAgent.slice(0, 110),
    screen: `${screen.width}x${screen.height}`
  });

  // Heartbeat under a single overwritten key: the last value tells us the moment
  // the popup was still alive, which is how we detect it being killed.
  const beat = () => {
    try {
      void chrome.storage.local.set({ [`${HB_PREFIX}${runId}`]: Date.now() - runId });
    } catch {
      /* ignore */
    }
  };
  beat();
  setInterval(beat, 250);

  document.addEventListener('visibilitychange', () => {
    mark(`document ${document.visibilityState}`);
    beat();
  });
  window.addEventListener('pagehide', () => mark('pagehide (popup closing)'));
  window.addEventListener('message', (e: MessageEvent) => {
    const d = e.data as { type?: string; status?: string; code?: string } | null;
    if (d && d.type === 'pw-oauth') {
      mark('pw-oauth MESSAGE received', { status: d.status, hasCode: !!d.code });
    }
  });
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    mark('unhandledrejection', { reason: String(e.reason).slice(0, 120) });
  });

  // Both classes expose the same surface; the point of the probe is that they
  // reach window.open by different routes. 'plain-sync' drives the plain client
  // too — it only changes WHERE the window is opened, not which SDK runs.
  const plainAuthOption =
    variant === 'plain-tab'
      ? {
          // No feature string → a tab, not a separate OS window. Everything else
          // about the flow (window.name, postMessage back to the opener,
          // self-close) is identical.
          openPopup: (url: string, name: string): Window | null => window.open(url, name)
        }
      : true;

  const paywall: any =
    variant === 'ext'
      ? new ExtPaywallUI({ paywallId, apiOrigin, auth: true, shadowMode: 'open' })
      : new PlainPaywallUI({
          paywallId,
          apiOrigin,
          auth: plainAuthOption,
          shadowMode: 'open'
        });

  paywall.on?.('error', (e: Error) => mark('paywall error event', { message: e?.message }));

  const session = (await Promise.resolve(paywall.auth?.getCachedSession?.() ?? null)) as {
    user?: { email?: string; is_anonymous?: boolean };
  } | null;

  async function signInDirect(): Promise<void> {
    mark('CLICK sign-in (direct signInWithOAuth)', { activation: activation() });
    try {
      const s = await paywall.auth.signInWithOAuth({
        provider: 'google',
        onPopupOpened: () => mark('onPopupOpened callback')
      });
      mark('signInWithOAuth RESOLVED ✅', { email: s?.user?.email ?? '(none)' });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      mark('signInWithOAuth REJECTED ❌', {
        code: err?.code ?? '(none)',
        message: (err?.message ?? String(e)).slice(0, 120)
      });
    }
    render();
  }

  /** Resolves with the auth code, or null on cancel/timeout. Mirrors the SDK's
   *  internal waitForOAuthResult, which isn't part of the public entry. */
  function waitForCode(win: Window, state: string): Promise<string | null> {
    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        window.removeEventListener('message', onMsg);
        clearInterval(closedTimer);
        clearTimeout(timeoutTimer);
      };
      const done = (v: string | null) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(v);
      };
      const onMsg = (e: MessageEvent) => {
        const d = e.data as
          | { type?: string; messageId?: string; status?: string; code?: string }
          | null;
        if (!d || d.type !== 'pw-oauth' || d.messageId !== state) return;
        done(d.status === 'success' && d.code ? d.code : null);
      };
      const closedTimer = setInterval(() => {
        try {
          if (win.closed) done(null);
        } catch {
          /* cross-origin — keep waiting */
        }
      }, 500);
      const timeoutTimer = setTimeout(() => done(null), 5 * 60_000);
      window.addEventListener('message', onMsg);
    });
  }

  async function signInPlainSync(): Promise<void> {
    mark('CLICK sign-in (plain sdk + sync-open fix)', { activation: activation() });
    const tempName = `pw-oauth-pending-${Math.random().toString(36).slice(2, 10)}`;
    const win = window.open('about:blank', tempName, 'width=480,height=640,popup=yes');
    if (!win) {
      mark('sync-open FAILED ❌ — window.open returned null');
      void render();
      return;
    }
    try {
      const { authorize_url, state } = await paywall.auth.startOAuthFlow({ provider: 'google' });
      mark('startOAuthFlow resolved', { state: state.slice(0, 8) + '…' });
      win.name = `pw-oauth-${state}`;
      win.location.replace(authorize_url);
      mark('navigated the pre-opened window');
      const code = await waitForCode(win, state);
      if (!code) {
        mark('no code — cancelled, closed, or timed out ❌');
        void render();
        return;
      }
      try {
        win.close();
      } catch {
        /* ignore */
      }
      const s = await paywall.auth.completeOAuthFlow({ state, code });
      mark('completeOAuthFlow RESOLVED ✅', { email: s?.user?.email ?? '(none)' });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      mark('plain-sync REJECTED ❌', {
        code: err?.code ?? '(none)',
        message: (err?.message ?? String(e)).slice(0, 120)
      });
    }
    void render();
  }

  function signInViaUI(): void {
    mark('CLICK openAuth() — modal UI path', { activation: activation() });
    paywall.openAuth();
  }

  async function setVariant(v: Variant): Promise<void> {
    await chrome.storage.local.set({ [VARIANT_KEY]: v });
    location.reload();
  }

  async function clearLog(): Promise<void> {
    const all = await readAllStorage();
    const keys = Object.keys(all).filter(
      (k) => k.startsWith(EV_PREFIX) || k.startsWith(HB_PREFIX)
    );
    if (keys.length) await chrome.storage.local.remove(keys);
    location.reload();
  }

  async function readRuns(): Promise<
    Array<{ id: number; crumbs: Crumb[]; lastBeat: number | null }>
  > {
    const all = await readAllStorage();
    const byRun = new Map<number, Crumb[]>();
    const beats = new Map<number, number>();
    for (const [k, v] of Object.entries(all)) {
      if (k.startsWith(EV_PREFIX)) {
        const id = Number(k.slice(EV_PREFIX.length).split('_')[0]);
        if (!Number.isFinite(id)) continue;
        const list = byRun.get(id) ?? [];
        list.push(v as Crumb);
        byRun.set(id, list);
      } else if (k.startsWith(HB_PREFIX)) {
        const id = Number(k.slice(HB_PREFIX.length));
        if (Number.isFinite(id)) beats.set(id, v as number);
      }
    }
    return [...byRun.entries()]
      .map(([id, crumbs]) => ({
        id,
        crumbs: crumbs.sort((a, b) => a.t - b.t),
        lastBeat: beats.get(id) ?? null
      }))
      .sort((a, b) => b.id - a.id)
      .slice(0, 4);
  }

  function verdictFor(run: { crumbs: Crumb[]; lastBeat: number | null }): {
    cls: string;
    text: string;
  } {
    const has = (needle: string) => run.crumbs.some((c) => c.ev.includes(needle));
    const opened = run.crumbs.find((c) => c.ev === 'window.open CALLED');
    const clicked = run.crumbs.find((c) => c.ev.startsWith('CLICK'));
    const gap =
      opened && clicked ? `${Math.round(opened.t - clicked.t)}ms after the click` : 'n/a';
    const act =
      opened && 'activation' in opened
        ? `activation at open: ${String(opened.activation)}`
        : 'activation: unknown';

    if (has('RESOLVED')) {
      return { cls: 'ok', text: `SIGN-IN COMPLETED ✅ — window.open ${gap}, ${act}` };
    }
    if (has('null (blocked)')) {
      return { cls: 'bad', text: `POPUP BLOCKED — window.open returned null, ${gap}, ${act}` };
    }
    if (has('pw-oauth MESSAGE') && !has('RESOLVED')) {
      return { cls: 'bad', text: `code came back but exchange did not finish — ${act}` };
    }
    if (has('window.open CALLED') && !has('pw-oauth MESSAGE')) {
      return {
        cls: 'bad',
        text: `NO CODE RETURNED — popup last alive at +${run.lastBeat ?? '?'}ms; window.open ${gap}, ${act}`
      };
    }
    if (!clicked) return { cls: 'idle', text: 'no sign-in attempted in this run' };
    return { cls: 'idle', text: `incomplete — popup last alive at +${run.lastBeat ?? '?'}ms` };
  }

  async function render(): Promise<void> {
    const runs = await readRuns();
    app.innerHTML = '';

    const h = document.createElement('h1');
    h.textContent = 'OAuth probe — action popup';
    app.appendChild(h);

    // Variant switch
    const varCard = document.createElement('div');
    varCard.className = 'card';
    varCard.innerHTML =
      '<div class="muted" style="margin-bottom:6px">SDK package under test — reload happens automatically</div>';
    const varRow = document.createElement('div');
    varRow.className = 'row';
    (
      [
        ['plain', 'plain sdk (what the client uses)'],
        ['plain-tab', 'plain sdk + tab instead of window'],
        ['plain-sync', 'plain sdk + sync-open'],
        ['ext', 'sdk-extension (our demo)']
      ] as Array<[Variant, string]>
    ).forEach(([v, label]) => {
      const b = document.createElement('button');
      b.textContent = label;
      if (variant === v) b.className = 'on';
      b.onclick = () => void setVariant(v);
      varRow.appendChild(b);
    });
    varCard.appendChild(varRow);
    app.appendChild(varCard);

    // Actions
    const actCard = document.createElement('div');
    actCard.className = 'card';
    const who = session?.user?.email
      ? `signed in as ${session.user.email}`
      : session
        ? 'anonymous session'
        : 'not signed in';
    actCard.innerHTML = `<div class="muted" style="margin-bottom:6px">${who} · paywall ${paywallId} · ${apiOrigin.replace(/^https?:\/\//, '')}</div>`;
    const actRow = document.createElement('div');
    actRow.className = 'row';
    const b1 = document.createElement('button');
    b1.className = 'primary';
    b1.textContent = 'Sign in with Google (direct)';
    b1.onclick = () => void (variant === 'plain-sync' ? signInPlainSync() : signInDirect());
    const b2 = document.createElement('button');
    b2.textContent = 'via openAuth() UI';
    b2.onclick = signInViaUI;
    const b3 = document.createElement('button');
    b3.textContent = 'Clear log';
    b3.onclick = () => void clearLog();
    actRow.append(b1, b2, b3);

    // Same page, persistent surface. Run the identical variants here to see
    // whether the surface — not the SDK — is what decides the outcome.
    if (surface !== 'side-panel') {
      const b4 = document.createElement('button');
      b4.textContent = 'Open in side panel ▸';
      b4.onclick = () => {
        const sp = (chrome as typeof chrome & {
          sidePanel?: { open: (o: { windowId: number }) => Promise<void> };
        }).sidePanel;
        if (!sp) {
          mark('side panel API unavailable (needs Chrome 114+)');
          return;
        }
        void chrome.windows.getCurrent().then((w) => {
          if (w.id != null) void sp.open({ windowId: w.id });
        });
      };
      actRow.appendChild(b4);
    }
    actCard.appendChild(actRow);
    app.appendChild(actCard);

    // Target paywall — so the rig can be pointed at the reporter's own paywall
    // without touching storage by hand.
    const cfgCard = document.createElement('div');
    cfgCard.className = 'card';
    cfgCard.innerHTML =
      '<div class="muted" style="margin-bottom:6px">Target paywall — point this at your own to test your OAuth setup</div>';
    const cfgRow = document.createElement('div');
    cfgRow.className = 'row';
    const idInput = document.createElement('input');
    idInput.value = paywallId;
    idInput.placeholder = 'id';
    idInput.style.width = '56px';
    const originInput = document.createElement('input');
    originInput.value = apiOrigin;
    originInput.placeholder = 'https://your-custom-domain';
    originInput.style.flex = '1';
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save & reload';
    saveBtn.onclick = () => {
      void chrome.storage.local
        .set({
          [CFG_ID]: idInput.value.trim() || '3',
          [CFG_ORIGIN]: originInput.value.trim().replace(/\/+$/, '')
        })
        .then(() => location.reload());
    };
    cfgRow.append(idInput, originInput, saveBtn);
    cfgCard.appendChild(cfgRow);
    app.appendChild(cfgCard);

    // Runs
    const h2 = document.createElement('h2');
    h2.textContent = 'Recorded runs (newest first)';
    app.appendChild(h2);

    if (!runs.length) {
      const p = document.createElement('div');
      p.className = 'muted';
      p.textContent = 'Nothing recorded yet. Click sign-in, finish Google, then reopen this popup.';
      app.appendChild(p);
      return;
    }

    for (const run of runs) {
      const card = document.createElement('div');
      card.className = 'card';
      const v = verdictFor(run);
      const badge = document.createElement('div');
      badge.className = `verdict ${v.cls}`;
      const isCurrent = run.id === runId;
      badge.textContent = `${new Date(run.id).toLocaleTimeString()}${isCurrent ? ' (current)' : ''} — ${v.text}`;
      card.appendChild(badge);

      const pre = document.createElement('div');
      pre.className = 'log';
      pre.textContent = run.crumbs
        .map((c) => {
          const extras = Object.entries(c)
            .filter(([k]) => k !== 't' && k !== 'ev')
            .map(([k, val]) => `${k}=${String(val)}`)
            .join(' ');
          return `+${String(c.t).padStart(6)}ms  ${c.ev}${extras ? '  ' + extras : ''}`;
        })
        .join('\n');
      card.appendChild(pre);
      app.appendChild(card);
    }
  }

  await render();
}

void init();
