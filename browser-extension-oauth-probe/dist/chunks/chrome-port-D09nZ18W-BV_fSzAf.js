class o extends Error {
  constructor(t, e, s = {}) {
    super(e), this.name = "PaywallError", this.code = t, this.status = s.status, this.cause = s.cause, s.originRetryable !== void 0 && (this.originRetryable = s.originRetryable);
  }
}
class lt extends o {
  constructor(t) {
    super("not_enough_queries", t.message ?? "Not enough queries", {
      status: 402
    }), this.name = "QuotaExceededError", this.balances = t.balances, this.queryType = t.queryType, this.currentBalance = t.currentBalance;
  }
}
const dt = "3.4.0";
function ut() {
  return typeof chrome < "u" && !!chrome?.storage?.local && !!chrome?.runtime?.id;
}
const ft = {
  getItem(i) {
    return new Promise((t) => {
      chrome.storage.local.get([i], (e) => {
        const s = e[i];
        t(typeof s == "string" ? s : null);
      });
    });
  },
  setItem(i, t) {
    return new Promise((e) => {
      chrome.storage.local.set({ [i]: t }, () => e());
    });
  },
  removeItem(i) {
    return new Promise((t) => {
      chrome.storage.local.remove([i], () => t());
    });
  },
  watch(i, t) {
    const e = chrome?.storage?.onChanged;
    if (!e) return () => {
    };
    const s = (a, r) => {
      if (r !== "local") return;
      const n = a[i];
      n && t(typeof n.newValue == "string" ? n.newValue : null);
    };
    return e.addListener(s), () => e.removeListener(s);
  }
}, yt = {
  async getItem(i) {
    try {
      return window.localStorage.getItem(i);
    } catch {
      return null;
    }
  },
  async setItem(i, t) {
    try {
      window.localStorage.setItem(i, t);
    } catch {
    }
  },
  async removeItem(i) {
    try {
      window.localStorage.removeItem(i);
    } catch {
    }
  },
  watch(i, t) {
    if (typeof window > "u") return () => {
    };
    const e = (s) => {
      s.storageArea === window.localStorage && s.key === i && t(s.newValue);
    };
    return window.addEventListener("storage", e), () => window.removeEventListener("storage", e);
  }
}, L = /* @__PURE__ */ new Map(), pt = {
  async getItem(i) {
    return L.get(i) ?? null;
  },
  async setItem(i, t) {
    L.set(i, t);
  },
  async removeItem(i) {
    L.delete(i);
  }
};
function W(i) {
  return i || (ut() ? ft : typeof window < "u" && "localStorage" in window ? yt : pt);
}
const f = {
  visitorId: "pw-visitor-id",
  lastLoginMethod: (i) => `pw-${i}-last-login-method`,
  lastLoginEmail: (i) => `pw-${i}-last-login-email`,
  // last-known PaywallUser. Used as an offline fallback on startup, until the
  // first getUser() returns. The key depends on paywallId+identity hash —
  // switching identity must not hand back another user.
  userState: (i, t) => `pw-${i}-${t}-user-v1`,
  // Persisted auth bundle (access_token, refresh_token, expires_at, user) for
  // a single paywall. The key is tied to paywallId — a multi-paywall app
  // doesn't cross sessions. Bump '-v1' on a breaking shape change.
  authSession: (i) => `pw-${i}-auth-v1`,
  // Refresh token of the last anonymous user. Stored separately from
  // authSession, because it must survive signOut: after signOut() the user can
  // sign in again as the same anonymous — without a captcha, via this token.
  // signIn by another method (email/oauth) doesn't touch it either. Cleared
  // only by an explicit signOut({forgetAnonymous: true}) or a 401 from the
  // refresh endpoint (meaning the token was revoked, so there's no point
  // keeping it).
  anonRefreshToken: (i) => `pw-${i}-anon-rt-v1`,
  // Persisted bootstrap (settings/prices/offers/layout/locales/version) for
  // stale-while-revalidate. Independent of identity — the layout is the same
  // for all users of one paywall; user-state lives separately under
  // `userState(...)`. Bump '-v1' on a breaking shape change.
  bootstrap: (i) => `pw-${i}-bootstrap-v1`,
  // One-shot "a checkout was started on this device" marker ({at: ts}).
  // Written by PaywallUI on checkout_started, consumed by
  // BillingClient.getSettledUser: a persisted has_active_subscription:false is
  // NOT trusted while the marker is fresh — the purchase may have completed in
  // the checkout tab while no SDK context was alive to record it (an extension
  // popup dies when the user leaves to pay), and the stale negative caused a
  // one-time paywall flash on the next open. Not identity-bound: the checkout
  // and the re-check happen on the same device within minutes.
  checkoutPending: (i) => `pw-${i}-checkout-pending-v1`,
  // Persisted balances (AI providers × tokenization_queries). Identity-bound,
  // since balance is counted per-Bearer-user; on re-login the key changes and
  // other users' balances aren't visible. They change after payment (backend)
  // and API calls (optimistically via `decrementBalanceLocal`).
  balances: (i, t) => `pw-${i}-${t}-balances-v1`,
  // Sticky mirror-origin failover state ({active: 'primary'|'edge',
  // switchedAt} — see core/edge.ts). Written only on primary↔edge
  // transitions, read once per client construction. Keyed by the PRIMARY
  // ORIGIN HOST, not paywallId: the in-memory shared state is origin-keyed,
  // and a paywallId key let two paywalls on one custom_domain hydrate/persist
  // past each other (review finding).
  edgeState: (i) => `pw-edge-${i}-v1`,
  // Sticky A/B experiment assignment for this device: {experimentId, variant,
  // at}. First-touch persisted so a later change of experiment weights doesn't
  // rebucket users who were already exposed. One key per paywall — the backend
  // runs at most one experiment per paywall at a time; a new experiment id
  // overwrites the record.
  experiment: (i) => `pw-${i}-exp-v1`
};
function Y() {
  const i = typeof globalThis < "u" ? globalThis.crypto : void 0;
  if (i && typeof i.randomUUID == "function") return i.randomUUID();
  const t = new Uint8Array(16);
  if (i && typeof i.getRandomValues == "function")
    i.getRandomValues(t);
  else
    for (let s = 0; s < 16; s++) t[s] = Math.floor(Math.random() * 256);
  t[6] = t[6] & 15 | 64, t[8] = t[8] & 63 | 128;
  const e = Array.from(t, (s) => s.toString(16).padStart(2, "0")).join(
    ""
  );
  return `${e.slice(0, 8)}-${e.slice(8, 12)}-${e.slice(12, 16)}-${e.slice(16, 20)}-${e.slice(20)}`;
}
async function M(i) {
  try {
    const e = await i.getItem(f.visitorId);
    if (e && typeof e == "string" && e.length >= 16)
      return e;
  } catch {
  }
  const t = Y();
  try {
    await i.setItem(f.visitorId, t);
  } catch {
  }
  return t;
}
const R = "edge.", x = 1800 * 1e3, gt = 5e3, wt = 3e4, mt = 3e4;
function O(i) {
  return i && typeof i == "object" && "name" in i ? String(i.name) : void 0;
}
function Z(i, t = {}) {
  let e = null, s, a = false, r;
  const n = () => {
    if (e) return e;
    if (e = new AbortController(), i)
      if (i.aborted)
        e.abort(i.reason);
      else {
        const h = () => e.abort(i.reason);
        i.addEventListener("abort", h), r = () => i.removeEventListener("abort", h);
      }
    return e;
  };
  t.eager && n();
  const c = () => {
    s !== void 0 && clearTimeout(s), s = void 0;
  };
  return {
    get signal() {
      return e ? e.signal : i ?? void 0;
    },
    timedOut: () => a,
    arm(h) {
      if (c(), h == null) return;
      const l = n();
      s = setTimeout(() => {
        a = true, l.abort();
      }, h);
    },
    disarm: c,
    dispose() {
      c(), r?.();
    }
  };
}
function vt(i) {
  let t;
  try {
    t = new URL(i);
  } catch {
    return null;
  }
  if (t.protocol !== "https:") return null;
  const e = t.hostname;
  return e.startsWith(R) || !e.includes(".") || e.includes(":") || /^[\d.]+$/.test(e) ? null : `https://${R}${e}${t.port ? `:${t.port}` : ""}`;
}
const T = /* @__PURE__ */ new Map();
class tt {
  constructor(t) {
    this.primary = t.apiOrigin, this.storage = t.storage;
    let e;
    try {
      e = new URL(this.primary).host;
    } catch {
      e = this.primary;
    }
    this.storageKey = f.edgeState(e);
    let s;
    if (t.edgeFallback === false)
      s = null;
    else if (typeof t.edgeFallback == "string")
      try {
        s = new URL(t.edgeFallback).origin;
      } catch {
        throw new o(
          "invalid_config",
          `edgeFallback is not a valid origin: "${t.edgeFallback}"`
        );
      }
    else
      s = vt(this.primary);
    this.edge = s === this.primary ? null : s, this.ready = this.hydrate();
  }
  async hydrate() {
    if (!(!this.storage || !this.edge || T.has(this.primary)))
      try {
        const t = await this.storage.getItem(this.storageKey);
        if (!t) return;
        const e = JSON.parse(t);
        (e.active === "edge" || e.active === "primary") && typeof e.switchedAt == "number" && // Re-check after the await: a parallel client in this context may have
        // already discovered fresher truth than the persisted record.
        !T.has(this.primary) && T.set(this.primary, {
          active: e.active,
          switchedAt: e.switchedAt
        });
      } catch {
      }
  }
  /** Origins in the order they should be tried for this request. */
  candidates() {
    if (!this.edge) return [this.primary];
    const t = T.get(this.primary);
    return t?.active === "edge" && Date.now() - t.switchedAt < x ? [this.edge, this.primary] : [this.primary, this.edge];
  }
  /**
   * Record which origin actually served a response. Writes (memory + storage)
   * happen only on transitions — the happy path never touches storage.
   */
  noteSuccess(t) {
    if (!this.edge) return;
    const e = T.get(this.primary);
    if (t === this.edge) {
      if (e?.active === "edge" && Date.now() - e.switchedAt < x) return;
      this.setState({ active: "edge", switchedAt: Date.now() });
    } else t === this.primary && e?.active === "edge" && this.setState({ active: "primary", switchedAt: Date.now() });
  }
  setState(t) {
    T.set(this.primary, t), this.storage && this.storage.setItem(this.storageKey, JSON.stringify(t)).then(void 0, () => {
    });
  }
}
async function et(i, t, e = {}) {
  await i.ready;
  const s = i.candidates(), a = e.firstOnly ? s.slice(0, 1) : s;
  for (let r = 0; r < a.length; r++) {
    const n = r === a.length - 1;
    try {
      const c = await t(a[r], n, a.length);
      return i.noteSuccess(a[r]), c;
    } catch (c) {
      const h = c instanceof o && c.code === "network_error" && c.originRetryable !== false;
      if (n || !h) throw c;
    }
  }
  throw new o("network_error", "Network request failed");
}
const E = dt;
class st {
  constructor(t) {
    this.opts = t, this.resolver = new tt({
      apiOrigin: t.apiOrigin,
      edgeFallback: t.edgeFallback,
      storage: t.storage
    });
  }
  /** Origin the client currently talks to: apiOrigin, or the edge mirror
   *  after a network-level failover. For building sibling URLs off the same
   *  reachable host (the analytics endpoint). */
  activeOrigin() {
    return this.resolver.candidates()[0];
  }
  async request(t, e = {}) {
    return et(
      this.resolver,
      (s, a, r) => this.attempt(s, t, e, a, r)
    );
  }
  async attempt(t, e, s, a, r) {
    const n = new URL(e, t).toString(), c = this.opts.fetch ?? fetch, h = r > 1, l = (s.method ?? "GET").toUpperCase(), v = typeof FormData < "u" && s.body instanceof FormData, _ = s.replayable ?? (l === "GET" || l === "HEAD"), k = h && !v ? a ? wt : gt : null, y = h ? mt : null, u = Z(s.signal, {
      eager: k != null || y != null
    });
    let g = false;
    const I = (m) => u.timedOut() ? w("Request deadline exceeded", m) : new o("aborted", "Request aborted", { cause: m }), w = (m, A) => new o("network_error", m, {
      cause: A,
      // Post-headers failure of a non-idempotent request must NOT move to
      // the mirror: the origin already executed it, a replay would run the
      // side effect twice (duplicate ticket / double token adjustment).
      originRetryable: g ? _ : true
    });
    try {
      const m = async (d) => {
        const p = new Headers(s.headers);
        p.set("Accept", "application/json"), p.set("X-SDK-Version", E), p.set("X-Paywall-Id", this.opts.paywallId), this.opts.capabilities?.length && p.set("X-SDK-Capabilities", this.opts.capabilities.join(",")), d && p.set("Authorization", `Bearer ${d}`), s.body && !p.has("Content-Type") && !v && p.set("Content-Type", "application/json"), u.arm(k);
        try {
          const S = await c(n, {
            ...s,
            headers: p,
            signal: u.signal,
            credentials: "omit"
          });
          return g = true, S;
        } catch (S) {
          throw O(S) === "AbortError" ? I(S) : w("Network request failed", S);
        } finally {
          u.disarm();
        }
      }, A = await this.opts.getAuthToken?.() ?? null;
      let b = await m(A);
      if (b.status === 401 && A && this.opts.onUnauthorized) {
        const d = await this.opts.onUnauthorized().catch(() => null);
        d && d !== A && (g = false, b = await m(d));
      }
      u.arm(y);
      const ot = (b.headers.get("content-type") ?? "").includes("application/json");
      let B = null;
      if (ot)
        try {
          B = await b.json();
        } catch (d) {
          if (!(d instanceof SyntaxError || O(d) === "SyntaxError"))
            throw O(d) === "AbortError" ? I(d) : w("Response body read failed", d);
        }
      if (!b.ok) {
        const d = B && typeof B == "object" ? B : null, p = d && typeof d.error == "string" ? d.error : null, S = !!p && /^[a-z0-9_.-]{1,64}$/i.test(p), ct = d && "code" in d && d.code != null && String(d.code) || (S ? p : null) || `http_${b.status}`, ht = d && "message" in d && d.message != null && String(d.message) || (p && !S ? p : null) || b.statusText || "Request failed";
        throw new o(ct, ht, {
          status: b.status,
          cause: B
        });
      }
      return B;
    } finally {
      u.dispose();
    }
  }
}
function it(i) {
  const t = new Uint8Array(i), e = typeof globalThis < "u" ? globalThis.crypto : void 0;
  if (e && typeof e.getRandomValues == "function")
    e.getRandomValues(t);
  else
    for (let s = 0; s < i; s++) t[s] = Math.floor(Math.random() * 256);
  return t;
}
function K(i) {
  let t = "";
  for (let e = 0; e < i.length; e++) t += String.fromCharCode(i[e]);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function It() {
  return K(it(64));
}
async function bt(i) {
  const t = new TextEncoder().encode(i), e = globalThis.crypto;
  if (!e?.subtle?.digest)
    throw new Error("crypto.subtle is required for PKCE");
  const s = await e.subtle.digest("SHA-256", t);
  return K(new Uint8Array(s));
}
function St() {
  return K(it(16));
}
const _t = 6e4, kt = 600 * 1e3;
class Wt {
  constructor(t) {
    if (this.session = null, this.inflightRefresh = null, this.inflightAnonSignin = null, this.listeners = /* @__PURE__ */ new Set(), this.storageUnwatch = null, this.destroyed = false, this.oauthFlows = /* @__PURE__ */ new Map(), !t.paywallId)
      throw new o("invalid_config", "paywallId is required");
    if (!t.apiOrigin)
      throw new o(
        "invalid_config",
        "apiOrigin is required. Pass the paywall custom_domain configured in the platform."
      );
    this.paywallId = t.paywallId, this.apiOrigin = t.apiOrigin, this.storage = W(t.storage), this.api = new st({
      apiOrigin: this.apiOrigin,
      paywallId: t.paywallId,
      fetch: t.fetch,
      edgeFallback: t.edgeFallback,
      storage: this.storage
    }), this.openPopup = t.openPopup ?? ((e, s) => typeof window > "u" ? null : window.open(e, s, "width=480,height=640,popup=yes")), this.hydrated = this.hydrate(), this.startStorageWatch();
  }
  /**
   * Subscribes to changes of the session key in storage from other contexts:
   *  - Chrome Extension: `chrome.storage.onChanged` is shared across popup ↔
   *    background ↔ options ↔ content script. A login in one context → the others
   *    immediately emit onAuthChange and serve a fresh Bearer in getAccessToken.
   *  - Web: the `window.storage` event fires in OTHER tabs of the same origin
   *    (a tab doesn't receive its own setItem — no loops).
   *
   * Loop-guard: we compare the content by session fields before applySession, so
   * as not to fire extra onAuthChange on an identical overwrite. Calls from other
   * contexts with the same content (a re-save) — a no-op.
   */
  startStorageWatch() {
    typeof this.storage.watch == "function" && (this.storageUnwatch = this.storage.watch(this.storageKey(), (t) => {
      this.applyExternalSession(t);
    }));
  }
  async applyExternalSession(t) {
    if (!this.destroyed && (await this.hydrated, !this.destroyed)) {
      if (t == null) {
        this.session && this.setSession(null, { skipPersist: true, event: "SIGNED_OUT" });
        return;
      }
      try {
        const e = JSON.parse(t);
        if (!e || typeof e.access_token != "string" || typeof e.refresh_token != "string" || typeof e.expires_at != "number" || !e.user)
          return;
        const s = !this.session || this.session.user.id !== e.user.id ? "SIGNED_IN" : "TOKEN_REFRESHED";
        this.setSession(e, { skipPersist: true, event: s });
      } catch {
      }
    }
  }
  /**
   * The promise of hydrating the session from storage. Before it resolves,
   * getCachedSession() may still return null. getAccessToken/refresh/signOut/sign*
   * await it themselves; we expose it for the UI so it can wait for the initial
   * state before rendering a "logged-out" flash.
   */
  ready() {
    return this.hydrated;
  }
  /** Sync snapshot with no network requests. null = logged out or not hydrated yet. */
  getCachedSession() {
    return this.session;
  }
  getCachedUser() {
    return this.session?.user ?? null;
  }
  /**
   * The access_token for the Authorization header. If time-to-expiry <
   * REFRESH_LEEWAY_MS, it does a lazy refresh. null = logged out or the refresh
   * failed with 401 (refresh token revoked) — the caller should redirect to login.
   *
   * Network/5xx refresh errors are thrown — the current access is still valid,
   * the caller can try a request with it; the next getAccessToken will try the
   * refresh again.
   */
  async getAccessToken() {
    if (await this.hydrated, !this.session && (await this.rehydrateFromStorage(), !this.session))
      return null;
    if (this.isFresh(this.session)) return this.session.access_token;
    try {
      return (await this.refresh())?.access_token ?? null;
    } catch {
      return this.session?.access_token ?? null;
    }
  }
  async signInWithEmail(t) {
    await this.hydrated;
    const e = await this.readVisitorId(), s = {};
    t.idempotencyKey && (s["Idempotency-Key"] = t.idempotencyKey);
    const a = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/email/signin`,
      {
        method: "POST",
        headers: Object.keys(s).length ? s : void 0,
        body: JSON.stringify({
          email: t.email,
          password: t.password,
          visitor_id: e,
          user_meta: t.userMeta
        })
      }
    ), r = this.toSession(a, a.user);
    return this.setSession(r, { event: "SIGNED_IN" }), this.recordLastLogin("email", t.email), r;
  }
  /**
   * Signup. If email confirm is enabled in Supabase — the server returns
   * `{status: 'confirmation_required', user}` and does NOT issue tokens. In that
   * case setSession isn't called, the user must go through OTP/magic-link (a
   * separate feature in the next PR).
   */
  async signUp(t) {
    await this.hydrated;
    const e = await this.readVisitorId(), s = {};
    t.idempotencyKey && (s["Idempotency-Key"] = t.idempotencyKey);
    const a = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/email/signup`,
      {
        method: "POST",
        headers: Object.keys(s).length ? s : void 0,
        body: JSON.stringify({
          email: t.email,
          password: t.password,
          visitor_id: e,
          user_meta: t.userMeta
        })
      }
    );
    if (a.status === "already_registered")
      return { kind: "already_registered", email: a.email };
    if (a.status === "confirmation_required")
      return this.recordLastLogin("email", t.email), { kind: "confirmation_required", user: a.user };
    const r = this.toSession(a, a.user);
    return this.setSession(r, { event: "SIGNED_IN" }), this.recordLastLogin("email", t.email), { kind: "signed_in", session: r };
  }
  /**
   * Resends the confirmation email after a signUp with email-confirm enabled.
   * Uses GoTrue `/resend` type='signup'. The backend always returns ok
   * (anti-enumeration), except 429 on rate-limit (~once/min per email on the
   * Supabase side). The host handles 429 by showing "wait a minute"; everything
   * else — as success.
   */
  async resendConfirmation(t) {
    await this.hydrated;
    const e = {};
    t.idempotencyKey && (e["Idempotency-Key"] = t.idempotencyKey), await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/email/resend`,
      {
        method: "POST",
        headers: Object.keys(e).length ? e : void 0,
        body: JSON.stringify({ email: t.email })
      }
    );
  }
  /**
   * Email-OTP / signin without a password. Sends a 6-digit code to the user's
   * email. Anti-enumeration: the backend always returns ok, so the method doesn't
   * distinguish "email doesn't exist" from "sent" — the next step (verifyOtp)
   * fails with invalid_otp itself if the user doesn't exist. Under the hood it's
   * GoTrue with create_user=true, so new users log in via OTP in one step
   * (send → enter code → session).
   */
  async sendOtp(t) {
    await this.hydrated, await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/otp/send`,
      {
        method: "POST",
        body: JSON.stringify({
          email: t.email,
          create_user: t.createUser ?? true,
          user_meta: t.userMeta
        })
      }
    );
  }
  /**
   * OTP verification. type='email' (signin/signup-by-otp) — on success,
   * setSession and onAuthChange. type='recovery' — after /requestPasswordReset:
   * a short-lived access_token is issued for the subsequent updatePassword. We
   * store the recovery session the same as a regular one: the SDK doesn't
   * distinguish "can log in" vs "can change password" — it's the same session.
   */
  async verifyOtp(t) {
    await this.hydrated;
    const e = await this.readVisitorId(), s = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/otp/verify`,
      {
        method: "POST",
        body: JSON.stringify({
          email: t.email,
          token: t.token,
          type: t.type ?? "email",
          visitor_id: e,
          user_meta: t.userMeta
        })
      }
    ), a = this.toSession(s, s.user), r = t.type === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN";
    return this.setSession(a, { event: r }), a;
  }
  /**
   * Requests a recovery email. The backend always returns ok so as not to give
   * away enumeration. The user enters the code from the email into the SDK ui →
   * verifyOtp({type:'recovery'}) → gets a session → updatePassword.
   */
  async requestPasswordReset(t) {
    await this.hydrated, await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/password/request-reset`,
      {
        method: "POST",
        body: JSON.stringify({ email: t.email })
      }
    );
  }
  /**
   * Changes the password of the current session. Works after
   * verifyOtp({type:'recovery'}) (a recovery session) and after a regular login —
   * both cases give a valid access_token. If there's no session — we throw
   * PaywallError('not_authenticated') before the network request, so the UI
   * doesn't hit the backend in vain.
   */
  async updatePassword(t) {
    await this.hydrated;
    const e = await this.getAccessToken();
    if (!e)
      throw new o("not_authenticated", "no active session");
    await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/password/update`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${e}` },
        body: JSON.stringify({ password: t.password })
      }
    );
  }
  /**
   * Anonymous signin (a Supabase user without an email). The ladder of attempts:
   *
   *   1. If already logged in anonymously (session.user.is_anonymous === true) —
   *      a no-op, we return the current session. Idempotent for a UI that may
   *      call signInAnonymously() in a render loop without tracking state.
   *
   *   2. Resume via the saved anon refresh_token (`STORAGE_KEYS.anonRefreshToken`).
   *      If the token exists — we try `/auth/refresh` with it. Success →
   *      setSession, we return the user with the SAME id as at the previous anon
   *      signin (the promise from user feedback: "if I logged out from anonymous —
   *      log me into the same account").
   *
   *   3. Otherwise → POST /auth/anonymous/signin → setSession + save the
   *      refresh_token in anonRefreshToken.
   *
   * `captchaToken` isn't required — NOT because captcha is disabled in the project
   * (it may well be enabled for the legacy flow), but because v3 auth never hits
   * GoTrue from the browser: the SDK calls the `online` server, which talks to
   * GoTrue with the service_role key, and GoTrue skips captcha for admin
   * credentials (verifyCaptcha → requireAdminCredentials). Per-IP abuse is covered
   * by Supabase's rate limit (30/hour per real-IP, see the IP forwarding setup in
   * supabaseAuthRest.ts) + CF Bot Fight Mode at the edge. The field is left
   * optional for forward-compat: when the server starts returning
   * challenge_required in risk scenarios, the SDK can pass proof-of-something back
   * without a breaking change.
   *
   * `forceNewAnon: true` skips steps 1-2 and does /signin straight away (creates
   * a new anon user). Used in the switch-account flow.
   *
   * Parallel calls are deduplicated via `inflightAnonSignin` — two clicks on
   * "Sign in as guest" won't create two anon users (two /signup = two user_ids,
   * the second trial balance flies into oblivion).
   */
  async signInAnonymously(t = {}) {
    if (this.inflightAnonSignin) return this.inflightAnonSignin;
    this.inflightAnonSignin = (async () => {
      if (await this.hydrated, !t.forceNewAnon && this.session?.user.is_anonymous === true)
        return this.session;
      if (!t.forceNewAnon) {
        const n = await this.resumeAnonymous();
        if (n) return n;
      }
      const e = await this.readVisitorId(), s = await this.api.request(
        `/api/v1/paywall/${this.paywallId}/auth/anonymous/signin`,
        {
          method: "POST",
          body: JSON.stringify({
            ...t.captchaToken ? { captcha_token: t.captchaToken } : {},
            visitor_id: e,
            user_meta: t.userMeta
          })
        }
      ), a = {
        ...s.user,
        email: s.user.email ?? null,
        is_anonymous: true
      }, r = this.toSession(s, a);
      return this.setSession(r, { event: "SIGNED_IN" }), await this.writeAnonRefreshToken(r.refresh_token), r;
    })();
    try {
      return await this.inflightAnonSignin;
    } finally {
      this.inflightAnonSignin = null;
    }
  }
  /**
   * Internal resume — tries /auth/refresh with the saved anon refresh_token.
   * Returns a session on success, null if there's no token or it's revoked (401).
   * It throws network errors out — the caller decides whether to retry or ask the
   * user to pass a captcha.
   */
  async resumeAnonymous() {
    const t = await this.readAnonRefreshToken();
    if (!t) return null;
    try {
      const e = await this.api.request(
        `/api/v1/paywall/${this.paywallId}/auth/refresh`,
        { method: "POST", body: JSON.stringify({ refresh_token: t }) }
      ), s = this.session?.user.is_anonymous === true ? this.session.user : { id: "", email: null, is_anonymous: true }, a = this.toSession(e, s);
      return this.setSession(a, { event: "SIGNED_IN" }), await this.writeAnonRefreshToken(a.refresh_token), a;
    } catch (e) {
      if (e instanceof o && e.status === 401)
        return await this.clearAnonRefreshToken(), null;
      throw e;
    }
  }
  /**
   * Anon → email/password upgrade. Keeps the same auth.user.id, the balances and
   * trial-quotas remain. The behavior depends on the project's Supabase
   * email-confirm setting:
   *
   *  - Confirmation OFF → the backend immediately updates email + password in
   *    auth.users. We return `kind: 'updated'`, locally patch session.user.email +
   *    is_anonymous=false (the current access_token stays valid, no need to
   *    reissue — GoTrue doesn't rotate tokens on updateUser).
   *
   *  - Confirmation ON → the backend returns `confirmation_required`. The current
   *    session STAYS anonymous until the user clicks the confirmation link. The
   *    password is applied right away (you can keep logging in with it even before
   *    confirm). After the click — the next /auth/refresh pulls the updated
   *    is_anonymous=false from the JWT (refresh doesn't return user, so the UI can
   *    explicitly poke `auth.refresh()` a minute or two later, or wait for the
   *    lazy-refresh at access expiry).
   *
   * Without an active session it throws `not_authenticated`. There's no dedup —
   * a double form submit must be prevented by the UI with idempotencyKey.
   */
  async upgradeAnonymousToEmail(t) {
    await this.hydrated;
    const e = await this.getAccessToken();
    if (!e)
      throw new o("not_authenticated", "no active session");
    const s = {
      Authorization: `Bearer ${e}`
    };
    t.idempotencyKey && (s["Idempotency-Key"] = t.idempotencyKey);
    const a = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/anonymous/upgrade`,
      {
        method: "POST",
        headers: s,
        body: JSON.stringify({
          email: t.email,
          password: t.password,
          user_meta: t.userMeta
        })
      }
    );
    if (a.status === "confirmation_required")
      return { kind: "confirmation_required", email: a.email };
    const r = this.session;
    if (!r)
      throw new o(
        "not_authenticated",
        "session disappeared during upgrade"
      );
    const n = {
      ...r.user,
      id: a.user.id,
      email: a.user.email,
      is_anonymous: a.user.is_anonymous ?? false
    }, c = { ...r, user: n };
    return this.setSession(c, { event: "USER_UPDATED" }), await this.clearAnonRefreshToken(), { kind: "updated", session: c };
  }
  /**
   * OAuth signin via a popup with PKCE. Lifecycle:
   * 1. Generate verifier+challenge+state locally (the verifier doesn't go to the
   *    backend until /exchange — this protects against interception of the code).
   * 2. POST /oauth/init with the challenge → the backend returns authorize_url.
   * 3. Open the popup, wait for a postMessage of type 'pw-oauth' with our state.
   * 4. POST /oauth/exchange with {auth_code, code_verifier} → session.
   *
   * Timeout — 5 minutes from opening the popup. If the user closed the popup
   * before the flow finished (window.closed → true) — we throw
   * PaywallError('oauth_cancelled'). Parallel calls are NOT deduped — each opens
   * its own popup; calling in parallel makes no sense, but the code shouldn't
   * defend against it.
   *
   * onPopupOpened is called right after a successful window.open (before waiting
   * for the code). The UI uses it to reset the button's loading state: from here
   * responsibility for the flow is on the popup, the main page shouldn't hang. If
   * the popup didn't return a code (the user closed the tab, closed-detection
   * didn't fire due to a COOP severance) — the promise reaches oauth_timeout after
   * 5 minutes, but by then the button is already free.
   */
  async signInWithOAuth(t) {
    if (typeof window > "u")
      throw new o("oauth_unavailable", "window is required for OAuth");
    const { authorize_url: e, state: s } = await this.startOAuthFlow({
      provider: t.provider,
      scopes: t.scopes,
      userMeta: t.userMeta,
      switchAccount: t.switchAccount
    }), a = this.openPopup(e, `pw-oauth-${s}`);
    if (!a)
      throw this.oauthFlows.delete(s), new o(
        "popup_blocked",
        "browser blocked auth popup — call from a user gesture"
      );
    t.onPopupOpened?.();
    const r = await Tt(a, s);
    try {
      a.close();
    } catch {
    }
    if (this.destroyed)
      throw this.oauthFlows.delete(s), new o("aborted", "AuthClient destroyed mid-flow");
    if (r.kind === "cancelled")
      throw new o("oauth_cancelled", "auth popup was closed");
    if (r.kind === "timeout")
      throw new o("oauth_timeout", "OAuth flow timed out");
    if (r.kind === "error")
      throw this.oauthFlows.delete(s), new o(
        Ut(r) ? "oauth_identity_already_linked" : "oauth_failed",
        r.description || r.error || "OAuth provider returned error"
      );
    return this.completeOAuthFlow({ state: s, code: r.code });
  }
  /**
   * Step 1 of the OAuth split-API: initiates the flow on the backend, generates
   * the PKCE verifier + state, stores them itself, returns `{authorize_url, state}`
   * for opening the popup. The verifier does NOT leave — AuthClient holds it until
   * `completeOAuthFlow`.
   *
   * Used in the offscreen architecture (@monetize/sdk-extension): start is called
   * via RPC from the content-script, content opens the popup natively (gesture
   * preserved), then calls completeOAuthFlow with the code. AuthClient (in the
   * offscreen) does /exchange with the saved verifier.
   *
   * Pending flows are GC'd after 10min — more than a user needs to click through
   * Google. Without cleanup the Map would grow for every closed popup.
   */
  async startOAuthFlow(t) {
    await this.hydrated, this.gcOAuthFlows();
    const e = It(), s = await bt(e), a = St(), r = {};
    if (!t.switchAccount) {
      const c = await this.getAccessToken().catch(() => null);
      c && (r.Authorization = `Bearer ${c}`);
    }
    const { authorize_url: n } = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/oauth/init`,
      {
        method: "POST",
        headers: Object.keys(r).length ? r : void 0,
        body: JSON.stringify({
          provider: t.provider,
          code_challenge: s,
          code_challenge_method: "s256",
          scopes: t.scopes
        })
      }
    );
    return this.oauthFlows.set(a, {
      verifier: e,
      userMeta: t.userMeta,
      provider: t.provider,
      startedAt: Date.now()
    }), this.recordLastLoginMethod(t.provider), { authorize_url: n, state: a };
  }
  /**
   * Step 2 of the OAuth split-API: exchanges the code (obtained from the popup)
   * for a session, using the verifier saved at startOAuthFlow. On success — set
   * session and emit onAuthChange.
   *
   * If the flow isn't found (the state isn't from startOAuthFlow or was GC'd past
   * the TTL) — it throws `oauth_invalid_state`. The caller must start over via
   * startOAuthFlow.
   */
  async completeOAuthFlow(t) {
    await this.hydrated;
    const e = this.oauthFlows.get(t.state);
    if (!e)
      throw new o(
        "oauth_invalid_state",
        "OAuth flow not found — start with startOAuthFlow first or check TTL"
      );
    this.oauthFlows.delete(t.state);
    const s = await this.readVisitorId(), a = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/oauth/exchange`,
      {
        method: "POST",
        body: JSON.stringify({
          auth_code: t.code,
          code_verifier: e.verifier,
          visitor_id: s,
          user_meta: e.userMeta
        })
      }
    );
    if (this.destroyed)
      throw new o("aborted", "AuthClient destroyed mid-flow");
    const r = this.toSession(a, a.user);
    return this.setSession(r, { event: "SIGNED_IN" }), r.user.email && this.recordLastLoginEmail(r.user.email), r;
  }
  gcOAuthFlows() {
    const t = Date.now() - kt;
    for (const [e, s] of this.oauthFlows)
      s.startedAt < t && this.oauthFlows.delete(e);
  }
  /**
   * Refreshes the access/refresh pair via the current refresh_token. Deduplicates
   * parallel calls (one in-flight promise for the whole client).
   *
   * - 401 → refresh_token revoked/invalid → we clear the session, emit logout.
   * - Network/5xx → we propagate the error, keep the session — the user shouldn't
   *   be logged out due to a temporary network problem.
   * - No session → we return null without a network request.
   */
  async refresh() {
    if (await this.hydrated, !this.session) return null;
    if (this.inflightRefresh) return this.inflightRefresh;
    const t = this.session.refresh_token, e = this.session.user;
    return this.inflightRefresh = (async () => {
      try {
        const s = await this.api.request(
          `/api/v1/paywall/${this.paywallId}/auth/refresh`,
          {
            method: "POST",
            body: JSON.stringify({ refresh_token: t })
          }
        ), a = this.toSession(s, e);
        return this.setSession(a, { event: "TOKEN_REFRESHED" }), e.is_anonymous === true && await this.writeAnonRefreshToken(a.refresh_token), a;
      } catch (s) {
        if (s instanceof o && s.status === 401)
          return e.is_anonymous === true && await this.clearAnonRefreshToken(), this.setSession(null, { event: "SIGNED_OUT" }), null;
        throw s;
      } finally {
        this.inflightRefresh = null;
      }
    })(), this.inflightRefresh;
  }
  /**
   * Global logout — invalidates ALL of the user's refresh tokens across all
   * devices/contexts via GoTrue `/logout?scope=global`. Used for the
   * compromise-account flow ("suspicious activity, log out everywhere").
   *
   * Local-side: we clear the current session, the other contexts (other tabs /
   * extension popup and background) pick up the logout via storage-watch
   * automatically. Active access tokens in other contexts stay valid until their
   * natural expiry (1 hour max), but refresh no longer works — after the first
   * `getAccessToken()` each context logs itself out.
   *
   * Security: the backend doesn't accept a target user_id — it resolves the user
   * from Bearer, you can't log out someone else's account.
   */
  async revokeAllSessions() {
    await this.hydrated;
    const t = this.session?.access_token;
    if (!t)
      throw new o("not_authenticated", "no active session");
    await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/revoke-all`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` }
      }
    ), this.setSession(null, { event: "SIGNED_OUT" });
  }
  /**
   * Signout: clears the local session IMMEDIATELY (UX — an instant logout without
   * waiting for the network), then a best-effort POST /auth/signout with the
   * current access. A network/5xx error here is no longer critical — the token
   * will expire on the backend anyway.
   *
   * Anon-aware: by default anonRefreshToken is kept. This allows calling
   * signInAnonymously() after signOut() and landing in the SAME anon account
   * without a captcha (see resumeAnonymous). The behavior is predictable for the
   * UX "guest → logged in → logged out → guest again with the same balances".
   *
   * `forgetAnonymous: true` — full forgetting, including anonRefreshToken. Needed
   * for scenarios like "switch account on the device" or privacy complaints
   * ("erase all my traces").
   */
  async signOut(t = {}) {
    await this.hydrated;
    const e = this.session?.access_token, s = this.session?.user.is_anonymous === true;
    if (this.setSession(null, { event: "SIGNED_OUT" }), t.forgetAnonymous && await this.clearAnonRefreshToken(), !!e && !(s && !t.forgetAnonymous))
      try {
        await this.api.request(
          `/api/v1/paywall/${this.paywallId}/auth/signout`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${e}` }
          }
        );
      } catch {
      }
  }
  /**
   * Subscribe to session changes: signin/signup/refresh/signOut/expired-401.
   *
   * Guaranteed contract: the FIRST callback to each subscriber is always
   * `event = 'INITIAL_SESSION'`, triggered asynchronously after the hydrate
   * resolves (even if session=null — the listener gets an explicit "no session",
   * not silence). All subsequent callbacks are real transitions with a concrete
   * event (SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED / USER_UPDATED /
   * PASSWORD_RECOVERY).
   *
   * This lets the listener safely do "only on real signin" side effects (force
   * refetch balances, etc.) via `event === 'SIGNED_IN'` without confusing them
   * with a restore from storage.
   *
   * Returns an unsubscribe.
   */
  onAuthChange(t) {
    return this.listeners.add(t), this.hydrated.then(() => {
      if (this.destroyed || !this.listeners.has(t)) return;
      const e = this.session;
      try {
        t("INITIAL_SESSION", e);
      } catch (s) {
        console.warn("[paywall] onAuthChange INITIAL_SESSION threw", s);
      }
    }), () => {
      this.listeners.delete(t);
    };
  }
  isFresh(t) {
    return t.expires_at - Date.now() > _t;
  }
  toSession(t, e) {
    const s = t.expires_at != null ? t.expires_at * 1e3 : Date.now() + t.expires_in * 1e3;
    return {
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: s,
      user: e
    };
  }
  setSession(t, e) {
    if (this.destroyed) return;
    const s = this.session;
    this.session = t, e.skipPersist || this.persist(), Et(s, t) || this.emit(e.event);
  }
  emit(t) {
    for (const e of this.listeners)
      try {
        e(t, this.session);
      } catch (s) {
        console.warn("[paywall] onAuthChange listener threw", s);
      }
  }
  storageKey() {
    return f.authSession(this.paywallId);
  }
  async hydrate() {
    try {
      const t = await this.storage.getItem(this.storageKey());
      if (!t) return;
      const e = JSON.parse(t);
      if (!e || typeof e.access_token != "string" || typeof e.refresh_token != "string" || typeof e.expires_at != "number" || !e.user)
        return;
      this.session = e;
    } catch {
    }
  }
  // Used as a race-fallback in getAccessToken: between construction (when storage
  // was empty) and onChanged delivery, a signin could have happened in another
  // context. It doesn't duplicate watch — that one is about push, this one about pull.
  async rehydrateFromStorage() {
    try {
      const t = await this.storage.getItem(this.storageKey());
      if (!t) return;
      const e = JSON.parse(t);
      if (!e || typeof e.access_token != "string" || typeof e.refresh_token != "string" || typeof e.expires_at != "number" || !e.user)
        return;
      this.setSession(e, { skipPersist: true, event: "SIGNED_IN" });
    } catch {
    }
  }
  /**
   * Releases AuthClient's resources: unsubscribes storage-watch, clears
   * listeners, sets the destroyed flag. After destroy all async operations
   * (inflight refresh, OAuth popup, applyExternalSession) early-return via
   * `isDestroyed()` guards — no write-backs to storage, no emits to empty listeners.
   *
   * destroy() is idempotent: a repeated call is a no-op.
   */
  destroy() {
    this.destroyed = true, this.storageUnwatch && (this.storageUnwatch(), this.storageUnwatch = null), this.listeners.clear(), this.inflightRefresh = null;
  }
  /** Sync check: was destroy() called. Useful for UI / tests. */
  isDestroyed() {
    return this.destroyed;
  }
  async persist() {
    try {
      this.session ? await this.storage.setItem(
        this.storageKey(),
        JSON.stringify(this.session)
      ) : await this.storage.removeItem(this.storageKey());
    } catch {
    }
  }
  async readAnonRefreshToken() {
    try {
      const t = await this.storage.getItem(f.anonRefreshToken(this.paywallId));
      return typeof t == "string" && t.length > 0 ? t : null;
    } catch {
      return null;
    }
  }
  async writeAnonRefreshToken(t) {
    try {
      await this.storage.setItem(
        f.anonRefreshToken(this.paywallId),
        t
      );
    } catch {
    }
  }
  async clearAnonRefreshToken() {
    try {
      await this.storage.removeItem(
        f.anonRefreshToken(this.paywallId)
      );
    } catch {
    }
  }
  /**
   * Last-used auth method + email — for the "Last used" UI badge and pre-filling
   * the email input. Storage is paywall-scoped, so switching between paywalls on
   * one host doesn't cross the data. A read always returns an object — missing
   * fields = null. */
  async getLastLogin() {
    try {
      const [t, e] = await Promise.all([
        this.storage.getItem(f.lastLoginMethod(this.paywallId)),
        this.storage.getItem(f.lastLoginEmail(this.paywallId))
      ]);
      return !t || !Ot(t) ? null : { method: t, email: typeof e == "string" && e ? e : null };
    } catch {
      return null;
    }
  }
  /** Records method and email atomically (for email/password flows — both are
   *  known at signin/signup time). OAuth flows use separate recordLastLoginMethod
   *  (before the popup) and recordLastLoginEmail (after the exchange). */
  recordLastLogin(t, e) {
    this.recordLastLoginMethod(t), e && this.recordLastLoginEmail(e);
  }
  recordLastLoginMethod(t) {
    this.storage.setItem(f.lastLoginMethod(this.paywallId), t).catch(() => {
    });
  }
  recordLastLoginEmail(t) {
    this.storage.setItem(f.lastLoginEmail(this.paywallId), t).catch(() => {
    });
  }
  /**
   * Reads the stable visitor_id from storage if it's already there. Does NOT
   * generate it: AuthClient may be instantiated before BillingClient, and a
   * synthetic visitor_id without touching the paywall is meaningless (there are no
   * guest purchases to link). undefined → the backend itself skips the
   * "merge guest purchases" branch.
   */
  async readVisitorId() {
    try {
      const t = await this.storage.getItem(f.visitorId);
      return typeof t == "string" && t.length >= 16 ? t : void 0;
    } catch {
      return;
    }
  }
}
const At = 5 * 6e4, Bt = 500;
function Tt(i, t) {
  return new Promise((e) => {
    let s = false;
    const a = () => {
      s = true, window.removeEventListener("message", r), clearInterval(n), clearTimeout(c);
    }, r = (h) => {
      if (s) return;
      const l = h.data;
      !l || l.type !== "pw-oauth" || l.messageId === t && (l.status === "success" && l.code ? (a(), e({ kind: "code", code: l.code })) : l.status === "error" && (a(), e({
        kind: "error",
        error: l.error || "oauth_error",
        errorCode: l.errorCode,
        description: l.description
      })));
    }, n = setInterval(() => {
      if (s) return;
      let h;
      try {
        h = i.closed;
      } catch {
        return;
      }
      h && (a(), e({ kind: "cancelled" }));
    }, Bt), c = setTimeout(() => {
      s || (a(), e({ kind: "timeout" }));
    }, At);
    window.addEventListener("message", r);
  });
}
function Ut(i) {
  if (i.kind !== "error") return false;
  if (i.errorCode === "identity_already_exists") return true;
  const t = `${i.error ?? ""} ${i.description ?? ""}`.toLowerCase();
  return t.includes("identity_already_exists") || t.includes("already linked");
}
function Ot(i) {
  return i === "google" || i === "apple" || i === "github" || i === "facebook" || i === "email";
}
function Et(i, t) {
  return i === t ? true : !i || !t ? false : i.access_token === t.access_token && i.refresh_token === t.refresh_token && i.expires_at === t.expires_at && i.user.id === t.user.id && i.user.email === t.user.email;
}
class Lt {
  constructor(t) {
    if (!t.paywallId)
      throw new o("invalid_config", "paywallId is required");
    if (!t.apiOrigin)
      throw new o(
        "invalid_config",
        "apiOrigin is required. Pass the paywall custom_domain configured in the platform."
      );
    this.paywallId = t.paywallId, this.apiOrigin = t.apiOrigin, this.auth = t.auth, this.userId = t.userId, this.capabilities = t.capabilities, this.customFetch = t.fetch, this.onChargeSuccess = t.onChargeSuccess, this.onQuotaExceeded = t.onQuotaExceeded, this.resolver = new tt({
      apiOrigin: this.apiOrigin,
      edgeFallback: t.edgeFallback
    }), t.userId && !t.auth && typeof window < "u" && typeof window.document < "u" && console.warn(
      "[paywall] WARNING: ApiGatewayClient.userId set without auth in browser. Client can spoof userId. Use AuthClient + Bearer for trusted user.id."
    );
  }
  async call(t) {
    const e = t.path ? t.path.replace(/^\/+/, "") : "", s = (g) => {
      const I = new URL(
        `/api/v1/api-gateway/${encodeURIComponent(t.providerId)}${e ? `/${e}` : ""}`,
        g
      );
      return I.searchParams.set("paywall_id", this.paywallId), I.toString();
    }, a = new Headers(t.headers);
    a.set("X-SDK-Version", E), a.set("X-Paywall-Id", this.paywallId), this.capabilities?.length && a.set("X-SDK-Capabilities", this.capabilities.join(","));
    const r = await this.auth?.getAccessToken();
    r ? a.set("Authorization", `Bearer ${r}`) : this.userId && a.set("X-User-ID", this.userId);
    const n = typeof FormData < "u" && t.body instanceof FormData, c = typeof Blob < "u" && t.body instanceof Blob, h = typeof ReadableStream < "u" && t.body instanceof ReadableStream, l = typeof t.body == "string";
    let v;
    t.body === void 0 || t.body === null ? v = void 0 : n || c || h || l ? v = t.body : (v = JSON.stringify(t.body), a.has("Content-Type") || a.set("Content-Type", "application/json"));
    const _ = this.customFetch ?? fetch, k = async (g) => {
      const I = Z(t.signal);
      try {
        return await _(g, {
          method: t.method ?? "POST",
          headers: a,
          body: v,
          signal: I.signal,
          credentials: "omit"
        });
      } catch (w) {
        if (O(w) === "AbortError")
          throw new o("aborted", "Request aborted", { cause: w });
        const m = w instanceof Error ? w.message : String(w);
        throw new o(
          "network_error",
          `Network request failed: ${m}`,
          { cause: w }
        );
      } finally {
        I.dispose();
      }
    }, y = await et(
      this.resolver,
      async (g) => {
        const I = s(g);
        let w = await k(I);
        if (w.status === 401 && r && this.auth && !h) {
          const m = await this.auth.refresh().then((A) => A?.access_token ?? null).catch(() => null);
          m && m !== r && (a.set("Authorization", `Bearer ${m}`), w = await k(I));
        }
        return w;
      },
      { firstOnly: h }
    );
    if (y.status === 402) {
      const g = await Ct(y);
      throw this.onQuotaExceeded?.(g), g;
    }
    if (!y.ok) {
      const g = await Nt(y.clone());
      throw new o(
        g ?? `http_${y.status}`,
        y.statusText || "Gateway request failed",
        { status: y.status }
      );
    }
    const u = y.headers.get("X-Query-Type") ?? void 0;
    return this.onChargeSuccess?.(u), y;
  }
}
async function Ct(i) {
  let t = {};
  try {
    t = await i.json();
  } catch {
  }
  const e = t.details?.balances;
  let s = [];
  if (Array.isArray(e)) {
    const a = e[0];
    Array.isArray(a) ? s = a : a && Array.isArray(a.balances) && (s = a.balances);
  }
  return new lt({
    balances: s,
    queryType: t.details?.queryType ?? "",
    currentBalance: t.details?.currentBalance ?? null
  });
}
async function Nt(i) {
  if (!(i.headers.get("content-type") ?? "").includes("application/json")) return null;
  try {
    const e = await i.json();
    return e.code || e.error || null;
  } catch {
    return null;
  }
}
function Pt(i) {
  let t = 2166136261;
  for (let e = 0; e < i.length; e++)
    t ^= i.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Dt(i, t) {
  const e = i.variants.filter((n) => n && typeof n.key == "string"), s = e.reduce((n, c) => n + Math.max(0, c.weight || 0), 0);
  if (s <= 0) return null;
  const a = Pt(`${t}:${i.id}`) % s;
  let r = 0;
  for (const n of e)
    if (r += Math.max(0, n.weight || 0), a < r) return n.key;
  return e[e.length - 1]?.key ?? null;
}
async function Kt(i, t, e, s) {
  const a = f.experiment(t);
  try {
    const h = await i.getItem(a);
    if (h) {
      const l = JSON.parse(h);
      if (l && l.experimentId === e.id && e.variants.some((v) => v.key === l.variant))
        return { experimentId: l.experimentId, variant: l.variant };
    }
  } catch {
  }
  const r = await s(), n = Dt(e, r);
  if (!n) return null;
  const c = { experimentId: e.id, variant: n };
  try {
    const h = { ...c, at: Date.now() };
    await i.setItem(a, JSON.stringify(h));
  } catch {
  }
  return c;
}
function Mt(i, t) {
  const e = i.experiment;
  if (!e || e.id !== t.experimentId || (e.assigned_variant = t.variant, e.kind !== "prices")) return;
  const s = e.variants.find((a) => a.key === t.variant);
  s && Rt(i, s);
}
function Rt(i, t) {
  const e = /* @__PURE__ */ new Map();
  for (const r of t.prices ?? [])
    r.replaces != null && e.set(String(r.replaces), r);
  if (e.size === 0) return;
  i.prices = i.prices.map((r) => e.get(r.id) ?? r);
  const s = /* @__PURE__ */ new Map();
  e.forEach((r, n) => s.set(n, r.id));
  const a = (r) => s.get(r) ?? r;
  for (const r of i.layout?.blocks ?? [])
    r.type === "price_grid" ? (r.priceIds && (r.priceIds = r.priceIds.map(a)), r.popular_price_id && (r.popular_price_id = a(r.popular_price_id))) : r.type === "cta_button" && r.priceId && (r.priceId = a(r.priceId));
  for (const r of i.offers ?? [])
    r.price_id != null && (r.price_id = a(r.price_id));
}
const F = 5e3, at = 30 * 6e4, $ = 60 * 6e4, xt = 5 * 6e4, C = {
  has_active_subscription: false,
  purchases: [],
  trial: null,
  had_previous_trial: false
};
function q(i) {
  return i && (i.email || i.userId || i.anonymousId) || "guest";
}
function Ft(i, t) {
  return i === t ? true : !i || !t ? false : JSON.stringify(i) === JSON.stringify(t);
}
const $t = 5e3, H = 5 * 6e4, qt = at, Ht = 3e4;
function Jt(i, t) {
  if (i === t) return true;
  if (!i || !t || i.length !== t.length) return false;
  for (let e = 0; e < i.length; e++)
    if (i[e].type !== t[e].type || i[e].count !== t[e].count) return false;
  return true;
}
class Yt {
  constructor(t) {
    if (this.cachedBootstrap = null, this.cachedBootstrapAt = 0, this.inflightBootstrap = null, this.bootstrapListeners = /* @__PURE__ */ new Set(), this.bootstrapStorageUnwatch = null, this.authUnsubscribe = null, this.cachedUser = null, this.cachedUserAt = 0, this.inflightUser = null, this.userListeners = /* @__PURE__ */ new Set(), this.userHydration = Promise.resolve(), this.visitorIdPromise = null, this.visitorId = null, this.inflightCheckouts = /* @__PURE__ */ new Map(), this.cachedBalances = null, this.cachedBalancesAt = 0, this.balancesStorageUnwatch = null, this.inflightBalances = null, this.balanceListeners = /* @__PURE__ */ new Set(), this.previewVersionCounter = 0, !t.paywallId)
      throw new o("invalid_config", "paywallId is required");
    if (!t.apiOrigin)
      throw new o(
        "invalid_config",
        'apiOrigin is required. Pass the paywall custom_domain configured in the platform (e.g. "https://pay.your-domain.com"). The legacy "appbox.space" fallback is not used in SDK 3.0.'
      );
    this.paywallId = t.paywallId, this.apiOrigin = t.apiOrigin, this.capabilities = t.capabilities, this.auth = t.auth, this.previewMode = t.preview === true;
    const e = t.auth?.getCachedUser();
    if (this.identity = t.identity ?? (e ? N(e) : void 0), this.apiKey = t.apiKey, this.fetchImpl = t.fetch, t.apiKey && typeof window < "u" && typeof window.document < "u") {
      if (!t.allowInsecureBrowserUsage)
        throw new o(
          "apikey_in_browser",
          "BillingClient.apiKey detected in browser context. This is a server-SDK key and exposes your entire account. Move BillingClient to a trusted backend, or pass allowInsecureBrowserUsage:true if this is intentional (e2e tests)."
        );
      console.error(
        "[paywall] SECURITY: BillingClient.apiKey detected in browser context (allowInsecureBrowserUsage). This is a server-SDK key and exposes your account. Never ship this to production."
      );
    }
    this.storage = W(t.storage), this.api = new st({
      apiOrigin: this.apiOrigin,
      paywallId: t.paywallId,
      capabilities: t.capabilities,
      fetch: t.fetch,
      edgeFallback: t.edgeFallback,
      // Sticky failover choice survives restarts — a returning blocked user
      // goes straight to the working origin.
      storage: this.storage,
      // Bearer is passed on every request. AuthClient.getAccessToken does a lazy
      // refresh, dedupes, and on 401 returns null — then the Authorization
      // header simply isn't set.
      getAuthToken: t.auth ? () => t.auth.getAccessToken() : void 0,
      // Data endpoint got a 401 with a Bearer the client considered fresh —
      // the session was revoked server-side (refresh-rotation race in another
      // context / GoTrue family revocation / clock skew). Force one rotation:
      // refresh() dedupes in-flight calls, on its own 401 clears the session
      // and returns null (→ no retry, the UI sees the 401 and can offer a
      // re-signin), on network/5xx throws — swallowed here, the retry wouldn't
      // get through anyway.
      onUnauthorized: t.auth ? async () => {
        try {
          return (await t.auth.refresh())?.access_token ?? null;
        } catch {
          return null;
        }
      } : void 0
    }), t.auth && (this.authUnsubscribe = t.auth.onAuthChange((s, a) => {
      const r = a ? N(a.user) : void 0;
      J(this.identity, r) || this.setIdentity(r);
    })), this.auth && !this.identity || (this.userHydration = this.hydrateUserFromStorage()), this.hydrateBootstrapFromStorage(), this.subscribeBootstrapStorage(), this.hydrateBalancesFromStorage(), this.subscribeBalancesStorage(), this.visitorIdPromise = M(this.storage).then((s) => (this.visitorId = s, s));
  }
  /**
   * Stable visitor_id (UUID v4). The first call awaits the initial resolve from
   * storage; subsequent ones — instantly from the in-memory cache. Used by
   * EventTracker for analytics attribution.
   */
  async getVisitorId() {
    return this.visitorId ? this.visitorId : (this.visitorIdPromise || (this.visitorIdPromise = M(this.storage).then((t) => (this.visitorId = t, t))), this.visitorIdPromise);
  }
  /** Sync access to visitor_id. null if not resolved yet (the first ms of life). */
  getCachedVisitorId() {
    return this.visitorId;
  }
  setIdentity(t) {
    this.identity = t, this.cachedUser = null, this.cachedUserAt = 0, this.inflightUser = null, this.cachedBalances = null, this.cachedBalancesAt = 0, this.inflightBalances = null, this.balancesStorageUnwatch && (this.balancesStorageUnwatch(), this.balancesStorageUnwatch = null), this.hydrateBalancesFromStorage(), this.subscribeBalancesStorage(), this.userHydration = this.hydrateUserFromStorage(), t ? this.getUser({ force: true }).catch(() => {
    }) : (this.applyUser(C), this.applyBalances([]));
  }
  /**
   * Unsubscribe from auth events and clear listeners. Call when BillingClient is
   * no longer needed (tests, hot-reload, re-initialization). Without destroy()
   * the listener on AuthClient outlives BillingClient and keeps calling
   * setIdentity on a released instance. The user/balance listeners are cleared so
   * that a torn-down host (e.g. an unmounted React tree) doesn't hold closures
   * over these callbacks.
   */
  destroy() {
    this.authUnsubscribe && (this.authUnsubscribe(), this.authUnsubscribe = null), this.bootstrapStorageUnwatch && (this.bootstrapStorageUnwatch(), this.bootstrapStorageUnwatch = null), this.balancesStorageUnwatch && (this.balancesStorageUnwatch(), this.balancesStorageUnwatch = null), this.userListeners.clear(), this.balanceListeners.clear(), this.bootstrapListeners.clear();
  }
  getIdentity() {
    return this.identity;
  }
  getStorage() {
    return this.storage;
  }
  /** Origin the SDK is currently talking to: `apiOrigin`, or the edge mirror
   *  after a network-level failover (see core/edge.ts). For building sibling
   *  URLs that must reach the same host — e.g. the analytics endpoint. */
  activeApiOrigin() {
    return this.api.activeOrigin();
  }
  async bootstrap(t = false) {
    const e = typeof t == "boolean" ? { force: t } : t;
    if (this.previewMode) {
      if (this.cachedBootstrap) return this.cachedBootstrap;
      throw new o(
        "invalid_config",
        "BillingClient in preview mode but cachedBootstrap is not seeded. Call setBootstrap(bootstrap) before open()."
      );
    }
    const s = Date.now(), a = this.cachedBootstrap && this.cachedBootstrapAt > 0 && s - this.cachedBootstrapAt < $;
    return !e.force && a ? (s - this.cachedBootstrapAt > xt && this.revalidateBootstrap(e.signal).catch(() => {
    }), { ...this.cachedBootstrap, user: this.cachedUser ?? void 0 }) : this.inflightBootstrap ? this.inflightBootstrap : (this.inflightBootstrap = this.fetchBootstrap({
      ifVersion: e.force ? void 0 : this.cachedBootstrap?.version,
      signal: e.signal
    }).finally(() => {
      this.inflightBootstrap = null;
    }), this.inflightBootstrap);
  }
  /**
   * Subscribe to bootstrap changes: applyBootstrap (network revalidate,
   * cross-context storage.watch). Fires ONLY on a real `version` change (an
   * unchanged response from the server doesn't trigger listeners). Returns an
   * unsubscribe.
   */
  onBootstrapChange(t) {
    return this.bootstrapListeners.add(t), () => {
      this.bootstrapListeners.delete(t);
    };
  }
  /**
   * Replace cachedBootstrap with partial or full data and emit to all
   * subscribers. Used by the host in preview mode (the admin editor) for
   * live-updating the open modal without a network revalidate.
   *
   * Behavior:
   *  - Without `cachedBootstrap`, at least `settings` + `prices` are expected —
   *    otherwise PaywallRoot can't render the plans and will crash.
   *  - With an existing cache, the partial is merged on top: `settings` is a deep
   *    merge one level down (settings fields), the `prices`/`offers` arrays are overwritten.
   *  - Every call bumps `version` ("preview:<n>") so that applyBootstrap's
   *    `versionChanged` check always fires and listeners are triggered.
   *  - We do NOT persist to storage — preview must not leak into other tabs.
   *
   * In non-preview mode the method is available, but it's a rare path (e.g. for
   * host tests) — production code should rely on bootstrap() + revalidate.
   */
  setBootstrap(t) {
    const e = this.cachedBootstrap ?? {
      settings: { id: this.paywallId, name: "" },
      prices: [],
      offers: []
    }, s = {
      ...e,
      ...t,
      settings: t.settings !== void 0 ? { ...e.settings, ...t.settings } : e.settings,
      prices: t.prices !== void 0 ? t.prices : e.prices,
      offers: t.offers !== void 0 ? t.offers : e.offers,
      version: `preview:${++this.previewVersionCounter}`
    };
    s.layout || (s.layout = j(s.settings, s.prices)), U(s), this.cachedBootstrap = s, this.cachedBootstrapAt = Date.now();
    for (const a of this.bootstrapListeners)
      try {
        a(s);
      } catch (r) {
        console.warn("[paywall] onBootstrapChange listener threw", r);
      }
  }
  // Network primitive — a single point for the force request, the revalidate,
  // and the first cold bootstrap. `ifVersion` sends a server-side short-circuit:
  // if it matches — the backend answers `{unchanged: true, version, user}` and we
  // only update the cached user, leaving structure (layout/prices/offers/locales) untouched.
  async fetchBootstrap(t) {
    const e = {};
    this.identity?.email && (e["X-User-Email"] = this.identity.email);
    const s = t.ifVersion ? `/api/v1/paywall/${this.paywallId}/bootstrap?if_version=${encodeURIComponent(t.ifVersion)}` : `/api/v1/paywall/${this.paywallId}/bootstrap`, a = await this.api.request(s, {
      ...Object.keys(e).length ? { headers: e } : {},
      signal: t.signal
    });
    if ("unchanged" in a && a.unchanged)
      return this.cachedBootstrap ? (this.cachedBootstrapAt = Date.now(), a.user && this.applyUser(a.user), { ...this.cachedBootstrap, user: this.cachedUser ?? void 0 }) : this.fetchBootstrap({ signal: t.signal });
    const r = a;
    return Vt(r.settings.custom_domain, this.apiOrigin), r.layout || (r.layout = j(r.settings, r.prices)), U(r), await this.materializeExperiment(r), this.applyBootstrap(r, { persist: true }), r.user && this.applyUser(r.user), r;
  }
  // Client-side A/B: resolve the sticky assignment and materialize the variant
  // into the bootstrap (price/layout/offer substitution, see core/experiment.ts).
  // Runs AFTER applyLocaleOverrides at every bootstrap ingress point (network,
  // storage hydrate, cross-context watch) — locale overrides may swap the layout
  // back to one referencing control price ids. Idempotent; any failure leaves
  // the control experience intact — experiments must never break the paywall.
  async materializeExperiment(t) {
    const e = t.experiment;
    if (!(!e || !Array.isArray(e.variants) || e.variants.length === 0))
      try {
        const s = await Kt(
          this.storage,
          this.paywallId,
          e,
          () => this.getVisitorId()
        );
        s && Mt(t, s);
      } catch {
      }
  }
  // Background revalidate from the stale-while-revalidate branch. Deduplicated
  // via `inflightBootstrap` so that parallel revalidates don't cross.
  revalidateBootstrap(t) {
    return this.inflightBootstrap ? this.inflightBootstrap : (this.inflightBootstrap = this.fetchBootstrap({
      ifVersion: this.cachedBootstrap?.version,
      signal: t
    }).finally(() => {
      this.inflightBootstrap = null;
    }), this.inflightBootstrap);
  }
  // Applies a fresh bootstrap to state: emit listeners ONLY on a version change
  // (i.e. the structure is really different). This is needed so a repeated
  // applyBootstrap from storage.watch doesn't redraw the UI for nothing if
  // another tab found the same version. persist=false for the "got it from
  // storage" path — there someone else already wrote it.
  applyBootstrap(t, { persist: e }) {
    const s = !this.cachedBootstrap || this.cachedBootstrap.version !== t.version;
    if (this.cachedBootstrap = t, this.cachedBootstrapAt = Date.now(), e && this.persistBootstrap(t), s)
      for (const a of this.bootstrapListeners)
        try {
          a(t);
        } catch (r) {
          console.warn("[paywall] onBootstrapChange listener threw", r);
        }
  }
  async hydrateBootstrapFromStorage() {
    if (!this.cachedBootstrap)
      try {
        const t = await this.storage.getItem(f.bootstrap(this.paywallId));
        if (!t) return;
        const e = JSON.parse(t);
        if (!e?.bootstrap || Date.now() - e.at > $ || this.cachedBootstrap || (U(e.bootstrap), await this.materializeExperiment(e.bootstrap), this.cachedBootstrap)) return;
        this.cachedBootstrap = e.bootstrap, this.cachedBootstrapAt = e.at;
        for (const s of this.bootstrapListeners)
          try {
            s(e.bootstrap);
          } catch (a) {
            console.warn("[paywall] onBootstrapChange listener threw", a);
          }
      } catch {
      }
  }
  async persistBootstrap(t) {
    if (t.version)
      try {
        const { user: e, ...s } = t;
        await this.storage.setItem(
          f.bootstrap(this.paywallId),
          JSON.stringify({ at: Date.now(), bootstrap: s })
        );
      } catch {
      }
  }
  // Cross-context sync: another tab / popup / sw wrote a fresh bootstrap → we
  // pick it up without a network request. Adapters without watch (memory) — a
  // no-op, everything works as before via the network.
  subscribeBootstrapStorage() {
    typeof this.storage.watch == "function" && (this.bootstrapStorageUnwatch = this.storage.watch(
      f.bootstrap(this.paywallId),
      (t) => {
        if (t)
          try {
            const e = JSON.parse(t);
            if (!e?.bootstrap) return;
            if (this.cachedBootstrap?.version && this.cachedBootstrap.version === e.bootstrap.version) {
              this.cachedBootstrapAt = e.at;
              return;
            }
            U(e.bootstrap), this.materializeExperiment(e.bootstrap).then(() => {
              this.applyBootstrap(e.bootstrap, { persist: false });
            });
          } catch {
          }
      }
    ));
  }
  /** Returns the last loaded bootstrap without a network request.
   *  null = the bootstrap hasn't been loaded yet. Handy for post-checkout logic
   *  (PaywallUI reads success_redirect_url without doing a second round-trip). */
  getCachedBootstrap() {
    return this.cachedBootstrap;
  }
  /** Sticky A/B assignment of this device, read from the materialized
   *  bootstrap. null — no running experiment or the bootstrap isn't loaded yet.
   *  The host can use it to keep its own UI consistent with the paywall variant
   *  (e.g. a pricing page mirroring the tested amounts). */
  getExperimentAssignment() {
    const t = this.cachedBootstrap?.experiment;
    return t?.assigned_variant ? { experimentId: t.id, variant: t.assigned_variant } : null;
  }
  /**
   * A shortcut over `bootstrap()`: waits for the paywall structure to load and
   * returns the prices. Useful when the host renders prices outside the modal
   * (cards on a landing page, a "Pricing" page, etc.) and doesn't want to unpack
   * the bootstrap by hand.
   *
   * Locale overrides (`label`/`description` under `navigator.language`) are
   * already applied — the array is ready to render. Cache/TTL/stale-while-revalidate
   * are the same as `bootstrap()`: a repeat call doesn't storm the server.
   */
  async getPrices(t = {}) {
    return (await this.bootstrap(t)).prices;
  }
  /** Sync snapshot of prices from the last bootstrap. null = not loaded yet. */
  getCachedPrices() {
    return this.cachedBootstrap?.prices ?? null;
  }
  /** Sync snapshot of offers from the last bootstrap. null = the bootstrap
   *  hasn't been loaded yet, an empty array = the backend returned a paywall with
   *  no offers. The backend has already applied server-side targeting
   *  (target_countries / target_emails / targeting_mode from offer_settings) —
   *  only what's applicable to the current user comes out. The client side
   *  remains responsible for price_id matching and the countdown
   *  (see core/offer.ts → resolveOffer). */
  getCachedOffers() {
    return this.cachedBootstrap?.offers ?? null;
  }
  /**
   * A snapshot of what language the SDK currently considers the "user's
   * language". Useful for syncing the host's i18n with what the paywall actually
   * shows — so the surrounding UI doesn't contradict the modal (e.g. the host
   * renders a "Subscribe" button in English while the paywall shows «Подписаться» in Russian).
   *
   * Returns a structure rather than a single tag, so the integrator can:
   *  - quickly take `tag` for their own translations;
   *  - distinguish "the paywall is really in this language" (`applied !== null`)
   *    from "the SDK guessed, but there's no locale for this language — the base is rendered";
   *  - decide what to trust when browserLanguage vs countryLanguage conflict
   *    (a trip, an expat, a VPN — each has its own answer).
   *
   * Sync call: the data is already in the bootstrap, no separate requests are
   * made. If `bootstrap()` hasn't been called yet — `applied` and
   * `countryLanguage` will be `null`, but `browserLanguage` and `tag` are still
   * returned if `navigator.language` is present.
   */
  getUserLanguage() {
    const t = typeof navigator < "u" && navigator.language ? navigator.language : null, e = this.cachedBootstrap?.settings.locale_default ?? null, s = this.cachedBootstrap ? rt(this.cachedBootstrap) : null;
    return { tag: s ?? t ?? e, applied: s, browserLanguage: t, countryLanguage: e };
  }
  /**
   * Get the current subscription/purchases state.
   *
   * - In-memory cache TTL 5s — a naïve setInterval(1000) doesn't load the server.
   * - In-flight dedupe — parallel calls get a single promise.
   * - `force: true` bypasses the cache (for a post-checkout check).
   * - Without identity it returns empty-state (the server does the same).
   */
  async getUser({ force: t = false, signal: e } = {}) {
    if (!t && this.cachedUser && Date.now() - this.cachedUserAt < F)
      return this.cachedUser;
    if (this.inflightUser) return this.inflightUser;
    if (!this.identity?.email && this.auth) {
      if (await this.auth.ready().catch(() => {
      }), this.inflightUser) return this.inflightUser;
      if (!t && this.cachedUser && Date.now() - this.cachedUserAt < F)
        return this.cachedUser;
    }
    return this.inflightUser = (async () => {
      try {
        if (!this.identity?.email)
          return this.applyUser(C), C;
        const s = await this.api.request(
          `/api/v1/paywall/${this.paywallId}/user-state`,
          { headers: { "X-User-Email": this.identity.email }, signal: e }
        );
        return this.applyUser(s), s;
      } finally {
        this.inflightUser = null;
      }
    })(), this.inflightUser;
  }
  /**
   * Subscribe to user-state changes. The callback is invoked:
   * - immediately with the last-known user (if present in the cache) — by default
   *   via a microtask, optionally SYNC (see options);
   * - on every real change (getUser/bootstrap brought a different shape).
   *
   * `opts.immediate`:
   *   - `'microtask'` (default) — the initial snapshot is delivered in
   *     queueMicrotask, so the host can finish resetting state in the same tick.
   *     The safe choice for most integrations.
   *   - `'sync'` — the initial snapshot is delivered right in the current frame,
   *     before onUserChange returns. Convenient for React/Vue useEffect cleanup
   *     (avoids an extra re-render) and SSR (instant synchronization).
   *   - `'none'` — don't deliver an initial snapshot, only real changes.
   *
   * Returns the unsubscribe function.
   */
  onUserChange(t, e = {}) {
    this.userListeners.add(t);
    const s = e.immediate ?? "microtask";
    if (this.cachedUser && s !== "none") {
      const a = this.cachedUser;
      if (s === "sync")
        try {
          t(a);
        } catch (r) {
          console.warn("[paywall] onUserChange initial sync threw", r);
        }
      else
        queueMicrotask(() => {
          this.userListeners.has(t) && t(a);
        });
    }
    return () => {
      this.userListeners.delete(t);
    };
  }
  /** The current cached user without a network request. null = not loaded yet. */
  getCachedUser() {
    return this.cachedUser;
  }
  /**
   * User for subscription-gate decisions. Unlike `getCachedUser()`, waits for
   * the sources that are still in flight on a cold start (the extension-popup
   * lifecycle): auth session hydrate → identity sync → persisted user →
   * network user-state. Never rejects: a network failure resolves to the last
   * known cachedUser or null ("unknown"). null = nothing to resolve with (a
   * guest without identity ends up as EMPTY_USER, not null) or the network is
   * down with no cache.
   */
  async getSettledUser(t = {}) {
    if (this.auth && (await this.auth.ready().catch(() => {
    }), this.syncIdentityFromAuth()), await this.userHydration.catch(() => {
    }), this.cachedUser) {
      if (this.cachedUser.has_active_subscription) return this.cachedUser;
      if (!await this.consumeCheckoutPending()) return this.cachedUser;
      try {
        return await this.getUser({ force: true, signal: t.signal });
      } catch {
        return this.cachedUser;
      }
    }
    try {
      return await this.getUser({ signal: t.signal });
    } catch {
      return this.cachedUser;
    }
  }
  // Reads AND removes the one-shot checkout-pending marker. true = a checkout
  // was started on this device recently, the negative persisted user must be
  // re-checked against the network. Consumed on first read — an abandoned
  // checkout must not tax every subsequent open with an extra await; a
  // successful purchase persists an active user anyway, after which the
  // marker path is never consulted again.
  async consumeCheckoutPending() {
    const t = f.checkoutPending(this.paywallId);
    try {
      const e = await this.storage.getItem(t);
      if (!e) return false;
      Promise.resolve(this.storage.removeItem(t)).catch(
        () => {
        }
      );
      const s = JSON.parse(e);
      return typeof s?.at != "number" ? false : Date.now() - s.at <= qt;
    } catch {
      return false;
    }
  }
  // Sync identity from the current auth session — the same thing the
  // constructor's onAuthChange listener does; the sameIdentity guard swallows
  // no-ops, so calling it out-of-band is safe.
  syncIdentityFromAuth() {
    if (!this.auth) return;
    const t = this.auth.getCachedSession(), e = t ? N(t.user) : void 0;
    J(this.identity, e) || this.setIdentity(e);
  }
  applyUser(t) {
    const e = !Ft(this.cachedUser, t);
    if (this.cachedUser = t, this.cachedUserAt = Date.now(), e) {
      this.persistUser(t);
      for (const s of this.userListeners)
        try {
          s(t);
        } catch (a) {
          console.warn("[paywall] onUserChange listener threw", a);
        }
    }
  }
  storageKey() {
    return f.userState(this.paywallId, q(this.identity));
  }
  async hydrateUserFromStorage() {
    if (!this.cachedUser)
      try {
        const t = await this.storage.getItem(this.storageKey());
        if (!t) return;
        const e = JSON.parse(t);
        if (!e?.user || Date.now() - e.at > at || this.cachedUser) return;
        this.applyUser(e.user);
      } catch {
      }
  }
  async persistUser(t) {
    try {
      await this.storage.setItem(
        this.storageKey(),
        JSON.stringify({ at: Date.now(), user: t })
      );
    } catch {
    }
  }
  /**
   * AI provider balances (`paywall_balances` × `tokenization_queries`).
   *
   * - In-memory cache TTL 5s — parallel UI renders don't hit the network;
   * - In-flight dedupe — parallel `getBalances` calls get a single promise;
   * - `force: true` bypasses the cache (the typical case — after QuotaExceededError);
   * - Without auth (Bearer not issued) it returns an empty array without a
   *   network request: the backend would answer 401 anyway, no point spending a round-trip.
   *
   * If the paywall has `tokenization=false` — the backend returns `[]`, as for a
   * guest. The SDK doesn't distinguish "no quota" from "no quotas at all" — the
   * caller decides via `currentBalance` in QuotaExceededError or `balances.length`.
   */
  async getBalances({ force: t = false, signal: e } = {}) {
    const s = Date.now(), a = this.cachedBalances ? s - this.cachedBalancesAt : 1 / 0;
    return !t && this.cachedBalances && (a < $t || a < Ht) ? this.cachedBalances : !t && this.cachedBalances && a < H ? (this.fetchBalances({ signal: e }).catch(() => {
    }), this.cachedBalances) : this.inflightBalances ? this.inflightBalances : this.fetchBalances({ signal: e });
  }
  // Network primitive — a single point for force/stale-revalidate/cold-start.
  // Deduplicated via `inflightBalances`.
  fetchBalances({ signal: t } = {}) {
    return this.inflightBalances ? this.inflightBalances : (this.inflightBalances = (async () => {
      try {
        if (!this.auth)
          return this.applyBalances([]), [];
        const e = await this.api.request(`/api/v1/paywall/${this.paywallId}/balances`, { signal: t }), s = Array.isArray(e.balances) ? e.balances : [];
        return this.applyBalances(s), s;
      } finally {
        this.inflightBalances = null;
      }
    })(), this.inflightBalances);
  }
  /** Sync snapshot. null = not loaded yet (or an explicit clear on re-login). */
  getCachedBalances() {
    return this.cachedBalances;
  }
  /**
   * Subscribe to balance changes: getBalances/decrementBalanceLocal/setIdentity.
   * `opts.immediate` works the same as in `onUserChange`: 'microtask' (default),
   * 'sync' (for React/Vue useEffect), 'none' (changes only). Returns an unsubscribe.
   */
  onBalanceChange(t, e = {}) {
    this.balanceListeners.add(t);
    const s = e.immediate ?? "microtask";
    if (this.cachedBalances && s !== "none") {
      const a = this.cachedBalances;
      if (s === "sync")
        try {
          t(a);
        } catch (r) {
          console.warn("[paywall] onBalanceChange initial sync threw", r);
        }
      else
        queueMicrotask(() => {
          this.balanceListeners.has(t) && t(a);
        });
    }
    return () => {
      this.balanceListeners.delete(t);
    };
  }
  /**
   * Optimistically decrements the count for `queryType` by 1 and notifies
   * listeners. Used by ApiGatewayClient right after a successful gateway call
   * (the backend has already taken the credit, see `chargeApiQueries`).
   *
   * If queryType is missing from the cache or count<=0 — a no-op (we don't go
   * into negative values, the backend is the correct source-of-truth anyway). If
   * there's no cache at all — also a no-op: an explicit getBalances({force:true})
   * on the next render pulls in the current shape.
   *
   * queryType may be undefined (the gateway didn't send X-Query-Type) — in that
   * case we don't decrement but request refreshBalances() to realign.
   */
  decrementBalanceLocal(t) {
    if (!t) {
      this.getBalances({ force: true });
      return;
    }
    if (!this.cachedBalances) return;
    const e = this.cachedBalances.findIndex((r) => r.type === t);
    if (e < 0 || this.cachedBalances[e].count <= 0) return;
    const a = this.cachedBalances.map(
      (r, n) => n === e ? { ...r, count: r.count - 1 } : r
    );
    this.applyBalances(a);
  }
  /** A forced re-fetch — the typical call after QuotaExceededError, so the UI
   *  gets the current balance=0 and renders an upgrade prompt. */
  refreshBalances() {
    return this.getBalances({ force: true });
  }
  /**
   * Factory for an ApiGatewayClient wired to this billing's balance state:
   *  - Bearer/identity are taken from the current auth/identity;
   *  - on success we decrement cachedBalances optimistically;
   *  - on 402 (QuotaExceededError) we trigger refreshBalances() for the current snapshot.
   *
   * If you override options via `overrides` — they're taken as-is, but
   * `onChargeSuccess`/`onQuotaExceeded` are still called (composable, the host
   * can add its own callback on top).
   */
  createApiGatewayClient(t = {}) {
    const e = t.onChargeSuccess, s = t.onQuotaExceeded;
    return new Lt({
      paywallId: this.paywallId,
      apiOrigin: this.apiOrigin,
      auth: this.auth,
      userId: this.auth ? void 0 : this.identity?.userId,
      capabilities: this.capabilities,
      fetch: this.fetchImpl,
      ...t,
      onChargeSuccess: (a) => {
        this.decrementBalanceLocal(a), e?.(a);
      },
      onQuotaExceeded: (a) => {
        this.refreshBalances(), s?.(a);
      }
    });
  }
  applyBalances(t, { persist: e = true } = {}) {
    const s = !Jt(this.cachedBalances, t);
    if (this.cachedBalances = t, this.cachedBalancesAt = Date.now(), e && this.persistBalances(t), s)
      for (const a of this.balanceListeners)
        try {
          a(t);
        } catch (r) {
          console.warn("[paywall] onBalanceChange listener threw", r);
        }
  }
  balancesStorageKey() {
    return f.balances(this.paywallId, q(this.identity));
  }
  async hydrateBalancesFromStorage() {
    if (!this.cachedBalances)
      try {
        const t = await this.storage.getItem(this.balancesStorageKey());
        if (!t) return;
        const e = JSON.parse(t);
        if (!e?.balances || !Array.isArray(e.balances) || Date.now() - e.at > H || this.cachedBalances) return;
        this.cachedBalances = e.balances, this.cachedBalancesAt = e.at;
        for (const s of this.balanceListeners)
          try {
            s(e.balances);
          } catch (a) {
            console.warn("[paywall] onBalanceChange listener threw", a);
          }
      } catch {
      }
  }
  async persistBalances(t) {
    try {
      await this.storage.setItem(
        this.balancesStorageKey(),
        JSON.stringify({ at: Date.now(), balances: t })
      );
    } catch {
    }
  }
  // Cross-context sync: another tab / popup / SW updated balances (a fresh
  // getBalances or an optimistic decrement) → we pick it up without a network request.
  subscribeBalancesStorage() {
    typeof this.storage.watch == "function" && (this.balancesStorageUnwatch = this.storage.watch(
      this.balancesStorageKey(),
      (t) => {
        if (t)
          try {
            const e = JSON.parse(t);
            if (!e?.balances || !Array.isArray(e.balances) || e.at <= this.cachedBalancesAt) return;
            this.applyBalances(e.balances, { persist: false });
          } catch {
          }
      }
    ));
  }
  async createCheckout(t) {
    if (!this.identity?.email)
      throw new o(
        "identity_required",
        "createCheckout requires identity with email"
      );
    const e = t.idempotencyKey ?? `auto:${t.priceId}`, s = this.inflightCheckouts.get(e);
    if (s) return s;
    const r = {
      "Idempotency-Key": t.idempotencyKey ?? Y()
    };
    this.apiKey && (r["X-Api-Key"] = this.apiKey);
    const n = this.cachedBootstrap?.settings, c = t.successUrl ?? n?.success_redirect_url ?? void 0, h = t.shopUrl ?? n?.checkout_shop_url ?? void 0, v = this.cachedBootstrap?.prices.find(
      (u) => u.id === t.priceId
    )?.local?.currency ?? void 0, _ = this.cachedBootstrap?.experiment, k = this.getCachedVisitorId() ?? void 0, y = this.api.request(`/api/v1/paywall/${this.paywallId}/start-checkout`, {
      method: "POST",
      headers: r,
      signal: t.signal,
      body: JSON.stringify({
        email: this.identity.email,
        priceId: Number(t.priceId),
        offerId: t.offerId,
        successUrl: c,
        errorUrl: t.errorUrl,
        shopUrl: h,
        productName: n?.checkout_product_name ?? void 0,
        trial_days: t.trialDays,
        ignoreActivePurchase: t.ignoreActivePurchase ? true : void 0,
        userMeta: this.identity.userId ? { userId: this.identity.userId } : void 0,
        localCurrency: v,
        visitorId: k,
        experimentId: _?.assigned_variant ? _.id : void 0,
        variantKey: _?.assigned_variant ?? void 0
      })
    }).then((u) => ({ url: u.checkoutUrl, acquiring: u.acquiring })).catch((u) => {
      throw u instanceof o && u.status === 409 && u.cause && typeof u.cause == "object" && u.cause.hasActivePurchase === true ? new o(
        "already_purchased",
        "You already have an active subscription",
        { status: 409, cause: u.cause }
      ) : u;
    });
    return this.inflightCheckouts.set(e, y), y.finally(() => {
      this.inflightCheckouts.get(e) === y && this.inflightCheckouts.delete(e);
    }).catch(() => {
    }), y;
  }
  /**
   * The URL of the Stripe/Paddle/Chargebee customer portal — the place where a
   * logged-in user can manage their subscription (cancel, update card, download
   * invoices). The open flow is controlled by the host:
   *
   * ```ts
   * const { url } = await billing.getCustomerPortalUrl({
   *   returnUrl: 'https://your-app.com/account'
   * });
   * window.open(url, '_blank');
   * ```
   *
   * Auth: Bearer (via AuthClient) or server-side `apiKey`. Without auth and
   * without apiKey it throws PaywallError('identity_required'). A 403 from the
   * backend (no active subscription / acquiring doesn't support a portal) is
   * passed through as PaywallError('forbidden') with `status: 403` — the host
   * renders "no subscription to manage".
   */
  async getCustomerPortalUrl(t = {}) {
    if (!this.auth && !this.apiKey && !this.identity?.email)
      throw new o(
        "identity_required",
        "getCustomerPortalUrl requires auth, apiKey, or identity.email"
      );
    const e = {};
    this.apiKey && (e["X-Api-Key"] = this.apiKey);
    const s = this.auth && this.auth.getCachedSession() ? { returnUrl: t.returnUrl } : {
      email: this.identity?.email,
      userMeta: this.identity?.userId ? { userId: this.identity.userId } : void 0,
      returnUrl: t.returnUrl
    };
    return { url: (await this.api.request(
      `/api/v1/paywall/${this.paywallId}/get-customer-portal`,
      {
        method: "POST",
        headers: Object.keys(e).length ? e : void 0,
        body: JSON.stringify(s),
        signal: t.signal
      }
    )).url };
  }
  /**
   * The list of the user's purchases with rich fields (price, currency,
   * interval, discount, cancel metadata). Suitable for a customer-portal UI:
   * cards with Cancel/Renew/Manage buttons. Less cache-friendly than `getUser` —
   * it hits `/api/v1/paywall/[id]/user` without unstable_cache, because the list
   * for the UI must be fresh after a cancel.
   *
   * Auth (two paths):
   *  - Bearer (via AuthClient) — user.id is resolved from the session, identity
   *    in the query is ignored.
   *  - `apiKey` + `identity.email`/`identity.userId` — the server-SDK path for
   *    integrations with their own authorization. The backend checks that the
   *    identity is linked to this paywall (protection against a cross-paywall lookup).
   * Without auth and without apiKey+identity — `identity_required`.
   */
  async listPurchases(t = {}) {
    const e = !!(this.identity?.email || this.identity?.userId);
    if (!this.auth && !(this.apiKey && e))
      throw new o(
        "identity_required",
        "listPurchases requires AuthClient (Bearer) or apiKey + identity.email/userId"
      );
    const s = {};
    this.apiKey && (s["X-Api-Key"] = this.apiKey);
    const a = new URLSearchParams();
    this.apiKey && this.identity?.email && a.set("email", this.identity.email), this.apiKey && this.identity?.userId && a.set("user_id", this.identity.userId);
    const r = a.toString(), n = r ? `/api/v1/paywall/${this.paywallId}/user?${r}` : `/api/v1/paywall/${this.paywallId}/user`;
    return (await this.api.request(n, {
      method: "GET",
      headers: s,
      signal: t.signal
    })).purchases ?? [];
  }
  /**
   * Credit tokens to a user's tokenized balance (server-SDK only).
   *
   * Adds `amount` tokens of `type` to the user's balance for this paywall
   * (creates the type if absent) and returns the new count. Server-side ONLY:
   * requires `apiKey` + identity (email/userId). Token grants must never be
   * callable from the browser — a user could top up their own balance — so this
   * throws `apikey_required` without an apiKey (and the constructor already
   * forbids apiKey in a browser context).
   *
   * The backend mutation is atomic (no lost updates vs concurrent api-gateway
   * debits), and a credit above the daily-trial limit is NOT clawed back by the
   * daily trial top-up (it only tops balances UP to the limit, never down).
   */
  async creditTokens(t) {
    return this.adjustTokens("credit", t);
  }
  /**
   * Debit tokens from a user's tokenized balance (server-SDK only). Subtracts
   * `amount` of `type` and returns the new count. Throws
   * `PaywallError('insufficient')` if the balance would drop below zero — no
   * partial debit. Same server-only constraints as {@link creditTokens}.
   */
  async debitTokens(t) {
    return this.adjustTokens("debit", t);
  }
  async adjustTokens(t, e) {
    if (!this.apiKey)
      throw new o(
        "apikey_required",
        "creditTokens/debitTokens are server-SDK only — set apiKey + identity. Token balance changes must not be callable from the browser."
      );
    if (!this.identity?.email && !this.identity?.userId)
      throw new o(
        "identity_required",
        "creditTokens/debitTokens require identity.email or identity.userId"
      );
    if (!e.type || !Number.isInteger(e.amount) || e.amount <= 0)
      throw new o(
        "invalid_argument",
        "type is required and amount must be a positive integer"
      );
    const s = await this.api.request(`/api/v1/paywall/${this.paywallId}/balances`, {
      method: "POST",
      headers: { "X-Api-Key": this.apiKey },
      body: JSON.stringify({
        email: this.identity?.email,
        user_id: this.identity?.userId,
        type: e.type,
        amount: e.amount,
        op: t
      }),
      signal: e.signal
    });
    return { type: s.type, count: s.count };
  }
  /**
   * Cancel a subscription. The backend checks that the subscription belongs to
   * the user (Bearer path — from the session; apiKey path — from identity) and
   * cancels it at the acquirer (Stripe/Paddle/Chargebee/Overpay). By default the
   * cancel happens at the end of the current period — the user keeps access until
   * the renewal date.
   *
   * `reason` is required (validated on the backend).
   *
   * Auth (two paths):
   *  - Bearer (via AuthClient) — the standard path for a customer-portal UI.
   *  - `apiKey` + `identity.email`/`identity.userId` — for a self-service UI on
   *    the client's backend with its own authorization. The backend additionally
   *    filters the subscription by paywall_id so that the owner of paywall A
   *    can't cancel a subscription of paywall B.
   */
  async cancelSubscription(t) {
    const e = !!(this.identity?.email || this.identity?.userId);
    if (!this.auth && !(this.apiKey && e))
      throw new o(
        "identity_required",
        "cancelSubscription requires AuthClient (Bearer) or apiKey + identity.email/userId"
      );
    const s = {};
    this.apiKey && (s["X-Api-Key"] = this.apiKey);
    const a = {
      subscriptionId: t.subscriptionId,
      paywallId: this.paywallId,
      cancellationReason: t.reason
    };
    return this.apiKey && this.identity?.email && (a.email = this.identity.email), this.apiKey && this.identity?.userId && (a.userId = this.identity.userId), this.api.request("/api/paywall/cancel-subscription", {
      method: "POST",
      headers: s,
      body: JSON.stringify(a),
      signal: t.signal
    });
  }
  /**
   * Creates a support ticket. If `files` are present — multipart/form-data,
   * otherwise JSON. Email is taken (1) from the explicit payload.email field;
   * (2) from identity if present. If neither exists — the backend rejects the
   * ticket (`email_required`).
   *
   * The Bearer token (if an AuthClient is wired up) is added automatically — the
   * backend overrides customer_email with the email from the session (protection
   * against spoofing).
   */
  async createSupportTicket(t) {
    const e = t.email ?? this.identity?.email ?? null, s = `/api/v1/paywall/${this.paywallId}/support/ticket`;
    if (!!t.files && t.files.length > 0) {
      const r = new FormData();
      r.set("subject", t.subject), r.set("content", t.content), e && r.set("customer_email", e);
      for (const n of t.files) r.append("files", n);
      return this.api.request(s, {
        method: "POST",
        body: r
      });
    }
    return this.api.request(s, {
      method: "POST",
      body: JSON.stringify({
        subject: t.subject,
        content: t.content,
        customer_email: e
      })
    });
  }
}
function N(i) {
  return { email: i.email, userId: i.id };
}
function J(i, t) {
  return i === t ? true : !i || !t ? false : i.email === t.email && i.userId === t.userId && i.anonymousId === t.anonymousId;
}
function V(i) {
  if (!i) return null;
  const t = i.trim();
  if (!t) return null;
  try {
    return new URL(t.includes("://") ? t : `https://${t}`).origin;
  } catch {
    return null;
  }
}
function Vt(i, t) {
  const e = V(i);
  if (!(!e || V(t) === e))
    throw new o(
      "invalid_config",
      `apiOrigin mismatch: SDK initialized with "${t}" but paywall is configured with custom_domain "${i}". Use the custom_domain from the platform paywall settings.`
    );
}
function j(i, t) {
  return {
    type: "modal",
    blocks: [
      // offer_banner is NOT in the default layout — PaywallRoot renders it as a
      // top-tab above the dialog (rounded-top, negative margin), outside the
      // scrollable area. The block stays in the registry for the opt-in inline variant.
      { type: "heading", text: i.name || "Upgrade", level: 1 },
      { type: "price_grid", priceIds: t.map((e) => e.id) },
      { type: "cta_button", action: "checkout" },
      { type: "guarantee_badge" },
      { type: "current_session" }
    ]
  };
}
function rt(i) {
  const t = i.locales;
  if (!t) return null;
  const e = [];
  if (typeof navigator < "u") {
    navigator.language && e.push(navigator.language);
    const a = navigator.language?.split("-")[0];
    a && a !== navigator.language && e.push(a);
  }
  const s = i.settings.locale_default;
  s && e.push(s);
  for (const a of e)
    if (a && Object.prototype.hasOwnProperty.call(t, a)) return a;
  return null;
}
function U(i) {
  const t = rt(i);
  if (!t) return;
  const e = i.locales?.[t];
  e && (e.layout && (i.layout = e.layout), e.prices && (i.prices = i.prices.map((s) => {
    const a = e.prices?.[s.id];
    if (!a) return s;
    const r = { ...s };
    return "label" in a && (r.label = a.label ?? null), "description" in a && (r.description = a.description ?? null), r;
  })));
}
const jt = 1500, Gt = 20, G = 200;
class Zt {
  constructor(t) {
    this.buffer = [], this.flushTimer = null, this.destroyed = false, this.unloadHandler = null, this.visibilityHandler = null, this.opts = t, this.isEnabled() && this.attachUnloadHandlers();
  }
  isEnabled() {
    return this.opts.enabled !== false;
  }
  endpoint() {
    return typeof this.opts.endpoint == "function" ? this.opts.endpoint() : this.opts.endpoint;
  }
  track(t, e) {
    if (this.destroyed || !this.isEnabled() || typeof t != "string" || t.length === 0) return;
    let s = null;
    try {
      s = this.opts.getExperimentContext?.() ?? null;
    } catch {
    }
    const a = s ? { ...s, ...e } : e;
    this.buffer.push({ type: t, ts: Date.now(), props: a });
    const r = this.opts.maxBufferSize ?? Gt;
    if (this.buffer.length >= r) {
      this.flush();
      return;
    }
    this.buffer.length > G && (this.buffer = this.buffer.slice(-G)), this.scheduleFlush();
  }
  scheduleFlush() {
    if (this.flushTimer || this.destroyed) return;
    const t = this.opts.flushIntervalMs ?? jt;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null, this.flush();
    }, t);
  }
  async flush() {
    if (this.buffer.length === 0) return;
    this.flushTimer && (clearTimeout(this.flushTimer), this.flushTimer = null);
    const t = this.buffer;
    this.buffer = [];
    try {
      const e = await this.opts.getVisitorId(), s = this.opts.getUserId?.() ?? null, a = JSON.stringify({ events: t }), r = this.opts.fetch ?? (typeof fetch < "u" ? fetch : void 0);
      if (!r) return;
      await r(this.endpoint(), {
        method: "POST",
        credentials: "omit",
        keepalive: true,
        // if the page closes at this moment — the browser still finishes it
        headers: this.buildHeaders(e, s),
        body: a
      });
    } catch {
    }
  }
  /**
   * Sending via navigator.sendBeacon — for unload/pagehide. Guaranteed to
   * arrive (a POST with keepalive almost is too, but beacon is built exactly for
   * this). Headers can't be set (per spec), so SDK metadata travels in the body
   * as fallback fields that the server reads in addition to headers.
   */
  flushBeacon() {
    if (this.buffer.length === 0) return;
    const t = this.buffer;
    this.buffer = [];
    const e = this.opts.getCachedVisitorId?.() ?? null, s = this.opts.getUserId?.() ?? null;
    if (!e) {
      this.buffer.unshift(...t), this.flush();
      return;
    }
    const a = JSON.stringify({
      events: t,
      // body-level duplicates for the beacon flow, read by the server as a fallback.
      visitor_id: e,
      user_id: s,
      sdk_version: E,
      paywall_id: this.opts.paywallId,
      capabilities: this.opts.capabilities?.join(",") ?? ""
    }), r = this.opts.sendBeacon ?? (typeof navigator < "u" && typeof navigator.sendBeacon == "function" ? navigator.sendBeacon.bind(navigator) : null);
    if (!r) {
      this.buffer.unshift(...t), this.flush();
      return;
    }
    try {
      r(this.endpoint(), a) || (this.buffer.unshift(...t), this.flush());
    } catch {
      this.buffer.unshift(...t), this.flush();
    }
  }
  buildHeaders(t, e) {
    const s = {
      "Content-Type": "application/json",
      "X-SDK-Version": E,
      "X-Paywall-Id": this.opts.paywallId,
      "X-Visitor-Id": t
    };
    return this.opts.capabilities?.length && (s["X-SDK-Capabilities"] = this.opts.capabilities.join(",")), e && (s["X-User-Id"] = e), s;
  }
  attachUnloadHandlers() {
    typeof window > "u" || (this.unloadHandler = () => this.flushBeacon(), this.visibilityHandler = () => {
      typeof document < "u" && document.visibilityState === "hidden" && this.flushBeacon();
    }, window.addEventListener("pagehide", this.unloadHandler), typeof document < "u" && document.addEventListener("visibilitychange", this.visibilityHandler));
  }
  detachUnloadHandlers() {
    typeof window > "u" || (this.unloadHandler && window.removeEventListener("pagehide", this.unloadHandler), this.visibilityHandler && typeof document < "u" && document.removeEventListener("visibilitychange", this.visibilityHandler), this.unloadHandler = null, this.visibilityHandler = null);
  }
  destroy() {
    this.destroyed || (this.destroyed = true, this.flushTimer && (clearTimeout(this.flushTimer), this.flushTimer = null), this.flush(), this.detachUnloadHandlers());
  }
}
const X = 3600 * 1e3;
function P(i) {
  return `paywall-${i}-trial-time-first-open`;
}
function D(i) {
  return `paywall-${i}-skip-times`;
}
class nt {
  constructor(t, e, s) {
    this.storage = t, this.paywallId = e, this.config = s;
  }
  async check() {
    return this.config.mode === "time" ? this.checkTime() : this.checkOpens();
  }
  async recordBlock() {
    return this.config.mode === "time" ? this.recordTime() : this.recordOpens();
  }
  async reset() {
    await this.storage.removeItem(this.config.mode === "time" ? P(this.paywallId) : D(this.paywallId));
  }
  async checkTime() {
    const t = this.config.payload * X, e = await this.storage.getItem(P(this.paywallId)), s = e ? Number(e) : null;
    if (!s || !Number.isFinite(s))
      return {
        mode: "time",
        blocked: true,
        startedAt: null,
        expiresAt: null,
        remainingMs: t,
        totalMs: t
      };
    const a = s + t, r = Math.max(0, a - Date.now());
    return {
      mode: "time",
      blocked: r > 0,
      startedAt: s,
      expiresAt: a,
      remainingMs: r,
      totalMs: t
    };
  }
  async checkOpens() {
    const t = this.config.payload, e = await this.storage.getItem(D(this.paywallId)), s = e ? Number(e) : 0, a = Number.isFinite(s) ? s : 0, r = a < t, n = Math.max(0, t - a);
    return {
      mode: "opens",
      blocked: r,
      remainingActions: n,
      totalActions: t
    };
  }
  async recordTime() {
    const t = this.config.payload * X, e = P(this.paywallId), s = await this.storage.getItem(e);
    let a = s ? Number(s) : null;
    (!a || !Number.isFinite(a)) && (a = Date.now(), await this.storage.setItem(e, String(a)));
    const r = a + t, n = Math.max(0, r - Date.now());
    return {
      mode: "time",
      blocked: n > 0,
      startedAt: a,
      expiresAt: r,
      remainingMs: n,
      totalMs: t
    };
  }
  async recordOpens() {
    const t = this.config.payload, e = D(this.paywallId), s = await this.storage.getItem(e), a = s ? Number(s) : 0, r = Number.isFinite(a) ? a : 0, n = Math.min(t, r + 1);
    await this.storage.setItem(e, String(n));
    const c = Math.max(0, t - n);
    return {
      mode: "opens",
      blocked: n < t,
      remainingActions: c,
      totalActions: t
    };
  }
}
let z = false;
class Xt {
  constructor(t, e, s) {
    z || (z = true, console.warn(
      '[paywall] trial.storage="server" is not implemented yet — falling back to client storage. State lives in localStorage; users can reset trial by clearing site data.'
    )), this.fallback = new nt(t, e, s);
  }
  check() {
    return this.fallback.check();
  }
  recordBlock() {
    return this.fallback.recordBlock();
  }
  reset() {
    return this.fallback.reset();
  }
}
function te(i, t, e) {
  return e.storage === "server" ? new Xt(i, t, e) : new nt(i, t, e);
}
const Q = 32768;
function ee(i) {
  let t = "";
  for (let e = 0; e < i.length; e += Q) {
    const s = i.subarray(e, e + Q);
    t += String.fromCharCode.apply(null, s);
  }
  return btoa(t);
}
function se(i) {
  const t = atob(i), e = new Uint8Array(t.length);
  for (let s = 0; s < t.length; s++) e[s] = t.charCodeAt(s);
  return e;
}
const ie = 5, ae = 5 * 1024 * 1024, re = 1;
function ne(i) {
  return i instanceof o ? {
    name: "PaywallError",
    code: i.code,
    message: i.message,
    status: i.status,
    stack: i.stack
  } : i instanceof Error ? {
    name: i.name || "Error",
    code: "unknown",
    message: i.message,
    stack: i.stack
  } : {
    name: "Error",
    code: "unknown",
    message: typeof i == "string" ? i : "Unknown error"
  };
}
function oe(i) {
  if (i.name === "PaywallError") {
    const e = new o(i.code, i.message, { status: i.status });
    return i.stack && (e.stack = i.stack), e;
  }
  const t = new Error(i.message);
  return t.name = i.name, i.stack && (t.stack = i.stack), t;
}
function zt(i) {
  let t = false;
  const e = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Set(), a = (n) => {
    for (const c of e) c(n);
  }, r = () => {
    if (!t) {
      t = true;
      for (const n of s) n();
      i.onMessage.removeListener(a), i.onDisconnect.removeListener(r);
    }
  };
  return i.onMessage.addListener(a), i.onDisconnect.addListener(r), {
    send(n) {
      if (!t)
        try {
          i.postMessage(n);
        } catch (c) {
          throw r(), c;
        }
    },
    onMessage(n) {
      return e.add(n), () => e.delete(n);
    },
    onDisconnect(n) {
      return t ? (queueMicrotask(n), () => {
      }) : (s.add(n), () => s.delete(n));
    },
    close() {
      t || (i.disconnect(), r());
    }
  };
}
function ce(i) {
  const t = chrome.runtime.connect({ name: i });
  return zt(t);
}
export {
  Tt as T,
  Ut as U,
  Wt as W,
  Yt as Y,
  Zt as Z,
  ae as a,
  oe as b,
  ce as c,
  ee as e,
  f,
  ie as i,
  ne as n,
  o,
  re as r,
  se as s,
  te as t,
  zt as z
};
//# sourceMappingURL=chrome-port-D09nZ18W-BV_fSzAf.js.map
