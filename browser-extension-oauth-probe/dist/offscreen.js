import { W as Wt, Y as Yt, s as se, a as ae, o, t as te, z as zt, r as re, n as ne, Z as Zt, i as ie } from "./chunks/chrome-port-D09nZ18W-BV_fSzAf.js";
import { s } from "./chunks/port-name-ervLBWAQ-B1dz9CHi.js";
class m {
  constructor() {
    this.handlers = /* @__PURE__ */ new Map(), this.channels = /* @__PURE__ */ new Set(), this.active = /* @__PURE__ */ new WeakMap(), this.on("handshake", () => ({
      protocolVersion: re,
      offscreenReady: true
    }));
  }
  on(e, t) {
    this.handlers.set(e, t);
  }
  off(e) {
    this.handlers.delete(e);
  }
  /** Attach a channel. The server starts handling requests from it and
   *  includes it in broadcasts. On disconnect it automatically removes it and
   *  aborts all in-flight handlers for that channel. */
  accept(e) {
    this.channels.add(e), this.active.set(e, /* @__PURE__ */ new Map()), e.onMessage((t) => this.dispatch(e, t)), e.onDisconnect(() => {
      this.channels.delete(e);
      const t = this.active.get(e);
      if (t)
        for (const s2 of t.values()) s2.abort();
      this.active.delete(e);
    });
  }
  /** Fan-out an event to all connected channels. */
  broadcast(e, t) {
    const s2 = { type: "event", kind: e, payload: t };
    for (const i of this.channels)
      try {
        i.send(s2);
      } catch (a) {
        console.error("[sdk-extension] broadcast send failed", a);
      }
  }
  /** Size of the active pool — for health-check / offscreen cleanup
   *  (if 0, the host can close the offscreen document). */
  get connectionCount() {
    return this.channels.size;
  }
  async dispatch(e, t) {
    if (U(t)) {
      const r = this.active.get(e), o2 = r?.get(t.id);
      o2 && (o2.abort(), r.delete(t.id));
      return;
    }
    if (!C(t)) return;
    const s2 = this.handlers.get(t.kind);
    if (!s2) {
      this.respondErr(e, t.id, new Error(`Unknown request kind: ${t.kind}`));
      return;
    }
    const i = new AbortController(), a = this.active.get(e);
    a?.set(t.id, i);
    try {
      const r = await s2(t.params, {
        signal: i.signal
      });
      this.respondOk(e, t.id, r);
    } catch (r) {
      this.respondErr(e, t.id, r);
    } finally {
      a?.delete(t.id);
    }
  }
  respondOk(e, t, s2) {
    try {
      e.send({ type: "response", id: t, ok: true, result: s2 });
    } catch (i) {
      console.error("[sdk-extension] respond send failed", i);
    }
  }
  respondErr(e, t, s2) {
    try {
      e.send({ type: "response", id: t, ok: false, error: ne(s2) });
    } catch (i) {
      console.error("[sdk-extension] respond err send failed", i);
    }
  }
}
function C(n) {
  return typeof n != "object" || n === null ? false : n.type === "request";
}
function U(n) {
  return typeof n != "object" || n === null ? false : n.type === "cancel";
}
const v = 600 * 1e3, A = ie * 2;
class T {
  constructor(e) {
    this.transport = new m(), this.stagedFiles = /* @__PURE__ */ new Map(), this.connectListener = null, this.userUnsub = null, this.balanceUnsub = null, this.authUnsub = null, e.auth && (this.auth = new Wt({
      paywallId: e.paywallId,
      apiOrigin: e.apiOrigin
    })), this.billing = new Yt({
      paywallId: e.paywallId,
      apiOrigin: e.apiOrigin,
      auth: this.auth
    }), this.tracker = O(e, this.billing), this.registerBillingHandlers(), this.auth && this.registerAuthHandlers(this.auth), this.tracker && this.registerTrackerHandlers(this.tracker), this.bridgeBroadcasts();
  }
  registerTrackerHandlers(e) {
    this.transport.on("tracker.track", (t) => {
      e.track(t.name, t.props);
    });
  }
  /** Drop staged support attachments older than the TTL. Called on every
   *  stage request — no timer needed, the map is only ever populated by the
   *  same request path. */
  sweepStagedFiles() {
    const e = Date.now() - v;
    for (const [t, s2] of this.stagedFiles)
      s2.stagedAt < e && this.stagedFiles.delete(t);
  }
  registerBillingHandlers() {
    this.transport.on(
      "billing.bootstrap",
      async (t, s2) => this.billing.bootstrap({ force: t.force, signal: s2.signal })
    ), this.transport.on(
      "billing.getCachedBootstrap",
      () => this.billing.getCachedBootstrap()
    ), this.transport.on("billing.getVisitorId", async () => this.billing.getVisitorId()), this.transport.on(
      "billing.getUser",
      async (t, s2) => this.billing.getUser({ force: t.force, signal: s2.signal })
    ), this.transport.on("billing.getCachedUser", () => this.billing.getCachedUser()), this.transport.on(
      "billing.getSettledUser",
      async (t, s2) => this.billing.getSettledUser({ signal: s2.signal })
    ), this.transport.on(
      "billing.getBalances",
      async (t, s2) => this.billing.getBalances({ force: t.force, signal: s2.signal })
    ), this.transport.on("billing.getCachedBalances", () => this.billing.getCachedBalances()), this.transport.on(
      "billing.createCheckout",
      async (t, s2) => this.billing.createCheckout({ ...t, signal: s2.signal })
    ), this.transport.on(
      "billing.listPurchases",
      async (t, s2) => this.billing.listPurchases({ signal: s2.signal })
    ), this.transport.on(
      "billing.cancelSubscription",
      async (t, s2) => this.billing.cancelSubscription({ ...t, signal: s2.signal })
    ), this.transport.on(
      "billing.getCustomerPortalUrl",
      async (t, s2) => this.billing.getCustomerPortalUrl({ returnUrl: t.returnUrl, signal: s2.signal })
    ), this.transport.on("billing.stageSupportFile", (t) => {
      this.sweepStagedFiles();
      const s2 = se(t.dataBase64);
      if (s2.length > ae)
        throw new o("invalid_file", "Attachment too large", { status: 400 });
      if (this.stagedFiles.size >= A)
        throw new o("too_many_files", "Too many staged attachments", {
          status: 429
        });
      const i = crypto.randomUUID();
      return this.stagedFiles.set(i, {
        name: t.name,
        type: t.type,
        bytes: s2,
        stagedAt: Date.now()
      }), { fileId: i };
    }), this.transport.on("billing.createSupportTicket", async (t) => {
      const { fileIds: s2, ...i } = t, a = [];
      for (const r of s2 ?? []) {
        const o$1 = this.stagedFiles.get(r);
        if (this.stagedFiles.delete(r), !o$1)
          throw new o("invalid_file", "Attachment expired, re-send the ticket", {
            status: 400
          });
        a.push(new File([o$1.bytes], o$1.name, { type: o$1.type }));
      }
      return this.billing.createSupportTicket({
        ...i,
        files: a.length > 0 ? a : void 0
      });
    }), this.transport.on("billing.getIdentity", () => this.billing.getIdentity() ?? null), this.transport.on("billing.setIdentity", (t) => {
      this.billing.setIdentity(t.identity ?? void 0);
    });
    const e = this.billing.getStorage();
    this.transport.on("storage.get", async (t) => e.getItem(t.key)), this.transport.on("storage.set", async (t) => {
      await e.setItem(t.key, t.value);
    }), this.transport.on("storage.remove", async (t) => {
      await e.removeItem(t.key);
    }), this.transport.on(
      "trial.check",
      async (t) => h(
        t.paywallId,
        () => this.makeTrialStore(t.paywallId, t.config).check()
      )
    ), this.transport.on(
      "trial.recordBlock",
      async (t) => h(
        t.paywallId,
        () => this.makeTrialStore(t.paywallId, t.config).recordBlock()
      )
    ), this.transport.on(
      "trial.reset",
      async (t) => h(
        t.paywallId,
        () => this.makeTrialStore(t.paywallId, t.config).reset()
      )
    );
  }
  /** Each trial handler creates a fresh store — it's stateless and reads state
   *  from storage. There's no point caching instances (storage = SoT). */
  makeTrialStore(e, t) {
    return te(this.billing.getStorage(), e, t);
  }
  registerAuthHandlers(e) {
    this.transport.on(
      "auth.signInWithEmail",
      async (t) => e.signInWithEmail(t)
    ), this.transport.on("auth.signUp", async (t) => e.signUp(t)), this.transport.on("auth.signOut", async () => e.signOut()), this.transport.on("auth.refresh", async () => e.refresh()), this.transport.on("auth.getCachedSession", () => e.getCachedSession()), this.transport.on(
      "auth.requestPasswordReset",
      async (t) => e.requestPasswordReset(t)
    ), this.transport.on(
      "auth.updatePassword",
      async (t) => e.updatePassword(t)
    ), this.transport.on("auth.sendOtp", async (t) => e.sendOtp(t)), this.transport.on("auth.verifyOtp", async (t) => e.verifyOtp(t)), this.transport.on(
      "auth.resendConfirmation",
      async (t) => e.resendConfirmation(t)
    ), this.transport.on("auth.revokeAllSessions", async () => e.revokeAllSessions()), this.transport.on("auth.getLastLogin", async () => e.getLastLogin()), this.transport.on("auth.oauthStart", async (t) => {
      const { authorize_url: s2, state: i } = await e.startOAuthFlow({
        provider: t.provider,
        scopes: t.scopes,
        userMeta: t.userMeta,
        switchAccount: t.switchAccount
      });
      return { authorizeUrl: s2, state: i };
    }), this.transport.on(
      "auth.oauthExchange",
      async (t) => e.completeOAuthFlow({ state: t.state, code: t.code })
    ), this.transport.on("auth.getAccessToken", async () => e.getAccessToken()), this.transport.on(
      "auth.signInAnonymously",
      async (t) => e.signInAnonymously({
        captchaToken: t.captchaToken,
        userMeta: t.userMeta,
        forceNewAnon: t.forceNewAnon
      })
    );
  }
  bridgeBroadcasts() {
    this.userUnsub = this.billing.onUserChange(
      (e) => this.transport.broadcast("userChange", e),
      { immediate: "none" }
    ), this.balanceUnsub = this.billing.onBalanceChange(
      (e) => this.transport.broadcast("balancesChange", e),
      { immediate: "none" }
    ), this.auth && (this.authUnsub = this.auth.onAuthChange((e, t) => {
      e !== "INITIAL_SESSION" && this.transport.broadcast("authChange", { event: e, session: t });
    }));
  }
  /** Accept a raw MessageChannel, bypassing chrome.runtime. Unit tests wire an
   *  in-memory channel here to exercise the real handler graph; prod traffic
   *  always arrives through start() → onConnect. */
  acceptChannel(e) {
    this.transport.accept(e);
  }
  /** Start the listener on chrome.runtime.onConnect. */
  start() {
    this.connectListener || (this.connectListener = (e) => {
      e.name === s && this.transport.accept(zt(e));
    }, chrome.runtime.onConnect.addListener(this.connectListener));
  }
  stop() {
    this.connectListener && (chrome.runtime.onConnect.removeListener(this.connectListener), this.connectListener = null), this.userUnsub?.(), this.balanceUnsub?.(), this.authUnsub?.(), this.userUnsub = null, this.balanceUnsub = null, this.authUnsub = null, this.tracker?.destroy();
  }
}
async function h(n, e) {
  return typeof navigator < "u" && navigator.locks?.request ? navigator.locks.request(`@monetize.software/sdk-extension:trial:${n}`, e) : e();
}
function O(n, e) {
  if (n.analytics === false) return;
  const t = typeof n.analytics == "object" && n.analytics !== null ? n.analytics : {}, s2 = t.endpoint ?? (() => `${e.activeApiOrigin()}/api/v1/paywall/${e.paywallId}/events`);
  return new Zt({
    endpoint: s2,
    paywallId: e.paywallId,
    capabilities: e.capabilities,
    getVisitorId: () => e.getVisitorId(),
    getCachedVisitorId: () => e.getCachedVisitorId(),
    getUserId: () => e.getIdentity()?.userId ?? null,
    flushIntervalMs: t.flushIntervalMs,
    maxBufferSize: t.maxBufferSize
  });
}
let l = null;
function _(n) {
  if (typeof chrome > "u" || !chrome.runtime)
    throw new Error("@monetize.software/sdk-extension/offscreen requires chrome.runtime");
  return l || (l = new T(n), l.start(), l);
}
const params = new URLSearchParams(window.location.search);
_({
  paywallId: params.get("paywallId") ?? "3",
  apiOrigin: params.get("apiOrigin") ?? "https://onlineapp.stream",
  // auth: true в content-side PaywallUI создаёт RemoteAuthClient — он шлёт
  // request'ы 'auth.*'. Если здесь не включить — offscreen ответит
  // "Unknown request kind". Должно совпадать с конфигом content-script'а.
  auth: true
});
//# sourceMappingURL=offscreen.js.map
