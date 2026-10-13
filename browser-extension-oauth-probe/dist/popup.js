import { Y as Yt$3, Z as Zt$2, o as o$3, t as te, f as f$4, c as ce$2, i as ie, a as ae$1, e as ee$1, T as Tt$3, U as Ut$3, W as Wt$3, r as re, b as oe$2 } from "./chunks/chrome-port-D09nZ18W-BV_fSzAf.js";
import { e as e$2 } from "./chunks/port-name-ervLBWAQ-B1dz9CHi.js";
let o$2 = class o extends Error {
  constructor(t2, e2, s2 = {}) {
    super(e2), this.name = "PaywallError", this.code = t2, this.status = s2.status, this.cause = s2.cause, s2.originRetryable !== void 0 && (this.originRetryable = s2.originRetryable);
  }
};
class rt extends o$2 {
  constructor(t2) {
    super("not_enough_queries", t2.message ?? "Not enough queries", {
      status: 402
    }), this.name = "QuotaExceededError", this.balances = t2.balances, this.queryType = t2.queryType, this.currentBalance = t2.currentBalance;
  }
}
const at$1 = "3.4.0";
function nt$1() {
  return typeof chrome < "u" && !!chrome?.storage?.local && !!chrome?.runtime?.id;
}
const ot$1 = {
  getItem(i2) {
    return new Promise((t2) => {
      chrome.storage.local.get([i2], (e2) => {
        const s2 = e2[i2];
        t2(typeof s2 == "string" ? s2 : null);
      });
    });
  },
  setItem(i2, t2) {
    return new Promise((e2) => {
      chrome.storage.local.set({ [i2]: t2 }, () => e2());
    });
  },
  removeItem(i2) {
    return new Promise((t2) => {
      chrome.storage.local.remove([i2], () => t2());
    });
  },
  watch(i2, t2) {
    const e2 = chrome?.storage?.onChanged;
    if (!e2) return () => {
    };
    const s2 = (r2, a2) => {
      if (a2 !== "local") return;
      const n2 = r2[i2];
      n2 && t2(typeof n2.newValue == "string" ? n2.newValue : null);
    };
    return e2.addListener(s2), () => e2.removeListener(s2);
  }
}, ct$1 = {
  async getItem(i2) {
    try {
      return window.localStorage.getItem(i2);
    } catch {
      return null;
    }
  },
  async setItem(i2, t2) {
    try {
      window.localStorage.setItem(i2, t2);
    } catch {
    }
  },
  async removeItem(i2) {
    try {
      window.localStorage.removeItem(i2);
    } catch {
    }
  },
  watch(i2, t2) {
    if (typeof window > "u") return () => {
    };
    const e2 = (s2) => {
      s2.storageArea === window.localStorage && s2.key === i2 && t2(s2.newValue);
    };
    return window.addEventListener("storage", e2), () => window.removeEventListener("storage", e2);
  }
}, L$1 = /* @__PURE__ */ new Map(), ht$2 = {
  async getItem(i2) {
    return L$1.get(i2) ?? null;
  },
  async setItem(i2, t2) {
    L$1.set(i2, t2);
  },
  async removeItem(i2) {
    L$1.delete(i2);
  }
};
function j$2(i2) {
  return i2 || (nt$1() ? ot$1 : typeof window < "u" && "localStorage" in window ? ct$1 : ht$2);
}
const f$3 = {
  visitorId: "pw-visitor-id",
  lastLoginMethod: (i2) => `pw-${i2}-last-login-method`,
  lastLoginEmail: (i2) => `pw-${i2}-last-login-email`,
  // last-known PaywallUser. Used as an offline fallback on startup, until the
  // first getUser() returns. The key depends on paywallId+identity hash —
  // switching identity must not hand back another user.
  userState: (i2, t2) => `pw-${i2}-${t2}-user-v1`,
  // Persisted auth bundle (access_token, refresh_token, expires_at, user) for
  // a single paywall. The key is tied to paywallId — a multi-paywall app
  // doesn't cross sessions. Bump '-v1' on a breaking shape change.
  authSession: (i2) => `pw-${i2}-auth-v1`,
  // Refresh token of the last anonymous user. Stored separately from
  // authSession, because it must survive signOut: after signOut() the user can
  // sign in again as the same anonymous — without a captcha, via this token.
  // signIn by another method (email/oauth) doesn't touch it either. Cleared
  // only by an explicit signOut({forgetAnonymous: true}) or a 401 from the
  // refresh endpoint (meaning the token was revoked, so there's no point
  // keeping it).
  anonRefreshToken: (i2) => `pw-${i2}-anon-rt-v1`,
  // Persisted bootstrap (settings/prices/offers/layout/locales/version) for
  // stale-while-revalidate. Independent of identity — the layout is the same
  // for all users of one paywall; user-state lives separately under
  // `userState(...)`. Bump '-v1' on a breaking shape change.
  bootstrap: (i2) => `pw-${i2}-bootstrap-v1`,
  // One-shot "a checkout was started on this device" marker ({at: ts}).
  // Written by PaywallUI on checkout_started, consumed by
  // BillingClient.getSettledUser: a persisted has_active_subscription:false is
  // NOT trusted while the marker is fresh — the purchase may have completed in
  // the checkout tab while no SDK context was alive to record it (an extension
  // popup dies when the user leaves to pay), and the stale negative caused a
  // one-time paywall flash on the next open. Not identity-bound: the checkout
  // and the re-check happen on the same device within minutes.
  checkoutPending: (i2) => `pw-${i2}-checkout-pending-v1`,
  // Persisted balances (AI providers × tokenization_queries). Identity-bound,
  // since balance is counted per-Bearer-user; on re-login the key changes and
  // other users' balances aren't visible. They change after payment (backend)
  // and API calls (optimistically via `decrementBalanceLocal`).
  balances: (i2, t2) => `pw-${i2}-${t2}-balances-v1`,
  // Sticky mirror-origin failover state ({active: 'primary'|'edge',
  // switchedAt} — see core/edge.ts). Written only on primary↔edge
  // transitions, read once per client construction. Keyed by the PRIMARY
  // ORIGIN HOST, not paywallId: the in-memory shared state is origin-keyed,
  // and a paywallId key let two paywalls on one custom_domain hydrate/persist
  // past each other (review finding).
  edgeState: (i2) => `pw-edge-${i2}-v1`,
  // Sticky A/B experiment assignment for this device: {experimentId, variant,
  // at}. First-touch persisted so a later change of experiment weights doesn't
  // rebucket users who were already exposed. One key per paywall — the backend
  // runs at most one experiment per paywall at a time; a new experiment id
  // overwrites the record.
  experiment: (i2) => `pw-${i2}-exp-v1`
};
function G$3() {
  const i2 = typeof globalThis < "u" ? globalThis.crypto : void 0;
  if (i2 && typeof i2.randomUUID == "function") return i2.randomUUID();
  const t2 = new Uint8Array(16);
  if (i2 && typeof i2.getRandomValues == "function")
    i2.getRandomValues(t2);
  else
    for (let s2 = 0; s2 < 16; s2++) t2[s2] = Math.floor(Math.random() * 256);
  t2[6] = t2[6] & 15 | 64, t2[8] = t2[8] & 63 | 128;
  const e2 = Array.from(t2, (s2) => s2.toString(16).padStart(2, "0")).join(
    ""
  );
  return `${e2.slice(0, 8)}-${e2.slice(8, 12)}-${e2.slice(12, 16)}-${e2.slice(16, 20)}-${e2.slice(20)}`;
}
async function D$2(i2) {
  try {
    const e2 = await i2.getItem(f$3.visitorId);
    if (e2 && typeof e2 == "string" && e2.length >= 16)
      return e2;
  } catch {
  }
  const t2 = G$3();
  try {
    await i2.setItem(f$3.visitorId, t2);
  } catch {
  }
  return t2;
}
const P$1 = "edge.", R = 1800 * 1e3, lt$1 = 5e3, dt$2 = 3e4, ut$2 = 3e4;
function O$1(i2) {
  return i2 && typeof i2 == "object" && "name" in i2 ? String(i2.name) : void 0;
}
function z$2(i2, t2 = {}) {
  let e2 = null, s2, r2 = false, a2;
  const n2 = () => {
    if (e2) return e2;
    if (e2 = new AbortController(), i2)
      if (i2.aborted)
        e2.abort(i2.reason);
      else {
        const h2 = () => e2.abort(i2.reason);
        i2.addEventListener("abort", h2), a2 = () => i2.removeEventListener("abort", h2);
      }
    return e2;
  };
  t2.eager && n2();
  const c2 = () => {
    s2 !== void 0 && clearTimeout(s2), s2 = void 0;
  };
  return {
    get signal() {
      return e2 ? e2.signal : i2 ?? void 0;
    },
    timedOut: () => r2,
    arm(h2) {
      if (c2(), h2 == null) return;
      const l2 = n2();
      s2 = setTimeout(() => {
        r2 = true, l2.abort();
      }, h2);
    },
    disarm: c2,
    dispose() {
      c2(), a2?.();
    }
  };
}
function ft$2(i2) {
  let t2;
  try {
    t2 = new URL(i2);
  } catch {
    return null;
  }
  if (t2.protocol !== "https:") return null;
  const e2 = t2.hostname;
  return e2.startsWith(P$1) || !e2.includes(".") || e2.includes(":") || /^[\d.]+$/.test(e2) ? null : `https://${P$1}${e2}${t2.port ? `:${t2.port}` : ""}`;
}
const T$2 = /* @__PURE__ */ new Map();
let X$2 = class X {
  constructor(t2) {
    this.primary = t2.apiOrigin, this.storage = t2.storage;
    let e2;
    try {
      e2 = new URL(this.primary).host;
    } catch {
      e2 = this.primary;
    }
    this.storageKey = f$3.edgeState(e2);
    let s2;
    if (t2.edgeFallback === false)
      s2 = null;
    else if (typeof t2.edgeFallback == "string")
      try {
        s2 = new URL(t2.edgeFallback).origin;
      } catch {
        throw new o$2(
          "invalid_config",
          `edgeFallback is not a valid origin: "${t2.edgeFallback}"`
        );
      }
    else
      s2 = ft$2(this.primary);
    this.edge = s2 === this.primary ? null : s2, this.ready = this.hydrate();
  }
  async hydrate() {
    if (!(!this.storage || !this.edge || T$2.has(this.primary)))
      try {
        const t2 = await this.storage.getItem(this.storageKey);
        if (!t2) return;
        const e2 = JSON.parse(t2);
        (e2.active === "edge" || e2.active === "primary") && typeof e2.switchedAt == "number" && // Re-check after the await: a parallel client in this context may have
        // already discovered fresher truth than the persisted record.
        !T$2.has(this.primary) && T$2.set(this.primary, {
          active: e2.active,
          switchedAt: e2.switchedAt
        });
      } catch {
      }
  }
  /** Origins in the order they should be tried for this request. */
  candidates() {
    if (!this.edge) return [this.primary];
    const t2 = T$2.get(this.primary);
    return t2?.active === "edge" && Date.now() - t2.switchedAt < R ? [this.edge, this.primary] : [this.primary, this.edge];
  }
  /**
   * Record which origin actually served a response. Writes (memory + storage)
   * happen only on transitions — the happy path never touches storage.
   */
  noteSuccess(t2) {
    if (!this.edge) return;
    const e2 = T$2.get(this.primary);
    if (t2 === this.edge) {
      if (e2?.active === "edge" && Date.now() - e2.switchedAt < R) return;
      this.setState({ active: "edge", switchedAt: Date.now() });
    } else t2 === this.primary && e2?.active === "edge" && this.setState({ active: "primary", switchedAt: Date.now() });
  }
  setState(t2) {
    T$2.set(this.primary, t2), this.storage && this.storage.setItem(this.storageKey, JSON.stringify(t2)).then(void 0, () => {
    });
  }
};
async function Q$3(i2, t2, e2 = {}) {
  await i2.ready;
  const s2 = i2.candidates(), r2 = e2.firstOnly ? s2.slice(0, 1) : s2;
  for (let a2 = 0; a2 < r2.length; a2++) {
    const n2 = a2 === r2.length - 1;
    try {
      const c2 = await t2(r2[a2], n2, r2.length);
      return i2.noteSuccess(r2[a2]), c2;
    } catch (c2) {
      const h2 = c2 instanceof o$2 && c2.code === "network_error" && c2.originRetryable !== false;
      if (n2 || !h2) throw c2;
    }
  }
  throw new o$2("network_error", "Network request failed");
}
const E$1 = at$1;
class W {
  constructor(t2) {
    this.opts = t2, this.resolver = new X$2({
      apiOrigin: t2.apiOrigin,
      edgeFallback: t2.edgeFallback,
      storage: t2.storage
    });
  }
  /** Origin the client currently talks to: apiOrigin, or the edge mirror
   *  after a network-level failover. For building sibling URLs off the same
   *  reachable host (the analytics endpoint). */
  activeOrigin() {
    return this.resolver.candidates()[0];
  }
  async request(t2, e2 = {}) {
    return Q$3(
      this.resolver,
      (s2, r2, a2) => this.attempt(s2, t2, e2, r2, a2)
    );
  }
  async attempt(t2, e2, s2, r2, a2) {
    const n2 = new URL(e2, t2).toString(), c2 = this.opts.fetch ?? fetch, h2 = a2 > 1, l2 = (s2.method ?? "GET").toUpperCase(), v2 = typeof FormData < "u" && s2.body instanceof FormData, _2 = s2.replayable ?? (l2 === "GET" || l2 === "HEAD"), k2 = h2 && !v2 ? r2 ? dt$2 : lt$1 : null, y2 = h2 ? ut$2 : null, u2 = z$2(s2.signal, {
      eager: k2 != null || y2 != null
    });
    let g2 = false;
    const I2 = (m2) => u2.timedOut() ? w2("Request deadline exceeded", m2) : new o$2("aborted", "Request aborted", { cause: m2 }), w2 = (m2, B2) => new o$2("network_error", m2, {
      cause: B2,
      // Post-headers failure of a non-idempotent request must NOT move to
      // the mirror: the origin already executed it, a replay would run the
      // side effect twice (duplicate ticket / double token adjustment).
      originRetryable: g2 ? _2 : true
    });
    try {
      const m2 = async (d2) => {
        const p2 = new Headers(s2.headers);
        p2.set("Accept", "application/json"), p2.set("X-SDK-Version", E$1), p2.set("X-Paywall-Id", this.opts.paywallId), this.opts.capabilities?.length && p2.set("X-SDK-Capabilities", this.opts.capabilities.join(",")), d2 && p2.set("Authorization", `Bearer ${d2}`), s2.body && !p2.has("Content-Type") && !v2 && p2.set("Content-Type", "application/json"), u2.arm(k2);
        try {
          const S2 = await c2(n2, {
            ...s2,
            headers: p2,
            signal: u2.signal,
            credentials: "omit"
          });
          return g2 = true, S2;
        } catch (S2) {
          throw O$1(S2) === "AbortError" ? I2(S2) : w2("Network request failed", S2);
        } finally {
          u2.disarm();
        }
      }, B2 = await this.opts.getAuthToken?.() ?? null;
      let b = await m2(B2);
      if (b.status === 401 && B2 && this.opts.onUnauthorized) {
        const d2 = await this.opts.onUnauthorized().catch(() => null);
        d2 && d2 !== B2 && (g2 = false, b = await m2(d2));
      }
      u2.arm(y2);
      const et = (b.headers.get("content-type") ?? "").includes("application/json");
      let A2 = null;
      if (et)
        try {
          A2 = await b.json();
        } catch (d2) {
          if (!(d2 instanceof SyntaxError || O$1(d2) === "SyntaxError"))
            throw O$1(d2) === "AbortError" ? I2(d2) : w2("Response body read failed", d2);
        }
      if (!b.ok) {
        const d2 = A2 && typeof A2 == "object" ? A2 : null, p2 = d2 && typeof d2.error == "string" ? d2.error : null, S2 = !!p2 && /^[a-z0-9_.-]{1,64}$/i.test(p2), st2 = d2 && "code" in d2 && d2.code != null && String(d2.code) || (S2 ? p2 : null) || `http_${b.status}`, it = d2 && "message" in d2 && d2.message != null && String(d2.message) || (p2 && !S2 ? p2 : null) || b.statusText || "Request failed";
        throw new o$2(st2, it, {
          status: b.status,
          cause: A2
        });
      }
      return A2;
    } finally {
      u2.dispose();
    }
  }
}
let yt$2 = class yt {
  constructor(t2) {
    if (!t2.paywallId)
      throw new o$2("invalid_config", "paywallId is required");
    if (!t2.apiOrigin)
      throw new o$2(
        "invalid_config",
        "apiOrigin is required. Pass the paywall custom_domain configured in the platform."
      );
    this.paywallId = t2.paywallId, this.apiOrigin = t2.apiOrigin, this.auth = t2.auth, this.userId = t2.userId, this.capabilities = t2.capabilities, this.customFetch = t2.fetch, this.onChargeSuccess = t2.onChargeSuccess, this.onQuotaExceeded = t2.onQuotaExceeded, this.resolver = new X$2({
      apiOrigin: this.apiOrigin,
      edgeFallback: t2.edgeFallback
    }), t2.userId && !t2.auth && typeof window < "u" && typeof window.document < "u" && console.warn(
      "[paywall] WARNING: ApiGatewayClient.userId set without auth in browser. Client can spoof userId. Use AuthClient + Bearer for trusted user.id."
    );
  }
  async call(t2) {
    const e2 = t2.path ? t2.path.replace(/^\/+/, "") : "", s2 = (g2) => {
      const I2 = new URL(
        `/api/v1/api-gateway/${encodeURIComponent(t2.providerId)}${e2 ? `/${e2}` : ""}`,
        g2
      );
      return I2.searchParams.set("paywall_id", this.paywallId), I2.toString();
    }, r2 = new Headers(t2.headers);
    r2.set("X-SDK-Version", E$1), r2.set("X-Paywall-Id", this.paywallId), this.capabilities?.length && r2.set("X-SDK-Capabilities", this.capabilities.join(","));
    const a2 = await this.auth?.getAccessToken();
    a2 ? r2.set("Authorization", `Bearer ${a2}`) : this.userId && r2.set("X-User-ID", this.userId);
    const n2 = typeof FormData < "u" && t2.body instanceof FormData, c2 = typeof Blob < "u" && t2.body instanceof Blob, h2 = typeof ReadableStream < "u" && t2.body instanceof ReadableStream, l2 = typeof t2.body == "string";
    let v2;
    t2.body === void 0 || t2.body === null ? v2 = void 0 : n2 || c2 || h2 || l2 ? v2 = t2.body : (v2 = JSON.stringify(t2.body), r2.has("Content-Type") || r2.set("Content-Type", "application/json"));
    const _2 = this.customFetch ?? fetch, k2 = async (g2) => {
      const I2 = z$2(t2.signal);
      try {
        return await _2(g2, {
          method: t2.method ?? "POST",
          headers: r2,
          body: v2,
          signal: I2.signal,
          credentials: "omit"
        });
      } catch (w2) {
        if (O$1(w2) === "AbortError")
          throw new o$2("aborted", "Request aborted", { cause: w2 });
        const m2 = w2 instanceof Error ? w2.message : String(w2);
        throw new o$2(
          "network_error",
          `Network request failed: ${m2}`,
          { cause: w2 }
        );
      } finally {
        I2.dispose();
      }
    }, y2 = await Q$3(
      this.resolver,
      async (g2) => {
        const I2 = s2(g2);
        let w2 = await k2(I2);
        if (w2.status === 401 && a2 && this.auth && !h2) {
          const m2 = await this.auth.refresh().then((B2) => B2?.access_token ?? null).catch(() => null);
          m2 && m2 !== a2 && (r2.set("Authorization", `Bearer ${m2}`), w2 = await k2(I2));
        }
        return w2;
      },
      { firstOnly: h2 }
    );
    if (y2.status === 402) {
      const g2 = await pt$2(y2);
      throw this.onQuotaExceeded?.(g2), g2;
    }
    if (!y2.ok) {
      const g2 = await gt$2(y2.clone());
      throw new o$2(
        g2 ?? `http_${y2.status}`,
        y2.statusText || "Gateway request failed",
        { status: y2.status }
      );
    }
    const u2 = y2.headers.get("X-Query-Type") ?? void 0;
    return this.onChargeSuccess?.(u2), y2;
  }
};
async function pt$2(i2) {
  let t2 = {};
  try {
    t2 = await i2.json();
  } catch {
  }
  const e2 = t2.details?.balances;
  let s2 = [];
  if (Array.isArray(e2)) {
    const r2 = e2[0];
    Array.isArray(r2) ? s2 = r2 : r2 && Array.isArray(r2.balances) && (s2 = r2.balances);
  }
  return new rt({
    balances: s2,
    queryType: t2.details?.queryType ?? "",
    currentBalance: t2.details?.currentBalance ?? null
  });
}
async function gt$2(i2) {
  if (!(i2.headers.get("content-type") ?? "").includes("application/json")) return null;
  try {
    const e2 = await i2.json();
    return e2.code || e2.error || null;
  } catch {
    return null;
  }
}
function wt$2(i2) {
  let t2 = 2166136261;
  for (let e2 = 0; e2 < i2.length; e2++)
    t2 ^= i2.charCodeAt(e2), t2 = Math.imul(t2, 16777619);
  return t2 >>> 0;
}
function mt$2(i2, t2) {
  const e2 = i2.variants.filter((n2) => n2 && typeof n2.key == "string"), s2 = e2.reduce((n2, c2) => n2 + Math.max(0, c2.weight || 0), 0);
  if (s2 <= 0) return null;
  const r2 = wt$2(`${t2}:${i2.id}`) % s2;
  let a2 = 0;
  for (const n2 of e2)
    if (a2 += Math.max(0, n2.weight || 0), r2 < a2) return n2.key;
  return e2[e2.length - 1]?.key ?? null;
}
async function vt$2(i2, t2, e2, s2) {
  const r2 = f$3.experiment(t2);
  try {
    const h2 = await i2.getItem(r2);
    if (h2) {
      const l2 = JSON.parse(h2);
      if (l2 && l2.experimentId === e2.id && e2.variants.some((v2) => v2.key === l2.variant))
        return { experimentId: l2.experimentId, variant: l2.variant };
    }
  } catch {
  }
  const a2 = await s2(), n2 = mt$2(e2, a2);
  if (!n2) return null;
  const c2 = { experimentId: e2.id, variant: n2 };
  try {
    const h2 = { ...c2, at: Date.now() };
    await i2.setItem(r2, JSON.stringify(h2));
  } catch {
  }
  return c2;
}
function It$2(i2, t2) {
  const e2 = i2.experiment;
  if (!e2 || e2.id !== t2.experimentId || (e2.assigned_variant = t2.variant, e2.kind !== "prices")) return;
  const s2 = e2.variants.find((r2) => r2.key === t2.variant);
  s2 && bt$2(i2, s2);
}
function bt$2(i2, t2) {
  const e2 = /* @__PURE__ */ new Map();
  for (const a2 of t2.prices ?? [])
    a2.replaces != null && e2.set(String(a2.replaces), a2);
  if (e2.size === 0) return;
  i2.prices = i2.prices.map((a2) => e2.get(a2.id) ?? a2);
  const s2 = /* @__PURE__ */ new Map();
  e2.forEach((a2, n2) => s2.set(n2, a2.id));
  const r2 = (a2) => s2.get(a2) ?? a2;
  for (const a2 of i2.layout?.blocks ?? [])
    a2.type === "price_grid" ? (a2.priceIds && (a2.priceIds = a2.priceIds.map(r2)), a2.popular_price_id && (a2.popular_price_id = r2(a2.popular_price_id))) : a2.type === "cta_button" && a2.priceId && (a2.priceId = r2(a2.priceId));
  for (const a2 of i2.offers ?? [])
    a2.price_id != null && (a2.price_id = r2(a2.price_id));
}
const x$2 = 5e3, Y = 30 * 6e4, $$2 = 60 * 6e4, St$2 = 5 * 6e4, C$2 = {
  has_active_subscription: false,
  purchases: [],
  trial: null,
  had_previous_trial: false
};
function F$1(i2) {
  return i2 && (i2.email || i2.userId || i2.anonymousId) || "guest";
}
function _t$2(i2, t2) {
  return i2 === t2 ? true : !i2 || !t2 ? false : JSON.stringify(i2) === JSON.stringify(t2);
}
const kt$2 = 5e3, M$3 = 5 * 6e4, Bt$2 = Y, At$2 = 3e4;
function Tt$2(i2, t2) {
  if (i2 === t2) return true;
  if (!i2 || !t2 || i2.length !== t2.length) return false;
  for (let e2 = 0; e2 < i2.length; e2++)
    if (i2[e2].type !== t2[e2].type || i2[e2].count !== t2[e2].count) return false;
  return true;
}
let zt$2 = class zt {
  constructor(t2) {
    if (this.cachedBootstrap = null, this.cachedBootstrapAt = 0, this.inflightBootstrap = null, this.bootstrapListeners = /* @__PURE__ */ new Set(), this.bootstrapStorageUnwatch = null, this.authUnsubscribe = null, this.cachedUser = null, this.cachedUserAt = 0, this.inflightUser = null, this.userListeners = /* @__PURE__ */ new Set(), this.userHydration = Promise.resolve(), this.visitorIdPromise = null, this.visitorId = null, this.inflightCheckouts = /* @__PURE__ */ new Map(), this.cachedBalances = null, this.cachedBalancesAt = 0, this.balancesStorageUnwatch = null, this.inflightBalances = null, this.balanceListeners = /* @__PURE__ */ new Set(), this.previewVersionCounter = 0, !t2.paywallId)
      throw new o$2("invalid_config", "paywallId is required");
    if (!t2.apiOrigin)
      throw new o$2(
        "invalid_config",
        'apiOrigin is required. Pass the paywall custom_domain configured in the platform (e.g. "https://pay.your-domain.com"). The legacy "appbox.space" fallback is not used in SDK 3.0.'
      );
    this.paywallId = t2.paywallId, this.apiOrigin = t2.apiOrigin, this.capabilities = t2.capabilities, this.auth = t2.auth, this.previewMode = t2.preview === true;
    const e2 = t2.auth?.getCachedUser();
    if (this.identity = t2.identity ?? (e2 ? N$1(e2) : void 0), this.apiKey = t2.apiKey, this.fetchImpl = t2.fetch, t2.apiKey && typeof window < "u" && typeof window.document < "u") {
      if (!t2.allowInsecureBrowserUsage)
        throw new o$2(
          "apikey_in_browser",
          "BillingClient.apiKey detected in browser context. This is a server-SDK key and exposes your entire account. Move BillingClient to a trusted backend, or pass allowInsecureBrowserUsage:true if this is intentional (e2e tests)."
        );
      console.error(
        "[paywall] SECURITY: BillingClient.apiKey detected in browser context (allowInsecureBrowserUsage). This is a server-SDK key and exposes your account. Never ship this to production."
      );
    }
    this.storage = j$2(t2.storage), this.api = new W({
      apiOrigin: this.apiOrigin,
      paywallId: t2.paywallId,
      capabilities: t2.capabilities,
      fetch: t2.fetch,
      edgeFallback: t2.edgeFallback,
      // Sticky failover choice survives restarts — a returning blocked user
      // goes straight to the working origin.
      storage: this.storage,
      // Bearer is passed on every request. AuthClient.getAccessToken does a lazy
      // refresh, dedupes, and on 401 returns null — then the Authorization
      // header simply isn't set.
      getAuthToken: t2.auth ? () => t2.auth.getAccessToken() : void 0,
      // Data endpoint got a 401 with a Bearer the client considered fresh —
      // the session was revoked server-side (refresh-rotation race in another
      // context / GoTrue family revocation / clock skew). Force one rotation:
      // refresh() dedupes in-flight calls, on its own 401 clears the session
      // and returns null (→ no retry, the UI sees the 401 and can offer a
      // re-signin), on network/5xx throws — swallowed here, the retry wouldn't
      // get through anyway.
      onUnauthorized: t2.auth ? async () => {
        try {
          return (await t2.auth.refresh())?.access_token ?? null;
        } catch {
          return null;
        }
      } : void 0
    }), t2.auth && (this.authUnsubscribe = t2.auth.onAuthChange((s2, r2) => {
      const a2 = r2 ? N$1(r2.user) : void 0;
      q$1(this.identity, a2) || this.setIdentity(a2);
    })), this.auth && !this.identity || (this.userHydration = this.hydrateUserFromStorage()), this.hydrateBootstrapFromStorage(), this.subscribeBootstrapStorage(), this.hydrateBalancesFromStorage(), this.subscribeBalancesStorage(), this.visitorIdPromise = D$2(this.storage).then((s2) => (this.visitorId = s2, s2));
  }
  /**
   * Stable visitor_id (UUID v4). The first call awaits the initial resolve from
   * storage; subsequent ones — instantly from the in-memory cache. Used by
   * EventTracker for analytics attribution.
   */
  async getVisitorId() {
    return this.visitorId ? this.visitorId : (this.visitorIdPromise || (this.visitorIdPromise = D$2(this.storage).then((t2) => (this.visitorId = t2, t2))), this.visitorIdPromise);
  }
  /** Sync access to visitor_id. null if not resolved yet (the first ms of life). */
  getCachedVisitorId() {
    return this.visitorId;
  }
  setIdentity(t2) {
    this.identity = t2, this.cachedUser = null, this.cachedUserAt = 0, this.inflightUser = null, this.cachedBalances = null, this.cachedBalancesAt = 0, this.inflightBalances = null, this.balancesStorageUnwatch && (this.balancesStorageUnwatch(), this.balancesStorageUnwatch = null), this.hydrateBalancesFromStorage(), this.subscribeBalancesStorage(), this.userHydration = this.hydrateUserFromStorage(), t2 ? this.getUser({ force: true }).catch(() => {
    }) : (this.applyUser(C$2), this.applyBalances([]));
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
  async bootstrap(t2 = false) {
    const e2 = typeof t2 == "boolean" ? { force: t2 } : t2;
    if (this.previewMode) {
      if (this.cachedBootstrap) return this.cachedBootstrap;
      throw new o$2(
        "invalid_config",
        "BillingClient in preview mode but cachedBootstrap is not seeded. Call setBootstrap(bootstrap) before open()."
      );
    }
    const s2 = Date.now(), r2 = this.cachedBootstrap && this.cachedBootstrapAt > 0 && s2 - this.cachedBootstrapAt < $$2;
    return !e2.force && r2 ? (s2 - this.cachedBootstrapAt > St$2 && this.revalidateBootstrap(e2.signal).catch(() => {
    }), { ...this.cachedBootstrap, user: this.cachedUser ?? void 0 }) : this.inflightBootstrap ? this.inflightBootstrap : (this.inflightBootstrap = this.fetchBootstrap({
      ifVersion: e2.force ? void 0 : this.cachedBootstrap?.version,
      signal: e2.signal
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
  onBootstrapChange(t2) {
    return this.bootstrapListeners.add(t2), () => {
      this.bootstrapListeners.delete(t2);
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
  setBootstrap(t2) {
    const e2 = this.cachedBootstrap ?? {
      settings: { id: this.paywallId, name: "" },
      prices: [],
      offers: []
    }, s2 = {
      ...e2,
      ...t2,
      settings: t2.settings !== void 0 ? { ...e2.settings, ...t2.settings } : e2.settings,
      prices: t2.prices !== void 0 ? t2.prices : e2.prices,
      offers: t2.offers !== void 0 ? t2.offers : e2.offers,
      version: `preview:${++this.previewVersionCounter}`
    };
    s2.layout || (s2.layout = J$2(s2.settings, s2.prices)), U(s2), this.cachedBootstrap = s2, this.cachedBootstrapAt = Date.now();
    for (const r2 of this.bootstrapListeners)
      try {
        r2(s2);
      } catch (a2) {
        console.warn("[paywall] onBootstrapChange listener threw", a2);
      }
  }
  // Network primitive — a single point for the force request, the revalidate,
  // and the first cold bootstrap. `ifVersion` sends a server-side short-circuit:
  // if it matches — the backend answers `{unchanged: true, version, user}` and we
  // only update the cached user, leaving structure (layout/prices/offers/locales) untouched.
  async fetchBootstrap(t2) {
    const e2 = {};
    this.identity?.email && (e2["X-User-Email"] = this.identity.email);
    const s2 = t2.ifVersion ? `/api/v1/paywall/${this.paywallId}/bootstrap?if_version=${encodeURIComponent(t2.ifVersion)}` : `/api/v1/paywall/${this.paywallId}/bootstrap`, r2 = await this.api.request(s2, {
      ...Object.keys(e2).length ? { headers: e2 } : {},
      signal: t2.signal
    });
    if ("unchanged" in r2 && r2.unchanged)
      return this.cachedBootstrap ? (this.cachedBootstrapAt = Date.now(), r2.user && this.applyUser(r2.user), { ...this.cachedBootstrap, user: this.cachedUser ?? void 0 }) : this.fetchBootstrap({ signal: t2.signal });
    const a2 = r2;
    return Ut$2(a2.settings.custom_domain, this.apiOrigin), a2.layout || (a2.layout = J$2(a2.settings, a2.prices)), U(a2), await this.materializeExperiment(a2), this.applyBootstrap(a2, { persist: true }), a2.user && this.applyUser(a2.user), a2;
  }
  // Client-side A/B: resolve the sticky assignment and materialize the variant
  // into the bootstrap (price/layout/offer substitution, see core/experiment.ts).
  // Runs AFTER applyLocaleOverrides at every bootstrap ingress point (network,
  // storage hydrate, cross-context watch) — locale overrides may swap the layout
  // back to one referencing control price ids. Idempotent; any failure leaves
  // the control experience intact — experiments must never break the paywall.
  async materializeExperiment(t2) {
    const e2 = t2.experiment;
    if (!(!e2 || !Array.isArray(e2.variants) || e2.variants.length === 0))
      try {
        const s2 = await vt$2(
          this.storage,
          this.paywallId,
          e2,
          () => this.getVisitorId()
        );
        s2 && It$2(t2, s2);
      } catch {
      }
  }
  // Background revalidate from the stale-while-revalidate branch. Deduplicated
  // via `inflightBootstrap` so that parallel revalidates don't cross.
  revalidateBootstrap(t2) {
    return this.inflightBootstrap ? this.inflightBootstrap : (this.inflightBootstrap = this.fetchBootstrap({
      ifVersion: this.cachedBootstrap?.version,
      signal: t2
    }).finally(() => {
      this.inflightBootstrap = null;
    }), this.inflightBootstrap);
  }
  // Applies a fresh bootstrap to state: emit listeners ONLY on a version change
  // (i.e. the structure is really different). This is needed so a repeated
  // applyBootstrap from storage.watch doesn't redraw the UI for nothing if
  // another tab found the same version. persist=false for the "got it from
  // storage" path — there someone else already wrote it.
  applyBootstrap(t2, { persist: e2 }) {
    const s2 = !this.cachedBootstrap || this.cachedBootstrap.version !== t2.version;
    if (this.cachedBootstrap = t2, this.cachedBootstrapAt = Date.now(), e2 && this.persistBootstrap(t2), s2)
      for (const r2 of this.bootstrapListeners)
        try {
          r2(t2);
        } catch (a2) {
          console.warn("[paywall] onBootstrapChange listener threw", a2);
        }
  }
  async hydrateBootstrapFromStorage() {
    if (!this.cachedBootstrap)
      try {
        const t2 = await this.storage.getItem(f$3.bootstrap(this.paywallId));
        if (!t2) return;
        const e2 = JSON.parse(t2);
        if (!e2?.bootstrap || Date.now() - e2.at > $$2 || this.cachedBootstrap || (U(e2.bootstrap), await this.materializeExperiment(e2.bootstrap), this.cachedBootstrap)) return;
        this.cachedBootstrap = e2.bootstrap, this.cachedBootstrapAt = e2.at;
        for (const s2 of this.bootstrapListeners)
          try {
            s2(e2.bootstrap);
          } catch (r2) {
            console.warn("[paywall] onBootstrapChange listener threw", r2);
          }
      } catch {
      }
  }
  async persistBootstrap(t2) {
    if (t2.version)
      try {
        const { user: e2, ...s2 } = t2;
        await this.storage.setItem(
          f$3.bootstrap(this.paywallId),
          JSON.stringify({ at: Date.now(), bootstrap: s2 })
        );
      } catch {
      }
  }
  // Cross-context sync: another tab / popup / sw wrote a fresh bootstrap → we
  // pick it up without a network request. Adapters without watch (memory) — a
  // no-op, everything works as before via the network.
  subscribeBootstrapStorage() {
    typeof this.storage.watch == "function" && (this.bootstrapStorageUnwatch = this.storage.watch(
      f$3.bootstrap(this.paywallId),
      (t2) => {
        if (t2)
          try {
            const e2 = JSON.parse(t2);
            if (!e2?.bootstrap) return;
            if (this.cachedBootstrap?.version && this.cachedBootstrap.version === e2.bootstrap.version) {
              this.cachedBootstrapAt = e2.at;
              return;
            }
            U(e2.bootstrap), this.materializeExperiment(e2.bootstrap).then(() => {
              this.applyBootstrap(e2.bootstrap, { persist: false });
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
    const t2 = this.cachedBootstrap?.experiment;
    return t2?.assigned_variant ? { experimentId: t2.id, variant: t2.assigned_variant } : null;
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
  async getPrices(t2 = {}) {
    return (await this.bootstrap(t2)).prices;
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
    const t2 = typeof navigator < "u" && navigator.language ? navigator.language : null, e2 = this.cachedBootstrap?.settings.locale_default ?? null, s2 = this.cachedBootstrap ? Z$1(this.cachedBootstrap) : null;
    return { tag: s2 ?? t2 ?? e2, applied: s2, browserLanguage: t2, countryLanguage: e2 };
  }
  /**
   * Get the current subscription/purchases state.
   *
   * - In-memory cache TTL 5s — a naïve setInterval(1000) doesn't load the server.
   * - In-flight dedupe — parallel calls get a single promise.
   * - `force: true` bypasses the cache (for a post-checkout check).
   * - Without identity it returns empty-state (the server does the same).
   */
  async getUser({ force: t2 = false, signal: e2 } = {}) {
    if (!t2 && this.cachedUser && Date.now() - this.cachedUserAt < x$2)
      return this.cachedUser;
    if (this.inflightUser) return this.inflightUser;
    if (!this.identity?.email && this.auth) {
      if (await this.auth.ready().catch(() => {
      }), this.inflightUser) return this.inflightUser;
      if (!t2 && this.cachedUser && Date.now() - this.cachedUserAt < x$2)
        return this.cachedUser;
    }
    return this.inflightUser = (async () => {
      try {
        if (!this.identity?.email)
          return this.applyUser(C$2), C$2;
        const s2 = await this.api.request(
          `/api/v1/paywall/${this.paywallId}/user-state`,
          { headers: { "X-User-Email": this.identity.email }, signal: e2 }
        );
        return this.applyUser(s2), s2;
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
  onUserChange(t2, e2 = {}) {
    this.userListeners.add(t2);
    const s2 = e2.immediate ?? "microtask";
    if (this.cachedUser && s2 !== "none") {
      const r2 = this.cachedUser;
      if (s2 === "sync")
        try {
          t2(r2);
        } catch (a2) {
          console.warn("[paywall] onUserChange initial sync threw", a2);
        }
      else
        queueMicrotask(() => {
          this.userListeners.has(t2) && t2(r2);
        });
    }
    return () => {
      this.userListeners.delete(t2);
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
  async getSettledUser(t2 = {}) {
    if (this.auth && (await this.auth.ready().catch(() => {
    }), this.syncIdentityFromAuth()), await this.userHydration.catch(() => {
    }), this.cachedUser) {
      if (this.cachedUser.has_active_subscription) return this.cachedUser;
      if (!await this.consumeCheckoutPending()) return this.cachedUser;
      try {
        return await this.getUser({ force: true, signal: t2.signal });
      } catch {
        return this.cachedUser;
      }
    }
    try {
      return await this.getUser({ signal: t2.signal });
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
    const t2 = f$3.checkoutPending(this.paywallId);
    try {
      const e2 = await this.storage.getItem(t2);
      if (!e2) return false;
      Promise.resolve(this.storage.removeItem(t2)).catch(
        () => {
        }
      );
      const s2 = JSON.parse(e2);
      return typeof s2?.at != "number" ? false : Date.now() - s2.at <= Bt$2;
    } catch {
      return false;
    }
  }
  // Sync identity from the current auth session — the same thing the
  // constructor's onAuthChange listener does; the sameIdentity guard swallows
  // no-ops, so calling it out-of-band is safe.
  syncIdentityFromAuth() {
    if (!this.auth) return;
    const t2 = this.auth.getCachedSession(), e2 = t2 ? N$1(t2.user) : void 0;
    q$1(this.identity, e2) || this.setIdentity(e2);
  }
  applyUser(t2) {
    const e2 = !_t$2(this.cachedUser, t2);
    if (this.cachedUser = t2, this.cachedUserAt = Date.now(), e2) {
      this.persistUser(t2);
      for (const s2 of this.userListeners)
        try {
          s2(t2);
        } catch (r2) {
          console.warn("[paywall] onUserChange listener threw", r2);
        }
    }
  }
  storageKey() {
    return f$3.userState(this.paywallId, F$1(this.identity));
  }
  async hydrateUserFromStorage() {
    if (!this.cachedUser)
      try {
        const t2 = await this.storage.getItem(this.storageKey());
        if (!t2) return;
        const e2 = JSON.parse(t2);
        if (!e2?.user || Date.now() - e2.at > Y || this.cachedUser) return;
        this.applyUser(e2.user);
      } catch {
      }
  }
  async persistUser(t2) {
    try {
      await this.storage.setItem(
        this.storageKey(),
        JSON.stringify({ at: Date.now(), user: t2 })
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
  async getBalances({ force: t2 = false, signal: e2 } = {}) {
    const s2 = Date.now(), r2 = this.cachedBalances ? s2 - this.cachedBalancesAt : 1 / 0;
    return !t2 && this.cachedBalances && (r2 < kt$2 || r2 < At$2) ? this.cachedBalances : !t2 && this.cachedBalances && r2 < M$3 ? (this.fetchBalances({ signal: e2 }).catch(() => {
    }), this.cachedBalances) : this.inflightBalances ? this.inflightBalances : this.fetchBalances({ signal: e2 });
  }
  // Network primitive — a single point for force/stale-revalidate/cold-start.
  // Deduplicated via `inflightBalances`.
  fetchBalances({ signal: t2 } = {}) {
    return this.inflightBalances ? this.inflightBalances : (this.inflightBalances = (async () => {
      try {
        if (!this.auth)
          return this.applyBalances([]), [];
        const e2 = await this.api.request(`/api/v1/paywall/${this.paywallId}/balances`, { signal: t2 }), s2 = Array.isArray(e2.balances) ? e2.balances : [];
        return this.applyBalances(s2), s2;
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
  onBalanceChange(t2, e2 = {}) {
    this.balanceListeners.add(t2);
    const s2 = e2.immediate ?? "microtask";
    if (this.cachedBalances && s2 !== "none") {
      const r2 = this.cachedBalances;
      if (s2 === "sync")
        try {
          t2(r2);
        } catch (a2) {
          console.warn("[paywall] onBalanceChange initial sync threw", a2);
        }
      else
        queueMicrotask(() => {
          this.balanceListeners.has(t2) && t2(r2);
        });
    }
    return () => {
      this.balanceListeners.delete(t2);
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
  decrementBalanceLocal(t2) {
    if (!t2) {
      this.getBalances({ force: true });
      return;
    }
    if (!this.cachedBalances) return;
    const e2 = this.cachedBalances.findIndex((a2) => a2.type === t2);
    if (e2 < 0 || this.cachedBalances[e2].count <= 0) return;
    const r2 = this.cachedBalances.map(
      (a2, n2) => n2 === e2 ? { ...a2, count: a2.count - 1 } : a2
    );
    this.applyBalances(r2);
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
  createApiGatewayClient(t2 = {}) {
    const e2 = t2.onChargeSuccess, s2 = t2.onQuotaExceeded;
    return new yt$2({
      paywallId: this.paywallId,
      apiOrigin: this.apiOrigin,
      auth: this.auth,
      userId: this.auth ? void 0 : this.identity?.userId,
      capabilities: this.capabilities,
      fetch: this.fetchImpl,
      ...t2,
      onChargeSuccess: (r2) => {
        this.decrementBalanceLocal(r2), e2?.(r2);
      },
      onQuotaExceeded: (r2) => {
        this.refreshBalances(), s2?.(r2);
      }
    });
  }
  applyBalances(t2, { persist: e2 = true } = {}) {
    const s2 = !Tt$2(this.cachedBalances, t2);
    if (this.cachedBalances = t2, this.cachedBalancesAt = Date.now(), e2 && this.persistBalances(t2), s2)
      for (const r2 of this.balanceListeners)
        try {
          r2(t2);
        } catch (a2) {
          console.warn("[paywall] onBalanceChange listener threw", a2);
        }
  }
  balancesStorageKey() {
    return f$3.balances(this.paywallId, F$1(this.identity));
  }
  async hydrateBalancesFromStorage() {
    if (!this.cachedBalances)
      try {
        const t2 = await this.storage.getItem(this.balancesStorageKey());
        if (!t2) return;
        const e2 = JSON.parse(t2);
        if (!e2?.balances || !Array.isArray(e2.balances) || Date.now() - e2.at > M$3 || this.cachedBalances) return;
        this.cachedBalances = e2.balances, this.cachedBalancesAt = e2.at;
        for (const s2 of this.balanceListeners)
          try {
            s2(e2.balances);
          } catch (r2) {
            console.warn("[paywall] onBalanceChange listener threw", r2);
          }
      } catch {
      }
  }
  async persistBalances(t2) {
    try {
      await this.storage.setItem(
        this.balancesStorageKey(),
        JSON.stringify({ at: Date.now(), balances: t2 })
      );
    } catch {
    }
  }
  // Cross-context sync: another tab / popup / SW updated balances (a fresh
  // getBalances or an optimistic decrement) → we pick it up without a network request.
  subscribeBalancesStorage() {
    typeof this.storage.watch == "function" && (this.balancesStorageUnwatch = this.storage.watch(
      this.balancesStorageKey(),
      (t2) => {
        if (t2)
          try {
            const e2 = JSON.parse(t2);
            if (!e2?.balances || !Array.isArray(e2.balances) || e2.at <= this.cachedBalancesAt) return;
            this.applyBalances(e2.balances, { persist: false });
          } catch {
          }
      }
    ));
  }
  async createCheckout(t2) {
    if (!this.identity?.email)
      throw new o$2(
        "identity_required",
        "createCheckout requires identity with email"
      );
    const e2 = t2.idempotencyKey ?? `auto:${t2.priceId}`, s2 = this.inflightCheckouts.get(e2);
    if (s2) return s2;
    const a2 = {
      "Idempotency-Key": t2.idempotencyKey ?? G$3()
    };
    this.apiKey && (a2["X-Api-Key"] = this.apiKey);
    const n2 = this.cachedBootstrap?.settings, c2 = t2.successUrl ?? n2?.success_redirect_url ?? void 0, h2 = t2.shopUrl ?? n2?.checkout_shop_url ?? void 0, v2 = this.cachedBootstrap?.prices.find(
      (u2) => u2.id === t2.priceId
    )?.local?.currency ?? void 0, _2 = this.cachedBootstrap?.experiment, k2 = this.getCachedVisitorId() ?? void 0, y2 = this.api.request(`/api/v1/paywall/${this.paywallId}/start-checkout`, {
      method: "POST",
      headers: a2,
      signal: t2.signal,
      body: JSON.stringify({
        email: this.identity.email,
        priceId: Number(t2.priceId),
        offerId: t2.offerId,
        successUrl: c2,
        errorUrl: t2.errorUrl,
        shopUrl: h2,
        productName: n2?.checkout_product_name ?? void 0,
        trial_days: t2.trialDays,
        ignoreActivePurchase: t2.ignoreActivePurchase ? true : void 0,
        userMeta: this.identity.userId ? { userId: this.identity.userId } : void 0,
        localCurrency: v2,
        visitorId: k2,
        experimentId: _2?.assigned_variant ? _2.id : void 0,
        variantKey: _2?.assigned_variant ?? void 0
      })
    }).then((u2) => ({ url: u2.checkoutUrl, acquiring: u2.acquiring })).catch((u2) => {
      throw u2 instanceof o$2 && u2.status === 409 && u2.cause && typeof u2.cause == "object" && u2.cause.hasActivePurchase === true ? new o$2(
        "already_purchased",
        "You already have an active subscription",
        { status: 409, cause: u2.cause }
      ) : u2;
    });
    return this.inflightCheckouts.set(e2, y2), y2.finally(() => {
      this.inflightCheckouts.get(e2) === y2 && this.inflightCheckouts.delete(e2);
    }).catch(() => {
    }), y2;
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
  async getCustomerPortalUrl(t2 = {}) {
    if (!this.auth && !this.apiKey && !this.identity?.email)
      throw new o$2(
        "identity_required",
        "getCustomerPortalUrl requires auth, apiKey, or identity.email"
      );
    const e2 = {};
    this.apiKey && (e2["X-Api-Key"] = this.apiKey);
    const s2 = this.auth && this.auth.getCachedSession() ? { returnUrl: t2.returnUrl } : {
      email: this.identity?.email,
      userMeta: this.identity?.userId ? { userId: this.identity.userId } : void 0,
      returnUrl: t2.returnUrl
    };
    return { url: (await this.api.request(
      `/api/v1/paywall/${this.paywallId}/get-customer-portal`,
      {
        method: "POST",
        headers: Object.keys(e2).length ? e2 : void 0,
        body: JSON.stringify(s2),
        signal: t2.signal
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
  async listPurchases(t2 = {}) {
    const e2 = !!(this.identity?.email || this.identity?.userId);
    if (!this.auth && !(this.apiKey && e2))
      throw new o$2(
        "identity_required",
        "listPurchases requires AuthClient (Bearer) or apiKey + identity.email/userId"
      );
    const s2 = {};
    this.apiKey && (s2["X-Api-Key"] = this.apiKey);
    const r2 = new URLSearchParams();
    this.apiKey && this.identity?.email && r2.set("email", this.identity.email), this.apiKey && this.identity?.userId && r2.set("user_id", this.identity.userId);
    const a2 = r2.toString(), n2 = a2 ? `/api/v1/paywall/${this.paywallId}/user?${a2}` : `/api/v1/paywall/${this.paywallId}/user`;
    return (await this.api.request(n2, {
      method: "GET",
      headers: s2,
      signal: t2.signal
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
  async creditTokens(t2) {
    return this.adjustTokens("credit", t2);
  }
  /**
   * Debit tokens from a user's tokenized balance (server-SDK only). Subtracts
   * `amount` of `type` and returns the new count. Throws
   * `PaywallError('insufficient')` if the balance would drop below zero — no
   * partial debit. Same server-only constraints as {@link creditTokens}.
   */
  async debitTokens(t2) {
    return this.adjustTokens("debit", t2);
  }
  async adjustTokens(t2, e2) {
    if (!this.apiKey)
      throw new o$2(
        "apikey_required",
        "creditTokens/debitTokens are server-SDK only — set apiKey + identity. Token balance changes must not be callable from the browser."
      );
    if (!this.identity?.email && !this.identity?.userId)
      throw new o$2(
        "identity_required",
        "creditTokens/debitTokens require identity.email or identity.userId"
      );
    if (!e2.type || !Number.isInteger(e2.amount) || e2.amount <= 0)
      throw new o$2(
        "invalid_argument",
        "type is required and amount must be a positive integer"
      );
    const s2 = await this.api.request(`/api/v1/paywall/${this.paywallId}/balances`, {
      method: "POST",
      headers: { "X-Api-Key": this.apiKey },
      body: JSON.stringify({
        email: this.identity?.email,
        user_id: this.identity?.userId,
        type: e2.type,
        amount: e2.amount,
        op: t2
      }),
      signal: e2.signal
    });
    return { type: s2.type, count: s2.count };
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
  async cancelSubscription(t2) {
    const e2 = !!(this.identity?.email || this.identity?.userId);
    if (!this.auth && !(this.apiKey && e2))
      throw new o$2(
        "identity_required",
        "cancelSubscription requires AuthClient (Bearer) or apiKey + identity.email/userId"
      );
    const s2 = {};
    this.apiKey && (s2["X-Api-Key"] = this.apiKey);
    const r2 = {
      subscriptionId: t2.subscriptionId,
      paywallId: this.paywallId,
      cancellationReason: t2.reason
    };
    return this.apiKey && this.identity?.email && (r2.email = this.identity.email), this.apiKey && this.identity?.userId && (r2.userId = this.identity.userId), this.api.request("/api/paywall/cancel-subscription", {
      method: "POST",
      headers: s2,
      body: JSON.stringify(r2),
      signal: t2.signal
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
  async createSupportTicket(t2) {
    const e2 = t2.email ?? this.identity?.email ?? null, s2 = `/api/v1/paywall/${this.paywallId}/support/ticket`;
    if (!!t2.files && t2.files.length > 0) {
      const a2 = new FormData();
      a2.set("subject", t2.subject), a2.set("content", t2.content), e2 && a2.set("customer_email", e2);
      for (const n2 of t2.files) a2.append("files", n2);
      return this.api.request(s2, {
        method: "POST",
        body: a2
      });
    }
    return this.api.request(s2, {
      method: "POST",
      body: JSON.stringify({
        subject: t2.subject,
        content: t2.content,
        customer_email: e2
      })
    });
  }
};
function N$1(i2) {
  return { email: i2.email, userId: i2.id };
}
function q$1(i2, t2) {
  return i2 === t2 ? true : !i2 || !t2 ? false : i2.email === t2.email && i2.userId === t2.userId && i2.anonymousId === t2.anonymousId;
}
function H$2(i2) {
  if (!i2) return null;
  const t2 = i2.trim();
  if (!t2) return null;
  try {
    return new URL(t2.includes("://") ? t2 : `https://${t2}`).origin;
  } catch {
    return null;
  }
}
function Ut$2(i2, t2) {
  const e2 = H$2(i2);
  if (!(!e2 || H$2(t2) === e2))
    throw new o$2(
      "invalid_config",
      `apiOrigin mismatch: SDK initialized with "${t2}" but paywall is configured with custom_domain "${i2}". Use the custom_domain from the platform paywall settings.`
    );
}
function J$2(i2, t2) {
  return {
    type: "modal",
    blocks: [
      // offer_banner is NOT in the default layout — PaywallRoot renders it as a
      // top-tab above the dialog (rounded-top, negative margin), outside the
      // scrollable area. The block stays in the registry for the opt-in inline variant.
      { type: "heading", text: i2.name || "Upgrade", level: 1 },
      { type: "price_grid", priceIds: t2.map((e2) => e2.id) },
      { type: "cta_button", action: "checkout" },
      { type: "guarantee_badge" },
      { type: "current_session" }
    ]
  };
}
function Z$1(i2) {
  const t2 = i2.locales;
  if (!t2) return null;
  const e2 = [];
  if (typeof navigator < "u") {
    navigator.language && e2.push(navigator.language);
    const r2 = navigator.language?.split("-")[0];
    r2 && r2 !== navigator.language && e2.push(r2);
  }
  const s2 = i2.settings.locale_default;
  s2 && e2.push(s2);
  for (const r2 of e2)
    if (r2 && Object.prototype.hasOwnProperty.call(t2, r2)) return r2;
  return null;
}
function U(i2) {
  const t2 = Z$1(i2);
  if (!t2) return;
  const e2 = i2.locales?.[t2];
  e2 && (e2.layout && (i2.layout = e2.layout), e2.prices && (i2.prices = i2.prices.map((s2) => {
    const r2 = e2.prices?.[s2.id];
    if (!r2) return s2;
    const a2 = { ...s2 };
    return "label" in r2 && (a2.label = r2.label ?? null), "description" in r2 && (a2.description = r2.description ?? null), a2;
  })));
}
function tt(i2) {
  const t2 = new Uint8Array(i2), e2 = typeof globalThis < "u" ? globalThis.crypto : void 0;
  if (e2 && typeof e2.getRandomValues == "function")
    e2.getRandomValues(t2);
  else
    for (let s2 = 0; s2 < i2; s2++) t2[s2] = Math.floor(Math.random() * 256);
  return t2;
}
function K(i2) {
  let t2 = "";
  for (let e2 = 0; e2 < i2.length; e2++) t2 += String.fromCharCode(i2[e2]);
  return btoa(t2).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function Ot$2() {
  return K(tt(64));
}
async function Et$2(i2) {
  const t2 = new TextEncoder().encode(i2), e2 = globalThis.crypto;
  if (!e2?.subtle?.digest)
    throw new Error("crypto.subtle is required for PKCE");
  const s2 = await e2.subtle.digest("SHA-256", t2);
  return K(new Uint8Array(s2));
}
function Lt$2() {
  return K(tt(16));
}
const Ct$2 = 6e4, Nt$2 = 600 * 1e3;
let Xt$2 = class Xt {
  constructor(t2) {
    if (this.session = null, this.inflightRefresh = null, this.inflightAnonSignin = null, this.listeners = /* @__PURE__ */ new Set(), this.storageUnwatch = null, this.destroyed = false, this.oauthFlows = /* @__PURE__ */ new Map(), !t2.paywallId)
      throw new o$2("invalid_config", "paywallId is required");
    if (!t2.apiOrigin)
      throw new o$2(
        "invalid_config",
        "apiOrigin is required. Pass the paywall custom_domain configured in the platform."
      );
    this.paywallId = t2.paywallId, this.apiOrigin = t2.apiOrigin, this.storage = j$2(t2.storage), this.api = new W({
      apiOrigin: this.apiOrigin,
      paywallId: t2.paywallId,
      fetch: t2.fetch,
      edgeFallback: t2.edgeFallback,
      storage: this.storage
    }), this.openPopup = t2.openPopup ?? ((e2, s2) => typeof window > "u" ? null : window.open(e2, s2, "width=480,height=640,popup=yes")), this.hydrated = this.hydrate(), this.startStorageWatch();
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
    typeof this.storage.watch == "function" && (this.storageUnwatch = this.storage.watch(this.storageKey(), (t2) => {
      this.applyExternalSession(t2);
    }));
  }
  async applyExternalSession(t2) {
    if (!this.destroyed && (await this.hydrated, !this.destroyed)) {
      if (t2 == null) {
        this.session && this.setSession(null, { skipPersist: true, event: "SIGNED_OUT" });
        return;
      }
      try {
        const e2 = JSON.parse(t2);
        if (!e2 || typeof e2.access_token != "string" || typeof e2.refresh_token != "string" || typeof e2.expires_at != "number" || !e2.user)
          return;
        const s2 = !this.session || this.session.user.id !== e2.user.id ? "SIGNED_IN" : "TOKEN_REFRESHED";
        this.setSession(e2, { skipPersist: true, event: s2 });
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
  async signInWithEmail(t2) {
    await this.hydrated;
    const e2 = await this.readVisitorId(), s2 = {};
    t2.idempotencyKey && (s2["Idempotency-Key"] = t2.idempotencyKey);
    const r2 = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/email/signin`,
      {
        method: "POST",
        headers: Object.keys(s2).length ? s2 : void 0,
        body: JSON.stringify({
          email: t2.email,
          password: t2.password,
          visitor_id: e2,
          user_meta: t2.userMeta
        })
      }
    ), a2 = this.toSession(r2, r2.user);
    return this.setSession(a2, { event: "SIGNED_IN" }), this.recordLastLogin("email", t2.email), a2;
  }
  /**
   * Signup. If email confirm is enabled in Supabase — the server returns
   * `{status: 'confirmation_required', user}` and does NOT issue tokens. In that
   * case setSession isn't called, the user must go through OTP/magic-link (a
   * separate feature in the next PR).
   */
  async signUp(t2) {
    await this.hydrated;
    const e2 = await this.readVisitorId(), s2 = {};
    t2.idempotencyKey && (s2["Idempotency-Key"] = t2.idempotencyKey);
    const r2 = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/email/signup`,
      {
        method: "POST",
        headers: Object.keys(s2).length ? s2 : void 0,
        body: JSON.stringify({
          email: t2.email,
          password: t2.password,
          visitor_id: e2,
          user_meta: t2.userMeta
        })
      }
    );
    if (r2.status === "already_registered")
      return { kind: "already_registered", email: r2.email };
    if (r2.status === "confirmation_required")
      return this.recordLastLogin("email", t2.email), { kind: "confirmation_required", user: r2.user };
    const a2 = this.toSession(r2, r2.user);
    return this.setSession(a2, { event: "SIGNED_IN" }), this.recordLastLogin("email", t2.email), { kind: "signed_in", session: a2 };
  }
  /**
   * Resends the confirmation email after a signUp with email-confirm enabled.
   * Uses GoTrue `/resend` type='signup'. The backend always returns ok
   * (anti-enumeration), except 429 on rate-limit (~once/min per email on the
   * Supabase side). The host handles 429 by showing "wait a minute"; everything
   * else — as success.
   */
  async resendConfirmation(t2) {
    await this.hydrated;
    const e2 = {};
    t2.idempotencyKey && (e2["Idempotency-Key"] = t2.idempotencyKey), await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/email/resend`,
      {
        method: "POST",
        headers: Object.keys(e2).length ? e2 : void 0,
        body: JSON.stringify({ email: t2.email })
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
  async sendOtp(t2) {
    await this.hydrated, await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/otp/send`,
      {
        method: "POST",
        body: JSON.stringify({
          email: t2.email,
          create_user: t2.createUser ?? true,
          user_meta: t2.userMeta
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
  async verifyOtp(t2) {
    await this.hydrated;
    const e2 = await this.readVisitorId(), s2 = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/otp/verify`,
      {
        method: "POST",
        body: JSON.stringify({
          email: t2.email,
          token: t2.token,
          type: t2.type ?? "email",
          visitor_id: e2,
          user_meta: t2.userMeta
        })
      }
    ), r2 = this.toSession(s2, s2.user), a2 = t2.type === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN";
    return this.setSession(r2, { event: a2 }), r2;
  }
  /**
   * Requests a recovery email. The backend always returns ok so as not to give
   * away enumeration. The user enters the code from the email into the SDK ui →
   * verifyOtp({type:'recovery'}) → gets a session → updatePassword.
   */
  async requestPasswordReset(t2) {
    await this.hydrated, await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/password/request-reset`,
      {
        method: "POST",
        body: JSON.stringify({ email: t2.email })
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
  async updatePassword(t2) {
    await this.hydrated;
    const e2 = await this.getAccessToken();
    if (!e2)
      throw new o$2("not_authenticated", "no active session");
    await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/password/update`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${e2}` },
        body: JSON.stringify({ password: t2.password })
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
  async signInAnonymously(t2 = {}) {
    if (this.inflightAnonSignin) return this.inflightAnonSignin;
    this.inflightAnonSignin = (async () => {
      if (await this.hydrated, !t2.forceNewAnon && this.session?.user.is_anonymous === true)
        return this.session;
      if (!t2.forceNewAnon) {
        const n2 = await this.resumeAnonymous();
        if (n2) return n2;
      }
      const e2 = await this.readVisitorId(), s2 = await this.api.request(
        `/api/v1/paywall/${this.paywallId}/auth/anonymous/signin`,
        {
          method: "POST",
          body: JSON.stringify({
            ...t2.captchaToken ? { captcha_token: t2.captchaToken } : {},
            visitor_id: e2,
            user_meta: t2.userMeta
          })
        }
      ), r2 = {
        ...s2.user,
        email: s2.user.email ?? null,
        is_anonymous: true
      }, a2 = this.toSession(s2, r2);
      return this.setSession(a2, { event: "SIGNED_IN" }), await this.writeAnonRefreshToken(a2.refresh_token), a2;
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
    const t2 = await this.readAnonRefreshToken();
    if (!t2) return null;
    try {
      const e2 = await this.api.request(
        `/api/v1/paywall/${this.paywallId}/auth/refresh`,
        { method: "POST", body: JSON.stringify({ refresh_token: t2 }) }
      ), s2 = this.session?.user.is_anonymous === true ? this.session.user : { id: "", email: null, is_anonymous: true }, r2 = this.toSession(e2, s2);
      return this.setSession(r2, { event: "SIGNED_IN" }), await this.writeAnonRefreshToken(r2.refresh_token), r2;
    } catch (e2) {
      if (e2 instanceof o$2 && e2.status === 401)
        return await this.clearAnonRefreshToken(), null;
      throw e2;
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
  async upgradeAnonymousToEmail(t2) {
    await this.hydrated;
    const e2 = await this.getAccessToken();
    if (!e2)
      throw new o$2("not_authenticated", "no active session");
    const s2 = {
      Authorization: `Bearer ${e2}`
    };
    t2.idempotencyKey && (s2["Idempotency-Key"] = t2.idempotencyKey);
    const r2 = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/anonymous/upgrade`,
      {
        method: "POST",
        headers: s2,
        body: JSON.stringify({
          email: t2.email,
          password: t2.password,
          user_meta: t2.userMeta
        })
      }
    );
    if (r2.status === "confirmation_required")
      return { kind: "confirmation_required", email: r2.email };
    const a2 = this.session;
    if (!a2)
      throw new o$2(
        "not_authenticated",
        "session disappeared during upgrade"
      );
    const n2 = {
      ...a2.user,
      id: r2.user.id,
      email: r2.user.email,
      is_anonymous: r2.user.is_anonymous ?? false
    }, c2 = { ...a2, user: n2 };
    return this.setSession(c2, { event: "USER_UPDATED" }), await this.clearAnonRefreshToken(), { kind: "updated", session: c2 };
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
  async signInWithOAuth(t2) {
    if (typeof window > "u")
      throw new o$2("oauth_unavailable", "window is required for OAuth");
    const { authorize_url: e2, state: s2 } = await this.startOAuthFlow({
      provider: t2.provider,
      scopes: t2.scopes,
      userMeta: t2.userMeta,
      switchAccount: t2.switchAccount
    }), r2 = this.openPopup(e2, `pw-oauth-${s2}`);
    if (!r2)
      throw this.oauthFlows.delete(s2), new o$2(
        "popup_blocked",
        "browser blocked auth popup — call from a user gesture"
      );
    t2.onPopupOpened?.();
    const a2 = await Pt$2(r2, s2);
    try {
      r2.close();
    } catch {
    }
    if (this.destroyed)
      throw this.oauthFlows.delete(s2), new o$2("aborted", "AuthClient destroyed mid-flow");
    if (a2.kind === "cancelled")
      throw new o$2("oauth_cancelled", "auth popup was closed");
    if (a2.kind === "timeout")
      throw new o$2("oauth_timeout", "OAuth flow timed out");
    if (a2.kind === "error")
      throw this.oauthFlows.delete(s2), new o$2(
        Rt$2(a2) ? "oauth_identity_already_linked" : "oauth_failed",
        a2.description || a2.error || "OAuth provider returned error"
      );
    return this.completeOAuthFlow({ state: s2, code: a2.code });
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
  async startOAuthFlow(t2) {
    await this.hydrated, this.gcOAuthFlows();
    const e2 = Ot$2(), s2 = await Et$2(e2), r2 = Lt$2(), a2 = {};
    if (!t2.switchAccount) {
      const c2 = await this.getAccessToken().catch(() => null);
      c2 && (a2.Authorization = `Bearer ${c2}`);
    }
    const { authorize_url: n2 } = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/oauth/init`,
      {
        method: "POST",
        headers: Object.keys(a2).length ? a2 : void 0,
        body: JSON.stringify({
          provider: t2.provider,
          code_challenge: s2,
          code_challenge_method: "s256",
          scopes: t2.scopes
        })
      }
    );
    return this.oauthFlows.set(r2, {
      verifier: e2,
      userMeta: t2.userMeta,
      provider: t2.provider,
      startedAt: Date.now()
    }), this.recordLastLoginMethod(t2.provider), { authorize_url: n2, state: r2 };
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
  async completeOAuthFlow(t2) {
    await this.hydrated;
    const e2 = this.oauthFlows.get(t2.state);
    if (!e2)
      throw new o$2(
        "oauth_invalid_state",
        "OAuth flow not found — start with startOAuthFlow first or check TTL"
      );
    this.oauthFlows.delete(t2.state);
    const s2 = await this.readVisitorId(), r2 = await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/oauth/exchange`,
      {
        method: "POST",
        body: JSON.stringify({
          auth_code: t2.code,
          code_verifier: e2.verifier,
          visitor_id: s2,
          user_meta: e2.userMeta
        })
      }
    );
    if (this.destroyed)
      throw new o$2("aborted", "AuthClient destroyed mid-flow");
    const a2 = this.toSession(r2, r2.user);
    return this.setSession(a2, { event: "SIGNED_IN" }), a2.user.email && this.recordLastLoginEmail(a2.user.email), a2;
  }
  gcOAuthFlows() {
    const t2 = Date.now() - Nt$2;
    for (const [e2, s2] of this.oauthFlows)
      s2.startedAt < t2 && this.oauthFlows.delete(e2);
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
    const t2 = this.session.refresh_token, e2 = this.session.user;
    return this.inflightRefresh = (async () => {
      try {
        const s2 = await this.api.request(
          `/api/v1/paywall/${this.paywallId}/auth/refresh`,
          {
            method: "POST",
            body: JSON.stringify({ refresh_token: t2 })
          }
        ), r2 = this.toSession(s2, e2);
        return this.setSession(r2, { event: "TOKEN_REFRESHED" }), e2.is_anonymous === true && await this.writeAnonRefreshToken(r2.refresh_token), r2;
      } catch (s2) {
        if (s2 instanceof o$2 && s2.status === 401)
          return e2.is_anonymous === true && await this.clearAnonRefreshToken(), this.setSession(null, { event: "SIGNED_OUT" }), null;
        throw s2;
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
    const t2 = this.session?.access_token;
    if (!t2)
      throw new o$2("not_authenticated", "no active session");
    await this.api.request(
      `/api/v1/paywall/${this.paywallId}/auth/revoke-all`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${t2}` }
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
  async signOut(t2 = {}) {
    await this.hydrated;
    const e2 = this.session?.access_token, s2 = this.session?.user.is_anonymous === true;
    if (this.setSession(null, { event: "SIGNED_OUT" }), t2.forgetAnonymous && await this.clearAnonRefreshToken(), !!e2 && !(s2 && !t2.forgetAnonymous))
      try {
        await this.api.request(
          `/api/v1/paywall/${this.paywallId}/auth/signout`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${e2}` }
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
  onAuthChange(t2) {
    return this.listeners.add(t2), this.hydrated.then(() => {
      if (this.destroyed || !this.listeners.has(t2)) return;
      const e2 = this.session;
      try {
        t2("INITIAL_SESSION", e2);
      } catch (s2) {
        console.warn("[paywall] onAuthChange INITIAL_SESSION threw", s2);
      }
    }), () => {
      this.listeners.delete(t2);
    };
  }
  isFresh(t2) {
    return t2.expires_at - Date.now() > Ct$2;
  }
  toSession(t2, e2) {
    const s2 = t2.expires_at != null ? t2.expires_at * 1e3 : Date.now() + t2.expires_in * 1e3;
    return {
      access_token: t2.access_token,
      refresh_token: t2.refresh_token,
      expires_at: s2,
      user: e2
    };
  }
  setSession(t2, e2) {
    if (this.destroyed) return;
    const s2 = this.session;
    this.session = t2, e2.skipPersist || this.persist(), $t$2(s2, t2) || this.emit(e2.event);
  }
  emit(t2) {
    for (const e2 of this.listeners)
      try {
        e2(t2, this.session);
      } catch (s2) {
        console.warn("[paywall] onAuthChange listener threw", s2);
      }
  }
  storageKey() {
    return f$3.authSession(this.paywallId);
  }
  async hydrate() {
    try {
      const t2 = await this.storage.getItem(this.storageKey());
      if (!t2) return;
      const e2 = JSON.parse(t2);
      if (!e2 || typeof e2.access_token != "string" || typeof e2.refresh_token != "string" || typeof e2.expires_at != "number" || !e2.user)
        return;
      this.session = e2;
    } catch {
    }
  }
  // Used as a race-fallback in getAccessToken: between construction (when storage
  // was empty) and onChanged delivery, a signin could have happened in another
  // context. It doesn't duplicate watch — that one is about push, this one about pull.
  async rehydrateFromStorage() {
    try {
      const t2 = await this.storage.getItem(this.storageKey());
      if (!t2) return;
      const e2 = JSON.parse(t2);
      if (!e2 || typeof e2.access_token != "string" || typeof e2.refresh_token != "string" || typeof e2.expires_at != "number" || !e2.user)
        return;
      this.setSession(e2, { skipPersist: true, event: "SIGNED_IN" });
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
      const t2 = await this.storage.getItem(f$3.anonRefreshToken(this.paywallId));
      return typeof t2 == "string" && t2.length > 0 ? t2 : null;
    } catch {
      return null;
    }
  }
  async writeAnonRefreshToken(t2) {
    try {
      await this.storage.setItem(
        f$3.anonRefreshToken(this.paywallId),
        t2
      );
    } catch {
    }
  }
  async clearAnonRefreshToken() {
    try {
      await this.storage.removeItem(
        f$3.anonRefreshToken(this.paywallId)
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
      const [t2, e2] = await Promise.all([
        this.storage.getItem(f$3.lastLoginMethod(this.paywallId)),
        this.storage.getItem(f$3.lastLoginEmail(this.paywallId))
      ]);
      return !t2 || !xt$2(t2) ? null : { method: t2, email: typeof e2 == "string" && e2 ? e2 : null };
    } catch {
      return null;
    }
  }
  /** Records method and email atomically (for email/password flows — both are
   *  known at signin/signup time). OAuth flows use separate recordLastLoginMethod
   *  (before the popup) and recordLastLoginEmail (after the exchange). */
  recordLastLogin(t2, e2) {
    this.recordLastLoginMethod(t2), e2 && this.recordLastLoginEmail(e2);
  }
  recordLastLoginMethod(t2) {
    this.storage.setItem(f$3.lastLoginMethod(this.paywallId), t2).catch(() => {
    });
  }
  recordLastLoginEmail(t2) {
    this.storage.setItem(f$3.lastLoginEmail(this.paywallId), t2).catch(() => {
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
      const t2 = await this.storage.getItem(f$3.visitorId);
      return typeof t2 == "string" && t2.length >= 16 ? t2 : void 0;
    } catch {
      return;
    }
  }
};
const Kt$2 = 5 * 6e4, Dt$2 = 500;
function Pt$2(i2, t2) {
  return new Promise((e2) => {
    let s2 = false;
    const r2 = () => {
      s2 = true, window.removeEventListener("message", a2), clearInterval(n2), clearTimeout(c2);
    }, a2 = (h2) => {
      if (s2) return;
      const l2 = h2.data;
      !l2 || l2.type !== "pw-oauth" || l2.messageId === t2 && (l2.status === "success" && l2.code ? (r2(), e2({ kind: "code", code: l2.code })) : l2.status === "error" && (r2(), e2({
        kind: "error",
        error: l2.error || "oauth_error",
        errorCode: l2.errorCode,
        description: l2.description
      })));
    }, n2 = setInterval(() => {
      if (s2) return;
      let h2;
      try {
        h2 = i2.closed;
      } catch {
        return;
      }
      h2 && (r2(), e2({ kind: "cancelled" }));
    }, Dt$2), c2 = setTimeout(() => {
      s2 || (r2(), e2({ kind: "timeout" }));
    }, Kt$2);
    window.addEventListener("message", a2);
  });
}
function Rt$2(i2) {
  if (i2.kind !== "error") return false;
  if (i2.errorCode === "identity_already_exists") return true;
  const t2 = `${i2.error ?? ""} ${i2.description ?? ""}`.toLowerCase();
  return t2.includes("identity_already_exists") || t2.includes("already linked");
}
function xt$2(i2) {
  return i2 === "google" || i2 === "apple" || i2 === "github" || i2 === "facebook" || i2 === "email";
}
function $t$2(i2, t2) {
  return i2 === t2 ? true : !i2 || !t2 ? false : i2.access_token === t2.access_token && i2.refresh_token === t2.refresh_token && i2.expires_at === t2.expires_at && i2.user.id === t2.user.id && i2.user.email === t2.user.email;
}
const Ft$2 = 1500, Mt$2 = 20, V$1 = 200;
let Qt$2 = class Qt {
  constructor(t2) {
    this.buffer = [], this.flushTimer = null, this.destroyed = false, this.unloadHandler = null, this.visibilityHandler = null, this.opts = t2, this.isEnabled() && this.attachUnloadHandlers();
  }
  isEnabled() {
    return this.opts.enabled !== false;
  }
  endpoint() {
    return typeof this.opts.endpoint == "function" ? this.opts.endpoint() : this.opts.endpoint;
  }
  track(t2, e2) {
    if (this.destroyed || !this.isEnabled() || typeof t2 != "string" || t2.length === 0) return;
    let s2 = null;
    try {
      s2 = this.opts.getExperimentContext?.() ?? null;
    } catch {
    }
    const r2 = s2 ? { ...s2, ...e2 } : e2;
    this.buffer.push({ type: t2, ts: Date.now(), props: r2 });
    const a2 = this.opts.maxBufferSize ?? Mt$2;
    if (this.buffer.length >= a2) {
      this.flush();
      return;
    }
    this.buffer.length > V$1 && (this.buffer = this.buffer.slice(-V$1)), this.scheduleFlush();
  }
  scheduleFlush() {
    if (this.flushTimer || this.destroyed) return;
    const t2 = this.opts.flushIntervalMs ?? Ft$2;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null, this.flush();
    }, t2);
  }
  async flush() {
    if (this.buffer.length === 0) return;
    this.flushTimer && (clearTimeout(this.flushTimer), this.flushTimer = null);
    const t2 = this.buffer;
    this.buffer = [];
    try {
      const e2 = await this.opts.getVisitorId(), s2 = this.opts.getUserId?.() ?? null, r2 = JSON.stringify({ events: t2 }), a2 = this.opts.fetch ?? (typeof fetch < "u" ? fetch : void 0);
      if (!a2) return;
      await a2(this.endpoint(), {
        method: "POST",
        credentials: "omit",
        keepalive: true,
        // if the page closes at this moment — the browser still finishes it
        headers: this.buildHeaders(e2, s2),
        body: r2
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
    const t2 = this.buffer;
    this.buffer = [];
    const e2 = this.opts.getCachedVisitorId?.() ?? null, s2 = this.opts.getUserId?.() ?? null;
    if (!e2) {
      this.buffer.unshift(...t2), this.flush();
      return;
    }
    const r2 = JSON.stringify({
      events: t2,
      // body-level duplicates for the beacon flow, read by the server as a fallback.
      visitor_id: e2,
      user_id: s2,
      sdk_version: E$1,
      paywall_id: this.opts.paywallId,
      capabilities: this.opts.capabilities?.join(",") ?? ""
    }), a2 = this.opts.sendBeacon ?? (typeof navigator < "u" && typeof navigator.sendBeacon == "function" ? navigator.sendBeacon.bind(navigator) : null);
    if (!a2) {
      this.buffer.unshift(...t2), this.flush();
      return;
    }
    try {
      a2(this.endpoint(), r2) || (this.buffer.unshift(...t2), this.flush());
    } catch {
      this.buffer.unshift(...t2), this.flush();
    }
  }
  buildHeaders(t2, e2) {
    const s2 = {
      "Content-Type": "application/json",
      "X-SDK-Version": E$1,
      "X-Paywall-Id": this.opts.paywallId,
      "X-Visitor-Id": t2
    };
    return this.opts.capabilities?.length && (s2["X-SDK-Capabilities"] = this.opts.capabilities.join(",")), e2 && (s2["X-User-Id"] = e2), s2;
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
};
function qt$2(i2) {
  return `pw-offer-${i2}-start`;
}
function Ht$2(i2, t2) {
  if (!i2 || i2.length === 0) return null;
  const e2 = i2.find(
    (r2) => r2.price_id === t2 && (r2.discount_percent ?? 0) > 0
  );
  return e2 || (i2.find(
    (r2) => r2.price_id == null && (r2.discount_percent ?? 0) > 0
  ) ?? null);
}
function Wt$2(i2, t2, e2 = {}) {
  const s2 = Ht$2(i2, t2);
  return s2 && Jt$2(s2, e2) ? s2 : null;
}
function Jt$2(i2, t2 = {}) {
  const e2 = i2.discount_percent ?? 0;
  if (e2 <= 0) return null;
  const s2 = t2.now ?? Date.now(), r2 = Vt$2(i2, t2.readStart), a2 = jt$2(i2, r2), n2 = r2 !== null ? Math.max(0, r2 - s2) : null;
  return r2 !== null && r2 <= s2 ? null : { offer: i2, discountPercent: e2, remainingMs: n2, totalMs: a2, expiresAt: r2 };
}
function Vt$2(i2, t2) {
  if (i2.expires_at) {
    const e2 = Date.parse(i2.expires_at);
    return Number.isFinite(e2) ? e2 : null;
  }
  if (i2.duration_minutes && i2.duration_minutes > 0 && t2) {
    const e2 = t2(i2.id);
    if (!e2) return null;
    const s2 = Date.parse(e2);
    return Number.isFinite(s2) ? s2 + i2.duration_minutes * 6e4 : null;
  }
  return null;
}
function jt$2(i2, t2) {
  return i2.duration_minutes && i2.duration_minutes > 0 ? i2.duration_minutes * 6e4 : t2 !== null ? t2 - Date.now() : null;
}
function Yt$2(i2) {
  if (typeof window > "u") return null;
  try {
    return window.localStorage.getItem(qt$2(i2));
  } catch {
    return null;
  }
}
var n, l$1, u$2, i$1, r$1, o$1, e$1, f$2, c$1, s$1, a$1, h$1, p$1 = {}, v$1 = [], y$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, w$1 = Array.isArray;
function d$1(n2, l2) {
  for (var u2 in l2) n2[u2] = l2[u2];
  return n2;
}
function g(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function _$1(l2, u2, t2) {
  var i2, r2, o3, e2 = {};
  for (o3 in u2) "key" == o3 ? i2 = u2[o3] : "ref" == o3 ? r2 = u2[o3] : e2[o3] = u2[o3];
  if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), "function" == typeof l2 && null != l2.defaultProps) for (o3 in l2.defaultProps) void 0 === e2[o3] && (e2[o3] = l2.defaultProps[o3]);
  return m$1(l2, e2, i2, r2, null);
}
function m$1(n2, t2, i2, r2, o3) {
  var e2 = { type: n2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o3 ? ++u$2 : o3, __i: -1, __u: 0 };
  return null == o3 && null != l$1.vnode && l$1.vnode(e2), e2;
}
function k$1(n2) {
  return n2.children;
}
function x$1(n2, l2) {
  this.props = n2, this.context = l2;
}
function S(n2, l2) {
  if (null == l2) return n2.__ ? S(n2.__, n2.__i + 1) : null;
  for (var u2; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) return u2.__e;
  return "function" == typeof n2.type ? S(n2) : null;
}
function C$1(n2) {
  var l2, u2;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l2 = 0; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) {
      n2.__e = n2.__c.base = u2.__e;
      break;
    }
    return C$1(n2);
  }
}
function M$2(n2) {
  (!n2.__d && (n2.__d = true) && i$1.push(n2) && !$$1.__r++ || r$1 != l$1.debounceRendering) && ((r$1 = l$1.debounceRendering) || o$1)($$1);
}
function $$1() {
  for (var n2, u2, t2, r2, o3, f2, c2, s2 = 1; i$1.length; ) i$1.length > s2 && i$1.sort(e$1), n2 = i$1.shift(), s2 = i$1.length, n2.__d && (t2 = void 0, o3 = (r2 = (u2 = n2).__v).__e, f2 = [], c2 = [], u2.__P && ((t2 = d$1({}, r2)).__v = r2.__v + 1, l$1.vnode && l$1.vnode(t2), O(u2.__P, t2, r2, u2.__n, u2.__P.namespaceURI, 32 & r2.__u ? [o3] : null, f2, null == o3 ? S(r2) : o3, !!(32 & r2.__u), c2), t2.__v = r2.__v, t2.__.__k[t2.__i] = t2, N(f2, t2, c2), t2.__e != o3 && C$1(t2)));
  $$1.__r = 0;
}
function I(n2, l2, u2, t2, i2, r2, o3, e2, f2, c2, s2) {
  var a2, h2, y2, w2, d2, g2, _2 = t2 && t2.__k || v$1, m2 = l2.length;
  for (f2 = P(u2, l2, _2, f2, m2), a2 = 0; a2 < m2; a2++) null != (y2 = u2.__k[a2]) && (h2 = -1 == y2.__i ? p$1 : _2[y2.__i] || p$1, y2.__i = a2, g2 = O(n2, y2, h2, i2, r2, o3, e2, f2, c2, s2), w2 = y2.__e, y2.ref && h2.ref != y2.ref && (h2.ref && B$1(h2.ref, null, y2), s2.push(y2.ref, y2.__c || w2, y2)), null == d2 && null != w2 && (d2 = w2), 4 & y2.__u || h2.__k === y2.__k ? f2 = A$1(y2, f2, n2) : "function" == typeof y2.type && void 0 !== g2 ? f2 = g2 : w2 && (f2 = w2.nextSibling), y2.__u &= -7);
  return u2.__e = d2, f2;
}
function P(n2, l2, u2, t2, i2) {
  var r2, o3, e2, f2, c2, s2 = u2.length, a2 = s2, h2 = 0;
  for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o3 = l2[r2]) && "boolean" != typeof o3 && "function" != typeof o3 ? (f2 = r2 + h2, (o3 = n2.__k[r2] = "string" == typeof o3 || "number" == typeof o3 || "bigint" == typeof o3 || o3.constructor == String ? m$1(null, o3, null, null, null) : w$1(o3) ? m$1(k$1, { children: o3 }, null, null, null) : null == o3.constructor && o3.__b > 0 ? m$1(o3.type, o3.props, o3.key, o3.ref ? o3.ref : null, o3.__v) : o3).__ = n2, o3.__b = n2.__b + 1, e2 = null, -1 != (c2 = o3.__i = L(o3, u2, f2, a2)) && (a2--, (e2 = u2[c2]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c2 && (i2 > s2 ? h2-- : i2 < s2 && h2++), "function" != typeof o3.type && (o3.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o3.__u |= 4))) : n2.__k[r2] = null;
  if (a2) for (r2 = 0; r2 < s2; r2++) null != (e2 = u2[r2]) && 0 == (2 & e2.__u) && (e2.__e == t2 && (t2 = S(e2)), D$1(e2, e2));
  return t2;
}
function A$1(n2, l2, u2) {
  var t2, i2;
  if ("function" == typeof n2.type) {
    for (t2 = n2.__k, i2 = 0; t2 && i2 < t2.length; i2++) t2[i2] && (t2[i2].__ = n2, l2 = A$1(t2[i2], l2, u2));
    return l2;
  }
  n2.__e != l2 && (l2 && n2.type && !u2.contains(l2) && (l2 = S(n2)), u2.insertBefore(n2.__e, l2 || null), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (null != l2 && 8 == l2.nodeType);
  return l2;
}
function L(n2, l2, u2, t2) {
  var i2, r2, o3, e2 = n2.key, f2 = n2.type, c2 = l2[u2], s2 = null != c2 && 0 == (2 & c2.__u);
  if (null === c2 && null == n2.key || s2 && e2 == c2.key && f2 == c2.type) return u2;
  if (t2 > (s2 ? 1 : 0)) {
    for (i2 = u2 - 1, r2 = u2 + 1; i2 >= 0 || r2 < l2.length; ) if (null != (c2 = l2[o3 = i2 >= 0 ? i2-- : r2++]) && 0 == (2 & c2.__u) && e2 == c2.key && f2 == c2.type) return o3;
  }
  return -1;
}
function T$1(n2, l2, u2) {
  "-" == l2[0] ? n2.setProperty(l2, null == u2 ? "" : u2) : n2[l2] = null == u2 ? "" : "number" != typeof u2 || y$1.test(l2) ? u2 : u2 + "px";
}
function j$1(n2, l2, u2, t2, i2) {
  var r2, o3;
  n: if ("style" == l2) if ("string" == typeof u2) n2.style.cssText = u2;
  else {
    if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l2 in t2) u2 && l2 in u2 || T$1(n2.style, l2, "");
    if (u2) for (l2 in u2) t2 && u2[l2] == t2[l2] || T$1(n2.style, l2, u2[l2]);
  }
  else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f$2, "$1")), o3 = l2.toLowerCase(), l2 = o3 in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? o3.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t2 ? u2.u = t2.u : (u2.u = c$1, n2.addEventListener(l2, r2 ? a$1 : s$1, r2)) : n2.removeEventListener(l2, r2 ? a$1 : s$1, r2);
  else {
    if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2) try {
      n2[l2] = null == u2 ? "" : u2;
      break n;
    } catch (n3) {
    }
    "function" == typeof u2 || (null == u2 || false === u2 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == u2 ? "" : u2));
  }
}
function F(n2) {
  return function(u2) {
    if (this.l) {
      var t2 = this.l[u2.type + n2];
      if (null == u2.t) u2.t = c$1++;
      else if (u2.t < t2.u) return;
      return t2(l$1.event ? l$1.event(u2) : u2);
    }
  };
}
function O(n2, u2, t2, i2, r2, o3, e2, f2, c2, s2) {
  var a2, h2, p2, v2, y2, _2, m2, b, S2, C2, M2, $2, P2, A2, H2, L2, T2, j2 = u2.type;
  if (null != u2.constructor) return null;
  128 & t2.__u && (c2 = !!(32 & t2.__u), o3 = [f2 = u2.__e = t2.__e]), (a2 = l$1.__b) && a2(u2);
  n: if ("function" == typeof j2) try {
    if (b = u2.props, S2 = "prototype" in j2 && j2.prototype.render, C2 = (a2 = j2.contextType) && i2[a2.__c], M2 = a2 ? C2 ? C2.props.value : a2.__ : i2, t2.__c ? m2 = (h2 = u2.__c = t2.__c).__ = h2.__E : (S2 ? u2.__c = h2 = new j2(b, M2) : (u2.__c = h2 = new x$1(b, M2), h2.constructor = j2, h2.render = E), C2 && C2.sub(h2), h2.props = b, h2.state || (h2.state = {}), h2.context = M2, h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), S2 && null == h2.__s && (h2.__s = h2.state), S2 && null != j2.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = d$1({}, h2.__s)), d$1(h2.__s, j2.getDerivedStateFromProps(b, h2.__s))), v2 = h2.props, y2 = h2.state, h2.__v = u2, p2) S2 && null == j2.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), S2 && null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
    else {
      if (S2 && null == j2.getDerivedStateFromProps && b !== v2 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(b, M2), !h2.__e && null != h2.shouldComponentUpdate && false === h2.shouldComponentUpdate(b, h2.__s, M2) || u2.__v == t2.__v) {
        for (u2.__v != t2.__v && (h2.props = b, h2.state = h2.__s, h2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
          n3 && (n3.__ = u2);
        }), $2 = 0; $2 < h2._sb.length; $2++) h2.__h.push(h2._sb[$2]);
        h2._sb = [], h2.__h.length && e2.push(h2);
        break n;
      }
      null != h2.componentWillUpdate && h2.componentWillUpdate(b, h2.__s, M2), S2 && null != h2.componentDidUpdate && h2.__h.push(function() {
        h2.componentDidUpdate(v2, y2, _2);
      });
    }
    if (h2.context = M2, h2.props = b, h2.__P = n2, h2.__e = false, P2 = l$1.__r, A2 = 0, S2) {
      for (h2.state = h2.__s, h2.__d = false, P2 && P2(u2), a2 = h2.render(h2.props, h2.state, h2.context), H2 = 0; H2 < h2._sb.length; H2++) h2.__h.push(h2._sb[H2]);
      h2._sb = [];
    } else do {
      h2.__d = false, P2 && P2(u2), a2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
    } while (h2.__d && ++A2 < 25);
    h2.state = h2.__s, null != h2.getChildContext && (i2 = d$1(d$1({}, i2), h2.getChildContext())), S2 && !p2 && null != h2.getSnapshotBeforeUpdate && (_2 = h2.getSnapshotBeforeUpdate(v2, y2)), L2 = a2, null != a2 && a2.type === k$1 && null == a2.key && (L2 = V(a2.props.children)), f2 = I(n2, w$1(L2) ? L2 : [L2], u2, t2, i2, r2, o3, e2, f2, c2, s2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), m2 && (h2.__E = h2.__ = null);
  } catch (n3) {
    if (u2.__v = null, c2 || null != o3) if (n3.then) {
      for (u2.__u |= c2 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; ) f2 = f2.nextSibling;
      o3[o3.indexOf(f2)] = null, u2.__e = f2;
    } else {
      for (T2 = o3.length; T2--; ) g(o3[T2]);
      z$1(u2);
    }
    else u2.__e = t2.__e, u2.__k = t2.__k, n3.then || z$1(u2);
    l$1.__e(n3, u2, t2);
  }
  else null == o3 && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = q(t2.__e, u2, t2, i2, r2, o3, e2, c2, s2);
  return (a2 = l$1.diffed) && a2(u2), 128 & u2.__u ? void 0 : f2;
}
function z$1(n2) {
  n2 && n2.__c && (n2.__c.__e = true), n2 && n2.__k && n2.__k.forEach(z$1);
}
function N(n2, u2, t2) {
  for (var i2 = 0; i2 < t2.length; i2++) B$1(t2[i2], t2[++i2], t2[++i2]);
  l$1.__c && l$1.__c(u2, n2), n2.some(function(u3) {
    try {
      n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
        n3.call(u3);
      });
    } catch (n3) {
      l$1.__e(n3, u3.__v);
    }
  });
}
function V(n2) {
  return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : w$1(n2) ? n2.map(V) : d$1({}, n2);
}
function q(u2, t2, i2, r2, o3, e2, f2, c2, s2) {
  var a2, h2, v2, y2, d2, _2, m2, b = i2.props, k2 = t2.props, x2 = t2.type;
  if ("svg" == x2 ? o3 = "http://www.w3.org/2000/svg" : "math" == x2 ? o3 = "http://www.w3.org/1998/Math/MathML" : o3 || (o3 = "http://www.w3.org/1999/xhtml"), null != e2) {
    for (a2 = 0; a2 < e2.length; a2++) if ((d2 = e2[a2]) && "setAttribute" in d2 == !!x2 && (x2 ? d2.localName == x2 : 3 == d2.nodeType)) {
      u2 = d2, e2[a2] = null;
      break;
    }
  }
  if (null == u2) {
    if (null == x2) return document.createTextNode(k2);
    u2 = document.createElementNS(o3, x2, k2.is && k2), c2 && (l$1.__m && l$1.__m(t2, e2), c2 = false), e2 = null;
  }
  if (null == x2) b === k2 || c2 && u2.data == k2 || (u2.data = k2);
  else {
    if (e2 = e2 && n.call(u2.childNodes), b = i2.props || p$1, !c2 && null != e2) for (b = {}, a2 = 0; a2 < u2.attributes.length; a2++) b[(d2 = u2.attributes[a2]).name] = d2.value;
    for (a2 in b) if (d2 = b[a2], "children" == a2) ;
    else if ("dangerouslySetInnerHTML" == a2) v2 = d2;
    else if (!(a2 in k2)) {
      if ("value" == a2 && "defaultValue" in k2 || "checked" == a2 && "defaultChecked" in k2) continue;
      j$1(u2, a2, null, d2, o3);
    }
    for (a2 in k2) d2 = k2[a2], "children" == a2 ? y2 = d2 : "dangerouslySetInnerHTML" == a2 ? h2 = d2 : "value" == a2 ? _2 = d2 : "checked" == a2 ? m2 = d2 : c2 && "function" != typeof d2 || b[a2] === d2 || j$1(u2, a2, d2, b[a2], o3);
    if (h2) c2 || v2 && (h2.__html == v2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
    else if (v2 && (u2.innerHTML = ""), I("template" == t2.type ? u2.content : u2, w$1(y2) ? y2 : [y2], t2, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o3, e2, f2, e2 ? e2[0] : i2.__k && S(i2, 0), c2, s2), null != e2) for (a2 = e2.length; a2--; ) g(e2[a2]);
    c2 || (a2 = "value", "progress" == x2 && null == _2 ? u2.removeAttribute("value") : null != _2 && (_2 !== u2[a2] || "progress" == x2 && !_2 || "option" == x2 && _2 != b[a2]) && j$1(u2, a2, _2, b[a2], o3), a2 = "checked", null != m2 && m2 != u2[a2] && j$1(u2, a2, m2, b[a2], o3));
  }
  return u2;
}
function B$1(n2, u2, t2) {
  try {
    if ("function" == typeof n2) {
      var i2 = "function" == typeof n2.__u;
      i2 && n2.__u(), i2 && null == u2 || (n2.__u = n2(u2));
    } else n2.current = u2;
  } catch (n3) {
    l$1.__e(n3, t2);
  }
}
function D$1(n2, u2, t2) {
  var i2, r2;
  if (l$1.unmount && l$1.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || B$1(i2, null, u2)), null != (i2 = n2.__c)) {
    if (i2.componentWillUnmount) try {
      i2.componentWillUnmount();
    } catch (n3) {
      l$1.__e(n3, u2);
    }
    i2.base = i2.__P = null;
  }
  if (i2 = n2.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && D$1(i2[r2], u2, t2 || "function" != typeof n2.type);
  t2 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function E(n2, l2, u2) {
  return this.constructor(n2, u2);
}
function G$2(u2, t2, i2) {
  var r2, o3, e2, f2;
  t2 == document && (t2 = document.documentElement), l$1.__ && l$1.__(u2, t2), o3 = (r2 = false) ? null : t2.__k, e2 = [], f2 = [], O(t2, u2 = t2.__k = _$1(k$1, null, [u2]), o3 || p$1, p$1, t2.namespaceURI, o3 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, o3 ? o3.__e : t2.firstChild, r2, f2), N(e2, u2, f2);
}
function Q$2(n2) {
  function l2(n3) {
    var u2, t2;
    return this.getChildContext || (u2 = /* @__PURE__ */ new Set(), (t2 = {})[l2.__c] = this, this.getChildContext = function() {
      return t2;
    }, this.componentWillUnmount = function() {
      u2 = null;
    }, this.shouldComponentUpdate = function(n4) {
      this.props.value != n4.value && u2.forEach(function(n5) {
        n5.__e = true, M$2(n5);
      });
    }, this.sub = function(n4) {
      u2.add(n4);
      var l3 = n4.componentWillUnmount;
      n4.componentWillUnmount = function() {
        u2 && u2.delete(n4), l3 && l3.call(n4);
      };
    }), n3.children;
  }
  return l2.__c = "__cC" + h$1++, l2.__ = n2, l2.Provider = l2.__l = (l2.Consumer = function(n3, l3) {
    return n3.children(l3);
  }).contextType = l2, l2;
}
n = v$1.slice, l$1 = { __e: function(n2, l2, u2, t2) {
  for (var i2, r2, o3; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
    if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o3 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o3 = i2.__d), o3) return i2.__E = i2;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, u$2 = 0, x$1.prototype.setState = function(n2, l2) {
  var u2;
  u2 = null != this.__s && this.__s != this.state ? this.__s : this.__s = d$1({}, this.state), "function" == typeof n2 && (n2 = n2(d$1({}, u2), this.props)), n2 && d$1(u2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), M$2(this));
}, x$1.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), M$2(this));
}, x$1.prototype.render = k$1, i$1 = [], o$1 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e$1 = function(n2, l2) {
  return n2.__v.__b - l2.__v.__b;
}, $$1.__r = 0, f$2 = /(PointerCapture)$|Capture$/i, c$1 = 0, s$1 = F(false), a$1 = F(true), h$1 = 0;
var f$1 = 0;
function u$1(e2, t2, n2, o3, i2, u2) {
  t2 || (t2 = {});
  var a2, c2, p2 = t2;
  if ("ref" in p2) for (c2 in p2 = {}, t2) "ref" == c2 ? a2 = t2[c2] : p2[c2] = t2[c2];
  var l2 = { type: e2, props: p2, key: n2, ref: a2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f$1, __i: -1, __u: 0, __source: i2, __self: u2 };
  if ("function" == typeof e2 && (a2 = e2.defaultProps)) for (c2 in a2) void 0 === p2[c2] && (p2[c2] = a2[c2]);
  return l$1.vnode && l$1.vnode(l2), l2;
}
var t, r, u, i, o2 = 0, f = [], c = l$1, e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, s = c.__;
function p(n2, t2) {
  c.__h && c.__h(r, n2, o2 || t2), o2 = 0;
  var u2 = r.__H || (r.__H = { __: [], __h: [] });
  return n2 >= u2.__.length && u2.__.push({}), u2.__[n2];
}
function d(n2) {
  return o2 = 1, h(D, n2);
}
function h(n2, u2, i2) {
  var o3 = p(t++, 2);
  if (o3.t = n2, !o3.__c && (o3.__ = [D(void 0, u2), function(n3) {
    var t2 = o3.__N ? o3.__N[0] : o3.__[0], r2 = o3.t(t2, n3);
    t2 !== r2 && (o3.__N = [r2, o3.__[1]], o3.__c.setState({}));
  }], o3.__c = r, !r.__f)) {
    var f2 = function(n3, t2, r2) {
      if (!o3.__c.__H) return true;
      var u3 = o3.__c.__H.__.filter(function(n4) {
        return !!n4.__c;
      });
      if (u3.every(function(n4) {
        return !n4.__N;
      })) return !c2 || c2.call(this, n3, t2, r2);
      var i3 = o3.__c.props !== n3;
      return u3.forEach(function(n4) {
        if (n4.__N) {
          var t3 = n4.__[0];
          n4.__ = n4.__N, n4.__N = void 0, t3 !== n4.__[0] && (i3 = true);
        }
      }), c2 && c2.call(this, n3, t2, r2) || i3;
    };
    r.__f = true;
    var c2 = r.shouldComponentUpdate, e2 = r.componentWillUpdate;
    r.componentWillUpdate = function(n3, t2, r2) {
      if (this.__e) {
        var u3 = c2;
        c2 = void 0, f2(n3, t2, r2), c2 = u3;
      }
      e2 && e2.call(this, n3, t2, r2);
    }, r.shouldComponentUpdate = f2;
  }
  return o3.__N || o3.__;
}
function y(n2, u2) {
  var i2 = p(t++, 3);
  !c.__s && C(i2.__H, u2) && (i2.__ = n2, i2.u = u2, r.__H.__h.push(i2));
}
function _(n2, u2) {
  var i2 = p(t++, 4);
  !c.__s && C(i2.__H, u2) && (i2.__ = n2, i2.u = u2, r.__h.push(i2));
}
function A(n2) {
  return o2 = 5, T(function() {
    return { current: n2 };
  }, []);
}
function T(n2, r2) {
  var u2 = p(t++, 7);
  return C(u2.__H, r2) && (u2.__ = n2(), u2.__H = r2, u2.__h = n2), u2.__;
}
function x(n2) {
  var u2 = r.context[n2.__c], i2 = p(t++, 9);
  return i2.c = n2, u2 ? (null == i2.__ && (i2.__ = true, u2.sub(r)), u2.props.value) : n2.__;
}
function j() {
  for (var n2; n2 = f.shift(); ) if (n2.__P && n2.__H) try {
    n2.__H.__h.forEach(z), n2.__H.__h.forEach(B), n2.__H.__h = [];
  } catch (t2) {
    n2.__H.__h = [], c.__e(t2, n2.__v);
  }
}
c.__b = function(n2) {
  r = null, e && e(n2);
}, c.__ = function(n2, t2) {
  n2 && t2.__k && t2.__k.__m && (n2.__m = t2.__k.__m), s && s(n2, t2);
}, c.__r = function(n2) {
  a && a(n2), t = 0;
  var i2 = (r = n2.__c).__H;
  i2 && (u === r ? (i2.__h = [], r.__h = [], i2.__.forEach(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
  })) : (i2.__h.forEach(z), i2.__h.forEach(B), i2.__h = [], t = 0)), u = r;
}, c.diffed = function(n2) {
  v && v(n2);
  var t2 = n2.__c;
  t2 && t2.__H && (t2.__H.__h.length && (1 !== f.push(t2) && i === c.requestAnimationFrame || ((i = c.requestAnimationFrame) || w)(j)), t2.__H.__.forEach(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = void 0;
  })), u = r = null;
}, c.__c = function(n2, t2) {
  t2.some(function(n3) {
    try {
      n3.__h.forEach(z), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B(n4);
      });
    } catch (r2) {
      t2.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t2 = [], c.__e(r2, n3.__v);
    }
  }), l && l(n2, t2);
}, c.unmount = function(n2) {
  m && m(n2);
  var t2, r2 = n2.__c;
  r2 && r2.__H && (r2.__H.__.forEach(function(n3) {
    try {
      z(n3);
    } catch (n4) {
      t2 = n4;
    }
  }), r2.__H = void 0, t2 && c.__e(t2, r2.__v));
};
var k = "function" == typeof requestAnimationFrame;
function w(n2) {
  var t2, r2 = function() {
    clearTimeout(u2), k && cancelAnimationFrame(t2), setTimeout(n2);
  }, u2 = setTimeout(r2, 35);
  k && (t2 = requestAnimationFrame(r2));
}
function z(n2) {
  var t2 = r, u2 = n2.__c;
  "function" == typeof u2 && (n2.__c = void 0, u2()), r = t2;
}
function B(n2) {
  var t2 = r;
  n2.__c = n2.__(), r = t2;
}
function C(n2, t2) {
  return !n2 || n2.length !== t2.length || t2.some(function(t3, r2) {
    return t3 !== n2[r2];
  });
}
function D(n2, t2) {
  return "function" == typeof t2 ? t2(n2) : t2;
}
const ke = 3600 * 1e3;
function ne(t2) {
  return `paywall-${t2}-trial-time-first-open`;
}
function ae(t2) {
  return `paywall-${t2}-skip-times`;
}
let Re$1 = class Re {
  constructor(e2, r2, i2) {
    this.storage = e2, this.paywallId = r2, this.config = i2;
  }
  async check() {
    return this.config.mode === "time" ? this.checkTime() : this.checkOpens();
  }
  async recordBlock() {
    return this.config.mode === "time" ? this.recordTime() : this.recordOpens();
  }
  async reset() {
    await this.storage.removeItem(this.config.mode === "time" ? ne(this.paywallId) : ae(this.paywallId));
  }
  async checkTime() {
    const e2 = this.config.payload * ke, r2 = await this.storage.getItem(ne(this.paywallId)), i2 = r2 ? Number(r2) : null;
    if (!i2 || !Number.isFinite(i2))
      return {
        mode: "time",
        blocked: true,
        startedAt: null,
        expiresAt: null,
        remainingMs: e2,
        totalMs: e2
      };
    const n2 = i2 + e2, s2 = Math.max(0, n2 - Date.now());
    return {
      mode: "time",
      blocked: s2 > 0,
      startedAt: i2,
      expiresAt: n2,
      remainingMs: s2,
      totalMs: e2
    };
  }
  async checkOpens() {
    const e2 = this.config.payload, r2 = await this.storage.getItem(ae(this.paywallId)), i2 = r2 ? Number(r2) : 0, n2 = Number.isFinite(i2) ? i2 : 0, s2 = n2 < e2, o3 = Math.max(0, e2 - n2);
    return {
      mode: "opens",
      blocked: s2,
      remainingActions: o3,
      totalActions: e2
    };
  }
  async recordTime() {
    const e2 = this.config.payload * ke, r2 = ne(this.paywallId), i2 = await this.storage.getItem(r2);
    let n2 = i2 ? Number(i2) : null;
    (!n2 || !Number.isFinite(n2)) && (n2 = Date.now(), await this.storage.setItem(r2, String(n2)));
    const s2 = n2 + e2, o3 = Math.max(0, s2 - Date.now());
    return {
      mode: "time",
      blocked: o3 > 0,
      startedAt: n2,
      expiresAt: s2,
      remainingMs: o3,
      totalMs: e2
    };
  }
  async recordOpens() {
    const e2 = this.config.payload, r2 = ae(this.paywallId), i2 = await this.storage.getItem(r2), n2 = i2 ? Number(i2) : 0, s2 = Number.isFinite(n2) ? n2 : 0, o3 = Math.min(e2, s2 + 1);
    await this.storage.setItem(r2, String(o3));
    const c2 = Math.max(0, e2 - o3);
    return {
      mode: "opens",
      blocked: o3 < e2,
      remainingActions: c2,
      totalActions: e2
    };
  }
};
let _e = false;
class nt {
  constructor(e2, r2, i2) {
    _e || (_e = true, console.warn(
      '[paywall] trial.storage="server" is not implemented yet — falling back to client storage. State lives in localStorage; users can reset trial by clearing site data.'
    )), this.fallback = new Re$1(e2, r2, i2);
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
function at(t2, e2, r2) {
  return r2.storage === "server" ? new nt(t2, e2, r2) : new Re$1(t2, e2, r2);
}
const Ue$1 = '/*! tailwindcss v4.3.0 | MIT License | https://tailwindcss.com */@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-border-style:solid;--tw-leading:initial;--tw-font-weight:initial;--tw-tracking:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-outline-style:solid;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial}}}@layer theme{:root,:host{--font-sans:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";--font-mono:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;--color-red-50:oklch(97.1% .013 17.38);--color-red-600:oklch(57.7% .245 27.325);--color-emerald-100:oklch(95% .052 163.051);--color-emerald-500:oklch(69.6% .17 162.48);--color-emerald-700:oklch(50.8% .118 165.612);--color-slate-950:oklch(12.9% .042 264.695);--color-gray-50:oklch(98.5% .002 247.839);--color-gray-100:oklch(96.7% .003 264.542);--color-gray-200:oklch(92.8% .006 264.531);--color-gray-300:oklch(87.2% .01 258.338);--color-gray-400:oklch(70.7% .022 261.325);--color-gray-500:oklch(55.1% .027 264.364);--color-gray-600:oklch(44.6% .03 256.802);--color-gray-700:oklch(37.3% .034 259.733);--color-gray-800:oklch(27.8% .033 256.848);--color-gray-900:oklch(21% .034 264.665);--color-black:#000;--color-white:#fff;--spacing:.25rem;--text-xs:.75rem;--text-xs--line-height:calc(1 / .75);--text-sm:.875rem;--text-sm--line-height:calc(1.25 / .875);--text-base:1rem;--text-base--line-height: 1.5 ;--text-lg:1.125rem;--text-lg--line-height:calc(1.75 / 1.125);--text-xl:1.25rem;--text-xl--line-height:calc(1.75 / 1.25);--text-2xl:1.5rem;--text-2xl--line-height:calc(2 / 1.5);--text-3xl:1.875rem;--text-3xl--line-height: 1.2 ;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--tracking-tight:-.025em;--tracking-normal:0em;--tracking-wide:.025em;--tracking-wider:.05em;--leading-tight:1.25;--leading-snug:1.375;--leading-relaxed:1.625;--radius-md:.375rem;--radius-xl:.75rem;--radius-2xl:1rem;--radius-3xl:1.5rem;--animate-spin:spin 1s linear infinite;--animate-ping:ping 1s cubic-bezier(0, 0, .2, 1) infinite;--blur-sm:8px;--blur-md:12px;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4, 0, .2, 1);--default-font-family:var(--font-sans);--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab,red,red)){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}:host{all:initial;color-scheme:light;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizelegibility;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}*,:before,:after{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box}button{cursor:pointer;font-family:inherit}button:disabled{cursor:not-allowed}[role=button],[role=radio]{cursor:pointer}}@layer components;@layer utilities{.pointer-events-none{pointer-events:none}.collapse{visibility:collapse}.visible{visibility:visible}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.sticky{position:sticky}.inset-0{inset:calc(var(--spacing) * 0)}.-top-2{top:calc(var(--spacing) * -2)}.-top-\\[9px\\]{top:-9px}.-top-\\[10px\\]{top:-10px}.top-1\\/2{top:50%}.top-3{top:calc(var(--spacing) * 3)}.top-4{top:calc(var(--spacing) * 4)}.-right-\\[6px\\]{right:-6px}.right-3{right:calc(var(--spacing) * 3)}.right-4{right:calc(var(--spacing) * 4)}.left-1\\/2{left:50%}.z-10{z-index:10}.z-\\[1\\]{z-index:1}.z-\\[2147483647\\]{z-index:2147483647}.container{width:100%}@media(min-width:40rem){.container{max-width:40rem}}@media(min-width:48rem){.container{max-width:48rem}}@media(min-width:64rem){.container{max-width:64rem}}@media(min-width:80rem){.container{max-width:80rem}}@media(min-width:96rem){.container{max-width:96rem}}.mx-auto{margin-inline:auto}.-mt-3{margin-top:calc(var(--spacing) * -3)}.mt-0\\.5{margin-top:calc(var(--spacing) * .5)}.mt-1{margin-top:calc(var(--spacing) * 1)}.mt-1\\.5{margin-top:calc(var(--spacing) * 1.5)}.mt-2{margin-top:calc(var(--spacing) * 2)}.mt-2\\.5{margin-top:calc(var(--spacing) * 2.5)}.mt-3{margin-top:calc(var(--spacing) * 3)}.-mb-2{margin-bottom:calc(var(--spacing) * -2)}.mb-1{margin-bottom:calc(var(--spacing) * 1)}.mb-3{margin-bottom:calc(var(--spacing) * 3)}.-ml-1{margin-left:calc(var(--spacing) * -1)}.ml-2{margin-left:calc(var(--spacing) * 2)}.block{display:block}.flex{display:flex}.grid{display:grid}.hidden{display:none}.inline{display:inline}.inline-block{display:inline-block}.inline-flex{display:inline-flex}.table{display:table}.h-1{height:calc(var(--spacing) * 1)}.h-4{height:calc(var(--spacing) * 4)}.h-6{height:calc(var(--spacing) * 6)}.h-6\\.5{height:calc(var(--spacing) * 6.5)}.h-7{height:calc(var(--spacing) * 7)}.h-8{height:calc(var(--spacing) * 8)}.h-10{height:calc(var(--spacing) * 10)}.h-11{height:calc(var(--spacing) * 11)}.h-12{height:calc(var(--spacing) * 12)}.h-14{height:calc(var(--spacing) * 14)}.h-\\[22px\\]{height:22px}.h-full{height:100%}.h-px{height:1px}.max-h-\\[calc\\(100dvh-1rem\\)\\]{max-height:calc(100dvh - 1rem)}.min-h-0{min-height:calc(var(--spacing) * 0)}.min-h-12{min-height:calc(var(--spacing) * 12)}.min-h-\\[2\\.4em\\]{min-height:2.4em}.min-h-\\[120px\\]{min-height:120px}.w-1{width:calc(var(--spacing) * 1)}.w-4{width:calc(var(--spacing) * 4)}.w-6{width:calc(var(--spacing) * 6)}.w-6\\.5{width:calc(var(--spacing) * 6.5)}.w-7{width:calc(var(--spacing) * 7)}.w-8{width:calc(var(--spacing) * 8)}.w-11{width:calc(var(--spacing) * 11)}.w-14{width:calc(var(--spacing) * 14)}.w-full{width:100%}.max-w-\\[20rem\\]{max-width:20rem}.max-w-\\[22rem\\]{max-width:22rem}.max-w-\\[75\\%\\]{max-width:75%}.max-w-\\[320px\\]{max-width:320px}.max-w-\\[360px\\]{max-width:360px}.max-w-\\[400px\\]{max-width:400px}.flex-1{flex:1}.flex-shrink-0{flex-shrink:0}.shrink{flex-shrink:1}.grow{flex-grow:1}.-translate-x-1\\/2{--tw-translate-x: -50% ;translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1\\/2{--tw-translate-y: -50% ;translate:var(--tw-translate-x) var(--tw-translate-y)}.transform{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.animate-\\[pw-fade-in_180ms_ease-out\\]{animation:.18s ease-out pw-fade-in}.animate-\\[pw-scale-in_220ms_cubic-bezier\\(0\\.16\\,1\\,0\\.3\\,1\\)\\]{animation:.22s cubic-bezier(.16,1,.3,1) pw-scale-in}.animate-ping{animation:var(--animate-ping)}.animate-spin{animation:var(--animate-spin)}.cursor-not-allowed{cursor:not-allowed}.cursor-pointer{cursor:pointer}.flex-col{flex-direction:column}.flex-row-reverse{flex-direction:row-reverse}.flex-wrap{flex-wrap:wrap}.items-baseline{align-items:baseline}.items-center{align-items:center}.items-start{align-items:flex-start}.items-stretch{align-items:stretch}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.justify-start{justify-content:flex-start}.gap-0\\.5{gap:calc(var(--spacing) * .5)}.gap-1{gap:calc(var(--spacing) * 1)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-2\\.5{gap:calc(var(--spacing) * 2.5)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-4{gap:calc(var(--spacing) * 4)}.gap-5{gap:calc(var(--spacing) * 5)}.gap-6{gap:calc(var(--spacing) * 6)}.gap-x-1\\.5{column-gap:calc(var(--spacing) * 1.5)}.gap-x-2{column-gap:calc(var(--spacing) * 2)}.gap-y-1{row-gap:calc(var(--spacing) * 1)}.self-center{align-self:center}.self-start{align-self:flex-start}.truncate{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.rounded{border-radius:.25rem}.rounded-2xl{border-radius:var(--radius-2xl)}.rounded-3xl{border-radius:var(--radius-3xl)}.rounded-\\[9px\\]{border-radius:9px}.rounded-\\[11px\\]{border-radius:11px}.rounded-full{border-radius:3.40282e38px}.rounded-md{border-radius:var(--radius-md)}.rounded-xl{border-radius:var(--radius-xl)}.rounded-t-xl{border-top-left-radius:var(--radius-xl);border-top-right-radius:var(--radius-xl)}.rounded-tl-xl{border-top-left-radius:var(--radius-xl)}.rounded-tr-xl{border-top-right-radius:var(--radius-xl)}.rounded-b-none{border-bottom-right-radius:0;border-bottom-left-radius:0}.border,.border-1{border-style:var(--tw-border-style);border-width:1px}.border-2{border-style:var(--tw-border-style);border-width:2px}.border-\\[2\\.5px\\]{border-style:var(--tw-border-style);border-width:2.5px}.border-\\[3px\\]{border-style:var(--tw-border-style);border-width:3px}.border-\\[5px\\]{border-style:var(--tw-border-style);border-width:5px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-b,.border-b-1{border-bottom-style:var(--tw-border-style);border-bottom-width:1px}.border-dashed{--tw-border-style:dashed;border-style:dashed}.border-\\[var\\(--pw-accent\\)\\]{border-color:var(--pw-accent)}.border-gray-100{border-color:var(--color-gray-100)}.border-gray-200{border-color:var(--color-gray-200)}.border-gray-300{border-color:var(--color-gray-300)}.border-white{border-color:var(--color-white)}.border-white\\/40{border-color:#fff6}@supports (color:color-mix(in lab,red,red)){.border-white\\/40{border-color:color-mix(in oklab,var(--color-white) 40%,transparent)}}.border-t-\\[var\\(--pw-accent\\)\\]{border-top-color:var(--pw-accent)}.border-t-gray-700{border-top-color:var(--color-gray-700)}.border-t-white{border-top-color:var(--color-white)}.bg-\\[color-mix\\(in_srgb\\,var\\(--pw-accent\\)_6\\%\\,white\\)\\]{background-color:var(--pw-accent)}@supports (color:color-mix(in lab,red,red)){.bg-\\[color-mix\\(in_srgb\\,var\\(--pw-accent\\)_6\\%\\,white\\)\\]{background-color:color-mix(in srgb,var(--pw-accent) 6%,white)}}.bg-black\\/20{background-color:#0003}@supports (color:color-mix(in lab,red,red)){.bg-black\\/20{background-color:color-mix(in oklab,var(--color-black) 20%,transparent)}}.bg-emerald-100{background-color:var(--color-emerald-100)}.bg-gray-50{background-color:var(--color-gray-50)}.bg-gray-50\\/60{background-color:#f9fafb99}@supports (color:color-mix(in lab,red,red)){.bg-gray-50\\/60{background-color:color-mix(in oklab,var(--color-gray-50) 60%,transparent)}}.bg-gray-100{background-color:var(--color-gray-100)}.bg-gray-200{background-color:var(--color-gray-200)}.bg-gray-300{background-color:var(--color-gray-300)}.bg-gray-900{background-color:var(--color-gray-900)}.bg-red-50{background-color:var(--color-red-50)}.bg-slate-950\\/50{background-color:#02061880}@supports (color:color-mix(in lab,red,red)){.bg-slate-950\\/50{background-color:color-mix(in oklab,var(--color-slate-950) 50%,transparent)}}.bg-transparent{background-color:#0000}.bg-white{background-color:var(--color-white)}.bg-white\\/80{background-color:#fffc}@supports (color:color-mix(in lab,red,red)){.bg-white\\/80{background-color:color-mix(in oklab,var(--color-white) 80%,transparent)}}.p-2{padding:calc(var(--spacing) * 2)}.p-3\\.5{padding:calc(var(--spacing) * 3.5)}.p-6{padding:calc(var(--spacing) * 6)}.p-8{padding:calc(var(--spacing) * 8)}.px-1\\.5{padding-inline:calc(var(--spacing) * 1.5)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-2\\.5{padding-inline:calc(var(--spacing) * 2.5)}.px-3{padding-inline:calc(var(--spacing) * 3)}.px-4{padding-inline:calc(var(--spacing) * 4)}.px-5{padding-inline:calc(var(--spacing) * 5)}.px-6{padding-inline:calc(var(--spacing) * 6)}.px-8{padding-inline:calc(var(--spacing) * 8)}.py-0\\.5{padding-block:calc(var(--spacing) * .5)}.py-1{padding-block:calc(var(--spacing) * 1)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-2\\.5{padding-block:calc(var(--spacing) * 2.5)}.py-3{padding-block:calc(var(--spacing) * 3)}.py-3\\.5{padding-block:calc(var(--spacing) * 3.5)}.py-6{padding-block:calc(var(--spacing) * 6)}.py-8{padding-block:calc(var(--spacing) * 8)}.py-12{padding-block:calc(var(--spacing) * 12)}.pt-1{padding-top:calc(var(--spacing) * 1)}.pt-3{padding-top:calc(var(--spacing) * 3)}.pt-3\\.5{padding-top:calc(var(--spacing) * 3.5)}.pt-4{padding-top:calc(var(--spacing) * 4)}.pt-6{padding-top:calc(var(--spacing) * 6)}.pr-10{padding-right:calc(var(--spacing) * 10)}.pr-12{padding-right:calc(var(--spacing) * 12)}.pb-3{padding-bottom:calc(var(--spacing) * 3)}.pb-3\\.5{padding-bottom:calc(var(--spacing) * 3.5)}.pb-4{padding-bottom:calc(var(--spacing) * 4)}.pb-5{padding-bottom:calc(var(--spacing) * 5)}.pb-6{padding-bottom:calc(var(--spacing) * 6)}.pl-5{padding-left:calc(var(--spacing) * 5)}.text-center{text-align:center}.text-left{text-align:left}.font-mono{font-family:var(--font-mono)}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-3xl{font-size:var(--text-3xl);line-height:var(--tw-leading,var(--text-3xl--line-height))}.text-base{font-size:var(--text-base);line-height:var(--tw-leading,var(--text-base--line-height))}.text-lg{font-size:var(--text-lg);line-height:var(--tw-leading,var(--text-lg--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xl{font-size:var(--text-xl);line-height:var(--tw-leading,var(--text-xl--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.text-\\[0\\.9375rem\\]{font-size:.9375rem}.text-\\[10px\\]{font-size:10px}.text-\\[11px\\]{font-size:11px}.text-\\[12px\\]{font-size:12px}.text-\\[13px\\]{font-size:13px}.text-\\[15px\\]{font-size:15px}.text-\\[22px\\]{font-size:22px}.text-\\[26px\\]{font-size:26px}.leading-none{--tw-leading:1;line-height:1}.leading-relaxed{--tw-leading:var(--leading-relaxed);line-height:var(--leading-relaxed)}.leading-snug{--tw-leading:var(--leading-snug);line-height:var(--leading-snug)}.leading-tight{--tw-leading:var(--leading-tight);line-height:var(--leading-tight)}.font-bold{--tw-font-weight:var(--font-weight-bold);font-weight:var(--font-weight-bold)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-normal{--tw-font-weight:var(--font-weight-normal);font-weight:var(--font-weight-normal)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.tracking-normal{--tw-tracking:var(--tracking-normal);letter-spacing:var(--tracking-normal)}.tracking-tight{--tw-tracking:var(--tracking-tight);letter-spacing:var(--tracking-tight)}.tracking-wide{--tw-tracking:var(--tracking-wide);letter-spacing:var(--tracking-wide)}.tracking-wider{--tw-tracking:var(--tracking-wider);letter-spacing:var(--tracking-wider)}.text-balance{text-wrap:balance}.break-all{word-break:break-all}.whitespace-nowrap{white-space:nowrap}.text-emerald-500{color:var(--color-emerald-500)}.text-emerald-700{color:var(--color-emerald-700)}.text-gray-400{color:var(--color-gray-400)}.text-gray-500{color:var(--color-gray-500)}.text-gray-600{color:var(--color-gray-600)}.text-gray-700{color:var(--color-gray-700)}.text-gray-800{color:var(--color-gray-800)}.text-gray-800\\/70{color:#1e2939b3}@supports (color:color-mix(in lab,red,red)){.text-gray-800\\/70{color:color-mix(in oklab,var(--color-gray-800) 70%,transparent)}}.text-gray-900{color:var(--color-gray-900)}.text-red-600{color:var(--color-red-600)}.text-transparent{color:#0000}.text-white{color:var(--color-white)}.capitalize{text-transform:capitalize}.uppercase{text-transform:uppercase}.line-through{text-decoration-line:line-through}.underline{text-decoration-line:underline}.decoration-gray-400{-webkit-text-decoration-color:var(--color-gray-400);text-decoration-color:var(--color-gray-400)}.decoration-\\[1\\.5px\\]{text-decoration-thickness:1.5px}.underline-offset-2{text-underline-offset:2px}.opacity-0{opacity:0}.opacity-40{opacity:.4}.opacity-60{opacity:.6}.opacity-90{opacity:.9}.opacity-100{opacity:1}.shadow{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_0_0_2px_rgba\\(239\\,68\\,68\\,0\\.5\\)\\]{--tw-shadow:0 0 0 2px var(--tw-shadow-color,#ef444480);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-sm{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.ring{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.outline{outline-style:var(--tw-outline-style);outline-width:1px}.invert{--tw-invert:invert(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.\\!filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)!important}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-blur-md{--tw-backdrop-blur:blur(var(--blur-md));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-blur-sm{--tw-backdrop-blur:blur(var(--blur-sm));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-filter{-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.duration-150{--tw-duration:.15s;transition-duration:.15s}.outline-none{--tw-outline-style:none;outline-style:none}.placeholder\\:text-gray-500::placeholder{color:var(--color-gray-500)}@media(hover:hover){.hover\\:-translate-y-px:hover{--tw-translate-y:-1px;translate:var(--tw-translate-x) var(--tw-translate-y)}.hover\\:border-gray-300:hover{border-color:var(--color-gray-300)}.hover\\:border-gray-400:hover{border-color:var(--color-gray-400)}.hover\\:bg-gray-50:hover{background-color:var(--color-gray-50)}.hover\\:bg-gray-50\\/60:hover{background-color:#f9fafb99}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-gray-50\\/60:hover{background-color:color-mix(in oklab,var(--color-gray-50) 60%,transparent)}}.hover\\:bg-gray-100:hover{background-color:var(--color-gray-100)}.hover\\:bg-gray-200\\/60:hover{background-color:#e5e7eb99}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-gray-200\\/60:hover{background-color:color-mix(in oklab,var(--color-gray-200) 60%,transparent)}}.hover\\:bg-white:hover{background-color:var(--color-white)}.hover\\:text-gray-700:hover{color:var(--color-gray-700)}.hover\\:text-gray-900:hover{color:var(--color-gray-900)}.hover\\:text-red-600:hover{color:var(--color-red-600)}.hover\\:underline:hover{text-decoration-line:underline}.hover\\:opacity-80:hover{opacity:.8}.hover\\:brightness-105:hover{--tw-brightness:brightness(105%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}}.focus\\:bg-gray-200\\/60:focus{background-color:#e5e7eb99}@supports (color:color-mix(in lab,red,red)){.focus\\:bg-gray-200\\/60:focus{background-color:color-mix(in oklab,var(--color-gray-200) 60%,transparent)}}.focus\\:shadow-\\[0_0_0_2px_color-mix\\(in_srgb\\,var\\(--pw-accent\\)_30\\%\\,transparent\\)\\]:focus{--tw-shadow:0 0 0 2px var(--tw-shadow-color,var(--pw-accent))}@supports (color:color-mix(in lab,red,red)){.focus\\:shadow-\\[0_0_0_2px_color-mix\\(in_srgb\\,var\\(--pw-accent\\)_30\\%\\,transparent\\)\\]:focus{--tw-shadow:0 0 0 2px var(--tw-shadow-color,color-mix(in srgb,var(--pw-accent) 30%,transparent))}}.focus\\:shadow-\\[0_0_0_2px_color-mix\\(in_srgb\\,var\\(--pw-accent\\)_30\\%\\,transparent\\)\\]:focus{box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.focus\\:outline-none:focus{--tw-outline-style:none;outline-style:none}.focus-visible\\:opacity-80:focus-visible{opacity:.8}.focus-visible\\:ring-2:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.focus-visible\\:ring-\\[var\\(--pw-accent\\)\\]:focus-visible{--tw-ring-color:var(--pw-accent)}.focus-visible\\:ring-offset-2:focus-visible{--tw-ring-offset-width:2px;--tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)}.focus-visible\\:ring-inset:focus-visible{--tw-ring-inset:inset}.active\\:scale-\\[0\\.98\\]:active{scale:.98}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:opacity-60:disabled{opacity:.6}@media(hover:hover){.disabled\\:hover\\:translate-y-0:disabled:hover{--tw-translate-y:calc(var(--spacing) * 0);translate:var(--tw-translate-x) var(--tw-translate-y)}.disabled\\:hover\\:brightness-100:disabled:hover{--tw-brightness:brightness(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}}@media(min-width:40rem){.sm\\:max-h-\\[calc\\(100dvh-2rem\\)\\]{max-height:calc(100dvh - 2rem)}.sm\\:p-4{padding:calc(var(--spacing) * 4)}.sm\\:p-8{padding:calc(var(--spacing) * 8)}.sm\\:px-8{padding-inline:calc(var(--spacing) * 8)}.sm\\:pt-5{padding-top:calc(var(--spacing) * 5)}.sm\\:pt-8{padding-top:calc(var(--spacing) * 8)}.sm\\:pb-4{padding-bottom:calc(var(--spacing) * 4)}.sm\\:pb-8{padding-bottom:calc(var(--spacing) * 8)}.sm\\:text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}}}.pw-cta-shimmer:before{content:"";z-index:1;background:linear-gradient(90deg,#0000,#ffffff59 50%,#0000);width:100%;height:100%;animation:3s infinite pw-cta-shimmer;position:absolute;top:0;left:-100%}@keyframes pw-cta-shimmer{0%{left:-100%}to{left:100%}}@property --tw-translate-x{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-y{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-z{syntax:"*";inherits:false;initial-value:0}@property --tw-rotate-x{syntax:"*";inherits:false}@property --tw-rotate-y{syntax:"*";inherits:false}@property --tw-rotate-z{syntax:"*";inherits:false}@property --tw-skew-x{syntax:"*";inherits:false}@property --tw-skew-y{syntax:"*";inherits:false}@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-leading{syntax:"*";inherits:false}@property --tw-font-weight{syntax:"*";inherits:false}@property --tw-tracking{syntax:"*";inherits:false}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:"*";inherits:false}@property --tw-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:"*";inherits:false}@property --tw-inset-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:"*";inherits:false}@property --tw-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:"*";inherits:false}@property --tw-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:"*";inherits:false}@property --tw-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:"*";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-outline-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-blur{syntax:"*";inherits:false}@property --tw-brightness{syntax:"*";inherits:false}@property --tw-contrast{syntax:"*";inherits:false}@property --tw-grayscale{syntax:"*";inherits:false}@property --tw-hue-rotate{syntax:"*";inherits:false}@property --tw-invert{syntax:"*";inherits:false}@property --tw-opacity{syntax:"*";inherits:false}@property --tw-saturate{syntax:"*";inherits:false}@property --tw-sepia{syntax:"*";inherits:false}@property --tw-drop-shadow{syntax:"*";inherits:false}@property --tw-drop-shadow-color{syntax:"*";inherits:false}@property --tw-drop-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:"*";inherits:false}@property --tw-backdrop-blur{syntax:"*";inherits:false}@property --tw-backdrop-brightness{syntax:"*";inherits:false}@property --tw-backdrop-contrast{syntax:"*";inherits:false}@property --tw-backdrop-grayscale{syntax:"*";inherits:false}@property --tw-backdrop-hue-rotate{syntax:"*";inherits:false}@property --tw-backdrop-invert{syntax:"*";inherits:false}@property --tw-backdrop-opacity{syntax:"*";inherits:false}@property --tw-backdrop-saturate{syntax:"*";inherits:false}@property --tw-backdrop-sepia{syntax:"*";inherits:false}@property --tw-duration{syntax:"*";inherits:false}@keyframes spin{to{transform:rotate(360deg)}}@keyframes ping{75%,to{opacity:0;transform:scale(2)}}';
let Se$1 = false;
function st() {
  if (Se$1 || (Se$1 = true, typeof CSS > "u" || typeof CSS.registerProperty != "function")) return;
  let t2;
  try {
    const e2 = new CSSStyleSheet();
    e2.replaceSync(Ue$1), t2 = e2.cssRules;
  } catch {
    return;
  }
  for (const e2 of t2) {
    if (e2.constructor.name !== "CSSPropertyRule") continue;
    const r2 = e2;
    try {
      CSS.registerProperty({
        name: r2.name,
        syntax: r2.syntax,
        inherits: r2.inherits,
        ...r2.initialValue != null ? { initialValue: r2.initialValue } : {}
      });
    } catch {
    }
  }
}
function ot(t2, e2, r2 = {}) {
  if (typeof document > "u")
    throw new Error("mountShadow called in non-DOM environment");
  st();
  const i2 = r2.host ?? document.createElement("div");
  if (i2.setAttribute("data-paywall-host", ""), i2.style.cssText = r2.inline ? "all: initial; position: absolute; inset: 0; z-index: 1; pointer-events: none;" : "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;", !i2.isConnected && !r2.inline && document.body.appendChild(i2), !r2.inline && i2.isConnected && typeof i2.showPopover == "function")
    try {
      i2.setAttribute("popover", "manual"), i2.showPopover();
    } catch {
      i2.removeAttribute("popover");
    }
  const n2 = i2.attachShadow({ mode: r2.shadowMode ?? "closed" }), o3 = `
:host {
  all: initial !important;
  display: block !important;
  ${r2.inline ? "position: absolute !important; inset: 0 !important; z-index: 1 !important; pointer-events: none !important;" : "position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important;"}
  color: #111827 !important;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  font-style: normal !important;
  line-height: 1.5 !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  text-decoration: none !important;
  text-align: left !important;
  direction: ltr !important;
  cursor: auto !important;
  visibility: visible !important;
}
`, c2 = document.createElement("style");
  c2.textContent = o3 + Ue$1 + (r2.injectCss ?? ""), n2.appendChild(c2);
  const l2 = document.createElement("div");
  l2.style.pointerEvents = "auto", n2.appendChild(l2);
  let p2 = e2;
  return G$2(_$1(t2, p2), l2), {
    shadowRoot: n2,
    update(u2) {
      p2 = { ...p2, ...u2 }, G$2(_$1(t2, p2), l2);
    },
    unmount() {
      G$2(null, l2), i2.remove();
    }
  };
}
const lt = (t2, e2, r2) => {
  const i2 = t2[e2];
  return i2 ? typeof i2 == "function" ? i2() : Promise.resolve(i2) : new Promise((n2, s2) => {
    (typeof queueMicrotask == "function" ? queueMicrotask : setTimeout)(
      s2.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + e2 + (e2.split("/").length !== r2 ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
}, ct = [
  "ru",
  "uk",
  "de",
  "es",
  "fr",
  "it",
  "pt",
  "pl",
  "cs",
  "hu",
  "ro",
  "nl",
  "sv",
  "da",
  "no",
  "fi",
  "el",
  "tr",
  "id",
  "ar",
  "ja",
  "ko",
  "zh",
  "hi",
  "th",
  "vi",
  "he"
], Fe$1 = (t2, e2, r2) => Ne$1(e2, r2), De$1 = Q$2({ t: Fe$1, locale: "en" });
function Ne$1(t2, e2) {
  if (!e2) return t2;
  let r2 = t2;
  for (const [i2, n2] of Object.entries(e2))
    r2 = r2.split(`{${i2}}`).join(String(n2));
  return r2;
}
const se$1 = /* @__PURE__ */ new Map(), oe$1 = /* @__PURE__ */ new Map();
function Ve$1(t2) {
  return ct.includes(t2);
}
function dt$1(t2) {
  const e2 = [];
  if (typeof navigator < "u" && navigator.language) {
    e2.push(navigator.language);
    const i2 = navigator.language.split("-")[0];
    i2 && i2 !== navigator.language && e2.push(i2);
  }
  const r2 = t2.settings.locale_default;
  if (r2) {
    e2.push(r2);
    const i2 = r2.split("-")[0];
    i2 && i2 !== r2 && e2.push(i2);
  }
  for (const i2 of e2)
    if (Ve$1(i2)) return i2;
  return null;
}
function ut$1(t2, e2) {
  return !!t2.locales && t2.locales[e2] !== void 0;
}
async function pt$1(t2) {
  const e2 = se$1.get(t2);
  if (e2) return e2;
  const r2 = oe$1.get(t2);
  if (r2) return r2;
  const i2 = lt(/* @__PURE__ */ Object.assign({ "./locales/ar.ts": () => import("./chunks/ar-DxNtHOP6-DxNtHOP6.js"), "./locales/cs.ts": () => import("./chunks/cs-BwKcj3Ld-BwKcj3Ld.js"), "./locales/da.ts": () => import("./chunks/da-D7cuuSi5-D7cuuSi5.js"), "./locales/de.ts": () => import("./chunks/de-CrbEADXS-CrbEADXS.js"), "./locales/el.ts": () => import("./chunks/el-ZfB4Iqul-ZfB4Iqul.js"), "./locales/es.ts": () => import("./chunks/es-D-8Hz1oi-D-8Hz1oi.js"), "./locales/fi.ts": () => import("./chunks/fi-DrZs_mlw-DrZs_mlw.js"), "./locales/fr.ts": () => import("./chunks/fr-B-hKZ2Qj-B-hKZ2Qj.js"), "./locales/he.ts": () => import("./chunks/he-DYG3GZH9-DYG3GZH9.js"), "./locales/hi.ts": () => import("./chunks/hi-B4x8UToQ-B4x8UToQ.js"), "./locales/hu.ts": () => import("./chunks/hu-DsQ7uYWm-DsQ7uYWm.js"), "./locales/id.ts": () => import("./chunks/id-B9nOjQtk-B9nOjQtk.js"), "./locales/it.ts": () => import("./chunks/it-BYxdZk3i-BYxdZk3i.js"), "./locales/ja.ts": () => import("./chunks/ja-B6cssFwq-B6cssFwq.js"), "./locales/ko.ts": () => import("./chunks/ko-DQepcSJq-DQepcSJq.js"), "./locales/nl.ts": () => import("./chunks/nl-BPIoO4W2-BPIoO4W2.js"), "./locales/no.ts": () => import("./chunks/no-BnW620zl-BnW620zl.js"), "./locales/pl.ts": () => import("./chunks/pl-zVAX4cLO-zVAX4cLO.js"), "./locales/pt.ts": () => import("./chunks/pt-YHlwRjpr-YHlwRjpr.js"), "./locales/ro.ts": () => import("./chunks/ro-BIkdSqnr-BIkdSqnr.js"), "./locales/ru.ts": () => import("./chunks/ru-YgJ6Zw-g-YgJ6Zw-g.js"), "./locales/sv.ts": () => import("./chunks/sv-UmblPGgx-UmblPGgx.js"), "./locales/th.ts": () => import("./chunks/th-CxKBwk3z-CxKBwk3z.js"), "./locales/tr.ts": () => import("./chunks/tr-11aeILHo-11aeILHo.js"), "./locales/uk.ts": () => import("./chunks/uk-Dhw5DtrI-Dhw5DtrI.js"), "./locales/vi.ts": () => import("./chunks/vi-eCGRA0gQ-eCGRA0gQ.js"), "./locales/zh.ts": () => import("./chunks/zh-CH0U-LY3-CH0U-LY3.js") }), `./locales/${t2}.ts`, 3).then((n2) => {
    const s2 = n2.default ?? {};
    return se$1.set(t2, s2), s2;
  }).catch((n2) => {
    console.warn(`[paywall] failed to load locale chunk "${t2}"`, n2);
    const s2 = {};
    return se$1.set(t2, s2), s2;
  }).finally(() => {
    oe$1.delete(t2);
  });
  return oe$1.set(t2, i2), i2;
}
function ht$1({ bootstrap: t2, forceLocale: e2, children: r2 }) {
  const [i2, n2] = d("en"), [s2, o3] = d(null);
  y(() => {
    const p2 = (e2 && Ve$1(e2) ? e2 : null) ?? (() => {
      if (!t2) return null;
      const g2 = dt$1(t2);
      return !g2 || !ut$1(t2, g2) ? null : g2;
    })();
    if (!p2) {
      (s2 !== null || i2 !== "en") && (n2("en"), o3(null));
      return;
    }
    if (p2 === i2 && s2) return;
    let u2 = false;
    return pt$1(p2).then((g2) => {
      u2 || (n2(p2), o3(g2));
    }), () => {
      u2 = true;
    };
  }, [t2, e2]);
  const c2 = {
    locale: i2,
    t: s2 ? (l2, p2, u2) => Ne$1(s2[l2] ?? p2, u2) : Fe$1
  };
  return /* @__PURE__ */ u$1(De$1.Provider, { value: c2, children: r2 });
}
function M$1() {
  return x(De$1);
}
const gt$1 = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
function ft$1({
  open: t2,
  onClose: e2,
  labelledBy: r2,
  brandColor: i2,
  topBanner: n2,
  allowClose: s2 = true,
  hideCloseButton: o3 = false,
  inline: c2 = false,
  children: l2
}) {
  const { t: p2 } = M$1(), u2 = A(null), g2 = A(null);
  return y(() => {
    if (!t2) return;
    g2.current = document.activeElement ?? null;
    const f2 = u2.current;
    f2 && (f2.querySelector("[data-pw-autofocus]") ?? f2).focus({ preventScroll: true });
    const v2 = (h2) => {
      if (h2.key === "Escape") {
        if (!s2) return;
        h2.stopPropagation(), e2();
        return;
      }
      if (h2.key !== "Tab" || !u2.current) return;
      const b = Array.from(
        u2.current.querySelectorAll(gt$1)
      ).filter((U2) => !U2.hasAttribute("disabled") && U2.tabIndex !== -1);
      if (b.length === 0) {
        h2.preventDefault();
        return;
      }
      const T2 = b[0], R2 = b[b.length - 1], E2 = document.activeElement;
      h2.shiftKey && E2 === T2 ? (h2.preventDefault(), R2.focus()) : !h2.shiftKey && E2 === R2 && (h2.preventDefault(), T2.focus());
    };
    document.addEventListener("keydown", v2, true);
    const z2 = document.body.style.overflow;
    return c2 || (document.body.style.overflow = "hidden"), () => {
      document.removeEventListener("keydown", v2, true), c2 || (document.body.style.overflow = z2), g2.current?.focus?.({ preventScroll: true });
    };
  }, [t2, e2, s2, c2]), t2 ? /* @__PURE__ */ u$1(
    "div",
    {
      class: `${c2 ? "absolute z-[1]" : "fixed z-[2147483647]"} inset-0 flex items-center justify-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-md animate-[pw-fade-in_180ms_ease-out]`,
      onClick: (f2) => {
        s2 && f2.target === f2.currentTarget && e2();
      },
      "data-pw-root": true,
      children: [
        /* @__PURE__ */ u$1(
          "div",
          {
            class: "relative flex w-full max-w-[400px] flex-col animate-[pw-scale-in_220ms_cubic-bezier(0.16,1,0.3,1)]",
            style: { "--pw-accent": i2 ?? "#3b82f6" },
            children: [
              n2,
              /* @__PURE__ */ u$1(
                "div",
                {
                  ref: u2,
                  role: "dialog",
                  "aria-modal": "true",
                  "aria-labelledby": r2,
                  tabIndex: -1,
                  class: "relative flex max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-white outline-none",
                  style: {
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
                  },
                  children: [
                    l2,
                    s2 && !o3 ? /* @__PURE__ */ u$1(
                      "button",
                      {
                        type: "button",
                        onClick: e2,
                        "aria-label": p2("modal.close_aria", "Close"),
                        class: "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 backdrop-blur-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
                        children: /* @__PURE__ */ u$1("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ u$1(
                          "path",
                          {
                            d: "M3 3l10 10M13 3L3 13",
                            stroke: "currentColor",
                            "stroke-width": "1.75",
                            "stroke-linecap": "round"
                          }
                        ) })
                      }
                    ) : null
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ u$1("style", { children: `
        @keyframes pw-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pw-scale-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96) }
          to { opacity: 1; transform: none }
        }
      ` })
      ]
    }
  ) : null;
}
function Ce$1(t2, e2) {
  switch (t2) {
    case "google":
      return e2("auth.continue_with_google", "Continue with Google");
    case "apple":
      return e2("auth.continue_with_apple", "Continue with Apple");
    case "github":
      return e2("auth.continue_with_github", "Continue with GitHub");
    case "facebook":
      return e2("auth.continue_with_facebook", "Continue with Facebook");
  }
}
function Ie$1(t2, e2, r2) {
  const i2 = e2 === "signup" ? r2("auth.signup_failed", "Sign-up failed") : r2("auth.signin_failed", "Sign-in failed");
  if (!(t2 instanceof o$2)) return i2;
  switch (t2.code) {
    case "invalid_credentials":
      return r2("auth.invalid_credentials", "Invalid email or password");
    case "email_not_confirmed":
      return r2("auth.email_not_confirmed", "Please confirm your email before signing in.");
    case "email_exists":
    case "user_already_exists":
      return r2("auth.email_exists", "An account with this email already exists.");
    case "weak_password":
      return r2("auth.weak_password", "Password is too weak.");
    case "invalid_otp":
    case "otp_expired":
    case "token_expired":
      return r2("auth.invalid_otp", "The code is invalid or has expired.");
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
    case "rate_limited":
    case "http_429":
      return r2("auth.rate_limited", "Too many requests. Please try again later.");
    case "network_error":
      return r2("auth.network_error", "Network error. Please check your connection and try again.");
    case "upstream":
    case "upstream_error":
    case "http_502":
    case "http_503":
    case "http_504":
      return r2("auth.service_unavailable", "Service is temporarily unavailable. Please try again.");
    // Merchant misconfiguration, not a user error: OAuth redirects and
    // confirmation/recovery email links are built from the paywall's custom
    // domain (backend hard-fails without it). Shown as-is so the integrating
    // developer sees the actionable cause right in the UI during setup.
    case "custom_domain_required":
      return r2(
        "auth.custom_domain_required",
        "Sign-in is not available: the paywall has no custom domain configured (platform settings → Custom domains)."
      );
    default:
      return i2;
  }
}
function $e$1({ block: t2, ctx: e2 }) {
  const r2 = e2.auth, i2 = e2.authSession, n2 = t2.allow_signup !== false, s2 = t2.allow_password_reset !== false, o3 = t2.hide_when_authenticated !== false;
  if (!r2)
    return typeof console < "u" && console.warn("[paywall] auth_panel rendered without AuthClient — pass `auth: true` to PaywallUI"), null;
  const c2 = i2 && !i2.user.is_anonymous ? i2 : null;
  return c2 && o3 ? null : c2 ? /* @__PURE__ */ u$1(wt$1, { email: c2.user.email ?? "", onSignOut: () => r2.signOut().catch(() => {
  }) }) : /* @__PURE__ */ u$1(
    mt$1,
    {
      block: t2,
      allowSignup: n2,
      allowReset: s2,
      ctx: e2
    }
  );
}
function wt$1({ email: t2, onSignOut: e2 }) {
  const { t: r2 } = M$1();
  return /* @__PURE__ */ u$1("div", { class: "flex items-center justify-between gap-3 rounded-2xl bg-gray-100 px-4 py-3", children: [
    /* @__PURE__ */ u$1("div", { class: "flex flex-col", children: [
      /* @__PURE__ */ u$1("span", { class: "text-[10px] font-semibold uppercase tracking-wider text-gray-500", children: r2("auth.signed_in", "Signed in") }),
      /* @__PURE__ */ u$1("span", { class: "text-sm font-medium text-gray-900", children: t2 })
    ] }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: e2,
        class: "rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
        children: r2("auth.sign_out", "Sign out")
      }
    )
  ] });
}
function mt$1({ block: t2, allowSignup: e2, allowReset: r2, ctx: i2 }) {
  const { t: n2 } = M$1(), s2 = i2.auth, o3 = t2.providers ?? [], c2 = i2.initialAuthMode === "signup" && e2 ? "signup" : "signin", [l2, p2] = d(c2), [u2, g2] = d(""), [y$12, _2] = d(""), [m2, f2] = d(""), [v2, z2] = d(""), [h2, b] = d(null), T2 = A(false), [R2, E2] = d(null), [U2, D2] = d(null), [V2, j2] = d(false), [P2, N2] = d(null), B2 = A(null), [K2, ee2] = d(null);
  y(() => {
    if (typeof s2.getLastLogin != "function") return;
    let C2 = false;
    return s2.getLastLogin().then(
      (k2) => {
        C2 || !k2 || (ee2(k2), k2.email && g2((A2) => A2 === "" ? k2.email : A2));
      },
      () => {
      }
    ), () => {
      C2 = true;
    };
  }, [s2]);
  const $2 = (C2) => {
    p2(C2), E2(null), D2(null), j2(false), N2(null), B2.current = null;
  };
  y(() => {
    if (l2 !== "signup_sent" || !B2.current || typeof window > "u") return;
    let C2 = false, k2 = false;
    const A2 = async () => {
      const re2 = B2.current;
      if (!(C2 || k2 || !re2)) {
        k2 = true;
        try {
          await s2.signInWithEmail({ email: re2.email, password: re2.password }), B2.current = null;
        } catch {
        } finally {
          k2 = false;
        }
      }
    }, W2 = () => {
      typeof document < "u" && document.visibilityState === "hidden" || A2();
    };
    window.addEventListener("focus", W2), document.addEventListener("visibilitychange", W2);
    let me = 0;
    const be = window.setInterval(() => {
      if (me += 1, me > 30) {
        window.clearInterval(be);
        return;
      }
      A2();
    }, 2e4);
    return () => {
      C2 = true, window.removeEventListener("focus", W2), document.removeEventListener("visibilitychange", W2), window.clearInterval(be);
    };
  }, [l2, s2]);
  const te2 = async (C2) => {
    if (C2.preventDefault(), !(T2.current || h2)) {
      T2.current = true;
      try {
        if (E2(null), D2(null), l2 === "signup" && !V2) {
          if (!u2.trim()) return;
          j2(true);
          return;
        }
        if (l2 === "signup" && y$12 !== m2) {
          E2(n2("auth.passwords_mismatch", "Passwords don't match"));
          return;
        }
        b("email");
        try {
          if (l2 === "signin")
            await s2.signInWithEmail({ email: u2, password: y$12 });
          else if (l2 === "signup") {
            const k2 = await s2.signUp({ email: u2, password: y$12 });
            k2.kind === "confirmation_required" ? (B2.current = { email: u2, password: y$12 }, _2(""), p2("signup_sent")) : k2.kind === "already_registered" && (p2("signin"), j2(false), f2(""), D2(
              n2(
                "auth.email_already_registered",
                "This email is already registered. Sign in below — with your password or the social account you used."
              )
            ));
          } else l2 === "forgot" ? (await s2.requestPasswordReset({ email: u2 }), p2("reset_sent")) : l2 === "reset_verify" && (await s2.verifyOtp({
            email: u2,
            token: v2,
            type: y$12 ? "recovery" : "email"
          }), y$12 && await s2.updatePassword({ password: y$12 }));
        } catch (k2) {
          if (l2 === "signup" && k2 instanceof o$2 && (k2.code === "email_exists" || k2.code === "user_already_exists")) {
            p2("signin"), j2(false), f2(""), D2(
              n2(
                "auth.email_already_registered",
                "This email is already registered. Sign in below with your password or the account you used to sign up."
              )
            );
            return;
          }
          E2(Ie$1(k2, l2 === "signup" ? "signup" : l2 === "reset_verify" ? "otp" : l2 === "forgot" ? "reset" : "signin", n2));
        } finally {
          b(null);
        }
      } finally {
        T2.current = false;
      }
    }
  }, Y2 = async (C2, k2) => {
    if (!(T2.current || h2)) {
      T2.current = true, b(C2), E2(null), D2(null), k2?.switchAccount || N2(null);
      try {
        await s2.signInWithOAuth({
          provider: C2,
          switchAccount: k2?.switchAccount,
          onPopupOpened: () => b(null)
        }), N2(null);
      } catch (A2) {
        if (A2 instanceof o$2 && (A2.code === "oauth_cancelled" || A2.code === "oauth_timeout"))
          return;
        if (A2 instanceof o$2 && A2.code === "oauth_identity_already_linked") {
          N2(C2), E2(
            n2(
              "auth.identity_already_linked",
              "This account is already registered. Sign in to it below."
            )
          );
          return;
        }
        typeof console < "u" && console.warn("[paywall] OAuth sign-in failed", {
          provider: C2,
          code: A2 instanceof o$2 ? A2.code : void 0,
          message: A2 instanceof Error ? A2.message : String(A2)
        }), E2(Ie$1(A2, "signin", n2));
      } finally {
        T2.current = false, b(null);
      }
    }
  }, w2 = o3.length > 0 && (l2 === "signin" || l2 === "signup"), I2 = l2 === "signin" || l2 === "signup" || l2 === "forgot", S2 = l2 === "signin" || l2 === "signup" && V2;
  return l2 === "reset_sent" ? /* @__PURE__ */ u$1(Lt$1, { email: u2, onBack: () => $2("signin"), t: n2 }) : l2 === "signup_sent" ? /* @__PURE__ */ u$1(Mt$1, { email: u2, onBack: () => $2("signin"), t: n2 }) : /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-5", children: [
    /* @__PURE__ */ u$1(bt$1, { mode: l2, customHeading: t2.heading, customSubheading: t2.subheading }),
    w2 ? /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-2.5", children: [
      o3.map((C2) => /* @__PURE__ */ u$1("div", { class: "relative", children: [
        /* @__PURE__ */ u$1(
          "button",
          {
            type: "button",
            onClick: () => Y2(C2),
            disabled: h2 !== null,
            class: "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-1 border-gray-200 bg-white px-5 text-base font-medium text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
            children: [
              h2 === C2 ? /* @__PURE__ */ u$1("span", { class: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" }) : /* @__PURE__ */ u$1(Me$1, { provider: C2 }),
              /* @__PURE__ */ u$1("span", { children: Ce$1(C2, n2) })
            ]
          }
        ),
        K2?.method === C2 ? /* @__PURE__ */ u$1(Ct$1, { email: K2.email }) : null
      ] }, C2)),
      /* @__PURE__ */ u$1(At$1, {})
    ] }) : null,
    /* @__PURE__ */ u$1("form", { onSubmit: te2, class: "flex flex-col gap-3", children: [
      I2 && /* @__PURE__ */ u$1(
        Ae$1,
        {
          type: "email",
          placeholder: n2("auth.email", "Email address"),
          value: u2,
          onInput: g2,
          autocomplete: "email",
          required: true
        }
      ),
      S2 && /* @__PURE__ */ u$1(
        le$1,
        {
          placeholder: n2("auth.password", "Password"),
          value: y$12,
          onInput: _2,
          autocomplete: l2 === "signin" ? "current-password" : "new-password",
          required: true
        }
      ),
      l2 === "signup" && V2 && /* @__PURE__ */ u$1(
        le$1,
        {
          placeholder: n2("auth.repeat_password", "Repeat password"),
          value: m2,
          onInput: f2,
          autocomplete: "new-password",
          required: true
        }
      ),
      l2 === "reset_verify" && /* @__PURE__ */ u$1(
        Ae$1,
        {
          type: "text",
          placeholder: n2("auth.confirmation_code", "Confirmation code"),
          value: v2,
          onInput: z2,
          autocomplete: "one-time-code",
          inputMode: "numeric",
          required: true
        }
      ),
      l2 === "reset_verify" && /* @__PURE__ */ u$1(
        le$1,
        {
          placeholder: n2(
            "auth.new_password_optional",
            "New password (optional — only for password reset)"
          ),
          value: y$12,
          onInput: _2,
          autocomplete: "new-password"
        }
      ),
      l2 === "signin" && r2 && /* @__PURE__ */ u$1("div", { class: "flex justify-end text-sm", children: /* @__PURE__ */ u$1(Q$1, { onClick: () => $2("forgot"), children: n2("auth.forgot_password", "Forgot password?") }) }),
      R2 && /* @__PURE__ */ u$1("p", { class: "text-sm text-red-600", children: R2 }),
      U2 && /* @__PURE__ */ u$1("p", { class: "text-sm text-gray-500", children: U2 }),
      P2 && /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: () => Y2(P2, { switchAccount: true }),
          disabled: h2 !== null,
          class: "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-1 border-gray-200 bg-white px-5 text-base font-medium text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
          children: [
            h2 === P2 ? /* @__PURE__ */ u$1("span", { class: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" }) : /* @__PURE__ */ u$1(Me$1, { provider: P2 }),
            /* @__PURE__ */ u$1("span", { children: Ce$1(P2, n2) })
          ]
        }
      ),
      /* @__PURE__ */ u$1(
        kt$1,
        {
          busy: h2 === "email",
          label: xt$1(l2, V2, t2.submit_label ?? t2.heading, n2)
        }
      )
    ] }),
    /* @__PURE__ */ u$1(
      yt$1,
      {
        mode: l2,
        allowSignup: e2,
        onSwitch: $2
      }
    )
  ] });
}
function bt$1({
  mode: t2,
  customHeading: e2,
  customSubheading: r2
}) {
  const { t: i2 } = M$1(), n2 = vt$1(t2, i2), s2 = t2 === "signin" || t2 === "signup", o3 = s2 && e2 ? e2 : n2.title, c2 = s2 && r2 !== void 0 ? r2 || null : n2.subtitle;
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-2", children: [
    /* @__PURE__ */ u$1("h2", { class: "text-3xl font-bold tracking-tight text-gray-900", children: o3 }),
    c2 ? /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: c2 }) : null
  ] });
}
function vt$1(t2, e2) {
  switch (t2) {
    case "signin":
      return {
        title: e2("auth.welcome", "Welcome back!"),
        subtitle: e2("auth.default_subtitle", "Sign in to access all features and sync your data.")
      };
    case "signup":
      return {
        title: e2("auth.welcome_signup", "Welcome!"),
        subtitle: e2("auth.default_subtitle", "Sign in to access all features and sync your data.")
      };
    case "forgot":
      return {
        title: e2("auth.forgot_password_title", "Forgot password?"),
        subtitle: e2(
          "auth.forgot_subtitle",
          "Enter your email and we'll send you a password reset link."
        )
      };
    case "reset_sent":
    case "signup_sent":
      return {
        title: e2("auth.check_email_title", "Check your email"),
        subtitle: null
      };
    case "reset_verify":
      return {
        title: e2("auth.reset_password_title", "Reset password"),
        subtitle: e2(
          "auth.reset_password_subtitle",
          "Enter the code from your email and a new password."
        )
      };
  }
}
function xt$1(t2, e2, r2, i2) {
  if (t2 === "signin" && r2) return r2;
  switch (t2) {
    case "signin":
      return i2("auth.log_in", "Sign In");
    case "signup":
      return e2 ? i2("auth.create_account", "Create Account") : i2("auth.sign_up", "Sign Up");
    case "forgot":
      return i2("auth.send_reset", "Send Reset Email");
    case "reset_verify":
      return i2("auth.verify", "Verify");
    default:
      return i2("cta.continue", "Continue");
  }
}
function yt$1({
  mode: t2,
  allowSignup: e2,
  onSwitch: r2
}) {
  const { t: i2 } = M$1();
  return t2 === "signin" && e2 ? /* @__PURE__ */ u$1("p", { class: "text-center text-sm text-gray-600", children: [
    i2("auth.no_account", "Don't have an account?"),
    " ",
    /* @__PURE__ */ u$1(Q$1, { onClick: () => r2("signup"), children: i2("auth.sign_up_link", "Sign Up") })
  ] }) : t2 === "signup" ? /* @__PURE__ */ u$1("p", { class: "text-center text-sm text-gray-600", children: [
    i2("auth.have_account", "Already have an account?"),
    " ",
    /* @__PURE__ */ u$1(Q$1, { onClick: () => r2("signin"), children: i2("auth.log_in_link", "Log In") })
  ] }) : t2 === "forgot" || t2 === "reset_sent" || t2 === "reset_verify" ? /* @__PURE__ */ u$1("p", { class: "text-center text-sm text-gray-600", children: [
    i2("auth.no_account", "Don't have an account?"),
    " ",
    /* @__PURE__ */ u$1(Q$1, { onClick: () => r2("signup"), children: i2("auth.sign_up_link", "Sign Up") })
  ] }) : null;
}
function Q$1({
  onClick: t2,
  children: e2
}) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      onClick: t2,
      class: "font-semibold transition-opacity hover:opacity-80 focus:outline-none focus-visible:opacity-80",
      style: { color: "var(--pw-accent)" },
      children: e2
    }
  );
}
function kt$1({ busy: t2, label: e2 }) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "submit",
      disabled: t2,
      class: "pw-cta-shimmer relative mt-1 flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
      style: {
        background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
        boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
      },
      children: t2 ? /* @__PURE__ */ u$1("span", { class: "relative z-10 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" }) : /* @__PURE__ */ u$1("span", { class: "relative z-10", children: e2 })
    }
  );
}
function Ae$1({ type: t2, placeholder: e2, value: r2, onInput: i2, autocomplete: n2, inputMode: s2, required: o3 }) {
  return /* @__PURE__ */ u$1(
    "input",
    {
      type: t2,
      value: r2,
      placeholder: e2,
      onInput: (c2) => i2(c2.target.value),
      autocomplete: n2,
      inputMode: s2,
      required: o3,
      class: "h-14 w-full rounded-2xl bg-gray-100 px-5 text-base text-gray-900 outline-none transition-all placeholder:text-gray-500 hover:bg-gray-200/60 focus:bg-gray-200/60 focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--pw-accent)_30%,transparent)]"
    }
  );
}
function le$1({ placeholder: t2, value: e2, onInput: r2, autocomplete: i2, required: n2 }) {
  const { t: s2 } = M$1(), [o3, c2] = d(false), l2 = A(null);
  y(() => {
    const g2 = l2.current;
    g2 && g2.value !== e2 && (g2.value = e2);
  }, [o3, e2]);
  const p2 = s2("auth.show_password", "Show password"), u2 = s2("auth.hide_password", "Hide password");
  return /* @__PURE__ */ u$1("div", { class: "relative", children: [
    /* @__PURE__ */ u$1(
      "input",
      {
        ref: l2,
        type: o3 ? "text" : "password",
        value: e2,
        placeholder: t2,
        onInput: (g2) => r2(g2.target.value),
        autocomplete: i2,
        required: n2,
        class: "h-14 w-full rounded-2xl bg-gray-100 pl-5 pr-12 text-base text-gray-900 outline-none transition-all placeholder:text-gray-500 hover:bg-gray-200/60 focus:bg-gray-200/60 focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--pw-accent)_30%,transparent)]"
      }
    ),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: () => c2((g2) => !g2),
        "aria-label": o3 ? u2 : p2,
        tabIndex: -1,
        class: "absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
        children: o3 ? /* @__PURE__ */ u$1(St$1, {}) : /* @__PURE__ */ u$1(_t$1, {})
      }
    )
  ] });
}
function _t$1() {
  return /* @__PURE__ */ u$1("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ u$1(
      "path",
      {
        d: "M1.667 10S4.583 4.167 10 4.167 18.333 10 18.333 10 15.417 15.833 10 15.833 1.667 10 1.667 10Z",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    ),
    /* @__PURE__ */ u$1("circle", { cx: "10", cy: "10", r: "2.5", stroke: "currentColor", "stroke-width": "1.5" })
  ] });
}
function St$1() {
  return /* @__PURE__ */ u$1("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ u$1(
      "path",
      {
        d: "M8.236 4.293A6.96 6.96 0 0 1 10 4.167C15.417 4.167 18.333 10 18.333 10a13.5 13.5 0 0 1-1.92 2.755M11.768 11.768A2.5 2.5 0 0 1 8.233 8.233",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    ),
    /* @__PURE__ */ u$1(
      "path",
      {
        d: "M14.953 14.953A8.84 8.84 0 0 1 10 15.833C4.583 15.833 1.667 10 1.667 10a13.5 13.5 0 0 1 3.38-3.953M1.667 1.667l16.666 16.666",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    )
  ] });
}
function Ct$1({ email: t2 }) {
  const { t: e2 } = M$1(), r2 = t2 ? e2("auth.last_used", "Last used · {email}", { email: It$1(t2) }) : e2("auth.last_used_no_email", "Last used");
  return /* @__PURE__ */ u$1("span", { class: "pointer-events-none absolute -top-2 right-3 max-w-[75%] truncate rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-sm", children: r2 });
}
function It$1(t2) {
  const [e2, r2] = t2.split("@");
  return r2 ? `${e2.slice(0, 3)}*****@${r2}` : t2;
}
function At$1() {
  const { t: t2 } = M$1();
  return /* @__PURE__ */ u$1("div", { class: "flex items-center gap-3 py-1 text-sm text-gray-400", children: [
    /* @__PURE__ */ u$1("div", { class: "h-px flex-1 bg-gray-200" }),
    /* @__PURE__ */ u$1("span", { children: t2("auth.or", "or") }),
    /* @__PURE__ */ u$1("div", { class: "h-px flex-1 bg-gray-200" })
  ] });
}
function Me$1({ provider: t2 }) {
  return t2 === "google" ? /* @__PURE__ */ u$1("svg", { width: "20", height: "20", viewBox: "0 0 18 18", "aria-hidden": "true", children: [
    /* @__PURE__ */ u$1("path", { fill: "#4285F4", d: "M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62Z" }),
    /* @__PURE__ */ u$1("path", { fill: "#34A853", d: "M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.36 0-4.36-1.59-5.07-3.74H.92v2.33A9 9 0 0 0 9 18Z" }),
    /* @__PURE__ */ u$1("path", { fill: "#FBBC05", d: "M3.93 10.68a5.4 5.4 0 0 1 0-3.36V4.99H.92a9 9 0 0 0 0 8.02l3-2.33Z" }),
    /* @__PURE__ */ u$1("path", { fill: "#EA4335", d: "M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 .92 4.99l3.01 2.33C4.64 5.17 6.64 3.58 9 3.58Z" })
  ] }) : t2 === "apple" ? (
    // viewBox 0 0 24 24 leaves whitespace above/below the path, so visually
    // the Apple logo looks smaller than Google. We compensate with a larger
    // width/height — 26×26 gives roughly equal optical size to Google's 20×20.
    /* @__PURE__ */ u$1("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ u$1("path", { d: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" }) })
  ) : t2 === "github" ? /* @__PURE__ */ u$1("svg", { width: "20", height: "20", viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ u$1("path", { d: "M8 0C3.6 0 0 3.6 0 8a8 8 0 0 0 5.5 7.6c.4.1.5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7 0-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3.1-1.9 3.7-3.6 3.9.3.3.6.8.6 1.6V15c0 .2.1.5.6.4A8 8 0 0 0 16 8c0-4.4-3.6-8-8-8Z" }) }) : /* @__PURE__ */ u$1("svg", { width: "18", height: "20", viewBox: "0 0 14 16", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ u$1("path", { d: "M14 2.7C14 1.2 12.8 0 11.3 0H2.7C1.2 0 0 1.2 0 2.7v10.6C0 14.8 1.2 16 2.7 16h4V9.8H4.7v-2H6.7V6.4c0-2 1.2-3.1 3-3.1.9 0 1.7.1 2 .2V5h-1.4c-.8 0-1 .4-1 1v1.5h2.4l-.3 2H9.3V16h2c1.5 0 2.7-1.2 2.7-2.7V2.7Z" }) });
}
function Mt$1({
  email: t2,
  onBack: e2,
  t: r2
}) {
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-4 py-2 text-center", children: [
    /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex h-14 w-14 items-center justify-center rounded-full",
        style: {
          background: "linear-gradient(135deg, #4ade80, #16a34a)",
          color: "#fff",
          boxShadow: "0 0 0 8px rgba(74,222,128,0.12), 0 8px 20px -6px rgba(22,163,74,0.45)"
        },
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 13l4 4L19 7",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ) })
      }
    ),
    /* @__PURE__ */ u$1("h2", { class: "mt-1 text-3xl font-bold tracking-tight text-gray-900", children: r2("auth.check_email_title", "Check your email") }),
    /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: r2(
      "auth.signup_sent_subtitle",
      "We sent a confirmation link to your email. Click it to activate your account — you will be signed in here automatically."
    ) }),
    t2 ? /* @__PURE__ */ u$1("p", { class: "break-all text-base font-semibold text-gray-900", children: t2 }) : null,
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: e2,
        class: "pw-cta-shimmer relative mt-2 flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        style: {
          background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
          boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
        },
        children: /* @__PURE__ */ u$1("span", { class: "relative z-10", children: r2("auth.back_to_login", "Back to Login") })
      }
    )
  ] });
}
function Lt$1({
  email: t2,
  onBack: e2,
  t: r2
}) {
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-4 py-2 text-center", children: [
    /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex h-14 w-14 items-center justify-center rounded-full",
        style: {
          background: "linear-gradient(135deg, #4ade80, #16a34a)",
          color: "#fff",
          boxShadow: "0 0 0 8px rgba(74,222,128,0.12), 0 8px 20px -6px rgba(22,163,74,0.45)"
        },
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 13l4 4L19 7",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ) })
      }
    ),
    /* @__PURE__ */ u$1("h2", { class: "mt-1 text-3xl font-bold tracking-tight text-gray-900", children: r2("auth.check_email_title", "Check your email") }),
    /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: r2(
      "auth.reset_sent_subtitle",
      "We sent a password reset link. Follow the instructions in the email to reset your password."
    ) }),
    t2 ? /* @__PURE__ */ u$1("p", { class: "break-all text-base font-semibold text-gray-900", children: t2 }) : null,
    /* @__PURE__ */ u$1("p", { class: "text-sm text-gray-500", children: r2("auth.reset_link_valid", "The link is valid for 1 hour.") }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: e2,
        class: "pw-cta-shimmer relative mt-2 flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        style: {
          background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
          boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
        },
        children: /* @__PURE__ */ u$1("span", { class: "relative z-10", children: r2("auth.back_to_login", "Back to Login") })
      }
    )
  ] });
}
function Tt$1({
  block: t2,
  bootstrap: e2,
  auth: r2,
  authSession: i2,
  onBack: n2,
  showBack: s2 = true,
  intent: o3 = "preauth",
  initialMode: c2
}) {
  const { t: l2 } = M$1(), p2 = {
    bootstrap: e2,
    selectedPriceId: null,
    setSelectedPriceId: () => {
    },
    onAction: () => {
    },
    auth: r2,
    authSession: i2,
    initialAuthMode: c2
  }, u2 = o3 === "restore" ? {
    ...t2,
    heading: l2("auth.restore_purchases_heading", "Restore Purchases"),
    subheading: l2(
      "auth.restore_purchases_subheading",
      "Please sign in to restore your purchases."
    )
  } : o3 === "preauth" ? {
    ...t2,
    heading: l2("auth.login_continue_purchase", "Log in to continue your purchase"),
    subheading: l2(
      "auth.link_purchase_subheading",
      "We'll link the purchase to your account to keep access."
    ),
    // Preauth heading — a descriptive sentence ("Log in to continue
    // your purchase"), not an action verb. Long localizations (RU:
    // "Войдите, чтобы продолжить покупку") don't fit into the h-12
    // pill button and wrap onto 2 lines. An explicit short submit_label
    // solves it.
    submit_label: l2("auth.log_in", "Sign In")
  } : t2;
  return /* @__PURE__ */ u$1("div", { class: "relative flex-1 min-h-0 overflow-y-auto p-6 sm:p-8", children: [
    s2 ? /* @__PURE__ */ u$1(Pt$1, { onClick: n2, ariaLabel: l2("nav.back_aria", "Back") }) : null,
    /* @__PURE__ */ u$1($e$1, { block: u2, ctx: p2 })
  ] });
}
function Pt$1({ onClick: t2, ariaLabel: e2 }) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      onClick: t2,
      "aria-label": e2,
      class: "absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
      children: /* @__PURE__ */ u$1("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 8h8a4 4 0 0 1 0 8H9",
            stroke: "currentColor",
            "stroke-width": "1.75",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M8 4 4 8l4 4",
            stroke: "currentColor",
            "stroke-width": "1.75",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        )
      ] })
    }
  );
}
const Et$1 = (t2) => `pw-offer-${t2}-start`;
function ce$1(t2) {
  const e2 = t2 - Date.now();
  return e2 <= 0 ? { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true } : {
    days: Math.floor(e2 / (1e3 * 60 * 60 * 24)),
    hours: Math.floor(e2 % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60)),
    minutes: Math.floor(e2 % (1e3 * 60 * 60) / (1e3 * 60)),
    seconds: Math.floor(e2 % (1e3 * 60) / 1e3),
    expired: false
  };
}
function jt$1(t2) {
  if (t2.expires_at) {
    const e2 = Date.parse(t2.expires_at);
    return Number.isFinite(e2) ? e2 : null;
  }
  if (t2.duration_minutes && t2.duration_minutes > 0) {
    if (typeof window > "u") return null;
    try {
      const e2 = Et$1(t2.id);
      let r2 = window.localStorage.getItem(e2);
      return r2 || (r2 = (/* @__PURE__ */ new Date()).toISOString(), window.localStorage.setItem(e2, r2)), Date.parse(r2) + t2.duration_minutes * 6e4;
    } catch {
      return null;
    }
  }
  return null;
}
function He$1(t2, e2) {
  if (!t2 || t2.length === 0) return null;
  if (e2) {
    const r2 = t2.find((i2) => i2.id === e2);
    if (r2) return r2;
  }
  return t2.find((r2) => r2.expires_at || r2.duration_minutes) ?? null;
}
function qe$1(t2) {
  const e2 = t2 ? jt$1(t2) : null, [r2, i2] = d(
    () => e2 !== null ? ce$1(e2) : null
  ), n2 = A(e2);
  return n2.current = e2, y(() => {
    if (e2 === null) {
      i2(null);
      return;
    }
    i2(ce$1(e2));
    const s2 = setInterval(() => {
      const o3 = ce$1(n2.current ?? 0);
      i2(o3), o3.expired && clearInterval(s2);
    }, 1e3);
    return () => clearInterval(s2);
  }, [e2, t2?.duration_minutes, t2?.id]), r2;
}
function zt$1({ block: t2, ctx: e2 }) {
  const { t: r2 } = M$1(), i2 = He$1(e2.bootstrap.offers, t2.offer_id), n2 = qe$1(i2);
  if (!i2 || n2 === null || n2.expired && !t2.force) return null;
  const s2 = t2.title ?? i2.label ?? r2("offer.limited_time", "Limited-time offer"), o3 = i2.discount_percent ? `${s2} ${i2.discount_percent}%` : s2;
  return /* @__PURE__ */ u$1(
    "div",
    {
      class: "flex flex-wrap items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold leading-tight text-white",
      style: {
        background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 50%, color-mix(in srgb, var(--pw-accent) 85%, black) 100%)",
        textShadow: "0 0 2px rgba(0, 0, 0, 0.25)"
      },
      role: "status",
      children: [
        /* @__PURE__ */ u$1(We$1, {}),
        /* @__PURE__ */ u$1("span", { children: o3 }),
        /* @__PURE__ */ u$1(Ge$1, { value: n2, t: r2 })
      ]
    }
  );
}
function Ge$1({ value: t2, t: e2 }) {
  return /* @__PURE__ */ u$1("div", { class: "flex items-center gap-1 font-mono text-sm", children: [
    t2.days > 0 ? /* @__PURE__ */ u$1(k$1, { children: [
      /* @__PURE__ */ u$1(X$1, { children: String(t2.days) }),
      /* @__PURE__ */ u$1("span", { class: "text-xs", children: e2("countdown.d", "d") })
    ] }) : null,
    /* @__PURE__ */ u$1(X$1, { children: String(t2.hours).padStart(2, "0") }),
    /* @__PURE__ */ u$1("span", { class: "text-xs", children: e2("countdown.h", "h") }),
    /* @__PURE__ */ u$1(X$1, { children: String(t2.minutes).padStart(2, "0") }),
    /* @__PURE__ */ u$1("span", { class: "text-xs", children: e2("countdown.m", "m") }),
    /* @__PURE__ */ u$1(X$1, { children: String(t2.seconds).padStart(2, "0") }),
    /* @__PURE__ */ u$1("span", { class: "text-xs", children: e2("countdown.s", "s") })
  ] });
}
function X$1({ children: t2 }) {
  return /* @__PURE__ */ u$1("span", { class: "rounded bg-black/20 px-1.5 py-0.5 text-xs font-bold", children: t2 });
}
function Bt$1({ offer: t2 }) {
  const { t: e2 } = M$1(), r2 = qe$1(t2);
  if (r2 === null || r2.expired) return null;
  const i2 = t2.label ?? e2("offer.limited_time", "Limited-time offer"), n2 = t2.discount_percent ? `${i2} ${t2.discount_percent}%` : i2;
  return /* @__PURE__ */ u$1(
    "div",
    {
      class: "-mb-2 flex flex-wrap items-center justify-center gap-2 rounded-t-xl px-4 pb-5 pt-3 text-[15px] font-semibold leading-tight text-white",
      style: {
        background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 50%, color-mix(in srgb, var(--pw-accent) 85%, black) 100%)",
        textShadow: "0 0 2px rgba(0, 0, 0, 0.25)"
      },
      role: "status",
      children: [
        /* @__PURE__ */ u$1(We$1, {}),
        /* @__PURE__ */ u$1("span", { children: n2 }),
        /* @__PURE__ */ u$1(Ge$1, { value: r2, t: e2 })
      ]
    }
  );
}
function We$1() {
  return /* @__PURE__ */ u$1(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 12 12",
      fill: "none",
      "aria-hidden": "true",
      children: /* @__PURE__ */ u$1(
        "path",
        {
          fill: "currentColor",
          d: "m9.44 5.359-2.394-.895.61-3.036c.062-.31-.345-.531-.57-.291L2.434 6.105a.336.336 0 0 0 .126.537l2.395.894-.61 3.037c-.062.31.345.53.57.29l4.653-4.968a.336.336 0 0 0-.126-.536Z"
        }
      )
    }
  );
}
const Le$1 = 3, Te$1 = 200, Pe$1 = 5e3, de$1 = 5, he$1 = 5, Ot$1 = he$1 * 1024 * 1024, Ee$1 = ["image/jpeg", "image/png", "image/webp"], Rt$1 = /.+@.+\..+/;
function Ut$1({ client: t2, authSession: e2, origin: r2, onBack: i2 }) {
  const { t: n2 } = M$1(), s2 = e2?.user.email ?? "", o3 = s2 || null, [c2, l2] = d(s2), [p2, u2] = d(""), [g2, y2] = d(""), [_2, m2] = d([]), [f2, v2] = d(false), [z2, h2] = d(null), [b, T2] = d({}), R2 = () => {
    const j2 = {}, P2 = (o3 ?? c2).trim(), N2 = p2.trim(), B2 = g2.trim();
    return P2 ? Rt$1.test(P2.toLowerCase()) || (j2.email = n2("support.invalid_email", "Invalid email")) : j2.email = n2("support.required", "Required"), (N2.length < Le$1 || N2.length > Te$1) && (j2.subject = n2("support.subject_length", "{min}–{max} characters", {
      min: Le$1,
      max: Te$1
    })), (B2.length < 1 || B2.length > Pe$1) && (j2.message = n2("support.message_length", "{min}–{max} characters", {
      min: 1,
      max: Pe$1
    })), T2(j2), Object.keys(j2).length === 0;
  }, E2 = async (j2) => {
    if (j2.preventDefault(), !f2 && R2()) {
      v2(true), T2((P2) => ({ ...P2, submit: void 0 }));
      try {
        const P2 = (o3 ?? c2).trim();
        await t2.createSupportTicket({
          subject: p2.trim(),
          content: g2.trim(),
          email: P2 || void 0,
          files: _2.length > 0 ? _2 : void 0
        }), h2(P2);
      } catch (P2) {
        const N2 = P2 instanceof o$2 && P2.message || "Failed to send. Please try again.";
        T2((B2) => ({ ...B2, submit: N2 }));
      } finally {
        v2(false);
      }
    }
  }, U2 = () => {
    u2(""), y2(""), m2([]), T2({}), h2(null);
  }, D2 = "flex flex-col gap-3 bg-white px-6 pb-6 pt-3 sm:px-8", V2 = { boxShadow: "0 -4px 12px -4px rgba(15,23,42,0.06)" };
  return z2 ? /* @__PURE__ */ u$1("div", { class: "relative flex-1 min-h-0 flex flex-col", children: [
    /* @__PURE__ */ u$1("div", { class: "flex-1 min-h-0 overflow-y-auto flex flex-col items-center gap-4 px-6 pb-3 pt-6 sm:px-8 sm:pb-4 sm:pt-8 text-center", children: [
      /* @__PURE__ */ u$1(
        "div",
        {
          class: "flex h-14 w-14 items-center justify-center rounded-full",
          style: {
            background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 85%, white), var(--pw-accent))",
            color: "#fff",
            boxShadow: "0 0 0 8px color-mix(in srgb, var(--pw-accent) 12%, transparent), 0 8px 20px -6px color-mix(in srgb, var(--pw-accent) 45%, transparent)"
          },
          "aria-hidden": "true",
          children: /* @__PURE__ */ u$1("svg", { viewBox: "0 0 24 24", class: "h-7 w-7", children: /* @__PURE__ */ u$1(
            "path",
            {
              fill: "currentColor",
              d: "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm6.93 8.2-6.85 9.29a1.01 1.01 0 0 1-1.43.19L5.76 13.77a1 1 0 1 1 1.25-1.56l4.08 3.26 6.23-8.45a1 1 0 1 1 1.61 1.18Z"
            }
          ) })
        }
      ),
      /* @__PURE__ */ u$1("div", { class: "text-lg font-semibold tracking-tight text-gray-900", children: n2("support.success_heading", "Request submitted") }),
      /* @__PURE__ */ u$1("div", { class: "max-w-[320px] text-sm leading-relaxed text-gray-500", children: [
        n2(
          "support.success_message_prefix",
          "We've received your message and will respond to"
        ),
        " ",
        /* @__PURE__ */ u$1("b", { class: "text-gray-700", children: z2 }),
        "."
      ] })
    ] }),
    /* @__PURE__ */ u$1("div", { class: D2, style: V2, children: /* @__PURE__ */ u$1("div", { class: "flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: i2,
          class: "rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
          children: r2 === "standalone" ? n2("support.done_button", "Done") : n2("nav.back_aria", "Back")
        }
      ),
      /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: U2,
          class: "flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
          style: {
            background: "linear-gradient(180deg, color-mix(in srgb, var(--pw-accent) 92%, white), var(--pw-accent))",
            boxShadow: "0 1px 2px rgba(15,23,42,0.08), 0 6px 14px -4px color-mix(in srgb, var(--pw-accent) 50%, transparent)"
          },
          children: n2("support.send_another", "Send another request")
        }
      )
    ] }) })
  ] }) : /* @__PURE__ */ u$1("form", { onSubmit: E2, class: "relative flex-1 min-h-0 flex flex-col", children: [
    /* @__PURE__ */ u$1(Ft$1, { onClick: i2, ariaLabel: n2("nav.back_aria", "Back") }),
    /* @__PURE__ */ u$1("div", { class: "flex-1 min-h-0 overflow-y-auto px-6 pb-3 pt-6 sm:px-8 sm:pb-4 sm:pt-8", children: /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-5", children: [
      /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-2 pr-10", children: [
        /* @__PURE__ */ u$1("h2", { class: "text-3xl font-bold tracking-tight text-gray-900", children: n2("support.heading", "Support") }),
        /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: n2("support.instruction", "Please fill out the form below to submit your support request.") })
      ] }),
      /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-3", children: [
        o3 ? /* @__PURE__ */ u$1("div", { class: "rounded-2xl bg-gray-100 px-5 py-3 text-sm text-gray-600", children: [
          n2("support.sending_as", "Sending as"),
          " ",
          /* @__PURE__ */ u$1("b", { class: "font-medium text-gray-900", children: o3 })
        ] }) : /* @__PURE__ */ u$1(
          je$1,
          {
            type: "email",
            placeholder: n2("support.email_placeholder", "Enter your email *"),
            value: c2,
            onInput: l2,
            error: b.email,
            autocomplete: "email",
            required: true
          }
        ),
        /* @__PURE__ */ u$1(
          je$1,
          {
            type: "text",
            placeholder: n2("support.subject_placeholder", "Enter your subject *"),
            value: p2,
            onInput: u2,
            error: b.subject,
            required: true
          }
        ),
        /* @__PURE__ */ u$1(
          Dt$1,
          {
            placeholder: n2("support.message_placeholder", "Enter your message *"),
            value: g2,
            onInput: y2,
            error: b.message,
            required: true
          }
        ),
        /* @__PURE__ */ u$1(Nt$1, { files: _2, onChange: m2, disabled: f2 })
      ] })
    ] }) }),
    /* @__PURE__ */ u$1("div", { class: D2, style: V2, children: [
      b.submit && /* @__PURE__ */ u$1("p", { class: "text-sm text-red-600", children: b.submit }),
      /* @__PURE__ */ u$1("div", { class: "flex items-center justify-end gap-3", children: [
        /* @__PURE__ */ u$1(
          "button",
          {
            type: "button",
            onClick: i2,
            disabled: f2,
            class: "rounded-full px-4 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
            children: r2 === "standalone" ? n2("support.close_button", "Close") : n2("nav.back_aria", "Back")
          }
        ),
        /* @__PURE__ */ u$1(
          "button",
          {
            type: "submit",
            disabled: f2,
            class: "pw-cta-shimmer relative flex h-12 items-center justify-center overflow-hidden rounded-full px-8 text-base font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
            style: {
              background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
              boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
            },
            children: f2 ? /* @__PURE__ */ u$1("span", { class: "relative z-10 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" }) : /* @__PURE__ */ u$1("span", { class: "relative z-10", children: n2("support.send_button", "Send") })
          }
        )
      ] })
    ] })
  ] });
}
function Ft$1({ onClick: t2, ariaLabel: e2 }) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      onClick: t2,
      "aria-label": e2,
      class: "absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
      children: /* @__PURE__ */ u$1("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 8h8a4 4 0 0 1 0 8H9",
            stroke: "currentColor",
            "stroke-width": "1.75",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M8 4 4 8l4 4",
            stroke: "currentColor",
            "stroke-width": "1.75",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        )
      ] })
    }
  );
}
function je$1({
  type: t2,
  placeholder: e2,
  value: r2,
  onInput: i2,
  error: n2,
  autocomplete: s2,
  required: o3
}) {
  return /* @__PURE__ */ u$1("div", { children: [
    /* @__PURE__ */ u$1(
      "input",
      {
        type: t2,
        value: r2,
        placeholder: e2,
        onInput: (c2) => i2(c2.target.value),
        autocomplete: s2,
        required: o3,
        class: `h-14 w-full rounded-2xl bg-gray-100 px-5 text-base text-gray-900 outline-none transition-all placeholder:text-gray-500 hover:bg-gray-200/60 focus:bg-gray-200/60 ${n2 ? "shadow-[0_0_0_2px_rgba(239,68,68,0.5)]" : "focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--pw-accent)_30%,transparent)]"}`
      }
    ),
    n2 && /* @__PURE__ */ u$1("span", { class: "mt-1 ml-2 block text-sm text-red-600", children: n2 })
  ] });
}
function Dt$1({
  placeholder: t2,
  value: e2,
  onInput: r2,
  error: i2,
  required: n2
}) {
  return /* @__PURE__ */ u$1("div", { children: [
    /* @__PURE__ */ u$1(
      "textarea",
      {
        value: e2,
        placeholder: t2,
        onInput: (s2) => r2(s2.target.value),
        required: n2,
        rows: 5,
        class: `min-h-[120px] w-full rounded-2xl bg-gray-100 px-5 py-3.5 text-base leading-relaxed text-gray-900 outline-none transition-all placeholder:text-gray-500 hover:bg-gray-200/60 focus:bg-gray-200/60 ${i2 ? "shadow-[0_0_0_2px_rgba(239,68,68,0.5)]" : "focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--pw-accent)_30%,transparent)]"}`
      }
    ),
    i2 && /* @__PURE__ */ u$1("span", { class: "mt-1 ml-2 block text-sm text-red-600", children: i2 })
  ] });
}
function Nt$1({ files: t2, onChange: e2, disabled: r2 }) {
  const { t: i2 } = M$1(), n2 = A(null), [s2, o3] = d(false), [c2, l2] = d(null), p2 = (u2) => {
    if (!u2 || r2) return;
    l2(null);
    const g2 = Array.from(u2);
    if (t2.length + g2.length > de$1) {
      l2(i2("support.too_many_files", "Up to {max} files", { max: de$1 }));
      return;
    }
    const y2 = g2.filter(
      (_2) => Ee$1.includes(_2.type) && _2.size <= Ot$1
    );
    if (y2.length !== g2.length) {
      l2(
        i2("support.invalid_file", "Only JPEG/PNG/WebP, ≤ {size}MB each", {
          size: he$1
        })
      );
      return;
    }
    e2([...t2, ...y2]);
  };
  return /* @__PURE__ */ u$1("div", { children: [
    /* @__PURE__ */ u$1("span", { class: "text-xs font-medium text-gray-700", children: i2("support.attachments_label", "Attachments (optional)") }),
    /* @__PURE__ */ u$1(
      "div",
      {
        role: "button",
        tabIndex: 0,
        "aria-label": i2("support.attachments_aria", "Attachments upload"),
        onClick: () => !r2 && n2.current?.click(),
        onDragOver: (u2) => {
          u2.preventDefault(), r2 || o3(true);
        },
        onDragLeave: () => o3(false),
        onDrop: (u2) => {
          u2.preventDefault(), o3(false), p2(u2.dataTransfer?.files ?? null);
        },
        class: `mt-1.5 cursor-pointer rounded-2xl border border-dashed p-3.5 text-center transition-all ${s2 ? "border-[var(--pw-accent)] bg-[color-mix(in_srgb,var(--pw-accent)_6%,white)]" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/60"} ${r2 ? "cursor-not-allowed opacity-60" : ""}`,
        children: [
          /* @__PURE__ */ u$1("div", { class: "text-xs text-gray-500", children: i2("support.dropzone_text", "Drop images here or click to select") }),
          /* @__PURE__ */ u$1("div", { class: "mt-0.5 text-[11px] text-gray-400", children: i2("support.file_requirements", "JPEG/PNG/WebP, up to {max} files, ≤ {size}MB each", {
            max: de$1,
            size: he$1
          }) })
        ]
      }
    ),
    /* @__PURE__ */ u$1(
      "input",
      {
        ref: n2,
        type: "file",
        multiple: true,
        accept: Ee$1.join(","),
        class: "hidden",
        onChange: (u2) => {
          p2(u2.target.files), u2.currentTarget.value = "";
        }
      }
    ),
    c2 && /* @__PURE__ */ u$1("p", { class: "mt-1 text-xs text-red-600", children: c2 }),
    t2.length > 0 && /* @__PURE__ */ u$1("ul", { class: "mt-2 flex flex-col gap-1", children: t2.map((u2, g2) => /* @__PURE__ */ u$1(
      "li",
      {
        class: "flex items-center justify-between gap-2 rounded bg-gray-50 px-2 py-1 text-xs",
        children: [
          /* @__PURE__ */ u$1("span", { class: "truncate text-gray-700", children: u2.name }),
          /* @__PURE__ */ u$1(
            "button",
            {
              type: "button",
              onClick: () => {
                const y2 = [...t2];
                y2.splice(g2, 1), e2(y2);
              },
              disabled: r2,
              class: "text-gray-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60",
              "aria-label": i2("support.remove_file_aria", "Remove {filename}", { filename: u2.name }),
              children: "✕"
            }
          )
        ]
      },
      `${u2.name}-${u2.size}-${g2}`
    )) })
  ] });
}
const Vt$1 = {
  day: "cta.get_plan_daily",
  week: "cta.get_plan_weekly",
  month: "cta.get_plan_monthly",
  year: "cta.get_plan_yearly"
}, $t$1 = {
  day: "Get Daily Plan",
  week: "Get Weekly Plan",
  month: "Get Monthly Plan",
  year: "Get Yearly Plan"
};
function Ht$1(t2, e2, r2, i2) {
  if (e2 === "close") return i2("cta.close", "Close");
  if (!t2) return i2("cta.continue", "Continue");
  if (!r2 && t2.trial_days && t2.interval && t2.interval !== "lifetime")
    return i2("cta.start_trial", "Start {days}-Day Free Trial", { days: t2.trial_days });
  if (!t2.interval || t2.interval === "lifetime")
    return i2("cta.get_lifetime_access", "Get Lifetime Access");
  const n2 = Vt$1[t2.interval];
  return n2 ? i2(n2, $t$1[t2.interval]) : i2("cta.get_plan_generic", "Get {interval} Plan", {
    interval: qt$1(t2.interval)
  });
}
function qt$1(t2) {
  return t2.length ? t2[0].toUpperCase() + t2.slice(1) : t2;
}
function Gt$1({ block: t2, ctx: e2 }) {
  const { t: r2 } = M$1(), [i2, n2] = d(false), s2 = t2.priceId ?? e2.selectedPriceId, o3 = i2 || t2.action === "checkout" && !s2, c2 = s2 ? e2.bootstrap.prices.find((g2) => g2.id === s2) ?? null : null, l2 = e2.bootstrap.user?.had_previous_trial ?? false, p2 = t2.label ?? Ht$1(c2, t2.action, l2, r2);
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      disabled: o3,
      onClick: async () => {
        if (!o3) {
          n2(true);
          try {
            await e2.onAction(t2.action, { priceId: s2 });
          } finally {
            n2(false);
          }
        }
      },
      class: "pw-cta-shimmer relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
      style: {
        background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
        boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
      },
      children: [
        /* @__PURE__ */ u$1(
          "span",
          {
            class: "absolute inset-0 opacity-40",
            style: {
              background: "radial-gradient(circle at 50% 0%, color-mix(in srgb, white 40%, transparent) 0%, transparent 70%)"
            },
            "aria-hidden": "true"
          }
        ),
        i2 ? /* @__PURE__ */ u$1("span", { class: "relative z-10 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" }) : /* @__PURE__ */ u$1("span", { class: "relative z-10", children: p2 })
      ]
    }
  );
}
function Wt$1({ ctx: t2 }) {
  const { t: e2 } = M$1(), r2 = t2.authSession, i2 = t2.auth, [n2, s2] = d(false), o3 = () => t2.onAction("support");
  if (r2 && !r2.user.is_anonymous) {
    const c2 = async () => {
      if (!(!i2 || n2)) {
        s2(true);
        try {
          await i2.signOut();
        } catch {
        } finally {
          s2(false);
        }
      }
    };
    return /* @__PURE__ */ u$1("div", { class: "-mt-3 flex flex-col items-center gap-1.5 pt-1 text-center text-[13px] text-gray-500", children: [
      /* @__PURE__ */ u$1("span", { children: [
        e2("session.signed_in_as_prefix", "Signed in as"),
        " ",
        /* @__PURE__ */ u$1("b", { class: "font-medium text-gray-700", children: r2.user.email })
      ] }),
      /* @__PURE__ */ u$1("div", { class: "flex items-center justify-center gap-3", children: [
        /* @__PURE__ */ u$1(J$1, { onClick: c2, disabled: !i2 || n2, children: n2 ? e2("session.signing_out", "Signing out…") : e2("session.sign_out", "Sign Out") }),
        /* @__PURE__ */ u$1(ze$1, {}),
        /* @__PURE__ */ u$1(J$1, { onClick: o3, children: e2("session.contact_support", "Contact Support") })
      ] })
    ] });
  }
  return /* @__PURE__ */ u$1("div", { class: "-mt-3 flex items-center justify-center gap-3 pt-1 text-center text-[13px]", children: [
    /* @__PURE__ */ u$1(J$1, { onClick: () => t2.onAction("restore"), children: e2("session.restore_purchases", "Restore purchases") }),
    /* @__PURE__ */ u$1(ze$1, {}),
    /* @__PURE__ */ u$1(J$1, { onClick: o3, children: e2("session.contact_support", "Contact Support") })
  ] });
}
function J$1({
  onClick: t2,
  disabled: e2,
  children: r2
}) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      onClick: t2,
      disabled: e2,
      class: "font-semibold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:opacity-80",
      style: { color: "var(--pw-accent)" },
      children: r2
    }
  );
}
function ze$1() {
  return /* @__PURE__ */ u$1("span", { class: "h-1 w-1 rounded-full bg-gray-300", "aria-hidden": "true" });
}
function Zt$1({ block: t2 }) {
  return t2.items.length ? /* @__PURE__ */ u$1("ul", { class: "flex flex-col gap-2.5", role: "list", children: t2.items.map((e2) => /* @__PURE__ */ u$1("li", { class: "flex items-start gap-3 text-sm text-gray-700", children: [
    /* @__PURE__ */ u$1(
      "svg",
      {
        width: "18",
        height: "18",
        viewBox: "0 0 20 20",
        fill: "none",
        class: "mt-0.5 flex-shrink-0 text-emerald-500",
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1(
          "path",
          {
            d: "M4 10.5l3.5 3.5 8.5-8.5",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        )
      }
    ),
    /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ u$1("span", { class: "font-medium leading-snug text-gray-900", children: e2.name }),
      e2.desc ? /* @__PURE__ */ u$1("span", { class: "text-xs leading-relaxed text-gray-400", children: e2.desc }) : null
    ] })
  ] }, e2.id)) }) : null;
}
function Kt$1({ block: t2 }) {
  const { t: e2 } = M$1(), r2 = t2.title ?? e2("pricing.money_back", "30-day money-back guarantee"), i2 = t2.subtitle, n2 = (t2.icon ?? "dollar_shield") !== "none", s2 = Yt$1(r2);
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-1.5 border-b-1 pb-4 mb-1 border-gray-100", children: [
    /* @__PURE__ */ u$1("div", { class: "inline-flex items-center gap-2 text-[12px] text-gray-700", children: [
      n2 ? /* @__PURE__ */ u$1(Xt$1, {}) : null,
      s2 ? /* @__PURE__ */ u$1("span", { children: [
        /* @__PURE__ */ u$1("b", { class: "font-bold text-gray-900", children: s2.bold }),
        " ",
        /* @__PURE__ */ u$1("span", { class: "font-medium", children: s2.rest })
      ] }) : /* @__PURE__ */ u$1("span", { class: "font-medium", children: r2 })
    ] }),
    i2 ? /* @__PURE__ */ u$1("span", { class: "text-center text-xs leading-relaxed text-gray-500", children: i2 }) : null
  ] });
}
function Yt$1(t2) {
  const e2 = t2.match(/^(\d+[-\s]?days?)\s+(.+)$/i);
  return e2 ? { bold: e2[1], rest: e2[2] } : null;
}
function Xt$1() {
  return /* @__PURE__ */ u$1(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      width: "16",
      height: "16",
      class: "flex-shrink-0 text-emerald-500",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M12 2 4 5v6c0 5.25 3.5 9.5 8 11 4.5-1.5 8-5.75 8-11V5l-8-3Z",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "m9 12 2 2 4-4",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        )
      ]
    }
  );
}
const Ze$1 = 24, Jt$1 = 16, Qt$1 = 2;
function er$1(t2, e2) {
  const r2 = e2 * Qt$1;
  let i2 = Ze$1;
  for (t2.style.fontSize = `${i2}px`; t2.scrollHeight > r2 && i2 > Jt$1; )
    i2 -= 1, t2.style.fontSize = `${i2}px`;
}
function tr$1({ block: t2, ctx: e2 }) {
  const r2 = t2.level ?? 1, i2 = `h${r2}`, n2 = r2 === 1 ? "text-[22px] sm:text-2xl font-semibold leading-tight text-center text-balance text-gray-800" : r2 === 2 ? "text-xl font-semibold leading-snug text-gray-900 tracking-tight" : "text-base font-medium text-gray-900", s2 = A(null), o3 = r2 === 1 && !!e2.bootstrap.settings.title_auto_fit;
  return y(() => {
    if (!o3 || !s2.current) return;
    const c2 = getComputedStyle(s2.current), l2 = parseFloat(c2.lineHeight) || Ze$1 * 1.5;
    er$1(s2.current, l2);
  }, [o3, t2.text]), /* @__PURE__ */ u$1(i2, { ref: s2, class: n2, children: t2.text });
}
function rr$1(t2) {
  const e2 = t2.local ?? { currency: t2.currency, amount: t2.amount };
  if (t2.interval === "year") {
    const r2 = (t2.interval_count ?? 1) * 12;
    return { amount: e2.amount / r2, currency: e2.currency };
  }
  return { amount: e2.amount, currency: e2.currency };
}
function ue$1(t2, e2) {
  const r2 = t2 % 1 !== 0 ? 2 : 0;
  try {
    const i2 = new Intl.NumberFormat(void 0, {
      style: "currency",
      currency: e2,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: r2,
      minimumFractionDigits: r2
    }).formatToParts(t2);
    let n2 = "", s2 = "";
    for (const o3 of i2)
      o3.type === "currency" ? n2 = o3.value : o3.type !== "literal" && (s2 += o3.value);
    return { currency: n2 || e2, amount: s2.trim() };
  } catch {
    return { currency: e2, amount: String(t2) };
  }
}
function fe$1(t2, e2) {
  const { amount: r2, currency: i2 } = rr$1(t2);
  if (!e2) {
    const { currency: c2, amount: l2 } = ue$1(r2, i2);
    return { currency: c2, amount: l2, originalAmount: null };
  }
  const n2 = r2 * (1 - e2 / 100), s2 = ue$1(n2, i2), o3 = ue$1(r2, i2);
  return {
    currency: s2.currency,
    amount: s2.amount,
    originalAmount: `${o3.currency}${o3.amount}`
  };
}
function Ke$1(t2, e2) {
  if (t2.label) return t2.label.toUpperCase();
  if (!t2.interval || t2.interval === "lifetime")
    return e2("pricing.plan_label.lifetime", "LIFETIME");
  const i2 = {
    day: { key: "pricing.plan_label.daily", fallback: "DAILY PLAN" },
    week: { key: "pricing.plan_label.weekly", fallback: "WEEKLY PLAN" },
    month: { key: "pricing.plan_label.monthly", fallback: "MONTHLY PLAN" },
    year: { key: "pricing.plan_label.yearly", fallback: "YEARLY PLAN" }
  }[t2.interval];
  return i2 ? e2(i2.key, i2.fallback) : `${t2.interval.toUpperCase()} PLAN`;
}
function we$1(t2, e2) {
  if (!t2.interval || t2.interval === "lifetime")
    return e2("pricing.interval.lifetime_short", "lifetime");
  if (t2.interval === "year") return e2("pricing.interval.month", "month");
  const r2 = t2.interval_count ?? 1;
  return r2 === 1 ? e2(`pricing.interval.${t2.interval}`, t2.interval) : `${r2} ${t2.interval}s`;
}
function ir$1({ block: t2, ctx: e2 }) {
  const { t: r2 } = M$1(), i2 = t2.priceIds && t2.priceIds.length > 0 ? new Set(t2.priceIds) : null, n2 = e2.bootstrap.prices.filter((o3) => !i2 || i2.has(o3.id));
  if (n2.length === 0)
    return /* @__PURE__ */ u$1("p", { class: "text-sm text-gray-500", children: r2("pricing.no_prices", "No prices available.") });
  const s2 = t2.popular_label ?? r2("pricing.most_popular", "Most popular");
  if (t2.view === "compact")
    return /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex w-full flex-col rounded-xl border border-gray-200 bg-gray-50",
        role: "radiogroup",
        "aria-label": r2("pricing.plans_aria", "Plans"),
        children: n2.map((o3, c2) => /* @__PURE__ */ u$1(
          ar$1,
          {
            price: o3,
            isLast: c2 === n2.length - 1,
            isPopular: t2.popular_price_id === o3.id,
            popularLabel: s2,
            offer: Wt$2(e2.bootstrap.offers, o3.id, { readStart: Yt$2 }),
            selected: e2.selectedPriceId === o3.id,
            onSelect: () => {
              e2.setSelectedPriceId(o3.id), e2.onAction("price_selected", { priceId: o3.id, price: o3 });
            },
            t: r2
          },
          o3.id
        ))
      }
    );
  if (t2.view === "horizontal") {
    const o3 = Math.min(n2.length, 3), c2 = n2.some(
      (l2) => (Wt$2(e2.bootstrap.offers, l2.id, { readStart: Yt$2 })?.discount_percent ?? 0) > 0
    );
    return /* @__PURE__ */ u$1(
      "div",
      {
        class: "grid items-stretch gap-2",
        style: { gridTemplateColumns: `repeat(${o3}, minmax(0, 1fr))` },
        role: "radiogroup",
        "aria-label": r2("pricing.plans_aria", "Plans"),
        children: n2.map((l2) => /* @__PURE__ */ u$1(
          sr$1,
          {
            price: l2,
            isPopular: t2.popular_price_id === l2.id,
            popularLabel: s2,
            offer: Wt$2(e2.bootstrap.offers, l2.id, { readStart: Yt$2 }),
            reserveStrikeRow: c2,
            selected: e2.selectedPriceId === l2.id,
            onSelect: () => {
              e2.setSelectedPriceId(l2.id), e2.onAction("price_selected", { priceId: l2.id, price: l2 });
            },
            t: r2
          },
          l2.id
        ))
      }
    );
  }
  return /* @__PURE__ */ u$1(
    "div",
    {
      class: "flex flex-col gap-2",
      role: "radiogroup",
      "aria-label": r2("pricing.plans_aria", "Plans"),
      children: n2.map((o3) => {
        const c2 = e2.selectedPriceId === o3.id, l2 = t2.popular_price_id === o3.id, u2 = Wt$2(e2.bootstrap.offers, o3.id, { readStart: Yt$2 })?.discount_percent ?? null, { currency: g2, amount: y2, originalAmount: _2 } = fe$1(o3, u2);
        return /* @__PURE__ */ u$1(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": c2,
            onClick: () => {
              e2.setSelectedPriceId(o3.id), e2.onAction("price_selected", { priceId: o3.id, price: o3 });
            },
            class: [
              "group relative inline-flex w-full mx-auto items-center justify-between flex-row-reverse gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
              // border 2px everywhere — selection is expressed by color only, the layout
              // does not jump (equal thickness for selected/unselected). The color
              // difference accent vs gray is strong enough for visual hierarchy.
              c2 ? "border-[var(--pw-accent)] bg-transparent" : "border-gray-200 bg-transparent hover:bg-gray-50"
            ].join(" "),
            children: [
              /* @__PURE__ */ u$1(
                "span",
                {
                  class: [
                    "flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                    c2 ? "border-[var(--pw-accent)] text-white" : "border-gray-300 bg-transparent text-transparent",
                    // The popular-label badge sits absolute at the top-right of the card and
                    // visually shifts the content's center down. flex items-center
                    // on the card keeps the checkmark at the geometric center, which
                    // makes it look too high — we compensate with a small mt.
                    l2 ? "mt-3" : ""
                  ].join(" "),
                  style: c2 ? {
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 70%, white) 0%, var(--pw-accent) 50%, color-mix(in srgb, var(--pw-accent) 85%, black) 100%)"
                  } : void 0,
                  "aria-hidden": "true",
                  children: /* @__PURE__ */ u$1(
                    "svg",
                    {
                      width: "14",
                      height: "10",
                      viewBox: "0 0 17 12",
                      fill: "none",
                      xmlns: "http://www.w3.org/2000/svg",
                      class: c2 ? "opacity-100" : "opacity-0",
                      children: /* @__PURE__ */ u$1(
                        "path",
                        {
                          d: "M16.5234 0.476562C16.9805 0.898438 16.9805 1.63672 16.5234 2.05859L7.52344 11.0586C7.10156 11.5156 6.36328 11.5156 5.94141 11.0586L1.44141 6.55859C0.984375 6.13672 0.984375 5.39844 1.44141 4.97656C1.86328 4.51953 2.60156 4.51953 3.02344 4.97656L6.75 8.66797L14.9414 0.476562C15.3633 0.0195312 16.1016 0.0195312 16.5234 0.476562Z",
                          fill: "currentColor"
                        }
                      )
                    }
                  )
                }
              ),
              /* @__PURE__ */ u$1("div", { class: "flex flex-1 flex-col gap-0.5", children: [
                /* @__PURE__ */ u$1("div", { class: "flex flex-wrap items-center gap-x-2 gap-y-1", children: [
                  /* @__PURE__ */ u$1("span", { class: "text-xs font-normal uppercase tracking-normal text-gray-800/70", children: Ke$1(o3, r2) }),
                  _2 ? (
                    // opacity-60 mutes the strike: the eye catches the label
                    // and discount badge first, then the main price; the original "former price"
                    // is tertiary info and should not compete with the label.
                    /* @__PURE__ */ u$1("span", { class: "text-[15px] font-normal text-gray-400 opacity-60 line-through decoration-gray-400 decoration-[1.5px]", children: _2 })
                  ) : null,
                  u2 ? (
                    // Emerald pill — a fixed "success/savings", independent of
                    // brand_color. Readable even on dark brand accents.
                    /* @__PURE__ */ u$1("span", { class: "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold leading-none text-emerald-700", children: [
                      "-",
                      u2,
                      "%"
                    ] })
                  ) : null
                ] }),
                /* @__PURE__ */ u$1("div", { class: "flex items-baseline gap-2 flex-wrap", children: /* @__PURE__ */ u$1("span", { class: "text-[26px] leading-tight whitespace-nowrap text-gray-800 font-medium", children: [
                  /* @__PURE__ */ u$1("span", { class: "opacity-90", children: g2 }),
                  y2,
                  /* @__PURE__ */ u$1("span", { class: "text-sm font-normal text-gray-500", children: [
                    " ",
                    "/ ",
                    we$1(o3, r2)
                  ] })
                ] }) }),
                o3.description ? /* @__PURE__ */ u$1("span", { class: "mt-1 text-xs leading-relaxed text-gray-500", children: o3.description }) : null
              ] }),
              l2 ? /* @__PURE__ */ u$1(
                "span",
                {
                  class: "absolute -top-[9px] -right-[6px] rounded-[11px] border-[5px] border-white px-2 py-1 text-[12px] font-semibold text-white",
                  style: { background: "var(--pw-accent)" },
                  children: s2
                }
              ) : null
            ]
          },
          o3.id
        );
      })
    }
  );
}
function nr$1(t2, e2) {
  return t2.label ? t2.label : !t2.interval || t2.interval === "lifetime" ? e2("pricing.interval.lifetime_short", "lifetime") : e2(`pricing.interval.${t2.interval}`, t2.interval);
}
function ar$1({
  price: t2,
  isLast: e2,
  isPopular: r2,
  popularLabel: i2,
  offer: n2,
  selected: s2,
  onSelect: o3,
  t: c2
}) {
  const l2 = n2?.discount_percent ?? null, { currency: p2, amount: u2, originalAmount: g2 } = fe$1(t2, l2);
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      role: "radio",
      "aria-checked": s2,
      onClick: o3,
      class: "group relative inline-flex w-full max-w-[360px] mx-auto items-center justify-between gap-4 px-4 pt-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pw-accent)]",
      children: [
        /* @__PURE__ */ u$1(
          "span",
          {
            class: [
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-colors mb-3",
              s2 ? "border-[var(--pw-accent)] text-white" : "border-gray-300 bg-transparent text-transparent"
            ].join(" "),
            style: s2 ? {
              background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 70%, white) 0%, var(--pw-accent) 50%, color-mix(in srgb, var(--pw-accent) 85%, black) 100%)"
            } : void 0,
            "aria-hidden": "true",
            children: /* @__PURE__ */ u$1(
              "svg",
              {
                width: "14",
                height: "10",
                viewBox: "0 0 17 12",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                class: s2 ? "opacity-100" : "opacity-0",
                children: /* @__PURE__ */ u$1(
                  "path",
                  {
                    d: "M16.5234 0.476562C16.9805 0.898438 16.9805 1.63672 16.5234 2.05859L7.52344 11.0586C7.10156 11.5156 6.36328 11.5156 5.94141 11.0586L1.44141 6.55859C0.984375 6.13672 0.984375 5.39844 1.44141 4.97656C1.86328 4.51953 2.60156 4.51953 3.02344 4.97656L6.75 8.66797L14.9414 0.476562C15.3633 0.0195312 16.1016 0.0195312 16.5234 0.476562Z",
                    fill: "currentColor"
                  }
                )
              }
            )
          }
        ),
        /* @__PURE__ */ u$1(
          "div",
          {
            class: [
              "flex flex-1 items-center gap-1.5 pb-3.5",
              e2 ? "" : "border-b border-gray-200"
            ].join(" "),
            children: [
              /* @__PURE__ */ u$1("div", { class: "flex flex-wrap items-center gap-1 gap-x-1.5", children: [
                /* @__PURE__ */ u$1("span", { class: "text-base font-normal capitalize text-gray-800", children: nr$1(t2, c2) }),
                r2 ? (
                  // Pastel brand-mix pill — exactly like `badge` in TelegramPricingRadio.
                  // Low visual weight: the pill is about the "plan name" (most popular), not
                  // about savings — it should not compete with the -X% discount pill.
                  /* @__PURE__ */ u$1(
                    "span",
                    {
                      class: "rounded-[9px] px-2 py-1 text-[10px] font-bold",
                      style: {
                        background: "linear-gradient(160deg, color-mix(in srgb, var(--pw-accent) 6%, white) 0%, color-mix(in srgb, var(--pw-accent) 15%, white) 100%)",
                        color: "var(--pw-accent)"
                      },
                      children: i2
                    }
                  )
                ) : null,
                l2 ? /* @__PURE__ */ u$1("span", { class: "rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700", children: [
                  "-",
                  l2,
                  "%"
                ] }) : null
              ] }),
              /* @__PURE__ */ u$1("div", { class: "flex-1" }),
              /* @__PURE__ */ u$1("span", { class: "flex items-baseline gap-1.5 text-base font-normal text-gray-600", children: [
                g2 ? /* @__PURE__ */ u$1("span", { class: "text-xs text-gray-400 line-through decoration-gray-400 decoration-[1.5px]", children: g2 }) : null,
                /* @__PURE__ */ u$1("span", { class: "whitespace-nowrap", children: [
                  /* @__PURE__ */ u$1("span", { class: "opacity-90", children: p2 }),
                  u2,
                  /* @__PURE__ */ u$1("span", { class: "text-xs text-gray-400", children: [
                    " ",
                    "/ ",
                    we$1(t2, c2)
                  ] })
                ] })
              ] })
            ]
          }
        )
      ]
    }
  );
}
function sr$1({
  price: t2,
  isPopular: e2,
  popularLabel: r2,
  offer: i2,
  reserveStrikeRow: n2,
  selected: s2,
  onSelect: o3,
  t: c2
}) {
  const l2 = i2?.discount_percent ?? null, { currency: p2, amount: u2, originalAmount: g2 } = fe$1(t2, l2);
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      role: "radio",
      "aria-checked": s2,
      onClick: o3,
      class: [
        "group relative flex h-full flex-col items-center justify-start gap-1 rounded-2xl border-2 px-3 pb-4 pt-3.5 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        s2 ? "border-[var(--pw-accent)]" : "border-gray-200 hover:bg-gray-50"
      ].join(" "),
      style: s2 ? { background: "color-mix(in srgb, var(--pw-accent) 6%, transparent)" } : void 0,
      children: [
        /* @__PURE__ */ u$1("span", { class: "flex min-h-[2.4em] items-center text-[10px] font-normal uppercase leading-tight text-gray-800/70", children: Ke$1(t2, c2) }),
        n2 ? /* @__PURE__ */ u$1("div", { class: "flex h-[22px] items-center justify-center gap-1.5", children: [
          g2 ? /* @__PURE__ */ u$1("span", { class: "text-[12px] text-gray-400 line-through decoration-gray-400 decoration-[1.5px]", children: g2 }) : null,
          l2 ? /* @__PURE__ */ u$1("span", { class: "rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700", children: [
            "-",
            l2,
            "%"
          ] }) : null
        ] }) : null,
        /* @__PURE__ */ u$1("span", { class: "text-[26px] leading-none whitespace-nowrap text-gray-800 font-medium", children: [
          /* @__PURE__ */ u$1("span", { class: "opacity-90", children: p2 }),
          u2
        ] }),
        /* @__PURE__ */ u$1("span", { class: "text-xs font-normal text-gray-500", children: [
          "/ ",
          we$1(t2, c2)
        ] }),
        e2 ? /* @__PURE__ */ u$1(
          "span",
          {
            class: "absolute -top-[10px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[11px] border-[3px] border-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white",
            style: { background: "var(--pw-accent)" },
            children: r2
          }
        ) : null
      ]
    }
  );
}
function or$1({ block: t2 }) {
  return /* @__PURE__ */ u$1("p", { class: "text-[0.9375rem] leading-relaxed text-gray-600", children: t2.text });
}
const lr$1 = {
  week: 0.25,
  month: 1,
  year: 12
};
function cr$1(t2, e2) {
  return t2 ? e2(`pricing.interval.${t2}`, t2) : e2("pricing.interval.period", "period");
}
function dr$1({ block: t2, ctx: e2 }) {
  const { t: r2 } = M$1();
  if (!t2.queries.length) return null;
  const n2 = e2.bootstrap.prices.find((o3) => o3.id === e2.selectedPriceId)?.interval ?? null, s2 = n2 ? lr$1[n2] : void 0;
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-2", children: [
    /* @__PURE__ */ u$1("div", { class: "text-sm font-semibold text-gray-800", children: !n2 || n2 === "lifetime" ? r2("pricing.included_total", "Included for lifetime:") : r2("pricing.included_per", "Included per {interval}:", {
      interval: cr$1(n2, r2)
    }) }),
    /* @__PURE__ */ u$1("ul", { class: "flex flex-col gap-2", role: "list", children: t2.queries.map((o3) => {
      const c2 = Number.isFinite(o3.count) ? o3.count : 0, l2 = s2 !== void 0 ? Math.round(c2 * s2) : c2;
      return /* @__PURE__ */ u$1("li", { class: `flex gap-3 ${o3.desc ? "items-start" : "items-center"}`, children: [
        /* @__PURE__ */ u$1(
          "svg",
          {
            width: "18",
            height: "18",
            viewBox: "0 0 20 20",
            fill: "none",
            class: `flex-shrink-0 text-emerald-500 ${o3.desc ? "mt-0.5" : ""}`,
            "aria-hidden": "true",
            children: /* @__PURE__ */ u$1(
              "path",
              {
                d: "M4 10.5l3.5 3.5 8.5-8.5",
                stroke: "currentColor",
                "stroke-width": "2.5",
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
              }
            )
          }
        ),
        /* @__PURE__ */ u$1("div", { children: [
          /* @__PURE__ */ u$1("span", { class: "font-semibold text-gray-900 text-sm", children: l2 }),
          " ",
          /* @__PURE__ */ u$1("span", { class: "text-sm text-gray-800", children: o3.name }),
          o3.desc ? /* @__PURE__ */ u$1(k$1, { children: [
            /* @__PURE__ */ u$1("br", {}),
            /* @__PURE__ */ u$1("span", { class: "text-xs text-gray-400", children: o3.desc })
          ] }) : null
        ] })
      ] }, o3.id);
    }) })
  ] });
}
const ur$1 = {
  heading: tr$1,
  text: or$1,
  price_grid: ir$1,
  cta_button: Gt$1,
  auth_panel: $e$1,
  current_session: Wt$1,
  features_list: Zt$1,
  tokenization_gate: dr$1,
  guarantee_badge: Kt$1,
  offer_banner: zt$1
};
function pr$1(t2, e2) {
  if (!e2) return t2;
  const r2 = t2.blocks.findIndex(
    (n2) => n2.type === "heading" && (n2.level ?? 1) === 1
  );
  if (r2 === -1)
    return {
      ...t2,
      blocks: [{ type: "heading", text: e2, level: 1 }, ...t2.blocks]
    };
  const i2 = t2.blocks.slice();
  return i2[r2] = { ...i2[r2], text: e2 }, { ...t2, blocks: i2 };
}
function hr$1({
  layout: t2,
  bootstrap: e2,
  onAction: r2,
  auth: i2,
  authSession: n2,
  hasTopBanner: s2,
  titleOverride: o3
}) {
  const c2 = T(
    () => pr$1(t2, o3),
    [t2, o3]
  ), l2 = T(() => {
    for (const v2 of c2.blocks)
      if (v2.type === "price_grid" && v2.popular_price_id && e2.prices.some((z2) => z2.id === v2.popular_price_id))
        return v2.popular_price_id;
    return e2.prices[0]?.id ?? null;
  }, [c2.blocks, e2.prices]), [p2, u2] = d(l2), g2 = {
    bootstrap: e2,
    selectedPriceId: p2,
    setSelectedPriceId: u2,
    onAction: r2,
    auth: i2,
    authSession: n2
  }, y2 = c2.blocks.findIndex((v2) => v2.type === "cta_button"), _2 = y2 === -1 ? c2.blocks : c2.blocks.slice(0, y2), m2 = y2 === -1 ? [] : c2.blocks.slice(y2), f2 = (v2, z2) => {
    const h2 = ur$1[v2.type];
    return h2 ? /* @__PURE__ */ u$1(h2, { block: v2, ctx: g2 }, `${v2.type}-${z2}`) : (typeof console < "u" && console.warn(`[paywall] unknown block type: ${v2.type}`), null);
  };
  return /* @__PURE__ */ u$1(k$1, { children: [
    /* @__PURE__ */ u$1("div", { class: "flex-1 min-h-0 overflow-y-auto px-6 pb-3 pt-6 sm:px-8 sm:pb-4 sm:pt-8", children: /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-6", children: _2.map(f2) }) }),
    m2.length > 0 ? (
      // A thin shadow-top instead of border-t — creates depth, reads as
      // "the footer is pinned to the bottom of the dialog". The line looked like a divider
      // in normal flow and didn't convey the sticky character.
      /* @__PURE__ */ u$1(
        "div",
        {
          class: "flex flex-col gap-4 bg-white px-6 pb-6 pt-3 sm:px-8",
          style: { boxShadow: "0 -4px 12px -4px rgba(15,23,42,0.06)" },
          children: m2.map((v2, z2) => f2(v2, _2.length + z2))
        }
      )
    ) : null
  ] });
}
function gr$1(t2, e2, r2, i2) {
  return t2 ? i2 ? { open: true, view: "purchased", error: null, processing: false } : e2.status === "idle" || e2.status === "loading" ? { open: true, view: "loading", error: null, processing: false } : e2.status === "error" ? { open: true, view: "error", error: e2.error, processing: false } : r2.kind === "support" ? { open: true, view: "support", error: null, processing: false } : r2.kind === "auth_gate" ? { open: true, view: "auth", error: null, processing: false } : r2.kind === "awaiting_payment" ? { open: true, view: "awaiting_payment", error: null, processing: false } : r2.kind === "popup_blocked" ? { open: true, view: "popup_blocked", error: null, processing: false } : r2.kind === "purchase_success" ? { open: true, view: "purchased", error: null, processing: false } : r2.kind === "verifying" ? { open: true, view: "loading", error: null, processing: false } : { open: true, view: "layout", error: null, processing: false } : { open: false, view: null, error: null, processing: false };
}
function fr$1(t2, e2) {
  return t2.open === e2.open && t2.view === e2.view && t2.error === e2.error && t2.processing === e2.processing;
}
function wr$1({
  client: t2,
  open: e2,
  onClose: r2,
  onEvent: i2,
  initialView: n2,
  initialAuthMode: s2,
  initialCheckoutPriceId: o3,
  initialCheckoutUrl: c2,
  purchased: l2,
  renew: p2,
  onState: u2,
  inline: g2,
  locale: y$12,
  titleOverride: _$12
}) {
  const [m2, f2] = d({ status: "idle" }), [v2, z2] = d(
    () => t2.auth?.getCachedSession() ?? null
  ), [h2, b] = d(() => n2 === "support" ? { kind: "support", origin: "standalone" } : n2 === "auth" ? o3 ? {
    kind: "auth_gate",
    pendingCheckout: { priceId: o3, direct: true },
    origin: "standalone",
    intent: "preauth"
  } : { kind: "auth_gate", origin: "standalone" } : n2 === "awaiting_payment" && o3 && c2 ? {
    kind: "awaiting_payment",
    priceId: o3,
    url: c2
  } : n2 === "popup_blocked" && o3 && c2 ? {
    kind: "popup_blocked",
    priceId: o3,
    url: c2
  } : { kind: "layout" }), T2 = n2 === "awaiting_payment" || n2 === "popup_blocked" || n2 === "auth" && !!o3, R2 = A(false), E2 = A(null);
  y(() => {
    if (!u2) return;
    const w2 = gr$1(e2, m2, h2, l2), I2 = E2.current;
    I2 && fr$1(I2, w2) || (E2.current = w2, u2(w2));
  }, [e2, m2, h2, l2, u2]), y(() => {
    if (t2.auth)
      return t2.auth.onAuthChange((w2, I2) => z2(I2));
  }, [t2.auth]), y(() => {
    if (typeof t2.onBootstrapChange == "function")
      return t2.onBootstrapChange((w2) => {
        f2(
          (I2) => I2.status === "ready" ? { status: "ready", data: w2 } : I2
        );
      });
  }, [t2]), y(() => {
    if (!e2 || m2.status === "ready" || m2.status === "loading") return;
    let w2 = false;
    return f2({ status: "loading" }), t2.bootstrap().then((I2) => {
      w2 || (f2({ status: "ready", data: I2 }), i2("ready", I2));
    }).catch((I2) => {
      if (w2) return;
      const S2 = I2 instanceof o$2 ? I2 : new o$2("unknown", "Failed to load paywall", { cause: I2 });
      f2({ status: "error", error: S2 }), i2("error", S2);
    }), () => {
      w2 = true;
    };
  }, [e2, t2]), _(() => {
    if (!e2) {
      b({ kind: "layout" }), R2.current = false, f2((w2) => w2.status === "loading" ? { status: "idle" } : w2);
      return;
    }
    n2 === "support" ? b({ kind: "support", origin: "standalone" }) : n2 === "auth" ? b(o3 ? {
      kind: "auth_gate",
      pendingCheckout: { priceId: o3, direct: true },
      origin: "standalone",
      intent: "preauth"
    } : { kind: "auth_gate", origin: "standalone" }) : n2 === "awaiting_payment" && o3 && c2 ? b({
      kind: "awaiting_payment",
      priceId: o3,
      url: c2
    }) : n2 === "popup_blocked" && o3 && c2 && b({
      kind: "popup_blocked",
      priceId: o3,
      url: c2
    });
  }, [e2, n2, o3, c2]);
  const U2 = async (w2, { allowAuthGate: I2 = true } = {}) => {
    try {
      const S2 = t2.getCachedOffers?.() ?? null, C2 = S2 ? Wt$2(S2, w2, { readStart: Yt$2 }) : null, k2 = await t2.createCheckout({
        priceId: w2,
        offerId: C2?.id,
        ignoreActivePurchase: p2 === true
      });
      if (i2("checkout_started", { priceId: w2, url: k2.url, acquiring: k2.acquiring }), typeof window > "u" || !k2.url) return;
      const A2 = window.open(k2.url, "_blank");
      if (A2) {
        try {
          A2.opener = null;
        } catch {
        }
        b({ kind: "awaiting_payment", priceId: w2, url: k2.url });
      } else
        b({ kind: "popup_blocked", priceId: w2, url: k2.url });
    } catch (S2) {
      if (S2 instanceof o$2 && S2.code === "already_purchased") {
        try {
          await t2.getUser({ force: true });
        } catch {
        }
        i2("purchase_completed", { priceId: w2, sessionId: null, restored: true }), T2 ? r2() : b({ kind: "purchase_success", restored: true });
        return;
      }
      if (I2 && S2 instanceof o$2 && S2.status === 401 && t2.auth && (m2.status === "ready" ? m2.data.settings.checkout_mode ?? "guest" : "guest") === "preauth") {
        i2("error", S2), b({
          kind: "auth_gate",
          pendingCheckout: { priceId: w2, direct: T2 },
          intent: "preauth"
        });
        return;
      }
      const C2 = S2 instanceof o$2 ? S2 : new o$2("checkout_failed", "Checkout failed", { cause: S2 });
      i2("error", C2), T2 ? r2() : b({ kind: "layout" });
    }
  }, D2 = (w2, I2) => {
    if (typeof window > "u") return;
    const S2 = window.open(I2, "_blank");
    if (S2) {
      try {
        S2.opener = null;
      } catch {
      }
      b({ kind: "awaiting_payment", priceId: w2, url: I2 });
    }
  };
  y(() => {
    if (h2.kind !== "auth_gate" || !v2 || v2.user.is_anonymous || R2.current) return;
    R2.current = true;
    const w2 = h2.pendingCheckout, I2 = h2.origin;
    b({ kind: "verifying" }), (async () => {
      if (!p2)
        try {
          if ((await t2.getUser({ force: true })).has_active_subscription) {
            i2("purchase_completed", {
              priceId: w2?.priceId ?? null,
              sessionId: null,
              restored: true
            }), w2?.direct ? r2() : b({ kind: "purchase_success", restored: true });
            return;
          }
        } catch {
        }
      if (!w2) {
        I2 === "standalone" ? r2() : b({ kind: "layout" });
        return;
      }
      await U2(w2.priceId, { allowAuthGate: false });
    })().finally(() => {
      R2.current = false;
    });
  }, [v2, h2]);
  const V2 = async (w2, I2) => {
    if (w2 === "close") {
      r2();
      return;
    }
    if (w2 === "price_selected") {
      i2("price_selected", I2);
      return;
    }
    if (w2 === "restore") {
      if (!t2.auth) return;
      const S2 = t2.auth.getCachedSession();
      if (S2 && !S2.user.is_anonymous) return;
      b({ kind: "auth_gate", intent: "restore" });
      return;
    }
    if (w2 === "support") {
      b({ kind: "support", origin: "layout" });
      return;
    }
    if (w2 === "checkout" && m2.status === "ready") {
      const S2 = I2?.priceId;
      if (!S2) {
        i2("error", new o$2("no_price", "No price selected"));
        return;
      }
      const C2 = m2.data.settings.checkout_mode ?? "guest", k2 = t2.auth?.getCachedSession() ?? null, A2 = !!k2 && !k2.user.is_anonymous;
      if (C2 === "preauth" && !!t2.auth && !A2) {
        b({ kind: "auth_gate", pendingCheckout: { priceId: S2 } });
        return;
      }
      await U2(S2);
    }
  }, j2 = m2.status === "ready" ? m2.data.settings.brand_color : null, P2 = m2.status === "ready" ? m2.data.settings.allow_close !== false : true, B2 = h2.kind === "layout" && m2.status === "ready" ? He$1(m2.data.offers) : null, K2 = B2 ? /* @__PURE__ */ u$1(Bt$1, { offer: B2 }) : null, ee2 = {
    type: "auth_panel",
    // We don't set the heading — AuthGate decides by intent (restore →
    // "Restore Purchases", the rest → the default "Welcome back!").
    allow_signup: true,
    allow_password_reset: true,
    // We don't hide it when a session is present — the auto-resume useEffect
    // runs faster than we'd want to show "Signed in as ..." as an intermediate
    // screen.
    hide_when_authenticated: false,
    providers: m2.status === "ready" ? m2.data.settings.auth_providers : void 0
  }, $2 = h2.kind === "support" ? /* @__PURE__ */ u$1(
    Ut$1,
    {
      client: t2,
      authSession: v2,
      origin: h2.origin,
      onBack: () => {
        h2.origin === "standalone" ? r2() : b({ kind: "layout" });
      }
    }
  ) : null, te2 = h2.kind === "auth_gate" && h2.origin !== "standalone" || h2.kind === "support", Y2 = m2.status === "ready" ? m2.data : null;
  return /* @__PURE__ */ u$1(ht$1, { bootstrap: Y2, forceLocale: y$12, children: /* @__PURE__ */ u$1(
    ft$1,
    {
      open: e2,
      onClose: r2,
      brandColor: j2,
      topBanner: K2,
      allowClose: P2,
      hideCloseButton: te2,
      inline: g2,
      labelledBy: "pw-title",
      children: l2 ? /* @__PURE__ */ u$1(H$1, { children: /* @__PURE__ */ u$1(Be$1, { onContinue: r2 }) }) : h2.kind === "purchase_success" ? /* @__PURE__ */ u$1(H$1, { children: /* @__PURE__ */ u$1(Be$1, { restored: h2.restored, onContinue: r2 }) }) : $2 || (m2.status === "loading" || m2.status === "idle" || h2.kind === "verifying" ? /* @__PURE__ */ u$1(H$1, { children: /* @__PURE__ */ u$1(mr$1, { verifying: h2.kind === "verifying" }) }) : m2.status === "error" ? /* @__PURE__ */ u$1(H$1, { children: /* @__PURE__ */ u$1(br$1, { message: m2.error.message }) }) : h2.kind === "auth_gate" && t2.auth ? /* @__PURE__ */ u$1(
        Tt$1,
        {
          block: ee2,
          bootstrap: m2.data,
          auth: t2.auth,
          authSession: v2,
          showBack: h2.origin !== "standalone",
          intent: h2.intent ?? (h2.origin === "standalone" ? "standalone" : "preauth"),
          initialMode: h2.origin === "standalone" ? s2 : void 0,
          onBack: () => {
            h2.origin === "standalone" ? r2() : b({ kind: "layout" });
          }
        }
      ) : h2.kind === "awaiting_payment" ? /* @__PURE__ */ u$1(H$1, { children: /* @__PURE__ */ u$1(
        xr$1,
        {
          client: t2,
          onBack: () => b({ kind: "layout" }),
          onReopen: () => {
            if (typeof window > "u") return;
            const w2 = window.open(h2.url, "_blank");
            if (w2)
              try {
                w2.opener = null;
              } catch {
              }
          },
          onRetry: () => U2(h2.priceId)
        }
      ) }) : h2.kind === "popup_blocked" ? /* @__PURE__ */ u$1(H$1, { children: /* @__PURE__ */ u$1(vr$1, { onReopen: () => D2(h2.priceId, h2.url) }) }) : /* @__PURE__ */ u$1(
        hr$1,
        {
          layout: m2.data.layout,
          bootstrap: m2.data,
          onAction: V2,
          auth: t2.auth,
          authSession: v2,
          titleOverride: _$12
        }
      ))
    }
  ) });
}
function H$1({ children: t2 }) {
  return /* @__PURE__ */ u$1("div", { class: "flex min-h-0 flex-1 flex-col overflow-y-auto", children: t2 });
}
function mr$1({ verifying: t2 }) {
  const { t: e2 } = M$1();
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center justify-center gap-3 py-12", children: [
    /* @__PURE__ */ u$1("span", { class: "inline-block h-7 w-7 animate-spin rounded-full border-[2.5px] border-gray-200 border-t-[var(--pw-accent)]" }),
    /* @__PURE__ */ u$1("span", { class: "text-xs font-medium tracking-wide text-gray-500", children: t2 ? e2("modal.verifying_subscription", "Checking your subscription…") : e2("modal.loading", "Loading…") })
  ] });
}
function br$1({ message: t2 }) {
  const { t: e2 } = M$1();
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-2 py-8 text-center", children: [
    /* @__PURE__ */ u$1("div", { class: "flex h-11 w-11 items-center justify-center rounded-full bg-red-50", children: /* @__PURE__ */ u$1("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
      /* @__PURE__ */ u$1("path", { d: "M10 6v5M10 14h.01", stroke: "#dc2626", "stroke-width": "2", "stroke-linecap": "round" }),
      /* @__PURE__ */ u$1("circle", { cx: "10", cy: "10", r: "8", stroke: "#dc2626", "stroke-width": "1.75" })
    ] }) }),
    /* @__PURE__ */ u$1("p", { class: "text-sm font-semibold tracking-tight text-gray-900", children: e2("modal.error_generic", "Something went wrong") }),
    /* @__PURE__ */ u$1("p", { class: "text-xs leading-relaxed text-gray-500", children: t2 })
  ] });
}
function vr$1({ onReopen: t2 }) {
  const { t: e2 } = M$1();
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-3 py-8 text-center", children: [
    /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex h-14 w-14 items-center justify-center rounded-full",
        style: { background: "color-mix(in srgb, var(--pw-accent) 12%, white)", color: "var(--pw-accent)" },
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", children: [
          /* @__PURE__ */ u$1(
            "path",
            {
              d: "M14 4h6v6",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            }
          ),
          /* @__PURE__ */ u$1(
            "path",
            {
              d: "M20 4l-9 9",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            }
          ),
          /* @__PURE__ */ u$1(
            "path",
            {
              d: "M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ u$1(
      "p",
      {
        id: "pw-title",
        class: "mt-1 text-lg font-semibold tracking-tight text-gray-900",
        children: e2("payment.popup_blocked_title", "Allow popups to continue")
      }
    ),
    /* @__PURE__ */ u$1("p", { class: "max-w-[20rem] text-sm leading-relaxed text-gray-500", children: e2("payment.popup_blocked_message", "Your browser blocked the checkout tab. Click below to open it.") }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: t2,
        class: "mt-3 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        style: {
          background: "linear-gradient(180deg, color-mix(in srgb, var(--pw-accent) 92%, white), var(--pw-accent))",
          boxShadow: "0 1px 2px rgba(15,23,42,0.08), 0 8px 20px -6px color-mix(in srgb, var(--pw-accent) 50%, transparent)"
        },
        children: e2("payment.open_checkout_button", "Open checkout")
      }
    )
  ] });
}
function xr$1({
  client: t2,
  onBack: e2,
  onReopen: r2,
  onRetry: i2
}) {
  const { t: n2 } = M$1(), [s2, o3] = d(false), [c2, l2] = d(false), p2 = A(null);
  y(() => () => {
    p2.current !== null && clearTimeout(p2.current);
  }, []);
  const u2 = async () => {
    if (!s2) {
      o3(true), l2(false);
      try {
        if ((await t2.getUser({ force: true })).has_active_subscription) {
          typeof window < "u" && window.postMessage({ type: "paywall_purchase" }, "*");
          return;
        }
        l2(true), p2.current !== null && clearTimeout(p2.current), p2.current = setTimeout(() => {
          l2(false), p2.current = null;
        }, 5e3);
      } catch {
        l2(true);
      } finally {
        o3(false);
      }
    }
  };
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-3 px-6 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5", children: [
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: e2,
        class: "-ml-1 self-start rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
        children: n2("nav.back", "← Back")
      }
    ),
    /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-3 py-6 text-center", children: [
      /* @__PURE__ */ u$1("div", { class: "relative flex h-14 w-14 items-center justify-center", children: [
        /* @__PURE__ */ u$1(
          "span",
          {
            class: "absolute inset-0 animate-ping rounded-full opacity-40",
            style: { background: "color-mix(in srgb, var(--pw-accent) 30%, transparent)" },
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ u$1("span", { class: "relative inline-block h-8 w-8 animate-spin rounded-full border-[2.5px] border-gray-200 border-t-[var(--pw-accent)]" })
      ] }),
      /* @__PURE__ */ u$1(
        "p",
        {
          id: "pw-title",
          class: "mt-1 text-lg font-semibold tracking-tight text-gray-900",
          children: n2("payment.awaiting_title", "Complete payment in the new tab")
        }
      ),
      /* @__PURE__ */ u$1("p", { class: "max-w-[22rem] text-sm leading-relaxed text-gray-500", children: n2(
        "payment.awaiting_subtitle",
        "We'll detect your payment automatically — or click below once you're done."
      ) }),
      /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: u2,
          disabled: s2,
          class: "mt-3 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
          style: {
            background: "linear-gradient(180deg, color-mix(in srgb, var(--pw-accent) 92%, white), var(--pw-accent))",
            boxShadow: "0 1px 2px rgba(15,23,42,0.08), 0 8px 20px -6px color-mix(in srgb, var(--pw-accent) 50%, transparent)"
          },
          children: s2 ? n2("payment.checking", "Checking…") : n2("payment.ive_paid", "I've paid")
        }
      ),
      c2 ? /* @__PURE__ */ u$1("p", { class: "text-xs leading-relaxed text-gray-500", children: n2("payment.still_processing", "Payment is still being processed. Please try again in a moment.") }) : null
    ] }),
    /* @__PURE__ */ u$1("div", { class: "rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5", children: [
      /* @__PURE__ */ u$1("p", { class: "text-xs leading-relaxed text-gray-600", children: n2("payment.popup_help_text", "Checkout window didn't open or got blocked? Click here to open it again.") }),
      /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: r2,
          class: "mt-2.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
          children: n2("payment.open_checkout_again", "Open checkout again")
        }
      )
    ] }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: i2,
        class: "self-center rounded-md px-2 py-1 text-xs text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
        children: n2("payment.tab_closed_retry", "Tab closed? Try again")
      }
    )
  ] });
}
function Be$1({
  onContinue: t2,
  restored: e2 = false
}) {
  const { t: r2 } = M$1();
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-4 px-6 py-6 text-center sm:px-8", children: [
    /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex h-14 w-14 items-center justify-center rounded-full",
        style: {
          background: "linear-gradient(135deg, #4ade80, #16a34a)",
          color: "#fff",
          boxShadow: "0 0 0 8px rgba(74,222,128,0.12), 0 8px 20px -6px rgba(22,163,74,0.45)"
        },
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 13l4 4L19 7",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ) })
      }
    ),
    /* @__PURE__ */ u$1("p", { id: "pw-title", class: "mt-1 text-3xl font-bold tracking-tight text-gray-900", children: e2 ? r2("modal.purchase_restored_title", "Welcome back") : r2("modal.purchase_success_title", "Payment received") }),
    /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: r2(e2 ? "modal.purchase_restored_subtitle" : "modal.purchase_success_subtitle", "You're all set — enjoy!") }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: t2,
        class: "pw-cta-shimmer relative mt-2 flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        style: {
          background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
          boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
        },
        children: /* @__PURE__ */ u$1("span", { class: "relative z-10", children: r2("modal.continue", "Continue") })
      }
    )
  ] });
}
const yr$1 = 10 * 6e4, kr$1 = 5e3, _r$1 = 3e4;
let Sr$1 = class Sr {
  constructor(e2) {
    this.timer = null, this.timeoutTimer = null, this.visibilityHandler = null, this.focusHandler = null, this.messageHandler = null, this.stopped = false, this.checking = false, this.opts = {
      client: e2.client,
      onActive: e2.onActive,
      onTimeout: e2.onTimeout ?? (() => {
      }),
      timeoutMs: e2.timeoutMs ?? yr$1,
      visibleIntervalMs: e2.visibleIntervalMs ?? kr$1,
      hiddenIntervalMs: e2.hiddenIntervalMs ?? _r$1
    };
  }
  start() {
    this.stopped || typeof document > "u" || typeof window > "u" || (this.check(), this.scheduleNext(), this.visibilityHandler = () => this.handleVisibilityChange(), document.addEventListener("visibilitychange", this.visibilityHandler), this.focusHandler = () => void this.check(), window.addEventListener("focus", this.focusHandler), this.messageHandler = (e2) => this.handleMessage(e2), window.addEventListener("message", this.messageHandler), this.timeoutTimer = setTimeout(() => {
      this.stopped || (this.stop(), this.opts.onTimeout());
    }, this.opts.timeoutMs));
  }
  stop() {
    this.stopped = true, this.timer !== null && clearTimeout(this.timer), this.timer = null, this.timeoutTimer !== null && clearTimeout(this.timeoutTimer), this.timeoutTimer = null, typeof document < "u" && this.visibilityHandler && document.removeEventListener("visibilitychange", this.visibilityHandler), typeof window < "u" && (this.focusHandler && window.removeEventListener("focus", this.focusHandler), this.messageHandler && window.removeEventListener("message", this.messageHandler)), this.visibilityHandler = null, this.focusHandler = null, this.messageHandler = null;
  }
  async check() {
    if (!(this.stopped || this.checking)) {
      this.checking = true;
      try {
        const e2 = await this.opts.client.getUser({ force: true });
        if (this.stopped) return;
        e2.has_active_subscription && (this.stop(), this.opts.onActive(e2));
      } catch {
      } finally {
        this.checking = false;
      }
    }
  }
  scheduleNext() {
    if (this.stopped) return;
    const r2 = typeof document < "u" && document.visibilityState === "visible" ? this.opts.visibleIntervalMs : this.opts.hiddenIntervalMs;
    this.timer = setTimeout(async () => {
      await this.check(), this.scheduleNext();
    }, r2);
  }
  handleVisibilityChange() {
    typeof document > "u" || (document.visibilityState === "visible" && this.check(), this.timer !== null && (clearTimeout(this.timer), this.timer = null), this.scheduleNext());
  }
  handleMessage(e2) {
    const r2 = e2.data;
    !r2 || typeof r2 != "object" || r2.type === "paywall_purchase" && this.check();
  }
};
function Cr$1() {
  return !(typeof document > "u" || typeof window > "u");
}
const pe$1 = {
  open: false,
  view: null,
  error: null,
  processing: false
}, G$1 = {
  status: "paywall_status",
  priceId: "paywall_price_id",
  sessionId: "paywall_session_id"
};
let Or$1 = class Or {
  constructor(e2) {
    this.handle = null, this.isOpen = false, this.listeners = /* @__PURE__ */ new Map(), this.userUnsub = null, this.authUnsub = null, this.watcher = null, this.tracker = null, this.purchased = false, this.lastMountedView = null, this.viewedTracked = false, this.titleOverride = null, this.trialStore = null, this.trialStoreConfig = null, this.lastTrialStatus = null, this.trialExpiredFired = false, this.restoredEmitted = false, this.mountedRenew = false, this.checkoutStartedSinceMount = false, this.lastVisibility = null, this.currentState = pe$1, this.stateListeners = /* @__PURE__ */ new Set();
    const { auth: r2, ownsAuth: i2 } = Ir$1(e2);
    this.auth = r2, this.ownsAuth = i2, this.billing = e2.client ?? new zt$2({ ...e2, auth: this.auth }), this.host = e2.host, this.shadowMode = e2.shadowMode ?? "closed", this.mountThenLoad = e2.mountThenLoad ?? true, this.inline = e2.inline === true, this.forceLocale = e2.locale ?? null, this.userUnsub = this.billing.onUserChange((n2) => {
      if (this.emit("userChange", n2), n2.has_active_subscription && (this.lastMountedView === "awaiting_payment" || this.lastMountedView === "popup_blocked")) {
        this.handlePurchaseDetected(n2);
        return;
      }
      n2.has_active_subscription && this.isOpen && !this.purchased && !this.mountedRenew && !this.checkoutStartedSinceMount && this.lastMountedView === "layout" && this.currentState.view === "layout" && (this.close(), this.emitRestoredOnce());
    }), this.auth && (this.authUnsub = this.auth.onAuthChange((n2, s2) => {
      this.emit("authChange", { event: n2, session: s2 });
    })), this.on("checkout_started", () => this.markCheckoutPending()), this.initTracker(e2.analytics), e2.autoDetectReturn !== false && typeof window < "u" && queueMicrotask(() => this.checkReturn());
  }
  initTracker(e2) {
    if (e2 === false) return;
    const r2 = typeof e2 == "object" && e2 !== null ? e2 : {};
    if (r2.enabled === false) return;
    const i2 = r2.endpoint ?? (() => `${this.billing.activeApiOrigin()}/api/v1/paywall/${this.billing.paywallId}/events`);
    this.tracker = new Qt$2({
      endpoint: i2,
      paywallId: this.billing.paywallId,
      capabilities: this.billing.capabilities,
      getVisitorId: () => this.billing.getVisitorId(),
      getCachedVisitorId: () => this.billing.getCachedVisitorId(),
      getUserId: () => this.billing.getIdentity()?.userId ?? null,
      // A/B: enrich every event with the assigned variant. Read from the
      // materialized bootstrap (not a dedicated method) so it also works
      // through proxying clients (sdk-extension RemoteBillingClient mirrors
      // getCachedBootstrap).
      getExperimentContext: () => {
        const n2 = this.billing.getCachedBootstrap()?.experiment;
        return n2?.assigned_variant ? { experiment_id: n2.id, variant: n2.assigned_variant } : null;
      },
      flushIntervalMs: r2.flushIntervalMs,
      maxBufferSize: r2.maxBufferSize,
      fetch: r2.fetch,
      sendBeacon: r2.sendBeacon
    }), this.on("ready", (n2) => {
      this.lastMountedView === "layout" && (this.viewedTracked = true, this.tracker?.track("paywall_viewed", {
        is_test_mode: n2.settings.is_test_mode,
        prices_count: n2.prices.length,
        offers_count: n2.offers.length,
        // The host passed open({title}) — the configured heading is replaced.
        // Lets host-side title experiments be told apart in analytics.
        ...this.titleOverride ? { custom_title: true } : {}
      }));
    }), this.on(
      "price_selected",
      (n2) => this.tracker?.track("price_selected", { price_id: n2.priceId })
    ), this.on(
      "checkout_started",
      (n2) => this.tracker?.track("checkout_started", {
        price_id: n2.priceId,
        acquiring: n2.acquiring
      })
    ), this.on("purchase_completed", (n2) => {
      n2.restored || this.tracker?.track("purchase_completed", {
        price_id: n2.priceId,
        session_id: n2.sessionId
      });
    }), this.on(
      "purchase_failed",
      (n2) => this.tracker?.track("purchase_failed", { reason: n2.reason })
    ), this.on("close", () => {
      this.viewedTracked && this.tracker?.track("paywall_closed"), this.viewedTracked = false;
    }), this.on(
      "trial_blocked",
      (n2) => this.tracker?.track("trial_blocked", {
        mode: n2.mode,
        ...n2.mode === "time" ? { remaining_ms: n2.remainingMs, total_ms: n2.totalMs } : n2.mode === "opens" ? { remaining_actions: n2.remainingActions, total_actions: n2.totalActions } : {}
      })
    ), this.on("trial_expired", () => this.tracker?.track("trial_expired")), this.on(
      "visibility_blocked",
      (n2) => this.tracker?.track("visibility_blocked", {
        reason: n2.reason,
        country: n2.country,
        tier: n2.tier
      })
    ), this.on(
      "error",
      (n2) => this.tracker?.track("error", { code: n2.code, message: n2.message })
    );
  }
  /**
   * Send an arbitrary analytics event. Names from the system whitelist
   * (`app_opened`, `paywall_viewed`, ...) are allowed as-is. Custom ones —
   * with a `host:` prefix (e.g. `host:user_clicked_upgrade`). The server drops
   * events with disallowed names.
   *
   * The most common case is `track('app_opened')` from the host right after the
   * app loads, to record the funnel before the paywall opens.
   */
  track(e2, r2) {
    this.tracker?.track(e2, r2);
  }
  /**
   * A convenient shortcut for `paywall.on('userChange', cb)` — the most common
   * pattern in host code, hence a separate named method. The callback receives
   * the last-known user from the cache synchronously via a microtask, if any.
   */
  onUserChange(e2) {
    return this.on("userChange", e2);
  }
  /**
   * Replace cachedBootstrap with live data — for preview mode in the admin
   * panel editor. If the modal is open, PaywallRoot is subscribed to
   * onBootstrapChange and re-renders instantly. Before open() — a seed for the
   * bootstrap() effect.
   *
   * See {@link BillingClientOptions.preview} — usually this option is set on
   * the client to also disable the network revalidate. setBootstrap technically
   * works in production mode too, but competing with a revalidate from the
   * network is almost always undesirable.
   */
  setBootstrap(e2) {
    this.billing.setBootstrap(e2);
  }
  /**
   * Change the force-locale on the fly — for the admin panel editor's
   * live-preview, when the user switches "Preview as user from <country>".
   * Loads the corresponding static chunk and forces a re-render via
   * handle.update. See PaywallUIOptions.locale.
   *
   * Pass `null`/`undefined` to return to the automatic resolution logic
   * (navigator.language → locale_default).
   */
  setLocale(e2) {
    const r2 = e2 ?? null;
    r2 !== this.forceLocale && (this.forceLocale = r2, this.handle && this.handle.update({ locale: r2 }));
  }
  on(e2, r2) {
    let i2 = this.listeners.get(e2);
    return i2 || (i2 = /* @__PURE__ */ new Set(), this.listeners.set(e2, i2)), i2.add(r2), () => i2.delete(r2);
  }
  off(e2, r2) {
    this.listeners.get(e2)?.delete(r2);
  }
  emit(e2, ...r2) {
    const i2 = this.listeners.get(e2);
    if (!i2) return;
    const n2 = r2[0];
    for (const s2 of i2)
      try {
        s2(n2);
      } catch (o3) {
        typeof console < "u" && console.error("[paywall] listener error", o3);
      }
  }
  open(e2 = {}) {
    this.openInternal("layout", e2);
  }
  /**
   * Warms up the bootstrap cache and balance cache in advance, without opening
   * the modal. Useful when the host knows the user will soon open the paywall
   * (hover on the CTA, component mount) — the first `open()` renders instantly,
   * without a loading flash.
   *
   * Doesn't throw: if the network failed, it silently ignores it (a repeat
   * open() does a fresh bootstrap with an error-state as usual). `signal` for
   * cancellation — e.g. if the host unmounts the component faster than bootstrap
   * returns.
   *
   * Can be called any number of times — subsequent calls return a cached
   * Promise (BillingClient already deduplicates).
   */
  async preload(e2 = {}) {
    try {
      await this.billing.bootstrap({ signal: e2.signal }), this.billing.auth && await this.billing.getBalances({ signal: e2.signal });
    } catch {
    }
  }
  /**
   * Opens the modal straight to the support form (bypassing the layout with
   * plans). Useful when the host app wants to give the user a "Help / Support"
   * button unrelated to a paywall upgrade. Back/Done in the support form close
   * the modal (don't return to the plans), because the user came here directly.
   *
   * From the regular `paywall.open()` flow support is still available via the
   * Contact Support link in the `current_session` block (there Back returns to
   * the layout).
   */
  openSupport(e2 = {}) {
    this.openInternal("support", e2);
  }
  /**
   * Opens the modal straight to the auth-gate (login/registration), without the
   * layout with plans. Scenario: a returning customer already bought and just
   * needs to sign in so the SDK picks up their purchases. After signIn the
   * modal closes; Back also closes it (the user came only to log in).
   *
   * Without `auth` (managed-auth not connected) the method is a no-op: there's
   * no one to do signIn. If the user is already signed in — the modal still
   * opens and closes via auto-resume in the auth_gate effect (instantly).
   *
   * The trial doesn't block this flow — auth isn't connected to the trial
   * mechanics.
   */
  openAuth(e2 = {}) {
    this.auth && this.openInternal("auth", { ...e2, skipTrial: true });
  }
  /**
   * A shortcut over `openAuth()` — opens the modal straight to the signin form.
   * Equivalent to `openAuth()` (signin is the default). Exists for symmetry with
   * `openSignup()` and host-code readability:
   *   - `paywall.openSignin()` — "log in to an existing account"
   *   - `paywall.openSignup()` — "new registration"
   * Without managed-auth — a no-op.
   */
  openSignin(e2 = {}) {
    this.auth && this.openInternal("auth", { ...e2, skipTrial: true, authMode: "signin" });
  }
  /**
   * Opens the modal with the auth-gate straight in registration mode (the
   * AuthPanel's signup mode — email/password/repeat). If the admin disabled
   * allow_signup in the paywall layout, AuthPanel ignores the mode and starts
   * with signin — the admin config is respected.
   * Without managed-auth — a no-op.
   */
  openSignup(e2 = {}) {
    this.auth && this.openInternal("auth", { ...e2, skipTrial: true, authMode: "signup" });
  }
  /**
   * Direct-checkout: create a checkout URL for a specific price and immediately
   * open the payment provider, bypassing the layout with plans. Useful when the
   * host app renders pricing cards/a table with its own UI and wants a click on
   * "Buy / Get this plan" to lead straight to Stripe/Paddle.
   *
   * **Late-mount UX.** Unlike `open()`, the modal doesn't appear during the
   * background work (bootstrap + visibility/trial gates + createCheckout). The
   * host shows a busy-state right on its own button during this phase (via
   * `state.processing === true` from `paywall.getState()` — or automatically via
   * `<PaywallButton priceId>` in sdk-react). The modal is mounted ONLY when the
   * UI is really needed:
   *  - `checkout_mode='preauth'` + managed-auth + not signed in → auth-gate
   *    (the signin form); after success, auto-resume into createCheckout.
   *  - the provider's popup is blocked by the browser → a popup_blocked view
   *    with a retry button under a fresh user gesture.
   *  - the popup opened successfully → an awaiting_payment view (a "pay in the
   *    new tab" indicator + I've paid).
   *
   * What's emitted without the modal:
   *  - `purchase_completed{restored:true, priceId}` when the user is already
   *    subscribed (cached user, fresh bootstrap, or a 409 hasActivePurchase
   *    from the backend) — a headless reject;
   *  - `error` when createCheckout failed or identity.email is missing;
   *  - `visibility_blocked` / `trial_blocked` — the standard gate events.
   *
   * What's emitted together with the modal:
   *  - `checkout_started{priceId, url, acquiring}` exactly when the headless URL
   *    is received, BEFORE mounting awaiting_payment/popup_blocked.
   *
   * The offer (countdown discount) is automatically resolved from cached offers
   * via `getOfferForPrice(priceId)` and passed into createCheckout as `offerId`
   * — so duration_minutes offers also apply on the backend (there's no
   * server-side timer for them, and without an explicit offer-id the discount is
   * lost).
   *
   * Requirements:
   *  - `identity.email` must be set (via `opts.identity`, or managed-auth, or an
   *    early `setIdentity`/`paywall.open({identity})`). Without an email the
   *    backend `/start-checkout` returns 400; the SDK emits `error`.
   *  - In `checkout_mode='preauth'` without managed-auth — the backend requires
   *    an email user; make sure `identity.email` is explicitly set.
   *
   * Without a modal at all (when the host renders its own awaiting-payment
   * screen) — use `paywall.billing.createCheckout({priceId, offerId})` directly,
   * but then you'll have to draw auth-gate / popup_blocked / awaiting_payment
   * yourself.
   */
  checkout(e2, r2 = {}) {
    if (r2.identity && this.billing.setIdentity(r2.identity), r2.renew !== true && this.billing.getCachedUser()?.has_active_subscription) {
      this.emit("purchase_completed", {
        priceId: e2,
        sessionId: null,
        restored: true
      });
      return;
    }
    this.runDirectCheckout(e2, r2);
  }
  /** Headless prep-work for `checkout(priceId, opts)`: bootstrap → gates →
   *  preauth check → createCheckout → mount the modal with the final view.
   *  Extracted into a separate method for a clean async/await flow instead of
   *  nested then-chains (5+ branches). Any error isn't propagated outward: we
   *  emit via `paywall.emit('error')` and exit — the host is subscribed to the
   *  `error` event. */
  async runDirectCheckout(e2, r2) {
    const i2 = r2.renew === true, n2 = r2.skipTrial === true, s2 = r2.skipVisibility === true;
    this.applyProcessing(true);
    const o3 = () => {
      this.applyProcessing(false);
    };
    let c2;
    try {
      c2 = await this.billing.bootstrap();
    } catch (f2) {
      const v2 = f2 instanceof o$2 ? f2 : new o$2("unknown", "Failed to load paywall", { cause: f2 });
      this.emit("error", v2), o3();
      return;
    }
    if (!s2) {
      const f2 = c2.settings.visibility;
      if (f2 && (this.lastVisibility = f2, !f2.visible)) {
        this.emit("visibility_blocked", f2), o3();
        return;
      }
    }
    if (!n2 && await this.checkTrialBeforeCheckout(c2)) {
      o3();
      return;
    }
    if (!i2 && c2.user?.has_active_subscription) {
      this.emit("purchase_completed", {
        priceId: e2,
        sessionId: null,
        restored: true
      }), o3();
      return;
    }
    const l2 = c2.settings.checkout_mode ?? "guest", p2 = this.auth?.getCachedSession() ?? null, u2 = !!p2 && !p2.user.is_anonymous;
    if (l2 === "preauth" && !!this.auth && !u2) {
      this.purchased = false, this.mountAndShow("auth", {
        renew: i2,
        authMode: "signin",
        checkoutPriceId: e2
      });
      return;
    }
    const y2 = this.getOfferForPrice(e2);
    let _2;
    try {
      _2 = await this.billing.createCheckout({
        priceId: e2,
        offerId: y2?.offer.id,
        ignoreActivePurchase: i2
      });
    } catch (f2) {
      if (f2 instanceof o$2 && f2.code === "already_purchased") {
        try {
          await this.billing.getUser({ force: true });
        } catch {
        }
        this.emit("purchase_completed", {
          priceId: e2,
          sessionId: null,
          restored: true
        }), o3();
        return;
      }
      if (f2 instanceof o$2 && f2.status === 401 && this.auth && l2 === "preauth") {
        this.emit("error", f2), this.purchased = false, this.mountAndShow("auth", {
          renew: i2,
          authMode: "signin",
          checkoutPriceId: e2
        });
        return;
      }
      const v2 = f2 instanceof o$2 ? f2 : new o$2("checkout_failed", "Checkout failed", { cause: f2 });
      this.emit("error", v2), o3();
      return;
    }
    if (this.emit("checkout_started", {
      priceId: e2,
      url: _2.url,
      acquiring: _2.acquiring
    }), this.startUserWatcher(), typeof window > "u" || !_2.url) {
      this.mountAndShow("awaiting_payment", {
        renew: i2,
        checkoutPriceId: e2,
        checkoutUrl: _2.url
      });
      return;
    }
    const m2 = window.open(_2.url, "_blank");
    if (this.purchased = false, m2) {
      try {
        m2.opener = null;
      } catch {
      }
      this.mountAndShow("awaiting_payment", {
        renew: i2,
        checkoutPriceId: e2,
        checkoutUrl: _2.url
      });
    } else
      this.mountAndShow("popup_blocked", {
        renew: i2,
        checkoutPriceId: e2,
        checkoutUrl: _2.url
      });
  }
  /** Trial check without mounting (for late-mount direct-checkout). Returns
   *  true if the trial blocked — the caller must stop the flow. On any storage
   *  error we log+continue (we don't block the sale). */
  async checkTrialBeforeCheckout(e2) {
    const r2 = e2.settings.trial;
    if (!r2) return false;
    const i2 = this.ensureTrialStore(r2);
    try {
      const n2 = await i2.check();
      if (this.lastTrialStatus = n2, n2.mode === "none") return false;
      if (n2.blocked) {
        const s2 = await i2.recordBlock();
        return this.lastTrialStatus = s2, this.emit("trial_blocked", s2), true;
      }
      return this.trialExpiredFired || (this.trialExpiredFired = true, this.emit("trial_expired")), false;
    } catch (n2) {
      return typeof console < "u" && console.warn("[paywall] trial check failed", n2), false;
    }
  }
  applyProcessing(e2) {
    this.currentState.processing !== e2 && this.applyState({ ...this.currentState, processing: e2 });
  }
  /**
   * Headless anonymous signin without opening the modal. Internally:
   * idempotent (if already anon — instant return) → resume via the saved
   * refresh_token → fresh /auth/anonymous/signin. Deduplicates parallel calls
   * inside the AuthClient.
   *
   * Convenient for host buttons like "Continue as guest" — the host manages the
   * loading-state on its own button, without a half-empty modal with a spinner.
   * Without managed-auth — resolves with a rejected promise (there's no
   * AuthClient to do signin).
   */
  signInAnonymously() {
    return this.auth ? this.auth.signInAnonymously() : Promise.reject(
      new o$2(
        "invalid_config",
        "signInAnonymously requires managed-auth. Pass `auth: true` to PaywallUI."
      )
    );
  }
  openInternal(e2, r2) {
    if (r2.identity && this.billing.setIdentity(r2.identity), this.purchased = false, e2 === "layout" && r2.renew !== true) {
      if (this.billing.getCachedUser()?.has_active_subscription) {
        this.emitRestoredOnce();
        return;
      }
      if (this.canResolveUser()) {
        this.billing.getSettledUser().then((n2) => {
          if (n2?.has_active_subscription) {
            this.emitRestoredOnce();
            return;
          }
          this.proceedOpen(e2, r2);
        });
        return;
      }
    }
    this.proceedOpen(e2, r2);
  }
  /** Whether some source can still reveal the user for the subscription gate:
   *  a managed-auth session (Bearer) or an explicitly set identity. Anonymous
   *  visitors have neither — waiting on getSettledUser would be pointless. */
  canResolveUser() {
    return !!this.auth || !!this.billing.getIdentity();
  }
  /** The tail of openInternal after the subscription gate: skip-flag
   *  normalization and the cached/cold bootstrap paths. Extracted so the
   *  settled-user branch above can continue the flow asynchronously. */
  proceedOpen(e2, r2) {
    const i2 = r2.skipTrial === true || e2 === "support", n2 = r2.skipVisibility === true || e2 === "support" || e2 === "auth", s2 = r2.renew === true, o3 = r2.title ?? null;
    if (i2 && n2) {
      this.mountAndShow(e2, { renew: s2, authMode: r2.authMode, title: o3 });
      return;
    }
    const c2 = this.billing.getCachedBootstrap();
    if (c2) {
      this.runOpenGates(e2, c2, { skipTrial: i2, skipVisibility: n2, renew: s2, title: o3 });
      return;
    }
    if (this.mountThenLoad) {
      this.mountAndShow(e2, { renew: s2, title: o3 }), this.billing.bootstrap().then((l2) => this.runDelayedGates(l2, { skipTrial: i2, skipVisibility: n2, renew: s2 })).catch(() => {
      });
      return;
    }
    this.billing.bootstrap().then(
      (l2) => this.runOpenGates(e2, l2, { skipTrial: i2, skipVisibility: n2, renew: s2, title: o3 })
    ).catch(() => {
      this.mountAndShow(e2, { renew: s2, title: o3 });
    });
  }
  /** Apply gates AFTER the modal is already mounted (the mount-then-load path).
   *  If a gate blocks — close() + emit. If the user already closed the modal
   *  themselves before bootstrap resolved — a no-op (isOpen=false). */
  async runDelayedGates(e2, r2) {
    if (!this.isOpen) return;
    if (!r2.renew) {
      let s2 = this.billing.getCachedUser();
      if (!s2?.has_active_subscription && this.canResolveUser() && (s2 = await this.billing.getSettledUser() ?? s2, !this.isOpen))
        return;
      if (s2?.has_active_subscription) {
        this.close(), this.emitRestoredOnce();
        return;
      }
    }
    if (!r2.skipVisibility) {
      const s2 = e2.settings.visibility;
      if (s2 && (this.lastVisibility = s2, !s2.visible)) {
        this.close(), this.emit("visibility_blocked", s2);
        return;
      }
    }
    if (r2.skipTrial) return;
    const i2 = e2.settings.trial;
    if (!i2) return;
    const n2 = this.ensureTrialStore(i2);
    n2.check().then(async (s2) => {
      if (this.isOpen && (this.lastTrialStatus = s2, s2.mode !== "none")) {
        if (s2.blocked) {
          const o3 = await n2.recordBlock();
          if (this.lastTrialStatus = o3, !this.isOpen) return;
          this.close(), this.emit("trial_blocked", o3);
          return;
        }
        this.trialExpiredFired || (this.trialExpiredFired = true, this.emit("trial_expired"));
      }
    }).catch((s2) => {
      typeof console < "u" && console.warn("[paywall] trial check failed", s2);
    });
  }
  // Gate order: visibility → trial. A country-mismatch ≠ a trial-block, and
  // keeping a trial-state "N views left" under a user who shouldn't see the
  // paywall at all by targeting is pointless: when they return to the correct
  // country they'd end up with a "stuck" trial counter.
  runOpenGates(e2, r2, i2) {
    if (e2 === "layout" && !i2.renew && this.billing.getCachedUser()?.has_active_subscription) {
      this.emitRestoredOnce();
      return;
    }
    if (!i2.skipVisibility) {
      const n2 = r2.settings.visibility;
      if (n2 && (this.lastVisibility = n2, !n2.visible)) {
        this.emit("visibility_blocked", n2);
        return;
      }
    }
    if (i2.skipTrial) {
      this.mountAndShow(e2, { renew: i2.renew, title: i2.title });
      return;
    }
    this.gateThroughTrial(e2, r2, i2.renew, i2.title);
  }
  gateThroughTrial(e2, r2, i2, n2) {
    const s2 = r2.settings.trial;
    if (!s2) {
      this.mountAndShow(e2, { renew: i2, title: n2 });
      return;
    }
    const o3 = this.ensureTrialStore(s2);
    o3.check().then(async (c2) => {
      if (this.lastTrialStatus = c2, c2.mode === "none") {
        this.mountAndShow(e2, { renew: i2, title: n2 });
        return;
      }
      if (c2.blocked) {
        const l2 = await o3.recordBlock();
        this.lastTrialStatus = l2, this.emit("trial_blocked", l2);
        return;
      }
      this.trialExpiredFired || (this.trialExpiredFired = true, this.emit("trial_expired")), this.mountAndShow(e2, { renew: i2, title: n2 });
    }).catch((c2) => {
      typeof console < "u" && console.warn("[paywall] trial check failed", c2), this.mountAndShow(e2, { renew: i2, title: n2 });
    });
  }
  ensureTrialStore(e2) {
    if (this.trialStore && this.trialStoreConfig && Lr$1(this.trialStoreConfig, e2))
      return this.trialStore;
    this.trialStoreConfig = e2;
    const r2 = this.billing.createTrialStore;
    return this.trialStore = typeof r2 == "function" ? r2.call(this.billing, e2) : at(this.billing.getStorage(), this.billing.paywallId, e2), this.trialStore;
  }
  mountAndShow(e2, r2 = {}) {
    this.lastMountedView = e2, this.viewedTracked = false;
    const i2 = r2.renew === true;
    this.mountedRenew = i2, this.checkoutStartedSinceMount = false;
    const n2 = r2.authMode, s2 = e2 === "layout" ? r2.title ?? null : null;
    this.titleOverride = s2;
    const c2 = e2 === "auth" || e2 === "awaiting_payment" || e2 === "popup_blocked" ? r2.checkoutPriceId ?? null : null, l2 = e2 === "awaiting_payment" || e2 === "popup_blocked" ? r2.checkoutUrl ?? null : null;
    if (this.handle) {
      this.isOpen = true, this.handle.update({
        open: true,
        initialView: e2,
        initialAuthMode: n2,
        initialCheckoutPriceId: c2,
        initialCheckoutUrl: l2,
        purchased: false,
        renew: i2,
        titleOverride: s2
      }), this.emit("open");
      return;
    }
    this.isOpen = true, this.handle = ot(
      wr$1,
      {
        client: this.billing,
        open: true,
        initialView: e2,
        initialAuthMode: n2,
        initialCheckoutPriceId: c2,
        initialCheckoutUrl: l2,
        purchased: false,
        renew: i2,
        titleOverride: s2,
        onClose: () => this.close(),
        onEvent: (p2, u2) => {
          this.emit(p2, u2), p2 === "checkout_started" && (this.checkoutStartedSinceMount = true, this.startUserWatcher());
        },
        onState: (p2) => this.applyState(p2),
        inline: this.inline,
        locale: this.forceLocale
      },
      { host: this.host, shadowMode: this.shadowMode, inline: this.inline }
    ), this.emit("open");
  }
  applyState(e2) {
    if (!Mr$1(this.currentState, e2)) {
      this.currentState = e2;
      for (const r2 of this.stateListeners)
        try {
          r2(e2);
        } catch (i2) {
          console.warn("[paywall] onStateChange listener threw", i2);
        }
    }
  }
  /**
   * A sync snapshot of the modal's current state. Suitable for
   * `useSyncExternalStore` in React
   * (`useSyncExternalStore(paywall.onStateChange, paywall.getState)`) and for
   * one-off checks ("is the paywall open right now?").
   *
   * The snapshot is stable — as long as the state hasn't changed, a repeat
   * getState() returns a `===`-equal object (important for useSyncExternalStore
   * to avoid re-rendering).
   */
  getState() {
    return this.currentState;
  }
  /**
   * Subscribe to state changes. The callback is called on every real change
   * (closed → loading → ready → ...). By default the initial snapshot is
   * delivered via a microtask after subscribing; via `{immediate: 'sync'|'none'}`
   * you can do sync delivery (not needed for useSyncExternalStore — there the
   * snapshot is read via getSnapshot separately) or skip the initial entirely.
   *
   * Returns an unsubscribe function.
   */
  onStateChange(e2, r2 = {}) {
    this.stateListeners.add(e2);
    const i2 = r2.immediate ?? "microtask";
    if (i2 !== "none") {
      const n2 = this.currentState;
      if (i2 === "sync")
        try {
          e2(n2);
        } catch (s2) {
          console.warn("[paywall] onStateChange initial sync threw", s2);
        }
      else
        queueMicrotask(() => {
          this.stateListeners.has(e2) && e2(n2);
        });
    }
    return () => {
      this.stateListeners.delete(e2);
    };
  }
  /** Sync access to the last known trial status. null — `paywall.open()` hasn't
   *  been called yet or the trial is disabled in the paywall config. Convenient
   *  for the host's own UI ("3 views left", "the trial expires in 2h"). */
  getTrialStatus() {
    return this.lastTrialStatus;
  }
  /** Sync access to the last server-computed visibility status. null —
   *  bootstrap isn't loaded yet or the server doesn't return
   *  `settings.visibility` (e.g. an old version of online without the targeting
   *  patch). The host can use it for its own fallback: "the service isn't
   *  available in your country". Updated on every open() that passes through the
   *  gate. */
  getVisibility() {
    return this.lastVisibility;
  }
  /**
   * The paywall's prices — a shortcut over `bootstrap()`. Locales are already
   * applied, and the cache and stale-while-revalidate are identical to
   * `billing.bootstrap()`. Suitable for pricing pages/cards on the site, where
   * the host wants to show the same prices as in the modal without pulling
   * bootstrap by hand.
   */
  getPrices(e2 = {}) {
    return this.billing.getPrices(e2);
  }
  /** A sync snapshot of the prices. null — bootstrap hasn't been loaded yet. */
  getCachedPrices() {
    return this.billing.getCachedPrices();
  }
  /** A sync snapshot of the offers. null = bootstrap not loaded, [] = a paywall
   *  without offers. The backend already applied server-side targeting
   *  (countries/email/mode) — only what's applicable to the current user comes
   *  out. */
  getCachedOffers() {
    return this.billing.getCachedOffers();
  }
  /**
   * Resolves the active offer for a specific price: price_id targeting +
   * countdown (`expires_at` OR `duration_minutes` from the first paywall open,
   * see clientStorage `pw-offer-{id}-start`).
   *
   * Read-only — does NOT write the start for `duration_minutes` offers. The
   * write starts only when the modal is actually open (by the renderer). Before
   * that `getOfferForPrice` returns `null` for duration-only offers, so host
   * pages outside the modal (pricing, landing) don't activate the countdown
   * prematurely.
   *
   * A host page that needs a countdown ticking every second should use the React
   * hook `usePaywallOffer(priceId)` from sdk-react, or a wrapper over
   * `setInterval(1000)` + a repeat call to this method.
   */
  getOfferForPrice(e2) {
    const r2 = this.billing.getCachedOffers();
    if (!r2) return null;
    const i2 = Ht$2(r2, e2);
    return i2 ? Jt$2(i2, {
      now: Date.now(),
      readStart: Yt$2
    }) : null;
  }
  /** A snapshot of the current "user language" — a proxy over
   *  `billing.getUserLanguage()`. Use it to sync the host's i18n with what the
   *  paywall actually shows. See the details in `BillingClient.getUserLanguage`. */
  getUserLanguage() {
    return this.billing.getUserLanguage();
  }
  /**
   * Decides whether the feature should be blocked for the current user. No side
   * effects (`recordBlock` isn't called on trial-storage, the modal isn't
   * mounted).
   *
   * Check order (the first one that triggers is final):
   *  1. `has_active_subscription` — the strongest signal, overrides the rest.
   *     A user with a subscription gets access regardless of visibility/trial.
   *  2. `visibility` (country/device/disabled-flag) — the user is outside the
   *     paywall's monetization scope, can't be gated.
   *  3. `trial` — the pre-paywall free period is active.
   *  4. Otherwise — `blocked`, the host locks the feature and calls
   *     `paywall.open()`.
   *
   * Bootstrap is cached in BillingClient — `getAccess()` can be called on every
   * render of the host component, /bootstrap isn't duplicated. On a failed
   * network it falls back to the persistent-cached user from storage: a user
   * with a past subscription gets `granted` offline, otherwise `blocked` (the
   * host shows the paywall with an error-state, the user can retry). Side
   * effect: `lastVisibility` / `lastTrialStatus` are updated so the synchronous
   * getters `getVisibility()` / `getTrialStatus()` see fresh data after the
   * first `getAccess()`, not only after the first `open()`.
   */
  async getAccess(e2 = {}) {
    let r2 = this.billing.getCachedBootstrap();
    if (!r2)
      try {
        r2 = await this.billing.bootstrap({ signal: e2.signal });
      } catch {
        const o3 = this.billing.getCachedUser();
        return o3?.has_active_subscription ? {
          access: "granted",
          reason: "has_subscription",
          visibility: null,
          trial: null,
          user: o3
        } : {
          access: "blocked",
          reason: "no_subscription",
          visibility: null,
          trial: null,
          user: o3
        };
      }
    let i2 = this.billing.getCachedUser();
    if (!i2?.has_active_subscription && this.canResolveUser() && (i2 = await this.billing.getSettledUser({ signal: e2.signal }) ?? i2), i2 || (i2 = r2.user ?? null), i2?.has_active_subscription)
      return {
        access: "granted",
        reason: "has_subscription",
        visibility: r2.settings.visibility ?? null,
        trial: null,
        user: i2
      };
    let n2 = null;
    if (!e2.skipVisibility) {
      const o3 = r2.settings.visibility;
      if (o3 && (n2 = o3, this.lastVisibility = o3, !o3.visible))
        return { access: "granted", reason: "visibility_blocked", visibility: n2, trial: null, user: i2 };
    }
    let s2 = null;
    if (!e2.skipTrial) {
      const o3 = r2.settings.trial;
      if (o3)
        try {
          if (s2 = await this.ensureTrialStore(o3).check(), this.lastTrialStatus = s2, s2.blocked)
            return { access: "granted", reason: "trial_blocked", visibility: n2, trial: s2, user: i2 };
        } catch (c2) {
          typeof console < "u" && console.warn("[paywall] getAccess: trial check failed", c2);
        }
    }
    return { access: "blocked", reason: "no_subscription", visibility: n2, trial: s2, user: i2 };
  }
  /** Reset the trial state in storage. Useful for dev mode / an admin button
   *  "run the scenario again". In prod the host usually doesn't call it. */
  async resetTrial() {
    this.trialStore && (await this.trialStore.reset(), this.lastTrialStatus = null, this.trialExpiredFired = false);
  }
  // Starts polling user-state until has_active_subscription=true or a timeout.
  // Idempotent: a repeat call on an already-running watcher is a no-op (the user
  // might press Continue again after returning).
  //
  // In the extension popup runtime — a no-op (the popup won't survive). There we
  // rely on bootstrap on the next open.
  startUserWatcher() {
    this.watcher || Cr$1() && (this.watcher = new Sr$1({
      client: this.billing,
      onActive: (e2) => this.handlePurchaseDetected(e2),
      onTimeout: () => {
        this.watcher = null;
      }
    }), this.watcher.start());
  }
  // Single funnel for "subscription became active during a checkout flow".
  // Reached from THREE independent sources:
  //   1. UserWatcher.onActive — the background poll (where it runs).
  //   2. billing.onUserChange — the manual "I've paid" button (getUser →
  //      applyUser → onUserChange) and cross-context user-state broadcasts
  //      (sdk-extension offscreen → RemoteBillingClient → onUserChange).
  //   3. (future) any other path that flips cachedUser to active.
  // Idempotent via `this.purchased` (reset to false at the start of every
  // checkout flow — see the direct-checkout/headless mounts).
  //
  // Previously this logic lived ONLY inside watcher.onActive, and the manual
  // button merely posted a `paywall_purchase` window-message to wake the
  // watcher. In runtimes where the watcher doesn't run — a full extension page
  // on chrome-extension:// (shouldRunUserWatcher was false for the whole
  // protocol) — neither the poll nor the manual button could close the awaiting
  // screen: the message had no listener. Funneling through onUserChange fixes
  // both, regardless of whether a watcher exists.
  handlePurchaseDetected(e2) {
    if (this.purchased) return;
    this.purchased = true, this.watcher && (this.watcher.stop(), this.watcher = null), this.emit("purchase_completed", { priceId: null, sessionId: null });
    const r2 = this.billing.getCachedBootstrap()?.settings.success_redirect_url;
    if (r2 && typeof window < "u")
      try {
        window.location.assign(r2);
        return;
      } catch {
      }
    this.isOpen && this.handle && this.handle.update({ purchased: true });
  }
  /** Fire-and-forget write of the checkout-pending marker (see the
   *  checkout_started subscription in the constructor). Goes through the
   *  billing storage adapter, so in the extension it lands in the offscreen
   *  storage — the same store BillingClient.getSettledUser reads. Storage
   *  failures degrade to the previous behavior (a one-time flash). */
  markCheckoutPending() {
    try {
      Promise.resolve(
        this.billing.getStorage().setItem(
          f$3.checkoutPending(this.billing.paywallId),
          JSON.stringify({ at: Date.now() })
        )
      ).catch(() => {
      });
    } catch {
    }
  }
  /** Blind open() hit the subscription gate: the modal is suppressed, the host
   *  gets the same signal as every other "subscription is already active" path
   *  — purchase_completed{restored:true}. Once per instance lifetime. */
  emitRestoredOnce() {
    this.restoredEmitted || (this.restoredEmitted = true, this.emit("purchase_completed", {
      priceId: null,
      sessionId: null,
      restored: true
    }));
  }
  close() {
    !this.isOpen || !this.handle || (this.isOpen = false, this.purchased = false, this.handle.update({ open: false, purchased: false }), this.applyState(pe$1), this.emit("close"));
  }
  /**
   * Scans the current URL for checkout-return markers and emits
   * purchase_completed / purchase_failed. The markers are removed from the URL
   * via history.replaceState. It looks in both the hash and the search (the
   * hash takes priority — protection against client SPA routers that intercept
   * the query).
   */
  checkReturn() {
    if (typeof window > "u") return;
    const e2 = new URL(window.location.href), r2 = Oe$1(e2.hash.replace(/^#/, "")), i2 = Oe$1(e2.search.replace(/^\?/, "")), n2 = r2 ?? i2;
    n2 && (n2.status === "paid" ? (this.emit("purchase_completed", {
      priceId: n2.priceId,
      sessionId: n2.sessionId
    }), Tr$1(n2)) : (n2.status === "failed" || n2.status === "cancelled") && this.emit("purchase_failed", { reason: n2.status }), Pr$1(e2));
  }
  destroy() {
    this.tracker?.destroy(), this.tracker = null, this.listeners.clear(), this.stateListeners.clear(), this.watcher?.stop(), this.watcher = null, this.userUnsub?.(), this.userUnsub = null, this.authUnsub?.(), this.authUnsub = null, this.ownsAuth && this.auth && this.auth.destroy?.(), this.ownsAuth = false, this.billing.destroy?.(), this.handle?.unmount(), this.handle = null, this.isOpen = false, this.currentState = pe$1;
  }
};
function Ir$1(t2) {
  if (!t2.auth) return { auth: void 0, ownsAuth: false };
  if (t2.auth instanceof Xt$2 || Ar$1(t2.auth))
    return { auth: t2.auth, ownsAuth: false };
  const e2 = t2.auth === true ? {} : t2.auth;
  return {
    auth: new Xt$2({
      paywallId: t2.paywallId,
      apiOrigin: e2.apiOrigin ?? t2.apiOrigin,
      storage: e2.storage ?? t2.storage,
      fetch: e2.fetch ?? t2.fetch,
      openPopup: e2.openPopup
    }),
    ownsAuth: true
  };
}
function Ar$1(t2) {
  if (typeof t2 != "object" || t2 === null) return false;
  const e2 = t2;
  return typeof e2.onAuthChange == "function" && typeof e2.getCachedSession == "function" && typeof e2.signOut == "function";
}
function Mr$1(t2, e2) {
  return t2.open === e2.open && t2.view === e2.view && t2.error === e2.error && t2.processing === e2.processing;
}
function Lr$1(t2, e2) {
  return t2.mode === e2.mode && t2.payload === e2.payload && t2.storage === e2.storage;
}
function Oe$1(t2) {
  if (!t2) return null;
  const e2 = new URLSearchParams(t2), r2 = e2.get(G$1.status);
  return r2 ? {
    status: r2,
    priceId: e2.get(G$1.priceId),
    sessionId: e2.get(G$1.sessionId)
  } : null;
}
function Tr$1(t2) {
  if (!(typeof window > "u" || !window.opener))
    try {
      window.opener.postMessage(
        {
          type: "paywall_purchase",
          status: t2.status,
          priceId: t2.priceId,
          sessionId: t2.sessionId
        },
        "*"
      );
    } catch {
    }
}
function Pr$1(t2) {
  const e2 = (i2, n2) => {
    if (!i2) return "";
    const s2 = new URLSearchParams(i2.replace(/^[?#]/, ""));
    s2.delete(G$1.status), s2.delete(G$1.priceId), s2.delete(G$1.sessionId);
    const o3 = s2.toString();
    return o3 ? n2 + o3 : "";
  }, r2 = t2.pathname + e2(t2.search, "?") + e2(t2.hash, "#");
  window.history.replaceState(null, "", r2);
}
function dt(r2) {
  return `pw-offer-${r2}-start`;
}
function ze(r2, e2) {
  if (!r2 || r2.length === 0) return null;
  const t2 = r2.find(
    (n2) => n2.price_id === e2 && (n2.discount_percent ?? 0) > 0
  );
  return t2 || (r2.find(
    (n2) => n2.price_id == null && (n2.discount_percent ?? 0) > 0
  ) ?? null);
}
function Z(r2, e2, t2 = {}) {
  const i2 = ze(r2, e2);
  return i2 && Re2(i2, t2) ? i2 : null;
}
function Re2(r2, e2 = {}) {
  const t2 = r2.discount_percent ?? 0;
  if (t2 <= 0) return null;
  const i2 = e2.now ?? Date.now(), n2 = ut(r2, e2.readStart), s2 = ht(r2, n2), o3 = n2 !== null ? Math.max(0, n2 - i2) : null;
  return n2 !== null && n2 <= i2 ? null : { offer: r2, discountPercent: t2, remainingMs: o3, totalMs: s2, expiresAt: n2 };
}
function ut(r2, e2) {
  if (r2.expires_at) {
    const t2 = Date.parse(r2.expires_at);
    return Number.isFinite(t2) ? t2 : null;
  }
  if (r2.duration_minutes && r2.duration_minutes > 0 && e2) {
    const t2 = e2(r2.id);
    if (!t2) return null;
    const i2 = Date.parse(t2);
    return Number.isFinite(i2) ? i2 + r2.duration_minutes * 6e4 : null;
  }
  return null;
}
function ht(r2, e2) {
  return r2.duration_minutes && r2.duration_minutes > 0 ? r2.duration_minutes * 6e4 : e2 !== null ? e2 - Date.now() : null;
}
function H(r2) {
  if (typeof window > "u") return null;
  try {
    return window.localStorage.getItem(dt(r2));
  } catch {
    return null;
  }
}
const De = '/*! tailwindcss v4.3.0 | MIT License | https://tailwindcss.com */@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-border-style:solid;--tw-leading:initial;--tw-font-weight:initial;--tw-tracking:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-outline-style:solid;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial}}}@layer theme{:root,:host{--font-sans:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";--font-mono:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;--color-red-50:oklch(97.1% .013 17.38);--color-red-600:oklch(57.7% .245 27.325);--color-emerald-100:oklch(95% .052 163.051);--color-emerald-500:oklch(69.6% .17 162.48);--color-emerald-700:oklch(50.8% .118 165.612);--color-slate-950:oklch(12.9% .042 264.695);--color-gray-50:oklch(98.5% .002 247.839);--color-gray-100:oklch(96.7% .003 264.542);--color-gray-200:oklch(92.8% .006 264.531);--color-gray-300:oklch(87.2% .01 258.338);--color-gray-400:oklch(70.7% .022 261.325);--color-gray-500:oklch(55.1% .027 264.364);--color-gray-600:oklch(44.6% .03 256.802);--color-gray-700:oklch(37.3% .034 259.733);--color-gray-800:oklch(27.8% .033 256.848);--color-gray-900:oklch(21% .034 264.665);--color-black:#000;--color-white:#fff;--spacing:.25rem;--text-xs:.75rem;--text-xs--line-height:calc(1 / .75);--text-sm:.875rem;--text-sm--line-height:calc(1.25 / .875);--text-base:1rem;--text-base--line-height: 1.5 ;--text-lg:1.125rem;--text-lg--line-height:calc(1.75 / 1.125);--text-xl:1.25rem;--text-xl--line-height:calc(1.75 / 1.25);--text-2xl:1.5rem;--text-2xl--line-height:calc(2 / 1.5);--text-3xl:1.875rem;--text-3xl--line-height: 1.2 ;--font-weight-normal:400;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--tracking-tight:-.025em;--tracking-normal:0em;--tracking-wide:.025em;--tracking-wider:.05em;--leading-tight:1.25;--leading-snug:1.375;--leading-relaxed:1.625;--radius-md:.375rem;--radius-xl:.75rem;--radius-2xl:1rem;--radius-3xl:1.5rem;--animate-spin:spin 1s linear infinite;--animate-ping:ping 1s cubic-bezier(0, 0, .2, 1) infinite;--blur-sm:8px;--blur-md:12px;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4, 0, .2, 1);--default-font-family:var(--font-sans);--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab,red,red)){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}:host{all:initial;color-scheme:light;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizelegibility;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}*,:before,:after{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;box-sizing:border-box}button{cursor:pointer;font-family:inherit}button:disabled{cursor:not-allowed}[role=button],[role=radio]{cursor:pointer}}@layer components;@layer utilities{.pointer-events-none{pointer-events:none}.collapse{visibility:collapse}.visible{visibility:visible}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.sticky{position:sticky}.inset-0{inset:calc(var(--spacing) * 0)}.-top-2{top:calc(var(--spacing) * -2)}.-top-\\[9px\\]{top:-9px}.-top-\\[10px\\]{top:-10px}.top-1\\/2{top:50%}.top-3{top:calc(var(--spacing) * 3)}.top-4{top:calc(var(--spacing) * 4)}.-right-\\[6px\\]{right:-6px}.right-3{right:calc(var(--spacing) * 3)}.right-4{right:calc(var(--spacing) * 4)}.left-1\\/2{left:50%}.z-10{z-index:10}.z-\\[1\\]{z-index:1}.z-\\[2147483647\\]{z-index:2147483647}.container{width:100%}@media(min-width:40rem){.container{max-width:40rem}}@media(min-width:48rem){.container{max-width:48rem}}@media(min-width:64rem){.container{max-width:64rem}}@media(min-width:80rem){.container{max-width:80rem}}@media(min-width:96rem){.container{max-width:96rem}}.mx-auto{margin-inline:auto}.-mt-3{margin-top:calc(var(--spacing) * -3)}.mt-0\\.5{margin-top:calc(var(--spacing) * .5)}.mt-1{margin-top:calc(var(--spacing) * 1)}.mt-1\\.5{margin-top:calc(var(--spacing) * 1.5)}.mt-2{margin-top:calc(var(--spacing) * 2)}.mt-2\\.5{margin-top:calc(var(--spacing) * 2.5)}.mt-3{margin-top:calc(var(--spacing) * 3)}.-mb-2{margin-bottom:calc(var(--spacing) * -2)}.mb-1{margin-bottom:calc(var(--spacing) * 1)}.mb-3{margin-bottom:calc(var(--spacing) * 3)}.-ml-1{margin-left:calc(var(--spacing) * -1)}.ml-2{margin-left:calc(var(--spacing) * 2)}.block{display:block}.flex{display:flex}.grid{display:grid}.hidden{display:none}.inline{display:inline}.inline-block{display:inline-block}.inline-flex{display:inline-flex}.table{display:table}.h-1{height:calc(var(--spacing) * 1)}.h-4{height:calc(var(--spacing) * 4)}.h-6{height:calc(var(--spacing) * 6)}.h-6\\.5{height:calc(var(--spacing) * 6.5)}.h-7{height:calc(var(--spacing) * 7)}.h-8{height:calc(var(--spacing) * 8)}.h-10{height:calc(var(--spacing) * 10)}.h-11{height:calc(var(--spacing) * 11)}.h-12{height:calc(var(--spacing) * 12)}.h-14{height:calc(var(--spacing) * 14)}.h-\\[22px\\]{height:22px}.h-full{height:100%}.h-px{height:1px}.max-h-\\[calc\\(100dvh-1rem\\)\\]{max-height:calc(100dvh - 1rem)}.min-h-0{min-height:calc(var(--spacing) * 0)}.min-h-12{min-height:calc(var(--spacing) * 12)}.min-h-\\[2\\.4em\\]{min-height:2.4em}.min-h-\\[120px\\]{min-height:120px}.w-1{width:calc(var(--spacing) * 1)}.w-4{width:calc(var(--spacing) * 4)}.w-6{width:calc(var(--spacing) * 6)}.w-6\\.5{width:calc(var(--spacing) * 6.5)}.w-7{width:calc(var(--spacing) * 7)}.w-8{width:calc(var(--spacing) * 8)}.w-11{width:calc(var(--spacing) * 11)}.w-14{width:calc(var(--spacing) * 14)}.w-full{width:100%}.max-w-\\[20rem\\]{max-width:20rem}.max-w-\\[22rem\\]{max-width:22rem}.max-w-\\[75\\%\\]{max-width:75%}.max-w-\\[320px\\]{max-width:320px}.max-w-\\[360px\\]{max-width:360px}.max-w-\\[400px\\]{max-width:400px}.flex-1{flex:1}.flex-shrink{flex-shrink:1}.flex-shrink-0{flex-shrink:0}.shrink{flex-shrink:1}.grow{flex-grow:1}.-translate-x-1\\/2{--tw-translate-x: -50% ;translate:var(--tw-translate-x) var(--tw-translate-y)}.-translate-y-1\\/2{--tw-translate-y: -50% ;translate:var(--tw-translate-x) var(--tw-translate-y)}.transform{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.animate-\\[pw-fade-in_180ms_ease-out\\]{animation:.18s ease-out pw-fade-in}.animate-\\[pw-scale-in_220ms_cubic-bezier\\(0\\.16\\,1\\,0\\.3\\,1\\)\\]{animation:.22s cubic-bezier(.16,1,.3,1) pw-scale-in}.animate-ping{animation:var(--animate-ping)}.animate-spin{animation:var(--animate-spin)}.cursor-not-allowed{cursor:not-allowed}.cursor-pointer{cursor:pointer}.resize{resize:both}.flex-col{flex-direction:column}.flex-row-reverse{flex-direction:row-reverse}.flex-wrap{flex-wrap:wrap}.items-baseline{align-items:baseline}.items-center{align-items:center}.items-start{align-items:flex-start}.items-stretch{align-items:stretch}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.justify-start{justify-content:flex-start}.gap-0\\.5{gap:calc(var(--spacing) * .5)}.gap-1{gap:calc(var(--spacing) * 1)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-2\\.5{gap:calc(var(--spacing) * 2.5)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-4{gap:calc(var(--spacing) * 4)}.gap-5{gap:calc(var(--spacing) * 5)}.gap-6{gap:calc(var(--spacing) * 6)}.gap-x-1\\.5{column-gap:calc(var(--spacing) * 1.5)}.gap-x-2{column-gap:calc(var(--spacing) * 2)}.gap-y-1{row-gap:calc(var(--spacing) * 1)}.self-center{align-self:center}.self-start{align-self:flex-start}.truncate{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.rounded{border-radius:.25rem}.rounded-2xl{border-radius:var(--radius-2xl)}.rounded-3xl{border-radius:var(--radius-3xl)}.rounded-\\[9px\\]{border-radius:9px}.rounded-\\[11px\\]{border-radius:11px}.rounded-full{border-radius:3.40282e38px}.rounded-md{border-radius:var(--radius-md)}.rounded-xl{border-radius:var(--radius-xl)}.rounded-t-xl{border-top-left-radius:var(--radius-xl);border-top-right-radius:var(--radius-xl)}.rounded-tl-xl{border-top-left-radius:var(--radius-xl)}.rounded-tr-xl{border-top-right-radius:var(--radius-xl)}.rounded-b-none{border-bottom-right-radius:0;border-bottom-left-radius:0}.border,.border-1{border-style:var(--tw-border-style);border-width:1px}.border-2{border-style:var(--tw-border-style);border-width:2px}.border-\\[2\\.5px\\]{border-style:var(--tw-border-style);border-width:2.5px}.border-\\[3px\\]{border-style:var(--tw-border-style);border-width:3px}.border-\\[5px\\]{border-style:var(--tw-border-style);border-width:5px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-b,.border-b-1{border-bottom-style:var(--tw-border-style);border-bottom-width:1px}.border-dashed{--tw-border-style:dashed;border-style:dashed}.border-\\[var\\(--pw-accent\\)\\]{border-color:var(--pw-accent)}.border-gray-100{border-color:var(--color-gray-100)}.border-gray-200{border-color:var(--color-gray-200)}.border-gray-300{border-color:var(--color-gray-300)}.border-white{border-color:var(--color-white)}.border-white\\/40{border-color:#fff6}@supports (color:color-mix(in lab,red,red)){.border-white\\/40{border-color:color-mix(in oklab,var(--color-white) 40%,transparent)}}.border-t-\\[var\\(--pw-accent\\)\\]{border-top-color:var(--pw-accent)}.border-t-gray-700{border-top-color:var(--color-gray-700)}.border-t-white{border-top-color:var(--color-white)}.bg-\\[color-mix\\(in_srgb\\,var\\(--pw-accent\\)_6\\%\\,white\\)\\]{background-color:var(--pw-accent)}@supports (color:color-mix(in lab,red,red)){.bg-\\[color-mix\\(in_srgb\\,var\\(--pw-accent\\)_6\\%\\,white\\)\\]{background-color:color-mix(in srgb,var(--pw-accent) 6%,white)}}.bg-black\\/20{background-color:#0003}@supports (color:color-mix(in lab,red,red)){.bg-black\\/20{background-color:color-mix(in oklab,var(--color-black) 20%,transparent)}}.bg-emerald-100{background-color:var(--color-emerald-100)}.bg-gray-50{background-color:var(--color-gray-50)}.bg-gray-50\\/60{background-color:#f9fafb99}@supports (color:color-mix(in lab,red,red)){.bg-gray-50\\/60{background-color:color-mix(in oklab,var(--color-gray-50) 60%,transparent)}}.bg-gray-100{background-color:var(--color-gray-100)}.bg-gray-200{background-color:var(--color-gray-200)}.bg-gray-300{background-color:var(--color-gray-300)}.bg-gray-900{background-color:var(--color-gray-900)}.bg-red-50{background-color:var(--color-red-50)}.bg-slate-950\\/50{background-color:#02061880}@supports (color:color-mix(in lab,red,red)){.bg-slate-950\\/50{background-color:color-mix(in oklab,var(--color-slate-950) 50%,transparent)}}.bg-transparent{background-color:#0000}.bg-white{background-color:var(--color-white)}.bg-white\\/80{background-color:#fffc}@supports (color:color-mix(in lab,red,red)){.bg-white\\/80{background-color:color-mix(in oklab,var(--color-white) 80%,transparent)}}.p-2{padding:calc(var(--spacing) * 2)}.p-3\\.5{padding:calc(var(--spacing) * 3.5)}.p-6{padding:calc(var(--spacing) * 6)}.p-8{padding:calc(var(--spacing) * 8)}.px-1\\.5{padding-inline:calc(var(--spacing) * 1.5)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-2\\.5{padding-inline:calc(var(--spacing) * 2.5)}.px-3{padding-inline:calc(var(--spacing) * 3)}.px-4{padding-inline:calc(var(--spacing) * 4)}.px-5{padding-inline:calc(var(--spacing) * 5)}.px-6{padding-inline:calc(var(--spacing) * 6)}.px-8{padding-inline:calc(var(--spacing) * 8)}.py-0\\.5{padding-block:calc(var(--spacing) * .5)}.py-1{padding-block:calc(var(--spacing) * 1)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-2\\.5{padding-block:calc(var(--spacing) * 2.5)}.py-3{padding-block:calc(var(--spacing) * 3)}.py-3\\.5{padding-block:calc(var(--spacing) * 3.5)}.py-6{padding-block:calc(var(--spacing) * 6)}.py-8{padding-block:calc(var(--spacing) * 8)}.py-12{padding-block:calc(var(--spacing) * 12)}.pt-1{padding-top:calc(var(--spacing) * 1)}.pt-3{padding-top:calc(var(--spacing) * 3)}.pt-3\\.5{padding-top:calc(var(--spacing) * 3.5)}.pt-4{padding-top:calc(var(--spacing) * 4)}.pt-6{padding-top:calc(var(--spacing) * 6)}.pr-10{padding-right:calc(var(--spacing) * 10)}.pr-12{padding-right:calc(var(--spacing) * 12)}.pb-3{padding-bottom:calc(var(--spacing) * 3)}.pb-3\\.5{padding-bottom:calc(var(--spacing) * 3.5)}.pb-4{padding-bottom:calc(var(--spacing) * 4)}.pb-5{padding-bottom:calc(var(--spacing) * 5)}.pb-6{padding-bottom:calc(var(--spacing) * 6)}.pl-5{padding-left:calc(var(--spacing) * 5)}.text-center{text-align:center}.text-left{text-align:left}.font-mono{font-family:var(--font-mono)}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-3xl{font-size:var(--text-3xl);line-height:var(--tw-leading,var(--text-3xl--line-height))}.text-base{font-size:var(--text-base);line-height:var(--tw-leading,var(--text-base--line-height))}.text-lg{font-size:var(--text-lg);line-height:var(--tw-leading,var(--text-lg--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xl{font-size:var(--text-xl);line-height:var(--tw-leading,var(--text-xl--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.text-\\[0\\.9375rem\\]{font-size:.9375rem}.text-\\[10px\\]{font-size:10px}.text-\\[11px\\]{font-size:11px}.text-\\[12px\\]{font-size:12px}.text-\\[13px\\]{font-size:13px}.text-\\[15px\\]{font-size:15px}.text-\\[22px\\]{font-size:22px}.text-\\[26px\\]{font-size:26px}.leading-none{--tw-leading:1;line-height:1}.leading-relaxed{--tw-leading:var(--leading-relaxed);line-height:var(--leading-relaxed)}.leading-snug{--tw-leading:var(--leading-snug);line-height:var(--leading-snug)}.leading-tight{--tw-leading:var(--leading-tight);line-height:var(--leading-tight)}.font-bold{--tw-font-weight:var(--font-weight-bold);font-weight:var(--font-weight-bold)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-normal{--tw-font-weight:var(--font-weight-normal);font-weight:var(--font-weight-normal)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.tracking-normal{--tw-tracking:var(--tracking-normal);letter-spacing:var(--tracking-normal)}.tracking-tight{--tw-tracking:var(--tracking-tight);letter-spacing:var(--tracking-tight)}.tracking-wide{--tw-tracking:var(--tracking-wide);letter-spacing:var(--tracking-wide)}.tracking-wider{--tw-tracking:var(--tracking-wider);letter-spacing:var(--tracking-wider)}.text-balance{text-wrap:balance}.break-all{word-break:break-all}.whitespace-nowrap{white-space:nowrap}.text-emerald-500{color:var(--color-emerald-500)}.text-emerald-700{color:var(--color-emerald-700)}.text-gray-400{color:var(--color-gray-400)}.text-gray-500{color:var(--color-gray-500)}.text-gray-600{color:var(--color-gray-600)}.text-gray-700{color:var(--color-gray-700)}.text-gray-800{color:var(--color-gray-800)}.text-gray-800\\/70{color:#1e2939b3}@supports (color:color-mix(in lab,red,red)){.text-gray-800\\/70{color:color-mix(in oklab,var(--color-gray-800) 70%,transparent)}}.text-gray-900{color:var(--color-gray-900)}.text-red-600{color:var(--color-red-600)}.text-transparent{color:#0000}.text-white{color:var(--color-white)}.capitalize{text-transform:capitalize}.uppercase{text-transform:uppercase}.line-through{text-decoration-line:line-through}.decoration-gray-400{-webkit-text-decoration-color:var(--color-gray-400);text-decoration-color:var(--color-gray-400)}.decoration-\\[1\\.5px\\]{text-decoration-thickness:1.5px}.underline-offset-2{text-underline-offset:2px}.opacity-0{opacity:0}.opacity-40{opacity:.4}.opacity-60{opacity:.6}.opacity-90{opacity:.9}.opacity-100{opacity:1}.shadow{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_0_0_2px_rgba\\(239\\,68\\,68\\,0\\.5\\)\\]{--tw-shadow:0 0 0 2px var(--tw-shadow-color,#ef444480);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-sm{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.ring{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.outline{outline-style:var(--tw-outline-style);outline-width:1px}.\\!filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)!important}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-blur-md{--tw-backdrop-blur:blur(var(--blur-md));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-blur-sm{--tw-backdrop-blur:blur(var(--blur-sm));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-filter{-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-transform{transition-property:transform,translate,scale,rotate;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.duration-150{--tw-duration:.15s;transition-duration:.15s}.outline-none{--tw-outline-style:none;outline-style:none}.placeholder\\:text-gray-500::placeholder{color:var(--color-gray-500)}@media(hover:hover){.hover\\:-translate-y-px:hover{--tw-translate-y:-1px;translate:var(--tw-translate-x) var(--tw-translate-y)}.hover\\:border-gray-300:hover{border-color:var(--color-gray-300)}.hover\\:border-gray-400:hover{border-color:var(--color-gray-400)}.hover\\:bg-gray-50:hover{background-color:var(--color-gray-50)}.hover\\:bg-gray-50\\/60:hover{background-color:#f9fafb99}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-gray-50\\/60:hover{background-color:color-mix(in oklab,var(--color-gray-50) 60%,transparent)}}.hover\\:bg-gray-100:hover{background-color:var(--color-gray-100)}.hover\\:bg-gray-200\\/60:hover{background-color:#e5e7eb99}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-gray-200\\/60:hover{background-color:color-mix(in oklab,var(--color-gray-200) 60%,transparent)}}.hover\\:bg-white:hover{background-color:var(--color-white)}.hover\\:text-gray-700:hover{color:var(--color-gray-700)}.hover\\:text-gray-900:hover{color:var(--color-gray-900)}.hover\\:text-red-600:hover{color:var(--color-red-600)}.hover\\:underline:hover{text-decoration-line:underline}.hover\\:opacity-80:hover{opacity:.8}.hover\\:brightness-105:hover{--tw-brightness:brightness(105%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}}.focus\\:bg-gray-200\\/60:focus{background-color:#e5e7eb99}@supports (color:color-mix(in lab,red,red)){.focus\\:bg-gray-200\\/60:focus{background-color:color-mix(in oklab,var(--color-gray-200) 60%,transparent)}}.focus\\:shadow-\\[0_0_0_2px_color-mix\\(in_srgb\\,var\\(--pw-accent\\)_30\\%\\,transparent\\)\\]:focus{--tw-shadow:0 0 0 2px var(--tw-shadow-color,var(--pw-accent))}@supports (color:color-mix(in lab,red,red)){.focus\\:shadow-\\[0_0_0_2px_color-mix\\(in_srgb\\,var\\(--pw-accent\\)_30\\%\\,transparent\\)\\]:focus{--tw-shadow:0 0 0 2px var(--tw-shadow-color,color-mix(in srgb,var(--pw-accent) 30%,transparent))}}.focus\\:shadow-\\[0_0_0_2px_color-mix\\(in_srgb\\,var\\(--pw-accent\\)_30\\%\\,transparent\\)\\]:focus{box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.focus\\:outline-none:focus{--tw-outline-style:none;outline-style:none}.focus-visible\\:opacity-80:focus-visible{opacity:.8}.focus-visible\\:ring-2:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.focus-visible\\:ring-\\[var\\(--pw-accent\\)\\]:focus-visible{--tw-ring-color:var(--pw-accent)}.focus-visible\\:ring-offset-2:focus-visible{--tw-ring-offset-width:2px;--tw-ring-offset-shadow:var(--tw-ring-inset,) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color)}.focus-visible\\:ring-inset:focus-visible{--tw-ring-inset:inset}.active\\:scale-\\[0\\.98\\]:active{scale:.98}.disabled\\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:opacity-60:disabled{opacity:.6}@media(hover:hover){.disabled\\:hover\\:translate-y-0:disabled:hover{--tw-translate-y:calc(var(--spacing) * 0);translate:var(--tw-translate-x) var(--tw-translate-y)}.disabled\\:hover\\:brightness-100:disabled:hover{--tw-brightness:brightness(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}}@media(min-width:40rem){.sm\\:max-h-\\[calc\\(100dvh-2rem\\)\\]{max-height:calc(100dvh - 2rem)}.sm\\:p-4{padding:calc(var(--spacing) * 4)}.sm\\:p-8{padding:calc(var(--spacing) * 8)}.sm\\:px-8{padding-inline:calc(var(--spacing) * 8)}.sm\\:pt-5{padding-top:calc(var(--spacing) * 5)}.sm\\:pt-8{padding-top:calc(var(--spacing) * 8)}.sm\\:pb-4{padding-bottom:calc(var(--spacing) * 4)}.sm\\:pb-8{padding-bottom:calc(var(--spacing) * 8)}.sm\\:text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}}}.pw-cta-shimmer:before{content:"";z-index:1;background:linear-gradient(90deg,#0000,#ffffff59 50%,#0000);width:100%;height:100%;animation:3s infinite pw-cta-shimmer;position:absolute;top:0;left:-100%}@keyframes pw-cta-shimmer{0%{left:-100%}to{left:100%}}@property --tw-translate-x{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-y{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-z{syntax:"*";inherits:false;initial-value:0}@property --tw-rotate-x{syntax:"*";inherits:false}@property --tw-rotate-y{syntax:"*";inherits:false}@property --tw-rotate-z{syntax:"*";inherits:false}@property --tw-skew-x{syntax:"*";inherits:false}@property --tw-skew-y{syntax:"*";inherits:false}@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-leading{syntax:"*";inherits:false}@property --tw-font-weight{syntax:"*";inherits:false}@property --tw-tracking{syntax:"*";inherits:false}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:"*";inherits:false}@property --tw-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:"*";inherits:false}@property --tw-inset-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:"*";inherits:false}@property --tw-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:"*";inherits:false}@property --tw-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:"*";inherits:false}@property --tw-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:"*";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-outline-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-blur{syntax:"*";inherits:false}@property --tw-brightness{syntax:"*";inherits:false}@property --tw-contrast{syntax:"*";inherits:false}@property --tw-grayscale{syntax:"*";inherits:false}@property --tw-hue-rotate{syntax:"*";inherits:false}@property --tw-invert{syntax:"*";inherits:false}@property --tw-opacity{syntax:"*";inherits:false}@property --tw-saturate{syntax:"*";inherits:false}@property --tw-sepia{syntax:"*";inherits:false}@property --tw-drop-shadow{syntax:"*";inherits:false}@property --tw-drop-shadow-color{syntax:"*";inherits:false}@property --tw-drop-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:"*";inherits:false}@property --tw-backdrop-blur{syntax:"*";inherits:false}@property --tw-backdrop-brightness{syntax:"*";inherits:false}@property --tw-backdrop-contrast{syntax:"*";inherits:false}@property --tw-backdrop-grayscale{syntax:"*";inherits:false}@property --tw-backdrop-hue-rotate{syntax:"*";inherits:false}@property --tw-backdrop-invert{syntax:"*";inherits:false}@property --tw-backdrop-opacity{syntax:"*";inherits:false}@property --tw-backdrop-saturate{syntax:"*";inherits:false}@property --tw-backdrop-sepia{syntax:"*";inherits:false}@property --tw-duration{syntax:"*";inherits:false}@keyframes spin{to{transform:rotate(360deg)}}@keyframes ping{75%,to{opacity:0;transform:scale(2)}}';
let Se = false;
function pt() {
  if (Se || (Se = true, typeof CSS > "u" || typeof CSS.registerProperty != "function")) return;
  let r2;
  try {
    const e2 = new CSSStyleSheet();
    e2.replaceSync(De), r2 = e2.cssRules;
  } catch {
    return;
  }
  for (const e2 of r2) {
    if (e2.constructor.name !== "CSSPropertyRule") continue;
    const t2 = e2;
    try {
      CSS.registerProperty({
        name: t2.name,
        syntax: t2.syntax,
        inherits: t2.inherits,
        ...t2.initialValue != null ? { initialValue: t2.initialValue } : {}
      });
    } catch {
    }
  }
}
function gt(r2, e2, t2 = {}) {
  if (typeof document > "u")
    throw new Error("mountShadow called in non-DOM environment");
  pt();
  const i2 = t2.host ?? document.createElement("div");
  if (i2.setAttribute("data-paywall-host", ""), i2.style.cssText = t2.inline ? "all: initial; position: absolute; inset: 0; z-index: 1; pointer-events: none;" : "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;", !i2.isConnected && !t2.inline && document.body.appendChild(i2), !t2.inline && i2.isConnected && typeof i2.showPopover == "function")
    try {
      i2.setAttribute("popover", "manual"), i2.showPopover();
    } catch {
      i2.removeAttribute("popover");
    }
  const n2 = i2.attachShadow({ mode: t2.shadowMode ?? "closed" }), o3 = `
:host {
  all: initial !important;
  display: block !important;
  ${t2.inline ? "position: absolute !important; inset: 0 !important; z-index: 1 !important; pointer-events: none !important;" : "position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important;"}
  color: #111827 !important;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  font-style: normal !important;
  line-height: 1.5 !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  text-decoration: none !important;
  text-align: left !important;
  direction: ltr !important;
  cursor: auto !important;
  visibility: visible !important;
}
`, c2 = document.createElement("style");
  c2.textContent = o3 + De + (t2.injectCss ?? ""), n2.appendChild(c2);
  const l2 = document.createElement("div");
  l2.style.pointerEvents = "auto", n2.appendChild(l2);
  let h2 = e2;
  return G$2(_$1(r2, h2), l2), {
    shadowRoot: n2,
    update(u2) {
      h2 = { ...h2, ...u2 }, G$2(_$1(r2, h2), l2);
    },
    unmount() {
      G$2(null, l2), i2.remove();
    }
  };
}
const ft = (r2, e2, t2) => {
  const i2 = r2[e2];
  return i2 ? typeof i2 == "function" ? i2() : Promise.resolve(i2) : new Promise((n2, s2) => {
    (typeof queueMicrotask == "function" ? queueMicrotask : setTimeout)(
      s2.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + e2 + (e2.split("/").length !== t2 ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
}, wt = [
  "ru",
  "uk",
  "de",
  "es",
  "fr",
  "it",
  "pt",
  "pl",
  "cs",
  "hu",
  "ro",
  "nl",
  "sv",
  "da",
  "no",
  "fi",
  "el",
  "tr",
  "id",
  "ar",
  "ja",
  "ko",
  "zh",
  "hi",
  "th",
  "vi",
  "he"
], qe = (r2, e2, t2) => Ne(e2, t2), Fe = Q$2({ t: qe, locale: "en" });
function Ne(r2, e2) {
  if (!e2) return r2;
  let t2 = r2;
  for (const [i2, n2] of Object.entries(e2))
    t2 = t2.split(`{${i2}}`).join(String(n2));
  return t2;
}
const se = /* @__PURE__ */ new Map(), oe = /* @__PURE__ */ new Map();
function Ve(r2) {
  return wt.includes(r2);
}
function mt(r2) {
  const e2 = [];
  if (typeof navigator < "u" && navigator.language) {
    e2.push(navigator.language);
    const i2 = navigator.language.split("-")[0];
    i2 && i2 !== navigator.language && e2.push(i2);
  }
  const t2 = r2.settings.locale_default;
  if (t2) {
    e2.push(t2);
    const i2 = t2.split("-")[0];
    i2 && i2 !== t2 && e2.push(i2);
  }
  for (const i2 of e2)
    if (Ve(i2)) return i2;
  return null;
}
function bt(r2, e2) {
  return !!r2.locales && r2.locales[e2] !== void 0;
}
async function yt2(r2) {
  const e2 = se.get(r2);
  if (e2) return e2;
  const t2 = oe.get(r2);
  if (t2) return t2;
  const i2 = ft(/* @__PURE__ */ Object.assign({ "./locales/ar.ts": () => import("./chunks/ar-DxNtHOP6-D_VloQhH.js"), "./locales/cs.ts": () => import("./chunks/cs-BwKcj3Ld-DuZeRgjg.js"), "./locales/da.ts": () => import("./chunks/da-D7cuuSi5-C1QL8qDX.js"), "./locales/de.ts": () => import("./chunks/de-CrbEADXS-BlFToHjK.js"), "./locales/el.ts": () => import("./chunks/el-ZfB4Iqul-DxZuetHn.js"), "./locales/es.ts": () => import("./chunks/es-D-8Hz1oi-D1sfWo2-.js"), "./locales/fi.ts": () => import("./chunks/fi-DrZs_mlw-BB9ID9VZ.js"), "./locales/fr.ts": () => import("./chunks/fr-B-hKZ2Qj-1mQFRVPl.js"), "./locales/he.ts": () => import("./chunks/he-DYG3GZH9-CQp7HIAO.js"), "./locales/hi.ts": () => import("./chunks/hi-B4x8UToQ--RCGOkHs.js"), "./locales/hu.ts": () => import("./chunks/hu-DsQ7uYWm-FGMx_LVp.js"), "./locales/id.ts": () => import("./chunks/id-B9nOjQtk-BdyWkAFd.js"), "./locales/it.ts": () => import("./chunks/it-BYxdZk3i-BVfzTGnh.js"), "./locales/ja.ts": () => import("./chunks/ja-B6cssFwq-BQ5GjQPB.js"), "./locales/ko.ts": () => import("./chunks/ko-DQepcSJq-CZL6Has6.js"), "./locales/nl.ts": () => import("./chunks/nl-BPIoO4W2-Ba17qlnZ.js"), "./locales/no.ts": () => import("./chunks/no-BnW620zl-jk2miden.js"), "./locales/pl.ts": () => import("./chunks/pl-zVAX4cLO-C3-tiyKU.js"), "./locales/pt.ts": () => import("./chunks/pt-YHlwRjpr-D0l8ZSDU.js"), "./locales/ro.ts": () => import("./chunks/ro-BIkdSqnr-CEGI3SWZ.js"), "./locales/ru.ts": () => import("./chunks/ru-YgJ6Zw-g-5TGmGc_U.js"), "./locales/sv.ts": () => import("./chunks/sv-UmblPGgx-DpPG7ecI.js"), "./locales/th.ts": () => import("./chunks/th-CxKBwk3z-B3N0znmC.js"), "./locales/tr.ts": () => import("./chunks/tr-11aeILHo-DSz6Qek1.js"), "./locales/uk.ts": () => import("./chunks/uk-Dhw5DtrI-WfHyyHSU.js"), "./locales/vi.ts": () => import("./chunks/vi-eCGRA0gQ-CL_yOum1.js"), "./locales/zh.ts": () => import("./chunks/zh-CH0U-LY3-Bjw5-Tlz.js") }), `./locales/${r2}.ts`, 3).then((n2) => {
    const s2 = n2.default ?? {};
    return se.set(r2, s2), s2;
  }).catch((n2) => {
    console.warn(`[paywall] failed to load locale chunk "${r2}"`, n2);
    const s2 = {};
    return se.set(r2, s2), s2;
  }).finally(() => {
    oe.delete(r2);
  });
  return oe.set(r2, i2), i2;
}
function vt({ bootstrap: r2, forceLocale: e2, children: t2 }) {
  const [i2, n2] = d("en"), [s2, o3] = d(null);
  y(() => {
    const h2 = (e2 && Ve(e2) ? e2 : null) ?? (() => {
      if (!r2) return null;
      const g2 = mt(r2);
      return !g2 || !bt(r2, g2) ? null : g2;
    })();
    if (!h2) {
      (s2 !== null || i2 !== "en") && (n2("en"), o3(null));
      return;
    }
    if (h2 === i2 && s2) return;
    let u2 = false;
    return yt2(h2).then((g2) => {
      u2 || (n2(h2), o3(g2));
    }), () => {
      u2 = true;
    };
  }, [r2, e2]);
  const c2 = {
    locale: i2,
    t: s2 ? (l2, h2, u2) => Ne(s2[l2] ?? h2, u2) : qe
  };
  return /* @__PURE__ */ u$1(Fe.Provider, { value: c2, children: t2 });
}
function M() {
  return x(Fe);
}
const xt = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
function kt({
  open: r2,
  onClose: e2,
  labelledBy: t2,
  brandColor: i2,
  topBanner: n2,
  allowClose: s2 = true,
  hideCloseButton: o3 = false,
  inline: c2 = false,
  children: l2
}) {
  const { t: h2 } = M(), u2 = A(null), g2 = A(null);
  return y(() => {
    if (!r2) return;
    g2.current = document.activeElement ?? null;
    const f2 = u2.current;
    f2 && (f2.querySelector("[data-pw-autofocus]") ?? f2).focus({ preventScroll: true });
    const y2 = (p2) => {
      if (p2.key === "Escape") {
        if (!s2) return;
        p2.stopPropagation(), e2();
        return;
      }
      if (p2.key !== "Tab" || !u2.current) return;
      const b = Array.from(
        u2.current.querySelectorAll(xt)
      ).filter((R2) => !R2.hasAttribute("disabled") && R2.tabIndex !== -1);
      if (b.length === 0) {
        p2.preventDefault();
        return;
      }
      const E2 = b[0], z2 = b[b.length - 1], P2 = document.activeElement;
      p2.shiftKey && P2 === E2 ? (p2.preventDefault(), z2.focus()) : !p2.shiftKey && P2 === z2 && (p2.preventDefault(), E2.focus());
    };
    document.addEventListener("keydown", y2, true);
    const O2 = document.body.style.overflow;
    return c2 || (document.body.style.overflow = "hidden"), () => {
      document.removeEventListener("keydown", y2, true), c2 || (document.body.style.overflow = O2), g2.current?.focus?.({ preventScroll: true });
    };
  }, [r2, e2, s2, c2]), r2 ? /* @__PURE__ */ u$1(
    "div",
    {
      class: `${c2 ? "absolute z-[1]" : "fixed z-[2147483647]"} inset-0 flex items-center justify-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-md animate-[pw-fade-in_180ms_ease-out]`,
      onClick: (f2) => {
        s2 && f2.target === f2.currentTarget && e2();
      },
      "data-pw-root": true,
      children: [
        /* @__PURE__ */ u$1(
          "div",
          {
            class: "relative flex w-full max-w-[400px] flex-col animate-[pw-scale-in_220ms_cubic-bezier(0.16,1,0.3,1)]",
            style: { "--pw-accent": i2 ?? "#3b82f6" },
            children: [
              n2,
              /* @__PURE__ */ u$1(
                "div",
                {
                  ref: u2,
                  role: "dialog",
                  "aria-modal": "true",
                  "aria-labelledby": t2,
                  tabIndex: -1,
                  class: "relative flex max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-white outline-none",
                  style: {
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
                  },
                  children: [
                    l2,
                    s2 && !o3 ? /* @__PURE__ */ u$1(
                      "button",
                      {
                        type: "button",
                        onClick: e2,
                        "aria-label": h2("modal.close_aria", "Close"),
                        class: "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 backdrop-blur-sm transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
                        children: /* @__PURE__ */ u$1("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true", children: /* @__PURE__ */ u$1(
                          "path",
                          {
                            d: "M3 3l10 10M13 3L3 13",
                            stroke: "currentColor",
                            "stroke-width": "1.75",
                            "stroke-linecap": "round"
                          }
                        ) })
                      }
                    ) : null
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ u$1("style", { children: `
        @keyframes pw-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pw-scale-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96) }
          to { opacity: 1; transform: none }
        }
      ` })
      ]
    }
  ) : null;
}
function Ce(r2, e2) {
  switch (r2) {
    case "google":
      return e2("auth.continue_with_google", "Continue with Google");
    case "apple":
      return e2("auth.continue_with_apple", "Continue with Apple");
    case "github":
      return e2("auth.continue_with_github", "Continue with GitHub");
    case "facebook":
      return e2("auth.continue_with_facebook", "Continue with Facebook");
  }
}
function Ie(r2, e2, t2) {
  const i2 = e2 === "signup" ? t2("auth.signup_failed", "Sign-up failed") : t2("auth.signin_failed", "Sign-in failed");
  if (!(r2 instanceof o$3)) return i2;
  switch (r2.code) {
    case "invalid_credentials":
      return t2("auth.invalid_credentials", "Invalid email or password");
    case "email_not_confirmed":
      return t2("auth.email_not_confirmed", "Please confirm your email before signing in.");
    case "email_exists":
    case "user_already_exists":
      return t2("auth.email_exists", "An account with this email already exists.");
    case "weak_password":
      return t2("auth.weak_password", "Password is too weak.");
    case "invalid_otp":
    case "otp_expired":
    case "token_expired":
      return t2("auth.invalid_otp", "The code is invalid or has expired.");
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
    case "rate_limited":
    case "http_429":
      return t2("auth.rate_limited", "Too many requests. Please try again later.");
    case "network_error":
      return t2("auth.network_error", "Network error. Please check your connection and try again.");
    case "upstream":
    case "upstream_error":
    case "http_502":
    case "http_503":
    case "http_504":
      return t2("auth.service_unavailable", "Service is temporarily unavailable. Please try again.");
    // Merchant misconfiguration, not a user error: OAuth redirects and
    // confirmation/recovery email links are built from the paywall's custom
    // domain (backend hard-fails without it). Shown as-is so the integrating
    // developer sees the actionable cause right in the UI during setup.
    case "custom_domain_required":
      return t2(
        "auth.custom_domain_required",
        "Sign-in is not available: the paywall has no custom domain configured (platform settings → Custom domains)."
      );
    default:
      return i2;
  }
}
function $e({ block: r2, ctx: e2 }) {
  const t2 = e2.auth, i2 = e2.authSession, n2 = r2.allow_signup !== false, s2 = r2.allow_password_reset !== false, o3 = r2.hide_when_authenticated !== false;
  if (!t2)
    return typeof console < "u" && console.warn("[paywall] auth_panel rendered without AuthClient — pass `auth: true` to PaywallUI"), null;
  const c2 = i2 && !i2.user.is_anonymous ? i2 : null;
  return c2 && o3 ? null : c2 ? /* @__PURE__ */ u$1(_t, { email: c2.user.email ?? "", onSignOut: () => t2.signOut().catch(() => {
  }) }) : /* @__PURE__ */ u$1(
    St,
    {
      block: r2,
      allowSignup: n2,
      allowReset: s2,
      ctx: e2
    }
  );
}
function _t({ email: r2, onSignOut: e2 }) {
  const { t: t2 } = M();
  return /* @__PURE__ */ u$1("div", { class: "flex items-center justify-between gap-3 rounded-2xl bg-gray-100 px-4 py-3", children: [
    /* @__PURE__ */ u$1("div", { class: "flex flex-col", children: [
      /* @__PURE__ */ u$1("span", { class: "text-[10px] font-semibold uppercase tracking-wider text-gray-500", children: t2("auth.signed_in", "Signed in") }),
      /* @__PURE__ */ u$1("span", { class: "text-sm font-medium text-gray-900", children: r2 })
    ] }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: e2,
        class: "rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
        children: t2("auth.sign_out", "Sign out")
      }
    )
  ] });
}
function St({ block: r2, allowSignup: e2, allowReset: t2, ctx: i2 }) {
  const { t: n2 } = M(), s2 = i2.auth, o3 = r2.providers ?? [], c2 = i2.initialAuthMode === "signup" && e2 ? "signup" : "signin", [l2, h2] = d(c2), [u2, g2] = d(""), [x2, _2] = d(""), [m2, f2] = d(""), [y$12, O2] = d(""), [p2, b] = d(null), E2 = A(false), [z2, P2] = d(null), [R2, q2] = d(null), [N2, B2] = d(false), [T2, F2] = d(null), U2 = A(null), [Y2, te2] = d(null);
  y(() => {
    if (typeof s2.getLastLogin != "function") return;
    let C2 = false;
    return s2.getLastLogin().then(
      (k2) => {
        C2 || !k2 || (te2(k2), k2.email && g2((L2) => L2 === "" ? k2.email : L2));
      },
      () => {
      }
    ), () => {
      C2 = true;
    };
  }, [s2]);
  const V2 = (C2) => {
    h2(C2), P2(null), q2(null), B2(false), F2(null), U2.current = null;
  };
  y(() => {
    if (l2 !== "signup_sent" || !U2.current || typeof window > "u") return;
    let C2 = false, k2 = false;
    const L2 = async () => {
      const ie2 = U2.current;
      if (!(C2 || k2 || !ie2)) {
        k2 = true;
        try {
          await s2.signInWithEmail({ email: ie2.email, password: ie2.password }), U2.current = null;
        } catch {
        } finally {
          k2 = false;
        }
      }
    }, W2 = () => {
      typeof document < "u" && document.visibilityState === "hidden" || L2();
    };
    window.addEventListener("focus", W2), document.addEventListener("visibilitychange", W2);
    let me = 0;
    const be = window.setInterval(() => {
      if (me += 1, me > 30) {
        window.clearInterval(be);
        return;
      }
      L2();
    }, 2e4);
    return () => {
      C2 = true, window.removeEventListener("focus", W2), document.removeEventListener("visibilitychange", W2), window.clearInterval(be);
    };
  }, [l2, s2]);
  const re2 = async (C2) => {
    if (C2.preventDefault(), !(E2.current || p2)) {
      E2.current = true;
      try {
        if (P2(null), q2(null), l2 === "signup" && !N2) {
          if (!u2.trim()) return;
          B2(true);
          return;
        }
        if (l2 === "signup" && x2 !== m2) {
          P2(n2("auth.passwords_mismatch", "Passwords don't match"));
          return;
        }
        b("email");
        try {
          if (l2 === "signin")
            await s2.signInWithEmail({ email: u2, password: x2 });
          else if (l2 === "signup") {
            const k2 = await s2.signUp({ email: u2, password: x2 });
            k2.kind === "confirmation_required" ? (U2.current = { email: u2, password: x2 }, _2(""), h2("signup_sent")) : k2.kind === "already_registered" && (h2("signin"), B2(false), f2(""), q2(
              n2(
                "auth.email_already_registered",
                "This email is already registered. Sign in below — with your password or the social account you used."
              )
            ));
          } else l2 === "forgot" ? (await s2.requestPasswordReset({ email: u2 }), h2("reset_sent")) : l2 === "reset_verify" && (await s2.verifyOtp({
            email: u2,
            token: y$12,
            type: x2 ? "recovery" : "email"
          }), x2 && await s2.updatePassword({ password: x2 }));
        } catch (k2) {
          if (l2 === "signup" && k2 instanceof o$3 && (k2.code === "email_exists" || k2.code === "user_already_exists")) {
            h2("signin"), B2(false), f2(""), q2(
              n2(
                "auth.email_already_registered",
                "This email is already registered. Sign in below with your password or the account you used to sign up."
              )
            );
            return;
          }
          P2(Ie(k2, l2 === "signup" ? "signup" : l2 === "reset_verify" ? "otp" : l2 === "forgot" ? "reset" : "signin", n2));
        } finally {
          b(null);
        }
      } finally {
        E2.current = false;
      }
    }
  }, K2 = async (C2, k2) => {
    if (!(E2.current || p2)) {
      E2.current = true, b(C2), P2(null), q2(null), k2?.switchAccount || F2(null);
      try {
        await s2.signInWithOAuth({
          provider: C2,
          switchAccount: k2?.switchAccount,
          onPopupOpened: () => b(null)
        }), F2(null);
      } catch (L2) {
        if (L2 instanceof o$3 && (L2.code === "oauth_cancelled" || L2.code === "oauth_timeout"))
          return;
        if (L2 instanceof o$3 && L2.code === "oauth_identity_already_linked") {
          F2(C2), P2(
            n2(
              "auth.identity_already_linked",
              "This account is already registered. Sign in to it below."
            )
          );
          return;
        }
        typeof console < "u" && console.warn("[paywall] OAuth sign-in failed", {
          provider: C2,
          code: L2 instanceof o$3 ? L2.code : void 0,
          message: L2 instanceof Error ? L2.message : String(L2)
        }), P2(Ie(L2, "signin", n2));
      } finally {
        E2.current = false, b(null);
      }
    }
  }, w2 = o3.length > 0 && (l2 === "signin" || l2 === "signup"), A$12 = l2 === "signin" || l2 === "signup" || l2 === "forgot", S2 = l2 === "signin" || l2 === "signup" && N2;
  return l2 === "reset_sent" ? /* @__PURE__ */ u$1(jt, { email: u2, onBack: () => V2("signin"), t: n2 }) : l2 === "signup_sent" ? /* @__PURE__ */ u$1(Ut, { email: u2, onBack: () => V2("signin"), t: n2 }) : /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-5", children: [
    /* @__PURE__ */ u$1(Ct, { mode: l2, customHeading: r2.heading, customSubheading: r2.subheading }),
    w2 ? /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-2.5", children: [
      o3.map((C2) => /* @__PURE__ */ u$1("div", { class: "relative", children: [
        /* @__PURE__ */ u$1(
          "button",
          {
            type: "button",
            onClick: () => K2(C2),
            disabled: p2 !== null,
            class: "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-1 border-gray-200 bg-white px-5 text-base font-medium text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
            children: [
              p2 === C2 ? /* @__PURE__ */ u$1("span", { class: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" }) : /* @__PURE__ */ u$1(Le, { provider: C2 }),
              /* @__PURE__ */ u$1("span", { children: Ce(C2, n2) })
            ]
          }
        ),
        Y2?.method === C2 ? /* @__PURE__ */ u$1(Pt, { email: Y2.email }) : null
      ] }, C2)),
      /* @__PURE__ */ u$1(Ot, {})
    ] }) : null,
    /* @__PURE__ */ u$1("form", { onSubmit: re2, class: "flex flex-col gap-3", children: [
      A$12 && /* @__PURE__ */ u$1(
        Ae,
        {
          type: "email",
          placeholder: n2("auth.email", "Email address"),
          value: u2,
          onInput: g2,
          autocomplete: "email",
          required: true
        }
      ),
      S2 && /* @__PURE__ */ u$1(
        le,
        {
          placeholder: n2("auth.password", "Password"),
          value: x2,
          onInput: _2,
          autocomplete: l2 === "signin" ? "current-password" : "new-password",
          required: true
        }
      ),
      l2 === "signup" && N2 && /* @__PURE__ */ u$1(
        le,
        {
          placeholder: n2("auth.repeat_password", "Repeat password"),
          value: m2,
          onInput: f2,
          autocomplete: "new-password",
          required: true
        }
      ),
      l2 === "reset_verify" && /* @__PURE__ */ u$1(
        Ae,
        {
          type: "text",
          placeholder: n2("auth.confirmation_code", "Confirmation code"),
          value: y$12,
          onInput: O2,
          autocomplete: "one-time-code",
          inputMode: "numeric",
          required: true
        }
      ),
      l2 === "reset_verify" && /* @__PURE__ */ u$1(
        le,
        {
          placeholder: n2(
            "auth.new_password_optional",
            "New password (optional — only for password reset)"
          ),
          value: x2,
          onInput: _2,
          autocomplete: "new-password"
        }
      ),
      l2 === "signin" && t2 && /* @__PURE__ */ u$1("div", { class: "flex justify-end text-sm", children: /* @__PURE__ */ u$1(ee, { onClick: () => V2("forgot"), children: n2("auth.forgot_password", "Forgot password?") }) }),
      z2 && /* @__PURE__ */ u$1("p", { class: "text-sm text-red-600", children: z2 }),
      R2 && /* @__PURE__ */ u$1("p", { class: "text-sm text-gray-500", children: R2 }),
      T2 && /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: () => K2(T2, { switchAccount: true }),
          disabled: p2 !== null,
          class: "flex h-12 w-full items-center justify-center gap-2.5 rounded-full border-1 border-gray-200 bg-white px-5 text-base font-medium text-gray-900 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
          children: [
            p2 === T2 ? /* @__PURE__ */ u$1("span", { class: "inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" }) : /* @__PURE__ */ u$1(Le, { provider: T2 }),
            /* @__PURE__ */ u$1("span", { children: Ce(T2, n2) })
          ]
        }
      ),
      /* @__PURE__ */ u$1(
        Mt,
        {
          busy: p2 === "email",
          label: At(l2, N2, r2.submit_label ?? r2.heading, n2)
        }
      )
    ] }),
    /* @__PURE__ */ u$1(
      Lt,
      {
        mode: l2,
        allowSignup: e2,
        onSwitch: V2
      }
    )
  ] });
}
function Ct({
  mode: r2,
  customHeading: e2,
  customSubheading: t2
}) {
  const { t: i2 } = M(), n2 = It(r2, i2), s2 = r2 === "signin" || r2 === "signup", o3 = s2 && e2 ? e2 : n2.title, c2 = s2 && t2 !== void 0 ? t2 || null : n2.subtitle;
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-2", children: [
    /* @__PURE__ */ u$1("h2", { class: "text-3xl font-bold tracking-tight text-gray-900", children: o3 }),
    c2 ? /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: c2 }) : null
  ] });
}
function It(r2, e2) {
  switch (r2) {
    case "signin":
      return {
        title: e2("auth.welcome", "Welcome back!"),
        subtitle: e2("auth.default_subtitle", "Sign in to access all features and sync your data.")
      };
    case "signup":
      return {
        title: e2("auth.welcome_signup", "Welcome!"),
        subtitle: e2("auth.default_subtitle", "Sign in to access all features and sync your data.")
      };
    case "forgot":
      return {
        title: e2("auth.forgot_password_title", "Forgot password?"),
        subtitle: e2(
          "auth.forgot_subtitle",
          "Enter your email and we'll send you a password reset link."
        )
      };
    case "reset_sent":
    case "signup_sent":
      return {
        title: e2("auth.check_email_title", "Check your email"),
        subtitle: null
      };
    case "reset_verify":
      return {
        title: e2("auth.reset_password_title", "Reset password"),
        subtitle: e2(
          "auth.reset_password_subtitle",
          "Enter the code from your email and a new password."
        )
      };
  }
}
function At(r2, e2, t2, i2) {
  if (r2 === "signin" && t2) return t2;
  switch (r2) {
    case "signin":
      return i2("auth.log_in", "Sign In");
    case "signup":
      return e2 ? i2("auth.create_account", "Create Account") : i2("auth.sign_up", "Sign Up");
    case "forgot":
      return i2("auth.send_reset", "Send Reset Email");
    case "reset_verify":
      return i2("auth.verify", "Verify");
    default:
      return i2("cta.continue", "Continue");
  }
}
function Lt({
  mode: r2,
  allowSignup: e2,
  onSwitch: t2
}) {
  const { t: i2 } = M();
  return r2 === "signin" && e2 ? /* @__PURE__ */ u$1("p", { class: "text-center text-sm text-gray-600", children: [
    i2("auth.no_account", "Don't have an account?"),
    " ",
    /* @__PURE__ */ u$1(ee, { onClick: () => t2("signup"), children: i2("auth.sign_up_link", "Sign Up") })
  ] }) : r2 === "signup" ? /* @__PURE__ */ u$1("p", { class: "text-center text-sm text-gray-600", children: [
    i2("auth.have_account", "Already have an account?"),
    " ",
    /* @__PURE__ */ u$1(ee, { onClick: () => t2("signin"), children: i2("auth.log_in_link", "Log In") })
  ] }) : r2 === "forgot" || r2 === "reset_sent" || r2 === "reset_verify" ? /* @__PURE__ */ u$1("p", { class: "text-center text-sm text-gray-600", children: [
    i2("auth.no_account", "Don't have an account?"),
    " ",
    /* @__PURE__ */ u$1(ee, { onClick: () => t2("signup"), children: i2("auth.sign_up_link", "Sign Up") })
  ] }) : null;
}
function ee({
  onClick: r2,
  children: e2
}) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      onClick: r2,
      class: "font-semibold transition-opacity hover:opacity-80 focus:outline-none focus-visible:opacity-80",
      style: { color: "var(--pw-accent)" },
      children: e2
    }
  );
}
function Mt({ busy: r2, label: e2 }) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "submit",
      disabled: r2,
      class: "pw-cta-shimmer relative mt-1 flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
      style: {
        background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
        boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
      },
      children: r2 ? /* @__PURE__ */ u$1("span", { class: "relative z-10 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" }) : /* @__PURE__ */ u$1("span", { class: "relative z-10", children: e2 })
    }
  );
}
function Ae({ type: r2, placeholder: e2, value: t2, onInput: i2, autocomplete: n2, inputMode: s2, required: o3 }) {
  return /* @__PURE__ */ u$1(
    "input",
    {
      type: r2,
      value: t2,
      placeholder: e2,
      onInput: (c2) => i2(c2.target.value),
      autocomplete: n2,
      inputMode: s2,
      required: o3,
      class: "h-14 w-full rounded-2xl bg-gray-100 px-5 text-base text-gray-900 outline-none transition-all placeholder:text-gray-500 hover:bg-gray-200/60 focus:bg-gray-200/60 focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--pw-accent)_30%,transparent)]"
    }
  );
}
function le({ placeholder: r2, value: e2, onInput: t2, autocomplete: i2, required: n2 }) {
  const { t: s2 } = M(), [o3, c2] = d(false), l2 = A(null);
  y(() => {
    const g2 = l2.current;
    g2 && g2.value !== e2 && (g2.value = e2);
  }, [o3, e2]);
  const h2 = s2("auth.show_password", "Show password"), u2 = s2("auth.hide_password", "Hide password");
  return /* @__PURE__ */ u$1("div", { class: "relative", children: [
    /* @__PURE__ */ u$1(
      "input",
      {
        ref: l2,
        type: o3 ? "text" : "password",
        value: e2,
        placeholder: r2,
        onInput: (g2) => t2(g2.target.value),
        autocomplete: i2,
        required: n2,
        class: "h-14 w-full rounded-2xl bg-gray-100 pl-5 pr-12 text-base text-gray-900 outline-none transition-all placeholder:text-gray-500 hover:bg-gray-200/60 focus:bg-gray-200/60 focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--pw-accent)_30%,transparent)]"
      }
    ),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: () => c2((g2) => !g2),
        "aria-label": o3 ? u2 : h2,
        tabIndex: -1,
        class: "absolute right-4 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-gray-500 transition-colors hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
        children: o3 ? /* @__PURE__ */ u$1(Tt, {}) : /* @__PURE__ */ u$1(Et, {})
      }
    )
  ] });
}
function Et() {
  return /* @__PURE__ */ u$1("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ u$1(
      "path",
      {
        d: "M1.667 10S4.583 4.167 10 4.167 18.333 10 18.333 10 15.417 15.833 10 15.833 1.667 10 1.667 10Z",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    ),
    /* @__PURE__ */ u$1("circle", { cx: "10", cy: "10", r: "2.5", stroke: "currentColor", "stroke-width": "1.5" })
  ] });
}
function Tt() {
  return /* @__PURE__ */ u$1("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
    /* @__PURE__ */ u$1(
      "path",
      {
        d: "M8.236 4.293A6.96 6.96 0 0 1 10 4.167C15.417 4.167 18.333 10 18.333 10a13.5 13.5 0 0 1-1.92 2.755M11.768 11.768A2.5 2.5 0 0 1 8.233 8.233",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    ),
    /* @__PURE__ */ u$1(
      "path",
      {
        d: "M14.953 14.953A8.84 8.84 0 0 1 10 15.833C4.583 15.833 1.667 10 1.667 10a13.5 13.5 0 0 1 3.38-3.953M1.667 1.667l16.666 16.666",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }
    )
  ] });
}
function Pt({ email: r2 }) {
  const { t: e2 } = M(), t2 = r2 ? e2("auth.last_used", "Last used · {email}", { email: Bt(r2) }) : e2("auth.last_used_no_email", "Last used");
  return /* @__PURE__ */ u$1("span", { class: "pointer-events-none absolute -top-2 right-3 max-w-[75%] truncate rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-sm", children: t2 });
}
function Bt(r2) {
  const [e2, t2] = r2.split("@");
  return t2 ? `${e2.slice(0, 3)}*****@${t2}` : r2;
}
function Ot() {
  const { t: r2 } = M();
  return /* @__PURE__ */ u$1("div", { class: "flex items-center gap-3 py-1 text-sm text-gray-400", children: [
    /* @__PURE__ */ u$1("div", { class: "h-px flex-1 bg-gray-200" }),
    /* @__PURE__ */ u$1("span", { children: r2("auth.or", "or") }),
    /* @__PURE__ */ u$1("div", { class: "h-px flex-1 bg-gray-200" })
  ] });
}
function Le({ provider: r2 }) {
  return r2 === "google" ? /* @__PURE__ */ u$1("svg", { width: "20", height: "20", viewBox: "0 0 18 18", "aria-hidden": "true", children: [
    /* @__PURE__ */ u$1("path", { fill: "#4285F4", d: "M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62Z" }),
    /* @__PURE__ */ u$1("path", { fill: "#34A853", d: "M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.36 0-4.36-1.59-5.07-3.74H.92v2.33A9 9 0 0 0 9 18Z" }),
    /* @__PURE__ */ u$1("path", { fill: "#FBBC05", d: "M3.93 10.68a5.4 5.4 0 0 1 0-3.36V4.99H.92a9 9 0 0 0 0 8.02l3-2.33Z" }),
    /* @__PURE__ */ u$1("path", { fill: "#EA4335", d: "M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 .92 4.99l3.01 2.33C4.64 5.17 6.64 3.58 9 3.58Z" })
  ] }) : r2 === "apple" ? (
    // viewBox 0 0 24 24 leaves whitespace above/below the path, so visually
    // the Apple logo looks smaller than Google. We compensate with a larger
    // width/height — 26×26 gives roughly equal optical size to Google's 20×20.
    /* @__PURE__ */ u$1("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ u$1("path", { d: "M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" }) })
  ) : r2 === "github" ? /* @__PURE__ */ u$1("svg", { width: "20", height: "20", viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ u$1("path", { d: "M8 0C3.6 0 0 3.6 0 8a8 8 0 0 0 5.5 7.6c.4.1.5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7 0-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3.1-1.9 3.7-3.6 3.9.3.3.6.8.6 1.6V15c0 .2.1.5.6.4A8 8 0 0 0 16 8c0-4.4-3.6-8-8-8Z" }) }) : /* @__PURE__ */ u$1("svg", { width: "18", height: "20", viewBox: "0 0 14 16", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ u$1("path", { d: "M14 2.7C14 1.2 12.8 0 11.3 0H2.7C1.2 0 0 1.2 0 2.7v10.6C0 14.8 1.2 16 2.7 16h4V9.8H4.7v-2H6.7V6.4c0-2 1.2-3.1 3-3.1.9 0 1.7.1 2 .2V5h-1.4c-.8 0-1 .4-1 1v1.5h2.4l-.3 2H9.3V16h2c1.5 0 2.7-1.2 2.7-2.7V2.7Z" }) });
}
function Ut({
  email: r2,
  onBack: e2,
  t: t2
}) {
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-4 py-2 text-center", children: [
    /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex h-14 w-14 items-center justify-center rounded-full",
        style: {
          background: "linear-gradient(135deg, #4ade80, #16a34a)",
          color: "#fff",
          boxShadow: "0 0 0 8px rgba(74,222,128,0.12), 0 8px 20px -6px rgba(22,163,74,0.45)"
        },
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 13l4 4L19 7",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ) })
      }
    ),
    /* @__PURE__ */ u$1("h2", { class: "mt-1 text-3xl font-bold tracking-tight text-gray-900", children: t2("auth.check_email_title", "Check your email") }),
    /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: t2(
      "auth.signup_sent_subtitle",
      "We sent a confirmation link to your email. Click it to activate your account — you will be signed in here automatically."
    ) }),
    r2 ? /* @__PURE__ */ u$1("p", { class: "break-all text-base font-semibold text-gray-900", children: r2 }) : null,
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: e2,
        class: "pw-cta-shimmer relative mt-2 flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        style: {
          background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
          boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
        },
        children: /* @__PURE__ */ u$1("span", { class: "relative z-10", children: t2("auth.back_to_login", "Back to Login") })
      }
    )
  ] });
}
function jt({
  email: r2,
  onBack: e2,
  t: t2
}) {
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-4 py-2 text-center", children: [
    /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex h-14 w-14 items-center justify-center rounded-full",
        style: {
          background: "linear-gradient(135deg, #4ade80, #16a34a)",
          color: "#fff",
          boxShadow: "0 0 0 8px rgba(74,222,128,0.12), 0 8px 20px -6px rgba(22,163,74,0.45)"
        },
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 13l4 4L19 7",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ) })
      }
    ),
    /* @__PURE__ */ u$1("h2", { class: "mt-1 text-3xl font-bold tracking-tight text-gray-900", children: t2("auth.check_email_title", "Check your email") }),
    /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: t2(
      "auth.reset_sent_subtitle",
      "We sent a password reset link. Follow the instructions in the email to reset your password."
    ) }),
    r2 ? /* @__PURE__ */ u$1("p", { class: "break-all text-base font-semibold text-gray-900", children: r2 }) : null,
    /* @__PURE__ */ u$1("p", { class: "text-sm text-gray-500", children: t2("auth.reset_link_valid", "The link is valid for 1 hour.") }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: e2,
        class: "pw-cta-shimmer relative mt-2 flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        style: {
          background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
          boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
        },
        children: /* @__PURE__ */ u$1("span", { class: "relative z-10", children: t2("auth.back_to_login", "Back to Login") })
      }
    )
  ] });
}
function zt2({
  block: r2,
  bootstrap: e2,
  auth: t2,
  authSession: i2,
  onBack: n2,
  showBack: s2 = true,
  intent: o3 = "preauth",
  initialMode: c2
}) {
  const { t: l2 } = M(), h2 = {
    bootstrap: e2,
    selectedPriceId: null,
    setSelectedPriceId: () => {
    },
    onAction: () => {
    },
    auth: t2,
    authSession: i2,
    initialAuthMode: c2
  }, u2 = o3 === "restore" ? {
    ...r2,
    heading: l2("auth.restore_purchases_heading", "Restore Purchases"),
    subheading: l2(
      "auth.restore_purchases_subheading",
      "Please sign in to restore your purchases."
    )
  } : o3 === "preauth" ? {
    ...r2,
    heading: l2("auth.login_continue_purchase", "Log in to continue your purchase"),
    subheading: l2(
      "auth.link_purchase_subheading",
      "We'll link the purchase to your account to keep access."
    ),
    // Preauth heading — a descriptive sentence ("Log in to continue
    // your purchase"), not an action verb. Long localizations (RU:
    // "Войдите, чтобы продолжить покупку") don't fit into the h-12
    // pill button and wrap onto 2 lines. An explicit short submit_label
    // solves it.
    submit_label: l2("auth.log_in", "Sign In")
  } : r2;
  return /* @__PURE__ */ u$1("div", { class: "relative flex-1 min-h-0 overflow-y-auto p-6 sm:p-8", children: [
    s2 ? /* @__PURE__ */ u$1(Rt, { onClick: n2, ariaLabel: l2("nav.back_aria", "Back") }) : null,
    /* @__PURE__ */ u$1($e, { block: u2, ctx: h2 })
  ] });
}
function Rt({ onClick: r2, ariaLabel: e2 }) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      onClick: r2,
      "aria-label": e2,
      class: "absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
      children: /* @__PURE__ */ u$1("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 8h8a4 4 0 0 1 0 8H9",
            stroke: "currentColor",
            "stroke-width": "1.75",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M8 4 4 8l4 4",
            stroke: "currentColor",
            "stroke-width": "1.75",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        )
      ] })
    }
  );
}
const Dt = (r2) => `pw-offer-${r2}-start`;
function ce(r2) {
  const e2 = r2 - Date.now();
  return e2 <= 0 ? { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true } : {
    days: Math.floor(e2 / (1e3 * 60 * 60 * 24)),
    hours: Math.floor(e2 % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60)),
    minutes: Math.floor(e2 % (1e3 * 60 * 60) / (1e3 * 60)),
    seconds: Math.floor(e2 % (1e3 * 60) / 1e3),
    expired: false
  };
}
function qt(r2) {
  if (r2.expires_at) {
    const e2 = Date.parse(r2.expires_at);
    return Number.isFinite(e2) ? e2 : null;
  }
  if (r2.duration_minutes && r2.duration_minutes > 0) {
    if (typeof window > "u") return null;
    try {
      const e2 = Dt(r2.id);
      let t2 = window.localStorage.getItem(e2);
      return t2 || (t2 = (/* @__PURE__ */ new Date()).toISOString(), window.localStorage.setItem(e2, t2)), Date.parse(t2) + r2.duration_minutes * 6e4;
    } catch {
      return null;
    }
  }
  return null;
}
function He(r2, e2) {
  if (!r2 || r2.length === 0) return null;
  if (e2) {
    const t2 = r2.find((i2) => i2.id === e2);
    if (t2) return t2;
  }
  return r2.find((t2) => t2.expires_at || t2.duration_minutes) ?? null;
}
function Ge(r2) {
  const e2 = r2 ? qt(r2) : null, [t2, i2] = d(
    () => e2 !== null ? ce(e2) : null
  ), n2 = A(e2);
  return n2.current = e2, y(() => {
    if (e2 === null) {
      i2(null);
      return;
    }
    i2(ce(e2));
    const s2 = setInterval(() => {
      const o3 = ce(n2.current ?? 0);
      i2(o3), o3.expired && clearInterval(s2);
    }, 1e3);
    return () => clearInterval(s2);
  }, [e2, r2?.duration_minutes, r2?.id]), t2;
}
function Ft({ block: r2, ctx: e2 }) {
  const { t: t2 } = M(), i2 = He(e2.bootstrap.offers, r2.offer_id), n2 = Ge(i2);
  if (!i2 || n2 === null || n2.expired && !r2.force) return null;
  const s2 = r2.title ?? i2.label ?? t2("offer.limited_time", "Limited-time offer"), o3 = i2.discount_percent ? `${s2} ${i2.discount_percent}%` : s2;
  return /* @__PURE__ */ u$1(
    "div",
    {
      class: "flex flex-wrap items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold leading-tight text-white",
      style: {
        background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 50%, color-mix(in srgb, var(--pw-accent) 85%, black) 100%)",
        textShadow: "0 0 2px rgba(0, 0, 0, 0.25)"
      },
      role: "status",
      children: [
        /* @__PURE__ */ u$1(Ze, {}),
        /* @__PURE__ */ u$1("span", { children: o3 }),
        /* @__PURE__ */ u$1(We, { value: n2, t: t2 })
      ]
    }
  );
}
function We({ value: r2, t: e2 }) {
  return /* @__PURE__ */ u$1("div", { class: "flex items-center gap-1 font-mono text-sm", children: [
    r2.days > 0 ? /* @__PURE__ */ u$1(k$1, { children: [
      /* @__PURE__ */ u$1(X2, { children: String(r2.days) }),
      /* @__PURE__ */ u$1("span", { class: "text-xs", children: e2("countdown.d", "d") })
    ] }) : null,
    /* @__PURE__ */ u$1(X2, { children: String(r2.hours).padStart(2, "0") }),
    /* @__PURE__ */ u$1("span", { class: "text-xs", children: e2("countdown.h", "h") }),
    /* @__PURE__ */ u$1(X2, { children: String(r2.minutes).padStart(2, "0") }),
    /* @__PURE__ */ u$1("span", { class: "text-xs", children: e2("countdown.m", "m") }),
    /* @__PURE__ */ u$1(X2, { children: String(r2.seconds).padStart(2, "0") }),
    /* @__PURE__ */ u$1("span", { class: "text-xs", children: e2("countdown.s", "s") })
  ] });
}
function X2({ children: r2 }) {
  return /* @__PURE__ */ u$1("span", { class: "rounded bg-black/20 px-1.5 py-0.5 text-xs font-bold", children: r2 });
}
function Nt({ offer: r2 }) {
  const { t: e2 } = M(), t2 = Ge(r2);
  if (t2 === null || t2.expired) return null;
  const i2 = r2.label ?? e2("offer.limited_time", "Limited-time offer"), n2 = r2.discount_percent ? `${i2} ${r2.discount_percent}%` : i2;
  return /* @__PURE__ */ u$1(
    "div",
    {
      class: "-mb-2 flex flex-wrap items-center justify-center gap-2 rounded-t-xl px-4 pb-5 pt-3 text-[15px] font-semibold leading-tight text-white",
      style: {
        background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 50%, color-mix(in srgb, var(--pw-accent) 85%, black) 100%)",
        textShadow: "0 0 2px rgba(0, 0, 0, 0.25)"
      },
      role: "status",
      children: [
        /* @__PURE__ */ u$1(Ze, {}),
        /* @__PURE__ */ u$1("span", { children: n2 }),
        /* @__PURE__ */ u$1(We, { value: t2, t: e2 })
      ]
    }
  );
}
function Ze() {
  return /* @__PURE__ */ u$1(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 12 12",
      fill: "none",
      "aria-hidden": "true",
      children: /* @__PURE__ */ u$1(
        "path",
        {
          fill: "currentColor",
          d: "m9.44 5.359-2.394-.895.61-3.036c.062-.31-.345-.531-.57-.291L2.434 6.105a.336.336 0 0 0 .126.537l2.395.894-.61 3.037c-.062.31.345.53.57.29l4.653-4.968a.336.336 0 0 0-.126-.536Z"
        }
      )
    }
  );
}
const Me = 3, Ee = 200, Te = 5e3, de = 5, pe = 5, Vt = pe * 1024 * 1024, Pe = ["image/jpeg", "image/png", "image/webp"], $t = /.+@.+\..+/;
function Ht({ client: r2, authSession: e2, origin: t2, onBack: i2 }) {
  const { t: n2 } = M(), s2 = e2?.user.email ?? "", o3 = s2 || null, [c2, l2] = d(s2), [h2, u2] = d(""), [g2, x2] = d(""), [_2, m2] = d([]), [f2, y2] = d(false), [O2, p2] = d(null), [b, E2] = d({}), z2 = () => {
    const B2 = {}, T2 = (o3 ?? c2).trim(), F2 = h2.trim(), U2 = g2.trim();
    return T2 ? $t.test(T2.toLowerCase()) || (B2.email = n2("support.invalid_email", "Invalid email")) : B2.email = n2("support.required", "Required"), (F2.length < Me || F2.length > Ee) && (B2.subject = n2("support.subject_length", "{min}–{max} characters", {
      min: Me,
      max: Ee
    })), (U2.length < 1 || U2.length > Te) && (B2.message = n2("support.message_length", "{min}–{max} characters", {
      min: 1,
      max: Te
    })), E2(B2), Object.keys(B2).length === 0;
  }, P2 = async (B2) => {
    if (B2.preventDefault(), !f2 && z2()) {
      y2(true), E2((T2) => ({ ...T2, submit: void 0 }));
      try {
        const T2 = (o3 ?? c2).trim();
        await r2.createSupportTicket({
          subject: h2.trim(),
          content: g2.trim(),
          email: T2 || void 0,
          files: _2.length > 0 ? _2 : void 0
        }), p2(T2);
      } catch (T2) {
        const F2 = T2 instanceof o$3 && T2.message || "Failed to send. Please try again.";
        E2((U2) => ({ ...U2, submit: F2 }));
      } finally {
        y2(false);
      }
    }
  }, R2 = () => {
    u2(""), x2(""), m2([]), E2({}), p2(null);
  }, q2 = "flex flex-col gap-3 bg-white px-6 pb-6 pt-3 sm:px-8", N2 = { boxShadow: "0 -4px 12px -4px rgba(15,23,42,0.06)" };
  return O2 ? /* @__PURE__ */ u$1("div", { class: "relative flex-1 min-h-0 flex flex-col", children: [
    /* @__PURE__ */ u$1("div", { class: "flex-1 min-h-0 overflow-y-auto flex flex-col items-center gap-4 px-6 pb-3 pt-6 sm:px-8 sm:pb-4 sm:pt-8 text-center", children: [
      /* @__PURE__ */ u$1(
        "div",
        {
          class: "flex h-14 w-14 items-center justify-center rounded-full",
          style: {
            background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 85%, white), var(--pw-accent))",
            color: "#fff",
            boxShadow: "0 0 0 8px color-mix(in srgb, var(--pw-accent) 12%, transparent), 0 8px 20px -6px color-mix(in srgb, var(--pw-accent) 45%, transparent)"
          },
          "aria-hidden": "true",
          children: /* @__PURE__ */ u$1("svg", { viewBox: "0 0 24 24", class: "h-7 w-7", children: /* @__PURE__ */ u$1(
            "path",
            {
              fill: "currentColor",
              d: "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm6.93 8.2-6.85 9.29a1.01 1.01 0 0 1-1.43.19L5.76 13.77a1 1 0 1 1 1.25-1.56l4.08 3.26 6.23-8.45a1 1 0 1 1 1.61 1.18Z"
            }
          ) })
        }
      ),
      /* @__PURE__ */ u$1("div", { class: "text-lg font-semibold tracking-tight text-gray-900", children: n2("support.success_heading", "Request submitted") }),
      /* @__PURE__ */ u$1("div", { class: "max-w-[320px] text-sm leading-relaxed text-gray-500", children: [
        n2(
          "support.success_message_prefix",
          "We've received your message and will respond to"
        ),
        " ",
        /* @__PURE__ */ u$1("b", { class: "text-gray-700", children: O2 }),
        "."
      ] })
    ] }),
    /* @__PURE__ */ u$1("div", { class: q2, style: N2, children: /* @__PURE__ */ u$1("div", { class: "flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: i2,
          class: "rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
          children: t2 === "standalone" ? n2("support.done_button", "Done") : n2("nav.back_aria", "Back")
        }
      ),
      /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: R2,
          class: "flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
          style: {
            background: "linear-gradient(180deg, color-mix(in srgb, var(--pw-accent) 92%, white), var(--pw-accent))",
            boxShadow: "0 1px 2px rgba(15,23,42,0.08), 0 6px 14px -4px color-mix(in srgb, var(--pw-accent) 50%, transparent)"
          },
          children: n2("support.send_another", "Send another request")
        }
      )
    ] }) })
  ] }) : /* @__PURE__ */ u$1("form", { onSubmit: P2, class: "relative flex-1 min-h-0 flex flex-col", children: [
    /* @__PURE__ */ u$1(Gt, { onClick: i2, ariaLabel: n2("nav.back_aria", "Back") }),
    /* @__PURE__ */ u$1("div", { class: "flex-1 min-h-0 overflow-y-auto px-6 pb-3 pt-6 sm:px-8 sm:pb-4 sm:pt-8", children: /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-5", children: [
      /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-2 pr-10", children: [
        /* @__PURE__ */ u$1("h2", { class: "text-3xl font-bold tracking-tight text-gray-900", children: n2("support.heading", "Support") }),
        /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: n2("support.instruction", "Please fill out the form below to submit your support request.") })
      ] }),
      /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-3", children: [
        o3 ? /* @__PURE__ */ u$1("div", { class: "rounded-2xl bg-gray-100 px-5 py-3 text-sm text-gray-600", children: [
          n2("support.sending_as", "Sending as"),
          " ",
          /* @__PURE__ */ u$1("b", { class: "font-medium text-gray-900", children: o3 })
        ] }) : /* @__PURE__ */ u$1(
          Be,
          {
            type: "email",
            placeholder: n2("support.email_placeholder", "Enter your email *"),
            value: c2,
            onInput: l2,
            error: b.email,
            autocomplete: "email",
            required: true
          }
        ),
        /* @__PURE__ */ u$1(
          Be,
          {
            type: "text",
            placeholder: n2("support.subject_placeholder", "Enter your subject *"),
            value: h2,
            onInput: u2,
            error: b.subject,
            required: true
          }
        ),
        /* @__PURE__ */ u$1(
          Wt,
          {
            placeholder: n2("support.message_placeholder", "Enter your message *"),
            value: g2,
            onInput: x2,
            error: b.message,
            required: true
          }
        ),
        /* @__PURE__ */ u$1(Zt, { files: _2, onChange: m2, disabled: f2 })
      ] })
    ] }) }),
    /* @__PURE__ */ u$1("div", { class: q2, style: N2, children: [
      b.submit && /* @__PURE__ */ u$1("p", { class: "text-sm text-red-600", children: b.submit }),
      /* @__PURE__ */ u$1("div", { class: "flex items-center justify-end gap-3", children: [
        /* @__PURE__ */ u$1(
          "button",
          {
            type: "button",
            onClick: i2,
            disabled: f2,
            class: "rounded-full px-4 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
            children: t2 === "standalone" ? n2("support.close_button", "Close") : n2("nav.back_aria", "Back")
          }
        ),
        /* @__PURE__ */ u$1(
          "button",
          {
            type: "submit",
            disabled: f2,
            class: "pw-cta-shimmer relative flex h-12 items-center justify-center overflow-hidden rounded-full px-8 text-base font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
            style: {
              background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
              boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
            },
            children: f2 ? /* @__PURE__ */ u$1("span", { class: "relative z-10 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" }) : /* @__PURE__ */ u$1("span", { class: "relative z-10", children: n2("support.send_button", "Send") })
          }
        )
      ] })
    ] })
  ] });
}
function Gt({ onClick: r2, ariaLabel: e2 }) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      onClick: r2,
      "aria-label": e2,
      class: "absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
      children: /* @__PURE__ */ u$1("svg", { width: "18", height: "18", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 8h8a4 4 0 0 1 0 8H9",
            stroke: "currentColor",
            "stroke-width": "1.75",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M8 4 4 8l4 4",
            stroke: "currentColor",
            "stroke-width": "1.75",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        )
      ] })
    }
  );
}
function Be({
  type: r2,
  placeholder: e2,
  value: t2,
  onInput: i2,
  error: n2,
  autocomplete: s2,
  required: o3
}) {
  return /* @__PURE__ */ u$1("div", { children: [
    /* @__PURE__ */ u$1(
      "input",
      {
        type: r2,
        value: t2,
        placeholder: e2,
        onInput: (c2) => i2(c2.target.value),
        autocomplete: s2,
        required: o3,
        class: `h-14 w-full rounded-2xl bg-gray-100 px-5 text-base text-gray-900 outline-none transition-all placeholder:text-gray-500 hover:bg-gray-200/60 focus:bg-gray-200/60 ${n2 ? "shadow-[0_0_0_2px_rgba(239,68,68,0.5)]" : "focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--pw-accent)_30%,transparent)]"}`
      }
    ),
    n2 && /* @__PURE__ */ u$1("span", { class: "mt-1 ml-2 block text-sm text-red-600", children: n2 })
  ] });
}
function Wt({
  placeholder: r2,
  value: e2,
  onInput: t2,
  error: i2,
  required: n2
}) {
  return /* @__PURE__ */ u$1("div", { children: [
    /* @__PURE__ */ u$1(
      "textarea",
      {
        value: e2,
        placeholder: r2,
        onInput: (s2) => t2(s2.target.value),
        required: n2,
        rows: 5,
        class: `min-h-[120px] w-full rounded-2xl bg-gray-100 px-5 py-3.5 text-base leading-relaxed text-gray-900 outline-none transition-all placeholder:text-gray-500 hover:bg-gray-200/60 focus:bg-gray-200/60 ${i2 ? "shadow-[0_0_0_2px_rgba(239,68,68,0.5)]" : "focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--pw-accent)_30%,transparent)]"}`
      }
    ),
    i2 && /* @__PURE__ */ u$1("span", { class: "mt-1 ml-2 block text-sm text-red-600", children: i2 })
  ] });
}
function Zt({ files: r2, onChange: e2, disabled: t2 }) {
  const { t: i2 } = M(), n2 = A(null), [s2, o3] = d(false), [c2, l2] = d(null), h2 = (u2) => {
    if (!u2 || t2) return;
    l2(null);
    const g2 = Array.from(u2);
    if (r2.length + g2.length > de) {
      l2(i2("support.too_many_files", "Up to {max} files", { max: de }));
      return;
    }
    const x2 = g2.filter(
      (_2) => Pe.includes(_2.type) && _2.size <= Vt
    );
    if (x2.length !== g2.length) {
      l2(
        i2("support.invalid_file", "Only JPEG/PNG/WebP, ≤ {size}MB each", {
          size: pe
        })
      );
      return;
    }
    e2([...r2, ...x2]);
  };
  return /* @__PURE__ */ u$1("div", { children: [
    /* @__PURE__ */ u$1("span", { class: "text-xs font-medium text-gray-700", children: i2("support.attachments_label", "Attachments (optional)") }),
    /* @__PURE__ */ u$1(
      "div",
      {
        role: "button",
        tabIndex: 0,
        "aria-label": i2("support.attachments_aria", "Attachments upload"),
        onClick: () => !t2 && n2.current?.click(),
        onDragOver: (u2) => {
          u2.preventDefault(), t2 || o3(true);
        },
        onDragLeave: () => o3(false),
        onDrop: (u2) => {
          u2.preventDefault(), o3(false), h2(u2.dataTransfer?.files ?? null);
        },
        class: `mt-1.5 cursor-pointer rounded-2xl border border-dashed p-3.5 text-center transition-all ${s2 ? "border-[var(--pw-accent)] bg-[color-mix(in_srgb,var(--pw-accent)_6%,white)]" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/60"} ${t2 ? "cursor-not-allowed opacity-60" : ""}`,
        children: [
          /* @__PURE__ */ u$1("div", { class: "text-xs text-gray-500", children: i2("support.dropzone_text", "Drop images here or click to select") }),
          /* @__PURE__ */ u$1("div", { class: "mt-0.5 text-[11px] text-gray-400", children: i2("support.file_requirements", "JPEG/PNG/WebP, up to {max} files, ≤ {size}MB each", {
            max: de,
            size: pe
          }) })
        ]
      }
    ),
    /* @__PURE__ */ u$1(
      "input",
      {
        ref: n2,
        type: "file",
        multiple: true,
        accept: Pe.join(","),
        class: "hidden",
        onChange: (u2) => {
          h2(u2.target.files), u2.currentTarget.value = "";
        }
      }
    ),
    c2 && /* @__PURE__ */ u$1("p", { class: "mt-1 text-xs text-red-600", children: c2 }),
    r2.length > 0 && /* @__PURE__ */ u$1("ul", { class: "mt-2 flex flex-col gap-1", children: r2.map((u2, g2) => /* @__PURE__ */ u$1(
      "li",
      {
        class: "flex items-center justify-between gap-2 rounded bg-gray-50 px-2 py-1 text-xs",
        children: [
          /* @__PURE__ */ u$1("span", { class: "truncate text-gray-700", children: u2.name }),
          /* @__PURE__ */ u$1(
            "button",
            {
              type: "button",
              onClick: () => {
                const x2 = [...r2];
                x2.splice(g2, 1), e2(x2);
              },
              disabled: t2,
              class: "text-gray-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60",
              "aria-label": i2("support.remove_file_aria", "Remove {filename}", { filename: u2.name }),
              children: "✕"
            }
          )
        ]
      },
      `${u2.name}-${u2.size}-${g2}`
    )) })
  ] });
}
const Yt = {
  day: "cta.get_plan_daily",
  week: "cta.get_plan_weekly",
  month: "cta.get_plan_monthly",
  year: "cta.get_plan_yearly"
}, Kt = {
  day: "Get Daily Plan",
  week: "Get Weekly Plan",
  month: "Get Monthly Plan",
  year: "Get Yearly Plan"
};
function Xt2(r2, e2, t2, i2) {
  if (e2 === "close") return i2("cta.close", "Close");
  if (!r2) return i2("cta.continue", "Continue");
  if (!t2 && r2.trial_days && r2.interval && r2.interval !== "lifetime")
    return i2("cta.start_trial", "Start {days}-Day Free Trial", { days: r2.trial_days });
  if (!r2.interval || r2.interval === "lifetime")
    return i2("cta.get_lifetime_access", "Get Lifetime Access");
  const n2 = Yt[r2.interval];
  return n2 ? i2(n2, Kt[r2.interval]) : i2("cta.get_plan_generic", "Get {interval} Plan", {
    interval: Jt(r2.interval)
  });
}
function Jt(r2) {
  return r2.length ? r2[0].toUpperCase() + r2.slice(1) : r2;
}
function Qt2({ block: r2, ctx: e2 }) {
  const { t: t2 } = M(), [i2, n2] = d(false), s2 = r2.priceId ?? e2.selectedPriceId, o3 = i2 || r2.action === "checkout" && !s2, c2 = s2 ? e2.bootstrap.prices.find((g2) => g2.id === s2) ?? null : null, l2 = e2.bootstrap.user?.had_previous_trial ?? false, h2 = r2.label ?? Xt2(c2, r2.action, l2, t2);
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      disabled: o3,
      onClick: async () => {
        if (!o3) {
          n2(true);
          try {
            await e2.onAction(r2.action, { priceId: s2 });
          } finally {
            n2(false);
          }
        }
      },
      class: "pw-cta-shimmer relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
      style: {
        background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
        boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
      },
      children: [
        /* @__PURE__ */ u$1(
          "span",
          {
            class: "absolute inset-0 opacity-40",
            style: {
              background: "radial-gradient(circle at 50% 0%, color-mix(in srgb, white 40%, transparent) 0%, transparent 70%)"
            },
            "aria-hidden": "true"
          }
        ),
        i2 ? /* @__PURE__ */ u$1("span", { class: "relative z-10 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" }) : /* @__PURE__ */ u$1("span", { class: "relative z-10", children: h2 })
      ]
    }
  );
}
function er({ ctx: r2 }) {
  const { t: e2 } = M(), t2 = r2.authSession, i2 = r2.auth, [n2, s2] = d(false), o3 = () => r2.onAction("support");
  if (t2 && !t2.user.is_anonymous) {
    const c2 = async () => {
      if (!(!i2 || n2)) {
        s2(true);
        try {
          await i2.signOut();
        } catch {
        } finally {
          s2(false);
        }
      }
    };
    return /* @__PURE__ */ u$1("div", { class: "-mt-3 flex flex-col items-center gap-1.5 pt-1 text-center text-[13px] text-gray-500", children: [
      /* @__PURE__ */ u$1("span", { children: [
        e2("session.signed_in_as_prefix", "Signed in as"),
        " ",
        /* @__PURE__ */ u$1("b", { class: "font-medium text-gray-700", children: t2.user.email })
      ] }),
      /* @__PURE__ */ u$1("div", { class: "flex items-center justify-center gap-3", children: [
        /* @__PURE__ */ u$1(J, { onClick: c2, disabled: !i2 || n2, children: n2 ? e2("session.signing_out", "Signing out…") : e2("session.sign_out", "Sign Out") }),
        /* @__PURE__ */ u$1(Oe, {}),
        /* @__PURE__ */ u$1(J, { onClick: o3, children: e2("session.contact_support", "Contact Support") })
      ] })
    ] });
  }
  return /* @__PURE__ */ u$1("div", { class: "-mt-3 flex items-center justify-center gap-3 pt-1 text-center text-[13px]", children: [
    /* @__PURE__ */ u$1(J, { onClick: () => r2.onAction("restore"), children: e2("session.restore_purchases", "Restore purchases") }),
    /* @__PURE__ */ u$1(Oe, {}),
    /* @__PURE__ */ u$1(J, { onClick: o3, children: e2("session.contact_support", "Contact Support") })
  ] });
}
function J({
  onClick: r2,
  disabled: e2,
  children: t2
}) {
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      onClick: r2,
      disabled: e2,
      class: "font-semibold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:opacity-80",
      style: { color: "var(--pw-accent)" },
      children: t2
    }
  );
}
function Oe() {
  return /* @__PURE__ */ u$1("span", { class: "h-1 w-1 rounded-full bg-gray-300", "aria-hidden": "true" });
}
function tr({ block: r2 }) {
  return r2.items.length ? /* @__PURE__ */ u$1("ul", { class: "flex flex-col gap-2.5", role: "list", children: r2.items.map((e2) => /* @__PURE__ */ u$1("li", { class: "flex items-start gap-3 text-sm text-gray-700", children: [
    /* @__PURE__ */ u$1(
      "svg",
      {
        width: "18",
        height: "18",
        viewBox: "0 0 20 20",
        fill: "none",
        class: "mt-0.5 flex-shrink-0 text-emerald-500",
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1(
          "path",
          {
            d: "M4 10.5l3.5 3.5 8.5-8.5",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        )
      }
    ),
    /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ u$1("span", { class: "font-medium leading-snug text-gray-900", children: e2.name }),
      e2.desc ? /* @__PURE__ */ u$1("span", { class: "text-xs leading-relaxed text-gray-400", children: e2.desc }) : null
    ] })
  ] }, e2.id)) }) : null;
}
function rr({ block: r2 }) {
  const { t: e2 } = M(), t2 = r2.title ?? e2("pricing.money_back", "30-day money-back guarantee"), i2 = r2.subtitle, n2 = (r2.icon ?? "dollar_shield") !== "none", s2 = ir(t2);
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-1.5 border-b-1 pb-4 mb-1 border-gray-100", children: [
    /* @__PURE__ */ u$1("div", { class: "inline-flex items-center gap-2 text-[12px] text-gray-700", children: [
      n2 ? /* @__PURE__ */ u$1(nr, {}) : null,
      s2 ? /* @__PURE__ */ u$1("span", { children: [
        /* @__PURE__ */ u$1("b", { class: "font-bold text-gray-900", children: s2.bold }),
        " ",
        /* @__PURE__ */ u$1("span", { class: "font-medium", children: s2.rest })
      ] }) : /* @__PURE__ */ u$1("span", { class: "font-medium", children: t2 })
    ] }),
    i2 ? /* @__PURE__ */ u$1("span", { class: "text-center text-xs leading-relaxed text-gray-500", children: i2 }) : null
  ] });
}
function ir(r2) {
  const e2 = r2.match(/^(\d+[-\s]?days?)\s+(.+)$/i);
  return e2 ? { bold: e2[1], rest: e2[2] } : null;
}
function nr() {
  return /* @__PURE__ */ u$1(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      width: "16",
      height: "16",
      class: "flex-shrink-0 text-emerald-500",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "M12 2 4 5v6c0 5.25 3.5 9.5 8 11 4.5-1.5 8-5.75 8-11V5l-8-3Z",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linejoin": "round"
          }
        ),
        /* @__PURE__ */ u$1(
          "path",
          {
            d: "m9 12 2 2 4-4",
            stroke: "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        )
      ]
    }
  );
}
const Ye = 24, ar = 16, sr = 2;
function or(r2, e2) {
  const t2 = e2 * sr;
  let i2 = Ye;
  for (r2.style.fontSize = `${i2}px`; r2.scrollHeight > t2 && i2 > ar; )
    i2 -= 1, r2.style.fontSize = `${i2}px`;
}
function lr({ block: r2, ctx: e2 }) {
  const t2 = r2.level ?? 1, i2 = `h${t2}`, n2 = t2 === 1 ? "text-[22px] sm:text-2xl font-semibold leading-tight text-center text-balance text-gray-800" : t2 === 2 ? "text-xl font-semibold leading-snug text-gray-900 tracking-tight" : "text-base font-medium text-gray-900", s2 = A(null), o3 = t2 === 1 && !!e2.bootstrap.settings.title_auto_fit;
  return y(() => {
    if (!o3 || !s2.current) return;
    const c2 = getComputedStyle(s2.current), l2 = parseFloat(c2.lineHeight) || Ye * 1.5;
    or(s2.current, l2);
  }, [o3, r2.text]), /* @__PURE__ */ u$1(i2, { ref: s2, class: n2, children: r2.text });
}
function cr(r2) {
  const e2 = r2.local ?? { currency: r2.currency, amount: r2.amount };
  if (r2.interval === "year") {
    const t2 = (r2.interval_count ?? 1) * 12;
    return { amount: e2.amount / t2, currency: e2.currency };
  }
  return { amount: e2.amount, currency: e2.currency };
}
function ue(r2, e2) {
  const t2 = r2 % 1 !== 0 ? 2 : 0;
  try {
    const i2 = new Intl.NumberFormat(void 0, {
      style: "currency",
      currency: e2,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: t2,
      minimumFractionDigits: t2
    }).formatToParts(r2);
    let n2 = "", s2 = "";
    for (const o3 of i2)
      o3.type === "currency" ? n2 = o3.value : o3.type !== "literal" && (s2 += o3.value);
    return { currency: n2 || e2, amount: s2.trim() };
  } catch {
    return { currency: e2, amount: String(r2) };
  }
}
function fe(r2, e2) {
  const { amount: t2, currency: i2 } = cr(r2);
  if (!e2) {
    const { currency: c2, amount: l2 } = ue(t2, i2);
    return { currency: c2, amount: l2, originalAmount: null };
  }
  const n2 = t2 * (1 - e2 / 100), s2 = ue(n2, i2), o3 = ue(t2, i2);
  return {
    currency: s2.currency,
    amount: s2.amount,
    originalAmount: `${o3.currency}${o3.amount}`
  };
}
function Ke(r2, e2) {
  if (r2.label) return r2.label.toUpperCase();
  if (!r2.interval || r2.interval === "lifetime")
    return e2("pricing.plan_label.lifetime", "LIFETIME");
  const i2 = {
    day: { key: "pricing.plan_label.daily", fallback: "DAILY PLAN" },
    week: { key: "pricing.plan_label.weekly", fallback: "WEEKLY PLAN" },
    month: { key: "pricing.plan_label.monthly", fallback: "MONTHLY PLAN" },
    year: { key: "pricing.plan_label.yearly", fallback: "YEARLY PLAN" }
  }[r2.interval];
  return i2 ? e2(i2.key, i2.fallback) : `${r2.interval.toUpperCase()} PLAN`;
}
function we(r2, e2) {
  if (!r2.interval || r2.interval === "lifetime")
    return e2("pricing.interval.lifetime_short", "lifetime");
  if (r2.interval === "year") return e2("pricing.interval.month", "month");
  const t2 = r2.interval_count ?? 1;
  return t2 === 1 ? e2(`pricing.interval.${r2.interval}`, r2.interval) : `${t2} ${r2.interval}s`;
}
function dr({ block: r2, ctx: e2 }) {
  const { t: t2 } = M(), i2 = r2.priceIds && r2.priceIds.length > 0 ? new Set(r2.priceIds) : null, n2 = e2.bootstrap.prices.filter((o3) => !i2 || i2.has(o3.id));
  if (n2.length === 0)
    return /* @__PURE__ */ u$1("p", { class: "text-sm text-gray-500", children: t2("pricing.no_prices", "No prices available.") });
  const s2 = r2.popular_label ?? t2("pricing.most_popular", "Most popular");
  if (r2.view === "compact")
    return /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex w-full flex-col rounded-xl border border-gray-200 bg-gray-50",
        role: "radiogroup",
        "aria-label": t2("pricing.plans_aria", "Plans"),
        children: n2.map((o3, c2) => /* @__PURE__ */ u$1(
          hr,
          {
            price: o3,
            isLast: c2 === n2.length - 1,
            isPopular: r2.popular_price_id === o3.id,
            popularLabel: s2,
            offer: Z(e2.bootstrap.offers, o3.id, { readStart: H }),
            selected: e2.selectedPriceId === o3.id,
            onSelect: () => {
              e2.setSelectedPriceId(o3.id), e2.onAction("price_selected", { priceId: o3.id, price: o3 });
            },
            t: t2
          },
          o3.id
        ))
      }
    );
  if (r2.view === "horizontal") {
    const o3 = Math.min(n2.length, 3), c2 = n2.some(
      (l2) => (Z(e2.bootstrap.offers, l2.id, { readStart: H })?.discount_percent ?? 0) > 0
    );
    return /* @__PURE__ */ u$1(
      "div",
      {
        class: "grid items-stretch gap-2",
        style: { gridTemplateColumns: `repeat(${o3}, minmax(0, 1fr))` },
        role: "radiogroup",
        "aria-label": t2("pricing.plans_aria", "Plans"),
        children: n2.map((l2) => /* @__PURE__ */ u$1(
          pr,
          {
            price: l2,
            isPopular: r2.popular_price_id === l2.id,
            popularLabel: s2,
            offer: Z(e2.bootstrap.offers, l2.id, { readStart: H }),
            reserveStrikeRow: c2,
            selected: e2.selectedPriceId === l2.id,
            onSelect: () => {
              e2.setSelectedPriceId(l2.id), e2.onAction("price_selected", { priceId: l2.id, price: l2 });
            },
            t: t2
          },
          l2.id
        ))
      }
    );
  }
  return /* @__PURE__ */ u$1(
    "div",
    {
      class: "flex flex-col gap-2",
      role: "radiogroup",
      "aria-label": t2("pricing.plans_aria", "Plans"),
      children: n2.map((o3) => {
        const c2 = e2.selectedPriceId === o3.id, l2 = r2.popular_price_id === o3.id, u2 = Z(e2.bootstrap.offers, o3.id, { readStart: H })?.discount_percent ?? null, { currency: g2, amount: x2, originalAmount: _2 } = fe(o3, u2);
        return /* @__PURE__ */ u$1(
          "button",
          {
            type: "button",
            role: "radio",
            "aria-checked": c2,
            onClick: () => {
              e2.setSelectedPriceId(o3.id), e2.onAction("price_selected", { priceId: o3.id, price: o3 });
            },
            class: [
              "group relative inline-flex w-full mx-auto items-center justify-between flex-row-reverse gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
              // border 2px everywhere — selection is expressed by color only, the layout
              // does not jump (equal thickness for selected/unselected). The color
              // difference accent vs gray is strong enough for visual hierarchy.
              c2 ? "border-[var(--pw-accent)] bg-transparent" : "border-gray-200 bg-transparent hover:bg-gray-50"
            ].join(" "),
            children: [
              /* @__PURE__ */ u$1(
                "span",
                {
                  class: [
                    "flex h-6.5 w-6.5 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                    c2 ? "border-[var(--pw-accent)] text-white" : "border-gray-300 bg-transparent text-transparent",
                    // The popular-label badge sits absolute at the top-right of the card and
                    // visually shifts the content's center down. flex items-center
                    // on the card keeps the checkmark at the geometric center, which
                    // makes it look too high — we compensate with a small mt.
                    l2 ? "mt-3" : ""
                  ].join(" "),
                  style: c2 ? {
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 70%, white) 0%, var(--pw-accent) 50%, color-mix(in srgb, var(--pw-accent) 85%, black) 100%)"
                  } : void 0,
                  "aria-hidden": "true",
                  children: /* @__PURE__ */ u$1(
                    "svg",
                    {
                      width: "14",
                      height: "10",
                      viewBox: "0 0 17 12",
                      fill: "none",
                      xmlns: "http://www.w3.org/2000/svg",
                      class: c2 ? "opacity-100" : "opacity-0",
                      children: /* @__PURE__ */ u$1(
                        "path",
                        {
                          d: "M16.5234 0.476562C16.9805 0.898438 16.9805 1.63672 16.5234 2.05859L7.52344 11.0586C7.10156 11.5156 6.36328 11.5156 5.94141 11.0586L1.44141 6.55859C0.984375 6.13672 0.984375 5.39844 1.44141 4.97656C1.86328 4.51953 2.60156 4.51953 3.02344 4.97656L6.75 8.66797L14.9414 0.476562C15.3633 0.0195312 16.1016 0.0195312 16.5234 0.476562Z",
                          fill: "currentColor"
                        }
                      )
                    }
                  )
                }
              ),
              /* @__PURE__ */ u$1("div", { class: "flex flex-1 flex-col gap-0.5", children: [
                /* @__PURE__ */ u$1("div", { class: "flex flex-wrap items-center gap-x-2 gap-y-1", children: [
                  /* @__PURE__ */ u$1("span", { class: "text-xs font-normal uppercase tracking-normal text-gray-800/70", children: Ke(o3, t2) }),
                  _2 ? (
                    // opacity-60 mutes the strike: the eye catches the label
                    // and discount badge first, then the main price; the original "former price"
                    // is tertiary info and should not compete with the label.
                    /* @__PURE__ */ u$1("span", { class: "text-[15px] font-normal text-gray-400 opacity-60 line-through decoration-gray-400 decoration-[1.5px]", children: _2 })
                  ) : null,
                  u2 ? (
                    // Emerald pill — a fixed "success/savings", independent of
                    // brand_color. Readable even on dark brand accents.
                    /* @__PURE__ */ u$1("span", { class: "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold leading-none text-emerald-700", children: [
                      "-",
                      u2,
                      "%"
                    ] })
                  ) : null
                ] }),
                /* @__PURE__ */ u$1("div", { class: "flex items-baseline gap-2 flex-wrap", children: /* @__PURE__ */ u$1("span", { class: "text-[26px] leading-tight whitespace-nowrap text-gray-800 font-medium", children: [
                  /* @__PURE__ */ u$1("span", { class: "opacity-90", children: g2 }),
                  x2,
                  /* @__PURE__ */ u$1("span", { class: "text-sm font-normal text-gray-500", children: [
                    " ",
                    "/ ",
                    we(o3, t2)
                  ] })
                ] }) }),
                o3.description ? /* @__PURE__ */ u$1("span", { class: "mt-1 text-xs leading-relaxed text-gray-500", children: o3.description }) : null
              ] }),
              l2 ? /* @__PURE__ */ u$1(
                "span",
                {
                  class: "absolute -top-[9px] -right-[6px] rounded-[11px] border-[5px] border-white px-2 py-1 text-[12px] font-semibold text-white",
                  style: { background: "var(--pw-accent)" },
                  children: s2
                }
              ) : null
            ]
          },
          o3.id
        );
      })
    }
  );
}
function ur(r2, e2) {
  return r2.label ? r2.label : !r2.interval || r2.interval === "lifetime" ? e2("pricing.interval.lifetime_short", "lifetime") : e2(`pricing.interval.${r2.interval}`, r2.interval);
}
function hr({
  price: r2,
  isLast: e2,
  isPopular: t2,
  popularLabel: i2,
  offer: n2,
  selected: s2,
  onSelect: o3,
  t: c2
}) {
  const l2 = n2?.discount_percent ?? null, { currency: h2, amount: u2, originalAmount: g2 } = fe(r2, l2);
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      role: "radio",
      "aria-checked": s2,
      onClick: o3,
      class: "group relative inline-flex w-full max-w-[360px] mx-auto items-center justify-between gap-4 px-4 pt-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--pw-accent)]",
      children: [
        /* @__PURE__ */ u$1(
          "span",
          {
            class: [
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-colors mb-3",
              s2 ? "border-[var(--pw-accent)] text-white" : "border-gray-300 bg-transparent text-transparent"
            ].join(" "),
            style: s2 ? {
              background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 70%, white) 0%, var(--pw-accent) 50%, color-mix(in srgb, var(--pw-accent) 85%, black) 100%)"
            } : void 0,
            "aria-hidden": "true",
            children: /* @__PURE__ */ u$1(
              "svg",
              {
                width: "14",
                height: "10",
                viewBox: "0 0 17 12",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                class: s2 ? "opacity-100" : "opacity-0",
                children: /* @__PURE__ */ u$1(
                  "path",
                  {
                    d: "M16.5234 0.476562C16.9805 0.898438 16.9805 1.63672 16.5234 2.05859L7.52344 11.0586C7.10156 11.5156 6.36328 11.5156 5.94141 11.0586L1.44141 6.55859C0.984375 6.13672 0.984375 5.39844 1.44141 4.97656C1.86328 4.51953 2.60156 4.51953 3.02344 4.97656L6.75 8.66797L14.9414 0.476562C15.3633 0.0195312 16.1016 0.0195312 16.5234 0.476562Z",
                    fill: "currentColor"
                  }
                )
              }
            )
          }
        ),
        /* @__PURE__ */ u$1(
          "div",
          {
            class: [
              "flex flex-1 items-center gap-1.5 pb-3.5",
              e2 ? "" : "border-b border-gray-200"
            ].join(" "),
            children: [
              /* @__PURE__ */ u$1("div", { class: "flex flex-wrap items-center gap-1 gap-x-1.5", children: [
                /* @__PURE__ */ u$1("span", { class: "text-base font-normal capitalize text-gray-800", children: ur(r2, c2) }),
                t2 ? (
                  // Pastel brand-mix pill — exactly like `badge` in TelegramPricingRadio.
                  // Low visual weight: the pill is about the "plan name" (most popular), not
                  // about savings — it should not compete with the -X% discount pill.
                  /* @__PURE__ */ u$1(
                    "span",
                    {
                      class: "rounded-[9px] px-2 py-1 text-[10px] font-bold",
                      style: {
                        background: "linear-gradient(160deg, color-mix(in srgb, var(--pw-accent) 6%, white) 0%, color-mix(in srgb, var(--pw-accent) 15%, white) 100%)",
                        color: "var(--pw-accent)"
                      },
                      children: i2
                    }
                  )
                ) : null,
                l2 ? /* @__PURE__ */ u$1("span", { class: "rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700", children: [
                  "-",
                  l2,
                  "%"
                ] }) : null
              ] }),
              /* @__PURE__ */ u$1("div", { class: "flex-1" }),
              /* @__PURE__ */ u$1("span", { class: "flex items-baseline gap-1.5 text-base font-normal text-gray-600", children: [
                g2 ? /* @__PURE__ */ u$1("span", { class: "text-xs text-gray-400 line-through decoration-gray-400 decoration-[1.5px]", children: g2 }) : null,
                /* @__PURE__ */ u$1("span", { class: "whitespace-nowrap", children: [
                  /* @__PURE__ */ u$1("span", { class: "opacity-90", children: h2 }),
                  u2,
                  /* @__PURE__ */ u$1("span", { class: "text-xs text-gray-400", children: [
                    " ",
                    "/ ",
                    we(r2, c2)
                  ] })
                ] })
              ] })
            ]
          }
        )
      ]
    }
  );
}
function pr({
  price: r2,
  isPopular: e2,
  popularLabel: t2,
  offer: i2,
  reserveStrikeRow: n2,
  selected: s2,
  onSelect: o3,
  t: c2
}) {
  const l2 = i2?.discount_percent ?? null, { currency: h2, amount: u2, originalAmount: g2 } = fe(r2, l2);
  return /* @__PURE__ */ u$1(
    "button",
    {
      type: "button",
      role: "radio",
      "aria-checked": s2,
      onClick: o3,
      class: [
        "group relative flex h-full flex-col items-center justify-start gap-1 rounded-2xl border-2 px-3 pb-4 pt-3.5 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        s2 ? "border-[var(--pw-accent)]" : "border-gray-200 hover:bg-gray-50"
      ].join(" "),
      style: s2 ? { background: "color-mix(in srgb, var(--pw-accent) 6%, transparent)" } : void 0,
      children: [
        /* @__PURE__ */ u$1("span", { class: "flex min-h-[2.4em] items-center text-[10px] font-normal uppercase leading-tight text-gray-800/70", children: Ke(r2, c2) }),
        n2 ? /* @__PURE__ */ u$1("div", { class: "flex h-[22px] items-center justify-center gap-1.5", children: [
          g2 ? /* @__PURE__ */ u$1("span", { class: "text-[12px] text-gray-400 line-through decoration-gray-400 decoration-[1.5px]", children: g2 }) : null,
          l2 ? /* @__PURE__ */ u$1("span", { class: "rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-emerald-700", children: [
            "-",
            l2,
            "%"
          ] }) : null
        ] }) : null,
        /* @__PURE__ */ u$1("span", { class: "text-[26px] leading-none whitespace-nowrap text-gray-800 font-medium", children: [
          /* @__PURE__ */ u$1("span", { class: "opacity-90", children: h2 }),
          u2
        ] }),
        /* @__PURE__ */ u$1("span", { class: "text-xs font-normal text-gray-500", children: [
          "/ ",
          we(r2, c2)
        ] }),
        e2 ? /* @__PURE__ */ u$1(
          "span",
          {
            class: "absolute -top-[10px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[11px] border-[3px] border-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white",
            style: { background: "var(--pw-accent)" },
            children: t2
          }
        ) : null
      ]
    }
  );
}
function gr({ block: r2 }) {
  return /* @__PURE__ */ u$1("p", { class: "text-[0.9375rem] leading-relaxed text-gray-600", children: r2.text });
}
const fr = {
  week: 0.25,
  month: 1,
  year: 12
};
function wr(r2, e2) {
  return r2 ? e2(`pricing.interval.${r2}`, r2) : e2("pricing.interval.period", "period");
}
function mr({ block: r2, ctx: e2 }) {
  const { t: t2 } = M();
  if (!r2.queries.length) return null;
  const n2 = e2.bootstrap.prices.find((o3) => o3.id === e2.selectedPriceId)?.interval ?? null, s2 = n2 ? fr[n2] : void 0;
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-2", children: [
    /* @__PURE__ */ u$1("div", { class: "text-sm font-semibold text-gray-800", children: !n2 || n2 === "lifetime" ? t2("pricing.included_total", "Included for lifetime:") : t2("pricing.included_per", "Included per {interval}:", {
      interval: wr(n2, t2)
    }) }),
    /* @__PURE__ */ u$1("ul", { class: "flex flex-col gap-2", role: "list", children: r2.queries.map((o3) => {
      const c2 = Number.isFinite(o3.count) ? o3.count : 0, l2 = s2 !== void 0 ? Math.round(c2 * s2) : c2;
      return /* @__PURE__ */ u$1("li", { class: `flex gap-3 ${o3.desc ? "items-start" : "items-center"}`, children: [
        /* @__PURE__ */ u$1(
          "svg",
          {
            width: "18",
            height: "18",
            viewBox: "0 0 20 20",
            fill: "none",
            class: `flex-shrink-0 text-emerald-500 ${o3.desc ? "mt-0.5" : ""}`,
            "aria-hidden": "true",
            children: /* @__PURE__ */ u$1(
              "path",
              {
                d: "M4 10.5l3.5 3.5 8.5-8.5",
                stroke: "currentColor",
                "stroke-width": "2.5",
                "stroke-linecap": "round",
                "stroke-linejoin": "round"
              }
            )
          }
        ),
        /* @__PURE__ */ u$1("div", { children: [
          /* @__PURE__ */ u$1("span", { class: "font-semibold text-gray-900 text-sm", children: l2 }),
          " ",
          /* @__PURE__ */ u$1("span", { class: "text-sm text-gray-800", children: o3.name }),
          o3.desc ? /* @__PURE__ */ u$1(k$1, { children: [
            /* @__PURE__ */ u$1("br", {}),
            /* @__PURE__ */ u$1("span", { class: "text-xs text-gray-400", children: o3.desc })
          ] }) : null
        ] })
      ] }, o3.id);
    }) })
  ] });
}
const br = {
  heading: lr,
  text: gr,
  price_grid: dr,
  cta_button: Qt2,
  auth_panel: $e,
  current_session: er,
  features_list: tr,
  tokenization_gate: mr,
  guarantee_badge: rr,
  offer_banner: Ft
};
function yr(r2, e2) {
  if (!e2) return r2;
  const t2 = r2.blocks.findIndex(
    (n2) => n2.type === "heading" && (n2.level ?? 1) === 1
  );
  if (t2 === -1)
    return {
      ...r2,
      blocks: [{ type: "heading", text: e2, level: 1 }, ...r2.blocks]
    };
  const i2 = r2.blocks.slice();
  return i2[t2] = { ...i2[t2], text: e2 }, { ...r2, blocks: i2 };
}
function vr({
  layout: r2,
  bootstrap: e2,
  onAction: t2,
  auth: i2,
  authSession: n2,
  hasTopBanner: s2,
  titleOverride: o3
}) {
  const c2 = T(
    () => yr(r2, o3),
    [r2, o3]
  ), l2 = T(() => {
    for (const y2 of c2.blocks)
      if (y2.type === "price_grid" && y2.popular_price_id && e2.prices.some((O2) => O2.id === y2.popular_price_id))
        return y2.popular_price_id;
    return e2.prices[0]?.id ?? null;
  }, [c2.blocks, e2.prices]), [h2, u2] = d(l2), g2 = {
    bootstrap: e2,
    selectedPriceId: h2,
    setSelectedPriceId: u2,
    onAction: t2,
    auth: i2,
    authSession: n2
  }, x2 = c2.blocks.findIndex((y2) => y2.type === "cta_button"), _2 = x2 === -1 ? c2.blocks : c2.blocks.slice(0, x2), m2 = x2 === -1 ? [] : c2.blocks.slice(x2), f2 = (y2, O2) => {
    const p2 = br[y2.type];
    return p2 ? /* @__PURE__ */ u$1(p2, { block: y2, ctx: g2 }, `${y2.type}-${O2}`) : (typeof console < "u" && console.warn(`[paywall] unknown block type: ${y2.type}`), null);
  };
  return /* @__PURE__ */ u$1(k$1, { children: [
    /* @__PURE__ */ u$1("div", { class: "flex-1 min-h-0 overflow-y-auto px-6 pb-3 pt-6 sm:px-8 sm:pb-4 sm:pt-8", children: /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-6", children: _2.map(f2) }) }),
    m2.length > 0 ? (
      // A thin shadow-top instead of border-t — creates depth, reads as
      // "the footer is pinned to the bottom of the dialog". The line looked like a divider
      // in normal flow and didn't convey the sticky character.
      /* @__PURE__ */ u$1(
        "div",
        {
          class: "flex flex-col gap-4 bg-white px-6 pb-6 pt-3 sm:px-8",
          style: { boxShadow: "0 -4px 12px -4px rgba(15,23,42,0.06)" },
          children: m2.map((y2, O2) => f2(y2, _2.length + O2))
        }
      )
    ) : null
  ] });
}
function xr(r2, e2, t2, i2) {
  return r2 ? i2 ? { open: true, view: "purchased", error: null, processing: false } : e2.status === "idle" || e2.status === "loading" ? { open: true, view: "loading", error: null, processing: false } : e2.status === "error" ? { open: true, view: "error", error: e2.error, processing: false } : t2.kind === "support" ? { open: true, view: "support", error: null, processing: false } : t2.kind === "auth_gate" ? { open: true, view: "auth", error: null, processing: false } : t2.kind === "awaiting_payment" ? { open: true, view: "awaiting_payment", error: null, processing: false } : t2.kind === "popup_blocked" ? { open: true, view: "popup_blocked", error: null, processing: false } : t2.kind === "purchase_success" ? { open: true, view: "purchased", error: null, processing: false } : t2.kind === "verifying" ? { open: true, view: "loading", error: null, processing: false } : { open: true, view: "layout", error: null, processing: false } : { open: false, view: null, error: null, processing: false };
}
function kr(r2, e2) {
  return r2.open === e2.open && r2.view === e2.view && r2.error === e2.error && r2.processing === e2.processing;
}
function _r({
  client: r2,
  open: e2,
  onClose: t2,
  onEvent: i2,
  initialView: n2,
  initialAuthMode: s2,
  initialCheckoutPriceId: o3,
  initialCheckoutUrl: c2,
  purchased: l2,
  renew: h2,
  onState: u2,
  inline: g2,
  locale: x2,
  titleOverride: _$12
}) {
  const [m2, f2] = d({ status: "idle" }), [y$12, O2] = d(
    () => r2.auth?.getCachedSession() ?? null
  ), [p2, b] = d(() => n2 === "support" ? { kind: "support", origin: "standalone" } : n2 === "auth" ? o3 ? {
    kind: "auth_gate",
    pendingCheckout: { priceId: o3, direct: true },
    origin: "standalone",
    intent: "preauth"
  } : { kind: "auth_gate", origin: "standalone" } : n2 === "awaiting_payment" && o3 && c2 ? {
    kind: "awaiting_payment",
    priceId: o3,
    url: c2
  } : n2 === "popup_blocked" && o3 && c2 ? {
    kind: "popup_blocked",
    priceId: o3,
    url: c2
  } : { kind: "layout" }), E2 = n2 === "awaiting_payment" || n2 === "popup_blocked" || n2 === "auth" && !!o3, z2 = A(false), P2 = A(null);
  y(() => {
    if (!u2) return;
    const w2 = xr(e2, m2, p2, l2), A2 = P2.current;
    A2 && kr(A2, w2) || (P2.current = w2, u2(w2));
  }, [e2, m2, p2, l2, u2]), y(() => {
    if (r2.auth)
      return r2.auth.onAuthChange((w2, A2) => O2(A2));
  }, [r2.auth]), y(() => {
    if (typeof r2.onBootstrapChange == "function")
      return r2.onBootstrapChange((w2) => {
        f2(
          (A2) => A2.status === "ready" ? { status: "ready", data: w2 } : A2
        );
      });
  }, [r2]), y(() => {
    if (!e2 || m2.status === "ready" || m2.status === "loading") return;
    let w2 = false;
    return f2({ status: "loading" }), r2.bootstrap().then((A2) => {
      w2 || (f2({ status: "ready", data: A2 }), i2("ready", A2));
    }).catch((A2) => {
      if (w2) return;
      const S2 = A2 instanceof o$3 ? A2 : new o$3("unknown", "Failed to load paywall", { cause: A2 });
      f2({ status: "error", error: S2 }), i2("error", S2);
    }), () => {
      w2 = true;
    };
  }, [e2, r2]), _(() => {
    if (!e2) {
      b({ kind: "layout" }), z2.current = false, f2((w2) => w2.status === "loading" ? { status: "idle" } : w2);
      return;
    }
    n2 === "support" ? b({ kind: "support", origin: "standalone" }) : n2 === "auth" ? b(o3 ? {
      kind: "auth_gate",
      pendingCheckout: { priceId: o3, direct: true },
      origin: "standalone",
      intent: "preauth"
    } : { kind: "auth_gate", origin: "standalone" }) : n2 === "awaiting_payment" && o3 && c2 ? b({
      kind: "awaiting_payment",
      priceId: o3,
      url: c2
    }) : n2 === "popup_blocked" && o3 && c2 && b({
      kind: "popup_blocked",
      priceId: o3,
      url: c2
    });
  }, [e2, n2, o3, c2]);
  const R2 = async (w2, { allowAuthGate: A2 = true } = {}) => {
    try {
      const S2 = r2.getCachedOffers?.() ?? null, C2 = S2 ? Z(S2, w2, { readStart: H }) : null, k2 = await r2.createCheckout({
        priceId: w2,
        offerId: C2?.id,
        ignoreActivePurchase: h2 === true
      });
      if (i2("checkout_started", { priceId: w2, url: k2.url, acquiring: k2.acquiring }), typeof window > "u" || !k2.url) return;
      const L2 = window.open(k2.url, "_blank");
      if (L2) {
        try {
          L2.opener = null;
        } catch {
        }
        b({ kind: "awaiting_payment", priceId: w2, url: k2.url });
      } else
        b({ kind: "popup_blocked", priceId: w2, url: k2.url });
    } catch (S2) {
      if (S2 instanceof o$3 && S2.code === "already_purchased") {
        try {
          await r2.getUser({ force: true });
        } catch {
        }
        i2("purchase_completed", { priceId: w2, sessionId: null, restored: true }), E2 ? t2() : b({ kind: "purchase_success", restored: true });
        return;
      }
      if (A2 && S2 instanceof o$3 && S2.status === 401 && r2.auth && (m2.status === "ready" ? m2.data.settings.checkout_mode ?? "guest" : "guest") === "preauth") {
        i2("error", S2), b({
          kind: "auth_gate",
          pendingCheckout: { priceId: w2, direct: E2 },
          intent: "preauth"
        });
        return;
      }
      const C2 = S2 instanceof o$3 ? S2 : new o$3("checkout_failed", "Checkout failed", { cause: S2 });
      i2("error", C2), E2 ? t2() : b({ kind: "layout" });
    }
  }, q2 = (w2, A2) => {
    if (typeof window > "u") return;
    const S2 = window.open(A2, "_blank");
    if (S2) {
      try {
        S2.opener = null;
      } catch {
      }
      b({ kind: "awaiting_payment", priceId: w2, url: A2 });
    }
  };
  y(() => {
    if (p2.kind !== "auth_gate" || !y$12 || y$12.user.is_anonymous || z2.current) return;
    z2.current = true;
    const w2 = p2.pendingCheckout, A2 = p2.origin;
    b({ kind: "verifying" }), (async () => {
      if (!h2)
        try {
          if ((await r2.getUser({ force: true })).has_active_subscription) {
            i2("purchase_completed", {
              priceId: w2?.priceId ?? null,
              sessionId: null,
              restored: true
            }), w2?.direct ? t2() : b({ kind: "purchase_success", restored: true });
            return;
          }
        } catch {
        }
      if (!w2) {
        A2 === "standalone" ? t2() : b({ kind: "layout" });
        return;
      }
      await R2(w2.priceId, { allowAuthGate: false });
    })().finally(() => {
      z2.current = false;
    });
  }, [y$12, p2]);
  const N2 = async (w2, A2) => {
    if (w2 === "close") {
      t2();
      return;
    }
    if (w2 === "price_selected") {
      i2("price_selected", A2);
      return;
    }
    if (w2 === "restore") {
      if (!r2.auth) return;
      const S2 = r2.auth.getCachedSession();
      if (S2 && !S2.user.is_anonymous) return;
      b({ kind: "auth_gate", intent: "restore" });
      return;
    }
    if (w2 === "support") {
      b({ kind: "support", origin: "layout" });
      return;
    }
    if (w2 === "checkout" && m2.status === "ready") {
      const S2 = A2?.priceId;
      if (!S2) {
        i2("error", new o$3("no_price", "No price selected"));
        return;
      }
      const C2 = m2.data.settings.checkout_mode ?? "guest", k2 = r2.auth?.getCachedSession() ?? null, L2 = !!k2 && !k2.user.is_anonymous;
      if (C2 === "preauth" && !!r2.auth && !L2) {
        b({ kind: "auth_gate", pendingCheckout: { priceId: S2 } });
        return;
      }
      await R2(S2);
    }
  }, B2 = m2.status === "ready" ? m2.data.settings.brand_color : null, T2 = m2.status === "ready" ? m2.data.settings.allow_close !== false : true, U2 = p2.kind === "layout" && m2.status === "ready" ? He(m2.data.offers) : null, Y2 = U2 ? /* @__PURE__ */ u$1(Nt, { offer: U2 }) : null, te2 = {
    type: "auth_panel",
    // We don't set the heading — AuthGate decides by intent (restore →
    // "Restore Purchases", the rest → the default "Welcome back!").
    allow_signup: true,
    allow_password_reset: true,
    // We don't hide it when a session is present — the auto-resume useEffect
    // runs faster than we'd want to show "Signed in as ..." as an intermediate
    // screen.
    hide_when_authenticated: false,
    providers: m2.status === "ready" ? m2.data.settings.auth_providers : void 0
  }, V2 = p2.kind === "support" ? /* @__PURE__ */ u$1(
    Ht,
    {
      client: r2,
      authSession: y$12,
      origin: p2.origin,
      onBack: () => {
        p2.origin === "standalone" ? t2() : b({ kind: "layout" });
      }
    }
  ) : null, re2 = p2.kind === "auth_gate" && p2.origin !== "standalone" || p2.kind === "support", K2 = m2.status === "ready" ? m2.data : null;
  return /* @__PURE__ */ u$1(vt, { bootstrap: K2, forceLocale: x2, children: /* @__PURE__ */ u$1(
    kt,
    {
      open: e2,
      onClose: t2,
      brandColor: B2,
      topBanner: Y2,
      allowClose: T2,
      hideCloseButton: re2,
      inline: g2,
      labelledBy: "pw-title",
      children: l2 ? /* @__PURE__ */ u$1($, { children: /* @__PURE__ */ u$1(Ue, { onContinue: t2 }) }) : p2.kind === "purchase_success" ? /* @__PURE__ */ u$1($, { children: /* @__PURE__ */ u$1(Ue, { restored: p2.restored, onContinue: t2 }) }) : V2 || (m2.status === "loading" || m2.status === "idle" || p2.kind === "verifying" ? /* @__PURE__ */ u$1($, { children: /* @__PURE__ */ u$1(Sr2, { verifying: p2.kind === "verifying" }) }) : m2.status === "error" ? /* @__PURE__ */ u$1($, { children: /* @__PURE__ */ u$1(Cr, { message: m2.error.message }) }) : p2.kind === "auth_gate" && r2.auth ? /* @__PURE__ */ u$1(
        zt2,
        {
          block: te2,
          bootstrap: m2.data,
          auth: r2.auth,
          authSession: y$12,
          showBack: p2.origin !== "standalone",
          intent: p2.intent ?? (p2.origin === "standalone" ? "standalone" : "preauth"),
          initialMode: p2.origin === "standalone" ? s2 : void 0,
          onBack: () => {
            p2.origin === "standalone" ? t2() : b({ kind: "layout" });
          }
        }
      ) : p2.kind === "awaiting_payment" ? /* @__PURE__ */ u$1($, { children: /* @__PURE__ */ u$1(
        Ar,
        {
          client: r2,
          onBack: () => b({ kind: "layout" }),
          onReopen: () => {
            if (typeof window > "u") return;
            const w2 = window.open(p2.url, "_blank");
            if (w2)
              try {
                w2.opener = null;
              } catch {
              }
          },
          onRetry: () => R2(p2.priceId)
        }
      ) }) : p2.kind === "popup_blocked" ? /* @__PURE__ */ u$1($, { children: /* @__PURE__ */ u$1(Ir, { onReopen: () => q2(p2.priceId, p2.url) }) }) : /* @__PURE__ */ u$1(
        vr,
        {
          layout: m2.data.layout,
          bootstrap: m2.data,
          onAction: N2,
          auth: r2.auth,
          authSession: y$12,
          titleOverride: _$12
        }
      ))
    }
  ) });
}
function $({ children: r2 }) {
  return /* @__PURE__ */ u$1("div", { class: "flex min-h-0 flex-1 flex-col overflow-y-auto", children: r2 });
}
function Sr2({ verifying: r2 }) {
  const { t: e2 } = M();
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center justify-center gap-3 py-12", children: [
    /* @__PURE__ */ u$1("span", { class: "inline-block h-7 w-7 animate-spin rounded-full border-[2.5px] border-gray-200 border-t-[var(--pw-accent)]" }),
    /* @__PURE__ */ u$1("span", { class: "text-xs font-medium tracking-wide text-gray-500", children: r2 ? e2("modal.verifying_subscription", "Checking your subscription…") : e2("modal.loading", "Loading…") })
  ] });
}
function Cr({ message: r2 }) {
  const { t: e2 } = M();
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-2 py-8 text-center", children: [
    /* @__PURE__ */ u$1("div", { class: "flex h-11 w-11 items-center justify-center rounded-full bg-red-50", children: /* @__PURE__ */ u$1("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true", children: [
      /* @__PURE__ */ u$1("path", { d: "M10 6v5M10 14h.01", stroke: "#dc2626", "stroke-width": "2", "stroke-linecap": "round" }),
      /* @__PURE__ */ u$1("circle", { cx: "10", cy: "10", r: "8", stroke: "#dc2626", "stroke-width": "1.75" })
    ] }) }),
    /* @__PURE__ */ u$1("p", { class: "text-sm font-semibold tracking-tight text-gray-900", children: e2("modal.error_generic", "Something went wrong") }),
    /* @__PURE__ */ u$1("p", { class: "text-xs leading-relaxed text-gray-500", children: r2 })
  ] });
}
function Ir({ onReopen: r2 }) {
  const { t: e2 } = M();
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-3 py-8 text-center", children: [
    /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex h-14 w-14 items-center justify-center rounded-full",
        style: { background: "color-mix(in srgb, var(--pw-accent) 12%, white)", color: "var(--pw-accent)" },
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1("svg", { width: "26", height: "26", viewBox: "0 0 24 24", fill: "none", children: [
          /* @__PURE__ */ u$1(
            "path",
            {
              d: "M14 4h6v6",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            }
          ),
          /* @__PURE__ */ u$1(
            "path",
            {
              d: "M20 4l-9 9",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            }
          ),
          /* @__PURE__ */ u$1(
            "path",
            {
              d: "M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5",
              stroke: "currentColor",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ u$1(
      "p",
      {
        id: "pw-title",
        class: "mt-1 text-lg font-semibold tracking-tight text-gray-900",
        children: e2("payment.popup_blocked_title", "Allow popups to continue")
      }
    ),
    /* @__PURE__ */ u$1("p", { class: "max-w-[20rem] text-sm leading-relaxed text-gray-500", children: e2("payment.popup_blocked_message", "Your browser blocked the checkout tab. Click below to open it.") }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: r2,
        class: "mt-3 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        style: {
          background: "linear-gradient(180deg, color-mix(in srgb, var(--pw-accent) 92%, white), var(--pw-accent))",
          boxShadow: "0 1px 2px rgba(15,23,42,0.08), 0 8px 20px -6px color-mix(in srgb, var(--pw-accent) 50%, transparent)"
        },
        children: e2("payment.open_checkout_button", "Open checkout")
      }
    )
  ] });
}
function Ar({
  client: r2,
  onBack: e2,
  onReopen: t2,
  onRetry: i2
}) {
  const { t: n2 } = M(), [s2, o3] = d(false), [c2, l2] = d(false), h2 = A(null);
  y(() => () => {
    h2.current !== null && clearTimeout(h2.current);
  }, []);
  const u2 = async () => {
    if (!s2) {
      o3(true), l2(false);
      try {
        if ((await r2.getUser({ force: true })).has_active_subscription) {
          typeof window < "u" && window.postMessage({ type: "paywall_purchase" }, "*");
          return;
        }
        l2(true), h2.current !== null && clearTimeout(h2.current), h2.current = setTimeout(() => {
          l2(false), h2.current = null;
        }, 5e3);
      } catch {
        l2(true);
      } finally {
        o3(false);
      }
    }
  };
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col gap-3 px-6 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5", children: [
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: e2,
        class: "-ml-1 self-start rounded-md px-1.5 py-0.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
        children: n2("nav.back", "← Back")
      }
    ),
    /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-3 py-6 text-center", children: [
      /* @__PURE__ */ u$1("div", { class: "relative flex h-14 w-14 items-center justify-center", children: [
        /* @__PURE__ */ u$1(
          "span",
          {
            class: "absolute inset-0 animate-ping rounded-full opacity-40",
            style: { background: "color-mix(in srgb, var(--pw-accent) 30%, transparent)" },
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ u$1("span", { class: "relative inline-block h-8 w-8 animate-spin rounded-full border-[2.5px] border-gray-200 border-t-[var(--pw-accent)]" })
      ] }),
      /* @__PURE__ */ u$1(
        "p",
        {
          id: "pw-title",
          class: "mt-1 text-lg font-semibold tracking-tight text-gray-900",
          children: n2("payment.awaiting_title", "Complete payment in the new tab")
        }
      ),
      /* @__PURE__ */ u$1("p", { class: "max-w-[22rem] text-sm leading-relaxed text-gray-500", children: n2(
        "payment.awaiting_subtitle",
        "We'll detect your payment automatically — or click below once you're done."
      ) }),
      /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: u2,
          disabled: s2,
          class: "mt-3 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
          style: {
            background: "linear-gradient(180deg, color-mix(in srgb, var(--pw-accent) 92%, white), var(--pw-accent))",
            boxShadow: "0 1px 2px rgba(15,23,42,0.08), 0 8px 20px -6px color-mix(in srgb, var(--pw-accent) 50%, transparent)"
          },
          children: s2 ? n2("payment.checking", "Checking…") : n2("payment.ive_paid", "I've paid")
        }
      ),
      c2 ? /* @__PURE__ */ u$1("p", { class: "text-xs leading-relaxed text-gray-500", children: n2("payment.still_processing", "Payment is still being processed. Please try again in a moment.") }) : null
    ] }),
    /* @__PURE__ */ u$1("div", { class: "rounded-2xl border border-gray-200 bg-gray-50/60 p-3.5", children: [
      /* @__PURE__ */ u$1("p", { class: "text-xs leading-relaxed text-gray-600", children: n2("payment.popup_help_text", "Checkout window didn't open or got blocked? Click here to open it again.") }),
      /* @__PURE__ */ u$1(
        "button",
        {
          type: "button",
          onClick: t2,
          class: "mt-2.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
          children: n2("payment.open_checkout_again", "Open checkout again")
        }
      )
    ] }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: i2,
        class: "self-center rounded-md px-2 py-1 text-xs text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pw-accent)]",
        children: n2("payment.tab_closed_retry", "Tab closed? Try again")
      }
    )
  ] });
}
function Ue({
  onContinue: r2,
  restored: e2 = false
}) {
  const { t: t2 } = M();
  return /* @__PURE__ */ u$1("div", { class: "flex flex-col items-center gap-4 px-6 py-6 text-center sm:px-8", children: [
    /* @__PURE__ */ u$1(
      "div",
      {
        class: "flex h-14 w-14 items-center justify-center rounded-full",
        style: {
          background: "linear-gradient(135deg, #4ade80, #16a34a)",
          color: "#fff",
          boxShadow: "0 0 0 8px rgba(74,222,128,0.12), 0 8px 20px -6px rgba(22,163,74,0.45)"
        },
        "aria-hidden": "true",
        children: /* @__PURE__ */ u$1("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", children: /* @__PURE__ */ u$1(
          "path",
          {
            d: "M5 13l4 4L19 7",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          }
        ) })
      }
    ),
    /* @__PURE__ */ u$1("p", { id: "pw-title", class: "mt-1 text-3xl font-bold tracking-tight text-gray-900", children: e2 ? t2("modal.purchase_restored_title", "Welcome back") : t2("modal.purchase_success_title", "Payment received") }),
    /* @__PURE__ */ u$1("p", { class: "text-base leading-relaxed text-gray-600", children: t2(e2 ? "modal.purchase_restored_subtitle" : "modal.purchase_success_subtitle", "You're all set — enjoy!") }),
    /* @__PURE__ */ u$1(
      "button",
      {
        type: "button",
        onClick: r2,
        class: "pw-cta-shimmer relative mt-2 flex min-h-12 w-full items-center justify-center overflow-hidden rounded-3xl px-5 py-2 text-center text-base font-semibold leading-tight text-white transition-transform duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--pw-accent)]",
        style: {
          background: "linear-gradient(135deg, color-mix(in srgb, var(--pw-accent) 55%, white) 0%, var(--pw-accent) 55%, color-mix(in srgb, var(--pw-accent) 90%, black) 100%)",
          boxShadow: "0 0 20px 0 color-mix(in srgb, var(--pw-accent) 25%, transparent), inset 0 0 8px 0 color-mix(in srgb, white 25%, transparent)"
        },
        children: /* @__PURE__ */ u$1("span", { class: "relative z-10", children: t2("modal.continue", "Continue") })
      }
    )
  ] });
}
const Lr = 10 * 6e4, Mr = 5e3, Er = 3e4;
class Tr {
  constructor(e2) {
    this.timer = null, this.timeoutTimer = null, this.visibilityHandler = null, this.focusHandler = null, this.messageHandler = null, this.stopped = false, this.checking = false, this.opts = {
      client: e2.client,
      onActive: e2.onActive,
      onTimeout: e2.onTimeout ?? (() => {
      }),
      timeoutMs: e2.timeoutMs ?? Lr,
      visibleIntervalMs: e2.visibleIntervalMs ?? Mr,
      hiddenIntervalMs: e2.hiddenIntervalMs ?? Er
    };
  }
  start() {
    this.stopped || typeof document > "u" || typeof window > "u" || (this.check(), this.scheduleNext(), this.visibilityHandler = () => this.handleVisibilityChange(), document.addEventListener("visibilitychange", this.visibilityHandler), this.focusHandler = () => void this.check(), window.addEventListener("focus", this.focusHandler), this.messageHandler = (e2) => this.handleMessage(e2), window.addEventListener("message", this.messageHandler), this.timeoutTimer = setTimeout(() => {
      this.stopped || (this.stop(), this.opts.onTimeout());
    }, this.opts.timeoutMs));
  }
  stop() {
    this.stopped = true, this.timer !== null && clearTimeout(this.timer), this.timer = null, this.timeoutTimer !== null && clearTimeout(this.timeoutTimer), this.timeoutTimer = null, typeof document < "u" && this.visibilityHandler && document.removeEventListener("visibilitychange", this.visibilityHandler), typeof window < "u" && (this.focusHandler && window.removeEventListener("focus", this.focusHandler), this.messageHandler && window.removeEventListener("message", this.messageHandler)), this.visibilityHandler = null, this.focusHandler = null, this.messageHandler = null;
  }
  async check() {
    if (!(this.stopped || this.checking)) {
      this.checking = true;
      try {
        const e2 = await this.opts.client.getUser({ force: true });
        if (this.stopped) return;
        e2.has_active_subscription && (this.stop(), this.opts.onActive(e2));
      } catch {
      } finally {
        this.checking = false;
      }
    }
  }
  scheduleNext() {
    if (this.stopped) return;
    const t2 = typeof document < "u" && document.visibilityState === "visible" ? this.opts.visibleIntervalMs : this.opts.hiddenIntervalMs;
    this.timer = setTimeout(async () => {
      await this.check(), this.scheduleNext();
    }, t2);
  }
  handleVisibilityChange() {
    typeof document > "u" || (document.visibilityState === "visible" && this.check(), this.timer !== null && (clearTimeout(this.timer), this.timer = null), this.scheduleNext());
  }
  handleMessage(e2) {
    const t2 = e2.data;
    !t2 || typeof t2 != "object" || t2.type === "paywall_purchase" && this.check();
  }
}
function Pr() {
  return !(typeof document > "u" || typeof window > "u");
}
const he = {
  open: false,
  view: null,
  error: null,
  processing: false
}, G = {
  status: "paywall_status",
  priceId: "paywall_price_id",
  sessionId: "paywall_session_id"
};
let Br = class {
  constructor(e2) {
    this.handle = null, this.isOpen = false, this.listeners = /* @__PURE__ */ new Map(), this.userUnsub = null, this.authUnsub = null, this.watcher = null, this.tracker = null, this.purchased = false, this.lastMountedView = null, this.viewedTracked = false, this.titleOverride = null, this.trialStore = null, this.trialStoreConfig = null, this.lastTrialStatus = null, this.trialExpiredFired = false, this.restoredEmitted = false, this.mountedRenew = false, this.checkoutStartedSinceMount = false, this.lastVisibility = null, this.currentState = he, this.stateListeners = /* @__PURE__ */ new Set();
    const { auth: t2, ownsAuth: i2 } = Or2(e2);
    this.auth = t2, this.ownsAuth = i2, this.billing = e2.client ?? new Yt$3({ ...e2, auth: this.auth }), this.host = e2.host, this.shadowMode = e2.shadowMode ?? "closed", this.mountThenLoad = e2.mountThenLoad ?? true, this.inline = e2.inline === true, this.forceLocale = e2.locale ?? null, this.userUnsub = this.billing.onUserChange((n2) => {
      if (this.emit("userChange", n2), n2.has_active_subscription && (this.lastMountedView === "awaiting_payment" || this.lastMountedView === "popup_blocked")) {
        this.handlePurchaseDetected(n2);
        return;
      }
      n2.has_active_subscription && this.isOpen && !this.purchased && !this.mountedRenew && !this.checkoutStartedSinceMount && this.lastMountedView === "layout" && this.currentState.view === "layout" && (this.close(), this.emitRestoredOnce());
    }), this.auth && (this.authUnsub = this.auth.onAuthChange((n2, s2) => {
      this.emit("authChange", { event: n2, session: s2 });
    })), this.on("checkout_started", () => this.markCheckoutPending()), this.initTracker(e2.analytics), e2.autoDetectReturn !== false && typeof window < "u" && queueMicrotask(() => this.checkReturn());
  }
  initTracker(e2) {
    if (e2 === false) return;
    const t2 = typeof e2 == "object" && e2 !== null ? e2 : {};
    if (t2.enabled === false) return;
    const i2 = t2.endpoint ?? (() => `${this.billing.activeApiOrigin()}/api/v1/paywall/${this.billing.paywallId}/events`);
    this.tracker = new Zt$2({
      endpoint: i2,
      paywallId: this.billing.paywallId,
      capabilities: this.billing.capabilities,
      getVisitorId: () => this.billing.getVisitorId(),
      getCachedVisitorId: () => this.billing.getCachedVisitorId(),
      getUserId: () => this.billing.getIdentity()?.userId ?? null,
      // A/B: enrich every event with the assigned variant. Read from the
      // materialized bootstrap (not a dedicated method) so it also works
      // through proxying clients (sdk-extension RemoteBillingClient mirrors
      // getCachedBootstrap).
      getExperimentContext: () => {
        const n2 = this.billing.getCachedBootstrap()?.experiment;
        return n2?.assigned_variant ? { experiment_id: n2.id, variant: n2.assigned_variant } : null;
      },
      flushIntervalMs: t2.flushIntervalMs,
      maxBufferSize: t2.maxBufferSize,
      fetch: t2.fetch,
      sendBeacon: t2.sendBeacon
    }), this.on("ready", (n2) => {
      this.lastMountedView === "layout" && (this.viewedTracked = true, this.tracker?.track("paywall_viewed", {
        is_test_mode: n2.settings.is_test_mode,
        prices_count: n2.prices.length,
        offers_count: n2.offers.length,
        // The host passed open({title}) — the configured heading is replaced.
        // Lets host-side title experiments be told apart in analytics.
        ...this.titleOverride ? { custom_title: true } : {}
      }));
    }), this.on(
      "price_selected",
      (n2) => this.tracker?.track("price_selected", { price_id: n2.priceId })
    ), this.on(
      "checkout_started",
      (n2) => this.tracker?.track("checkout_started", {
        price_id: n2.priceId,
        acquiring: n2.acquiring
      })
    ), this.on("purchase_completed", (n2) => {
      n2.restored || this.tracker?.track("purchase_completed", {
        price_id: n2.priceId,
        session_id: n2.sessionId
      });
    }), this.on(
      "purchase_failed",
      (n2) => this.tracker?.track("purchase_failed", { reason: n2.reason })
    ), this.on("close", () => {
      this.viewedTracked && this.tracker?.track("paywall_closed"), this.viewedTracked = false;
    }), this.on(
      "trial_blocked",
      (n2) => this.tracker?.track("trial_blocked", {
        mode: n2.mode,
        ...n2.mode === "time" ? { remaining_ms: n2.remainingMs, total_ms: n2.totalMs } : n2.mode === "opens" ? { remaining_actions: n2.remainingActions, total_actions: n2.totalActions } : {}
      })
    ), this.on("trial_expired", () => this.tracker?.track("trial_expired")), this.on(
      "visibility_blocked",
      (n2) => this.tracker?.track("visibility_blocked", {
        reason: n2.reason,
        country: n2.country,
        tier: n2.tier
      })
    ), this.on(
      "error",
      (n2) => this.tracker?.track("error", { code: n2.code, message: n2.message })
    );
  }
  /**
   * Send an arbitrary analytics event. Names from the system whitelist
   * (`app_opened`, `paywall_viewed`, ...) are allowed as-is. Custom ones —
   * with a `host:` prefix (e.g. `host:user_clicked_upgrade`). The server drops
   * events with disallowed names.
   *
   * The most common case is `track('app_opened')` from the host right after the
   * app loads, to record the funnel before the paywall opens.
   */
  track(e2, t2) {
    this.tracker?.track(e2, t2);
  }
  /**
   * A convenient shortcut for `paywall.on('userChange', cb)` — the most common
   * pattern in host code, hence a separate named method. The callback receives
   * the last-known user from the cache synchronously via a microtask, if any.
   */
  onUserChange(e2) {
    return this.on("userChange", e2);
  }
  /**
   * Replace cachedBootstrap with live data — for preview mode in the admin
   * panel editor. If the modal is open, PaywallRoot is subscribed to
   * onBootstrapChange and re-renders instantly. Before open() — a seed for the
   * bootstrap() effect.
   *
   * See {@link BillingClientOptions.preview} — usually this option is set on
   * the client to also disable the network revalidate. setBootstrap technically
   * works in production mode too, but competing with a revalidate from the
   * network is almost always undesirable.
   */
  setBootstrap(e2) {
    this.billing.setBootstrap(e2);
  }
  /**
   * Change the force-locale on the fly — for the admin panel editor's
   * live-preview, when the user switches "Preview as user from <country>".
   * Loads the corresponding static chunk and forces a re-render via
   * handle.update. See PaywallUIOptions.locale.
   *
   * Pass `null`/`undefined` to return to the automatic resolution logic
   * (navigator.language → locale_default).
   */
  setLocale(e2) {
    const t2 = e2 ?? null;
    t2 !== this.forceLocale && (this.forceLocale = t2, this.handle && this.handle.update({ locale: t2 }));
  }
  on(e2, t2) {
    let i2 = this.listeners.get(e2);
    return i2 || (i2 = /* @__PURE__ */ new Set(), this.listeners.set(e2, i2)), i2.add(t2), () => i2.delete(t2);
  }
  off(e2, t2) {
    this.listeners.get(e2)?.delete(t2);
  }
  emit(e2, ...t2) {
    const i2 = this.listeners.get(e2);
    if (!i2) return;
    const n2 = t2[0];
    for (const s2 of i2)
      try {
        s2(n2);
      } catch (o3) {
        typeof console < "u" && console.error("[paywall] listener error", o3);
      }
  }
  open(e2 = {}) {
    this.openInternal("layout", e2);
  }
  /**
   * Warms up the bootstrap cache and balance cache in advance, without opening
   * the modal. Useful when the host knows the user will soon open the paywall
   * (hover on the CTA, component mount) — the first `open()` renders instantly,
   * without a loading flash.
   *
   * Doesn't throw: if the network failed, it silently ignores it (a repeat
   * open() does a fresh bootstrap with an error-state as usual). `signal` for
   * cancellation — e.g. if the host unmounts the component faster than bootstrap
   * returns.
   *
   * Can be called any number of times — subsequent calls return a cached
   * Promise (BillingClient already deduplicates).
   */
  async preload(e2 = {}) {
    try {
      await this.billing.bootstrap({ signal: e2.signal }), this.billing.auth && await this.billing.getBalances({ signal: e2.signal });
    } catch {
    }
  }
  /**
   * Opens the modal straight to the support form (bypassing the layout with
   * plans). Useful when the host app wants to give the user a "Help / Support"
   * button unrelated to a paywall upgrade. Back/Done in the support form close
   * the modal (don't return to the plans), because the user came here directly.
   *
   * From the regular `paywall.open()` flow support is still available via the
   * Contact Support link in the `current_session` block (there Back returns to
   * the layout).
   */
  openSupport(e2 = {}) {
    this.openInternal("support", e2);
  }
  /**
   * Opens the modal straight to the auth-gate (login/registration), without the
   * layout with plans. Scenario: a returning customer already bought and just
   * needs to sign in so the SDK picks up their purchases. After signIn the
   * modal closes; Back also closes it (the user came only to log in).
   *
   * Without `auth` (managed-auth not connected) the method is a no-op: there's
   * no one to do signIn. If the user is already signed in — the modal still
   * opens and closes via auto-resume in the auth_gate effect (instantly).
   *
   * The trial doesn't block this flow — auth isn't connected to the trial
   * mechanics.
   */
  openAuth(e2 = {}) {
    this.auth && this.openInternal("auth", { ...e2, skipTrial: true });
  }
  /**
   * A shortcut over `openAuth()` — opens the modal straight to the signin form.
   * Equivalent to `openAuth()` (signin is the default). Exists for symmetry with
   * `openSignup()` and host-code readability:
   *   - `paywall.openSignin()` — "log in to an existing account"
   *   - `paywall.openSignup()` — "new registration"
   * Without managed-auth — a no-op.
   */
  openSignin(e2 = {}) {
    this.auth && this.openInternal("auth", { ...e2, skipTrial: true, authMode: "signin" });
  }
  /**
   * Opens the modal with the auth-gate straight in registration mode (the
   * AuthPanel's signup mode — email/password/repeat). If the admin disabled
   * allow_signup in the paywall layout, AuthPanel ignores the mode and starts
   * with signin — the admin config is respected.
   * Without managed-auth — a no-op.
   */
  openSignup(e2 = {}) {
    this.auth && this.openInternal("auth", { ...e2, skipTrial: true, authMode: "signup" });
  }
  /**
   * Direct-checkout: create a checkout URL for a specific price and immediately
   * open the payment provider, bypassing the layout with plans. Useful when the
   * host app renders pricing cards/a table with its own UI and wants a click on
   * "Buy / Get this plan" to lead straight to Stripe/Paddle.
   *
   * **Late-mount UX.** Unlike `open()`, the modal doesn't appear during the
   * background work (bootstrap + visibility/trial gates + createCheckout). The
   * host shows a busy-state right on its own button during this phase (via
   * `state.processing === true` from `paywall.getState()` — or automatically via
   * `<PaywallButton priceId>` in sdk-react). The modal is mounted ONLY when the
   * UI is really needed:
   *  - `checkout_mode='preauth'` + managed-auth + not signed in → auth-gate
   *    (the signin form); after success, auto-resume into createCheckout.
   *  - the provider's popup is blocked by the browser → a popup_blocked view
   *    with a retry button under a fresh user gesture.
   *  - the popup opened successfully → an awaiting_payment view (a "pay in the
   *    new tab" indicator + I've paid).
   *
   * What's emitted without the modal:
   *  - `purchase_completed{restored:true, priceId}` when the user is already
   *    subscribed (cached user, fresh bootstrap, or a 409 hasActivePurchase
   *    from the backend) — a headless reject;
   *  - `error` when createCheckout failed or identity.email is missing;
   *  - `visibility_blocked` / `trial_blocked` — the standard gate events.
   *
   * What's emitted together with the modal:
   *  - `checkout_started{priceId, url, acquiring}` exactly when the headless URL
   *    is received, BEFORE mounting awaiting_payment/popup_blocked.
   *
   * The offer (countdown discount) is automatically resolved from cached offers
   * via `getOfferForPrice(priceId)` and passed into createCheckout as `offerId`
   * — so duration_minutes offers also apply on the backend (there's no
   * server-side timer for them, and without an explicit offer-id the discount is
   * lost).
   *
   * Requirements:
   *  - `identity.email` must be set (via `opts.identity`, or managed-auth, or an
   *    early `setIdentity`/`paywall.open({identity})`). Without an email the
   *    backend `/start-checkout` returns 400; the SDK emits `error`.
   *  - In `checkout_mode='preauth'` without managed-auth — the backend requires
   *    an email user; make sure `identity.email` is explicitly set.
   *
   * Without a modal at all (when the host renders its own awaiting-payment
   * screen) — use `paywall.billing.createCheckout({priceId, offerId})` directly,
   * but then you'll have to draw auth-gate / popup_blocked / awaiting_payment
   * yourself.
   */
  checkout(e2, t2 = {}) {
    if (t2.identity && this.billing.setIdentity(t2.identity), t2.renew !== true && this.billing.getCachedUser()?.has_active_subscription) {
      this.emit("purchase_completed", {
        priceId: e2,
        sessionId: null,
        restored: true
      });
      return;
    }
    this.runDirectCheckout(e2, t2);
  }
  /** Headless prep-work for `checkout(priceId, opts)`: bootstrap → gates →
   *  preauth check → createCheckout → mount the modal with the final view.
   *  Extracted into a separate method for a clean async/await flow instead of
   *  nested then-chains (5+ branches). Any error isn't propagated outward: we
   *  emit via `paywall.emit('error')` and exit — the host is subscribed to the
   *  `error` event. */
  async runDirectCheckout(e2, t2) {
    const i2 = t2.renew === true, n2 = t2.skipTrial === true, s2 = t2.skipVisibility === true;
    this.applyProcessing(true);
    const o3 = () => {
      this.applyProcessing(false);
    };
    let c2;
    try {
      c2 = await this.billing.bootstrap();
    } catch (f2) {
      const y2 = f2 instanceof o$3 ? f2 : new o$3("unknown", "Failed to load paywall", { cause: f2 });
      this.emit("error", y2), o3();
      return;
    }
    if (!s2) {
      const f2 = c2.settings.visibility;
      if (f2 && (this.lastVisibility = f2, !f2.visible)) {
        this.emit("visibility_blocked", f2), o3();
        return;
      }
    }
    if (!n2 && await this.checkTrialBeforeCheckout(c2)) {
      o3();
      return;
    }
    if (!i2 && c2.user?.has_active_subscription) {
      this.emit("purchase_completed", {
        priceId: e2,
        sessionId: null,
        restored: true
      }), o3();
      return;
    }
    const l2 = c2.settings.checkout_mode ?? "guest", h2 = this.auth?.getCachedSession() ?? null, u2 = !!h2 && !h2.user.is_anonymous;
    if (l2 === "preauth" && !!this.auth && !u2) {
      this.purchased = false, this.mountAndShow("auth", {
        renew: i2,
        authMode: "signin",
        checkoutPriceId: e2
      });
      return;
    }
    const x2 = this.getOfferForPrice(e2);
    let _2;
    try {
      _2 = await this.billing.createCheckout({
        priceId: e2,
        offerId: x2?.offer.id,
        ignoreActivePurchase: i2
      });
    } catch (f2) {
      if (f2 instanceof o$3 && f2.code === "already_purchased") {
        try {
          await this.billing.getUser({ force: true });
        } catch {
        }
        this.emit("purchase_completed", {
          priceId: e2,
          sessionId: null,
          restored: true
        }), o3();
        return;
      }
      if (f2 instanceof o$3 && f2.status === 401 && this.auth && l2 === "preauth") {
        this.emit("error", f2), this.purchased = false, this.mountAndShow("auth", {
          renew: i2,
          authMode: "signin",
          checkoutPriceId: e2
        });
        return;
      }
      const y2 = f2 instanceof o$3 ? f2 : new o$3("checkout_failed", "Checkout failed", { cause: f2 });
      this.emit("error", y2), o3();
      return;
    }
    if (this.emit("checkout_started", {
      priceId: e2,
      url: _2.url,
      acquiring: _2.acquiring
    }), this.startUserWatcher(), typeof window > "u" || !_2.url) {
      this.mountAndShow("awaiting_payment", {
        renew: i2,
        checkoutPriceId: e2,
        checkoutUrl: _2.url
      });
      return;
    }
    const m2 = window.open(_2.url, "_blank");
    if (this.purchased = false, m2) {
      try {
        m2.opener = null;
      } catch {
      }
      this.mountAndShow("awaiting_payment", {
        renew: i2,
        checkoutPriceId: e2,
        checkoutUrl: _2.url
      });
    } else
      this.mountAndShow("popup_blocked", {
        renew: i2,
        checkoutPriceId: e2,
        checkoutUrl: _2.url
      });
  }
  /** Trial check without mounting (for late-mount direct-checkout). Returns
   *  true if the trial blocked — the caller must stop the flow. On any storage
   *  error we log+continue (we don't block the sale). */
  async checkTrialBeforeCheckout(e2) {
    const t2 = e2.settings.trial;
    if (!t2) return false;
    const i2 = this.ensureTrialStore(t2);
    try {
      const n2 = await i2.check();
      if (this.lastTrialStatus = n2, n2.mode === "none") return false;
      if (n2.blocked) {
        const s2 = await i2.recordBlock();
        return this.lastTrialStatus = s2, this.emit("trial_blocked", s2), true;
      }
      return this.trialExpiredFired || (this.trialExpiredFired = true, this.emit("trial_expired")), false;
    } catch (n2) {
      return typeof console < "u" && console.warn("[paywall] trial check failed", n2), false;
    }
  }
  applyProcessing(e2) {
    this.currentState.processing !== e2 && this.applyState({ ...this.currentState, processing: e2 });
  }
  /**
   * Headless anonymous signin without opening the modal. Internally:
   * idempotent (if already anon — instant return) → resume via the saved
   * refresh_token → fresh /auth/anonymous/signin. Deduplicates parallel calls
   * inside the AuthClient.
   *
   * Convenient for host buttons like "Continue as guest" — the host manages the
   * loading-state on its own button, without a half-empty modal with a spinner.
   * Without managed-auth — resolves with a rejected promise (there's no
   * AuthClient to do signin).
   */
  signInAnonymously() {
    return this.auth ? this.auth.signInAnonymously() : Promise.reject(
      new o$3(
        "invalid_config",
        "signInAnonymously requires managed-auth. Pass `auth: true` to PaywallUI."
      )
    );
  }
  openInternal(e2, t2) {
    if (t2.identity && this.billing.setIdentity(t2.identity), this.purchased = false, e2 === "layout" && t2.renew !== true) {
      if (this.billing.getCachedUser()?.has_active_subscription) {
        this.emitRestoredOnce();
        return;
      }
      if (this.canResolveUser()) {
        this.billing.getSettledUser().then((n2) => {
          if (n2?.has_active_subscription) {
            this.emitRestoredOnce();
            return;
          }
          this.proceedOpen(e2, t2);
        });
        return;
      }
    }
    this.proceedOpen(e2, t2);
  }
  /** Whether some source can still reveal the user for the subscription gate:
   *  a managed-auth session (Bearer) or an explicitly set identity. Anonymous
   *  visitors have neither — waiting on getSettledUser would be pointless. */
  canResolveUser() {
    return !!this.auth || !!this.billing.getIdentity();
  }
  /** The tail of openInternal after the subscription gate: skip-flag
   *  normalization and the cached/cold bootstrap paths. Extracted so the
   *  settled-user branch above can continue the flow asynchronously. */
  proceedOpen(e2, t2) {
    const i2 = t2.skipTrial === true || e2 === "support", n2 = t2.skipVisibility === true || e2 === "support" || e2 === "auth", s2 = t2.renew === true, o3 = t2.title ?? null;
    if (i2 && n2) {
      this.mountAndShow(e2, { renew: s2, authMode: t2.authMode, title: o3 });
      return;
    }
    const c2 = this.billing.getCachedBootstrap();
    if (c2) {
      this.runOpenGates(e2, c2, { skipTrial: i2, skipVisibility: n2, renew: s2, title: o3 });
      return;
    }
    if (this.mountThenLoad) {
      this.mountAndShow(e2, { renew: s2, title: o3 }), this.billing.bootstrap().then((l2) => this.runDelayedGates(l2, { skipTrial: i2, skipVisibility: n2, renew: s2 })).catch(() => {
      });
      return;
    }
    this.billing.bootstrap().then(
      (l2) => this.runOpenGates(e2, l2, { skipTrial: i2, skipVisibility: n2, renew: s2, title: o3 })
    ).catch(() => {
      this.mountAndShow(e2, { renew: s2, title: o3 });
    });
  }
  /** Apply gates AFTER the modal is already mounted (the mount-then-load path).
   *  If a gate blocks — close() + emit. If the user already closed the modal
   *  themselves before bootstrap resolved — a no-op (isOpen=false). */
  async runDelayedGates(e2, t2) {
    if (!this.isOpen) return;
    if (!t2.renew) {
      let s2 = this.billing.getCachedUser();
      if (!s2?.has_active_subscription && this.canResolveUser() && (s2 = await this.billing.getSettledUser() ?? s2, !this.isOpen))
        return;
      if (s2?.has_active_subscription) {
        this.close(), this.emitRestoredOnce();
        return;
      }
    }
    if (!t2.skipVisibility) {
      const s2 = e2.settings.visibility;
      if (s2 && (this.lastVisibility = s2, !s2.visible)) {
        this.close(), this.emit("visibility_blocked", s2);
        return;
      }
    }
    if (t2.skipTrial) return;
    const i2 = e2.settings.trial;
    if (!i2) return;
    const n2 = this.ensureTrialStore(i2);
    n2.check().then(async (s2) => {
      if (this.isOpen && (this.lastTrialStatus = s2, s2.mode !== "none")) {
        if (s2.blocked) {
          const o3 = await n2.recordBlock();
          if (this.lastTrialStatus = o3, !this.isOpen) return;
          this.close(), this.emit("trial_blocked", o3);
          return;
        }
        this.trialExpiredFired || (this.trialExpiredFired = true, this.emit("trial_expired"));
      }
    }).catch((s2) => {
      typeof console < "u" && console.warn("[paywall] trial check failed", s2);
    });
  }
  // Gate order: visibility → trial. A country-mismatch ≠ a trial-block, and
  // keeping a trial-state "N views left" under a user who shouldn't see the
  // paywall at all by targeting is pointless: when they return to the correct
  // country they'd end up with a "stuck" trial counter.
  runOpenGates(e2, t2, i2) {
    if (e2 === "layout" && !i2.renew && this.billing.getCachedUser()?.has_active_subscription) {
      this.emitRestoredOnce();
      return;
    }
    if (!i2.skipVisibility) {
      const n2 = t2.settings.visibility;
      if (n2 && (this.lastVisibility = n2, !n2.visible)) {
        this.emit("visibility_blocked", n2);
        return;
      }
    }
    if (i2.skipTrial) {
      this.mountAndShow(e2, { renew: i2.renew, title: i2.title });
      return;
    }
    this.gateThroughTrial(e2, t2, i2.renew, i2.title);
  }
  gateThroughTrial(e2, t2, i2, n2) {
    const s2 = t2.settings.trial;
    if (!s2) {
      this.mountAndShow(e2, { renew: i2, title: n2 });
      return;
    }
    const o3 = this.ensureTrialStore(s2);
    o3.check().then(async (c2) => {
      if (this.lastTrialStatus = c2, c2.mode === "none") {
        this.mountAndShow(e2, { renew: i2, title: n2 });
        return;
      }
      if (c2.blocked) {
        const l2 = await o3.recordBlock();
        this.lastTrialStatus = l2, this.emit("trial_blocked", l2);
        return;
      }
      this.trialExpiredFired || (this.trialExpiredFired = true, this.emit("trial_expired")), this.mountAndShow(e2, { renew: i2, title: n2 });
    }).catch((c2) => {
      typeof console < "u" && console.warn("[paywall] trial check failed", c2), this.mountAndShow(e2, { renew: i2, title: n2 });
    });
  }
  ensureTrialStore(e2) {
    if (this.trialStore && this.trialStoreConfig && zr(this.trialStoreConfig, e2))
      return this.trialStore;
    this.trialStoreConfig = e2;
    const t2 = this.billing.createTrialStore;
    return this.trialStore = typeof t2 == "function" ? t2.call(this.billing, e2) : te(this.billing.getStorage(), this.billing.paywallId, e2), this.trialStore;
  }
  mountAndShow(e2, t2 = {}) {
    this.lastMountedView = e2, this.viewedTracked = false;
    const i2 = t2.renew === true;
    this.mountedRenew = i2, this.checkoutStartedSinceMount = false;
    const n2 = t2.authMode, s2 = e2 === "layout" ? t2.title ?? null : null;
    this.titleOverride = s2;
    const c2 = e2 === "auth" || e2 === "awaiting_payment" || e2 === "popup_blocked" ? t2.checkoutPriceId ?? null : null, l2 = e2 === "awaiting_payment" || e2 === "popup_blocked" ? t2.checkoutUrl ?? null : null;
    if (this.handle) {
      this.isOpen = true, this.handle.update({
        open: true,
        initialView: e2,
        initialAuthMode: n2,
        initialCheckoutPriceId: c2,
        initialCheckoutUrl: l2,
        purchased: false,
        renew: i2,
        titleOverride: s2
      }), this.emit("open");
      return;
    }
    this.isOpen = true, this.handle = gt(
      _r,
      {
        client: this.billing,
        open: true,
        initialView: e2,
        initialAuthMode: n2,
        initialCheckoutPriceId: c2,
        initialCheckoutUrl: l2,
        purchased: false,
        renew: i2,
        titleOverride: s2,
        onClose: () => this.close(),
        onEvent: (h2, u2) => {
          this.emit(h2, u2), h2 === "checkout_started" && (this.checkoutStartedSinceMount = true, this.startUserWatcher());
        },
        onState: (h2) => this.applyState(h2),
        inline: this.inline,
        locale: this.forceLocale
      },
      { host: this.host, shadowMode: this.shadowMode, inline: this.inline }
    ), this.emit("open");
  }
  applyState(e2) {
    if (!jr(this.currentState, e2)) {
      this.currentState = e2;
      for (const t2 of this.stateListeners)
        try {
          t2(e2);
        } catch (i2) {
          console.warn("[paywall] onStateChange listener threw", i2);
        }
    }
  }
  /**
   * A sync snapshot of the modal's current state. Suitable for
   * `useSyncExternalStore` in React
   * (`useSyncExternalStore(paywall.onStateChange, paywall.getState)`) and for
   * one-off checks ("is the paywall open right now?").
   *
   * The snapshot is stable — as long as the state hasn't changed, a repeat
   * getState() returns a `===`-equal object (important for useSyncExternalStore
   * to avoid re-rendering).
   */
  getState() {
    return this.currentState;
  }
  /**
   * Subscribe to state changes. The callback is called on every real change
   * (closed → loading → ready → ...). By default the initial snapshot is
   * delivered via a microtask after subscribing; via `{immediate: 'sync'|'none'}`
   * you can do sync delivery (not needed for useSyncExternalStore — there the
   * snapshot is read via getSnapshot separately) or skip the initial entirely.
   *
   * Returns an unsubscribe function.
   */
  onStateChange(e2, t2 = {}) {
    this.stateListeners.add(e2);
    const i2 = t2.immediate ?? "microtask";
    if (i2 !== "none") {
      const n2 = this.currentState;
      if (i2 === "sync")
        try {
          e2(n2);
        } catch (s2) {
          console.warn("[paywall] onStateChange initial sync threw", s2);
        }
      else
        queueMicrotask(() => {
          this.stateListeners.has(e2) && e2(n2);
        });
    }
    return () => {
      this.stateListeners.delete(e2);
    };
  }
  /** Sync access to the last known trial status. null — `paywall.open()` hasn't
   *  been called yet or the trial is disabled in the paywall config. Convenient
   *  for the host's own UI ("3 views left", "the trial expires in 2h"). */
  getTrialStatus() {
    return this.lastTrialStatus;
  }
  /** Sync access to the last server-computed visibility status. null —
   *  bootstrap isn't loaded yet or the server doesn't return
   *  `settings.visibility` (e.g. an old version of online without the targeting
   *  patch). The host can use it for its own fallback: "the service isn't
   *  available in your country". Updated on every open() that passes through the
   *  gate. */
  getVisibility() {
    return this.lastVisibility;
  }
  /**
   * The paywall's prices — a shortcut over `bootstrap()`. Locales are already
   * applied, and the cache and stale-while-revalidate are identical to
   * `billing.bootstrap()`. Suitable for pricing pages/cards on the site, where
   * the host wants to show the same prices as in the modal without pulling
   * bootstrap by hand.
   */
  getPrices(e2 = {}) {
    return this.billing.getPrices(e2);
  }
  /** A sync snapshot of the prices. null — bootstrap hasn't been loaded yet. */
  getCachedPrices() {
    return this.billing.getCachedPrices();
  }
  /** A sync snapshot of the offers. null = bootstrap not loaded, [] = a paywall
   *  without offers. The backend already applied server-side targeting
   *  (countries/email/mode) — only what's applicable to the current user comes
   *  out. */
  getCachedOffers() {
    return this.billing.getCachedOffers();
  }
  /**
   * Resolves the active offer for a specific price: price_id targeting +
   * countdown (`expires_at` OR `duration_minutes` from the first paywall open,
   * see clientStorage `pw-offer-{id}-start`).
   *
   * Read-only — does NOT write the start for `duration_minutes` offers. The
   * write starts only when the modal is actually open (by the renderer). Before
   * that `getOfferForPrice` returns `null` for duration-only offers, so host
   * pages outside the modal (pricing, landing) don't activate the countdown
   * prematurely.
   *
   * A host page that needs a countdown ticking every second should use the React
   * hook `usePaywallOffer(priceId)` from sdk-react, or a wrapper over
   * `setInterval(1000)` + a repeat call to this method.
   */
  getOfferForPrice(e2) {
    const t2 = this.billing.getCachedOffers();
    if (!t2) return null;
    const i2 = ze(t2, e2);
    return i2 ? Re2(i2, {
      now: Date.now(),
      readStart: H
    }) : null;
  }
  /** A snapshot of the current "user language" — a proxy over
   *  `billing.getUserLanguage()`. Use it to sync the host's i18n with what the
   *  paywall actually shows. See the details in `BillingClient.getUserLanguage`. */
  getUserLanguage() {
    return this.billing.getUserLanguage();
  }
  /**
   * Decides whether the feature should be blocked for the current user. No side
   * effects (`recordBlock` isn't called on trial-storage, the modal isn't
   * mounted).
   *
   * Check order (the first one that triggers is final):
   *  1. `has_active_subscription` — the strongest signal, overrides the rest.
   *     A user with a subscription gets access regardless of visibility/trial.
   *  2. `visibility` (country/device/disabled-flag) — the user is outside the
   *     paywall's monetization scope, can't be gated.
   *  3. `trial` — the pre-paywall free period is active.
   *  4. Otherwise — `blocked`, the host locks the feature and calls
   *     `paywall.open()`.
   *
   * Bootstrap is cached in BillingClient — `getAccess()` can be called on every
   * render of the host component, /bootstrap isn't duplicated. On a failed
   * network it falls back to the persistent-cached user from storage: a user
   * with a past subscription gets `granted` offline, otherwise `blocked` (the
   * host shows the paywall with an error-state, the user can retry). Side
   * effect: `lastVisibility` / `lastTrialStatus` are updated so the synchronous
   * getters `getVisibility()` / `getTrialStatus()` see fresh data after the
   * first `getAccess()`, not only after the first `open()`.
   */
  async getAccess(e2 = {}) {
    let t2 = this.billing.getCachedBootstrap();
    if (!t2)
      try {
        t2 = await this.billing.bootstrap({ signal: e2.signal });
      } catch {
        const o3 = this.billing.getCachedUser();
        return o3?.has_active_subscription ? {
          access: "granted",
          reason: "has_subscription",
          visibility: null,
          trial: null,
          user: o3
        } : {
          access: "blocked",
          reason: "no_subscription",
          visibility: null,
          trial: null,
          user: o3
        };
      }
    let i2 = this.billing.getCachedUser();
    if (!i2?.has_active_subscription && this.canResolveUser() && (i2 = await this.billing.getSettledUser({ signal: e2.signal }) ?? i2), i2 || (i2 = t2.user ?? null), i2?.has_active_subscription)
      return {
        access: "granted",
        reason: "has_subscription",
        visibility: t2.settings.visibility ?? null,
        trial: null,
        user: i2
      };
    let n2 = null;
    if (!e2.skipVisibility) {
      const o3 = t2.settings.visibility;
      if (o3 && (n2 = o3, this.lastVisibility = o3, !o3.visible))
        return { access: "granted", reason: "visibility_blocked", visibility: n2, trial: null, user: i2 };
    }
    let s2 = null;
    if (!e2.skipTrial) {
      const o3 = t2.settings.trial;
      if (o3)
        try {
          if (s2 = await this.ensureTrialStore(o3).check(), this.lastTrialStatus = s2, s2.blocked)
            return { access: "granted", reason: "trial_blocked", visibility: n2, trial: s2, user: i2 };
        } catch (c2) {
          typeof console < "u" && console.warn("[paywall] getAccess: trial check failed", c2);
        }
    }
    return { access: "blocked", reason: "no_subscription", visibility: n2, trial: s2, user: i2 };
  }
  /** Reset the trial state in storage. Useful for dev mode / an admin button
   *  "run the scenario again". In prod the host usually doesn't call it. */
  async resetTrial() {
    this.trialStore && (await this.trialStore.reset(), this.lastTrialStatus = null, this.trialExpiredFired = false);
  }
  // Starts polling user-state until has_active_subscription=true or a timeout.
  // Idempotent: a repeat call on an already-running watcher is a no-op (the user
  // might press Continue again after returning).
  //
  // In the extension popup runtime — a no-op (the popup won't survive). There we
  // rely on bootstrap on the next open.
  startUserWatcher() {
    this.watcher || Pr() && (this.watcher = new Tr({
      client: this.billing,
      onActive: (e2) => this.handlePurchaseDetected(e2),
      onTimeout: () => {
        this.watcher = null;
      }
    }), this.watcher.start());
  }
  // Single funnel for "subscription became active during a checkout flow".
  // Reached from THREE independent sources:
  //   1. UserWatcher.onActive — the background poll (where it runs).
  //   2. billing.onUserChange — the manual "I've paid" button (getUser →
  //      applyUser → onUserChange) and cross-context user-state broadcasts
  //      (sdk-extension offscreen → RemoteBillingClient → onUserChange).
  //   3. (future) any other path that flips cachedUser to active.
  // Idempotent via `this.purchased` (reset to false at the start of every
  // checkout flow — see the direct-checkout/headless mounts).
  //
  // Previously this logic lived ONLY inside watcher.onActive, and the manual
  // button merely posted a `paywall_purchase` window-message to wake the
  // watcher. In runtimes where the watcher doesn't run — a full extension page
  // on chrome-extension:// (shouldRunUserWatcher was false for the whole
  // protocol) — neither the poll nor the manual button could close the awaiting
  // screen: the message had no listener. Funneling through onUserChange fixes
  // both, regardless of whether a watcher exists.
  handlePurchaseDetected(e2) {
    if (this.purchased) return;
    this.purchased = true, this.watcher && (this.watcher.stop(), this.watcher = null), this.emit("purchase_completed", { priceId: null, sessionId: null });
    const t2 = this.billing.getCachedBootstrap()?.settings.success_redirect_url;
    if (t2 && typeof window < "u")
      try {
        window.location.assign(t2);
        return;
      } catch {
      }
    this.isOpen && this.handle && this.handle.update({ purchased: true });
  }
  /** Fire-and-forget write of the checkout-pending marker (see the
   *  checkout_started subscription in the constructor). Goes through the
   *  billing storage adapter, so in the extension it lands in the offscreen
   *  storage — the same store BillingClient.getSettledUser reads. Storage
   *  failures degrade to the previous behavior (a one-time flash). */
  markCheckoutPending() {
    try {
      Promise.resolve(
        this.billing.getStorage().setItem(
          f$4.checkoutPending(this.billing.paywallId),
          JSON.stringify({ at: Date.now() })
        )
      ).catch(() => {
      });
    } catch {
    }
  }
  /** Blind open() hit the subscription gate: the modal is suppressed, the host
   *  gets the same signal as every other "subscription is already active" path
   *  — purchase_completed{restored:true}. Once per instance lifetime. */
  emitRestoredOnce() {
    this.restoredEmitted || (this.restoredEmitted = true, this.emit("purchase_completed", {
      priceId: null,
      sessionId: null,
      restored: true
    }));
  }
  close() {
    !this.isOpen || !this.handle || (this.isOpen = false, this.purchased = false, this.handle.update({ open: false, purchased: false }), this.applyState(he), this.emit("close"));
  }
  /**
   * Scans the current URL for checkout-return markers and emits
   * purchase_completed / purchase_failed. The markers are removed from the URL
   * via history.replaceState. It looks in both the hash and the search (the
   * hash takes priority — protection against client SPA routers that intercept
   * the query).
   */
  checkReturn() {
    if (typeof window > "u") return;
    const e2 = new URL(window.location.href), t2 = je(e2.hash.replace(/^#/, "")), i2 = je(e2.search.replace(/^\?/, "")), n2 = t2 ?? i2;
    n2 && (n2.status === "paid" ? (this.emit("purchase_completed", {
      priceId: n2.priceId,
      sessionId: n2.sessionId
    }), Rr(n2)) : (n2.status === "failed" || n2.status === "cancelled") && this.emit("purchase_failed", { reason: n2.status }), Dr(e2));
  }
  destroy() {
    this.tracker?.destroy(), this.tracker = null, this.listeners.clear(), this.stateListeners.clear(), this.watcher?.stop(), this.watcher = null, this.userUnsub?.(), this.userUnsub = null, this.authUnsub?.(), this.authUnsub = null, this.ownsAuth && this.auth && this.auth.destroy?.(), this.ownsAuth = false, this.billing.destroy?.(), this.handle?.unmount(), this.handle = null, this.isOpen = false, this.currentState = he;
  }
};
function Or2(r2) {
  if (!r2.auth) return { auth: void 0, ownsAuth: false };
  if (r2.auth instanceof Wt$3 || Ur(r2.auth))
    return { auth: r2.auth, ownsAuth: false };
  const e2 = r2.auth === true ? {} : r2.auth;
  return {
    auth: new Wt$3({
      paywallId: r2.paywallId,
      apiOrigin: e2.apiOrigin ?? r2.apiOrigin,
      storage: e2.storage ?? r2.storage,
      fetch: e2.fetch ?? r2.fetch,
      openPopup: e2.openPopup
    }),
    ownsAuth: true
  };
}
function Ur(r2) {
  if (typeof r2 != "object" || r2 === null) return false;
  const e2 = r2;
  return typeof e2.onAuthChange == "function" && typeof e2.getCachedSession == "function" && typeof e2.signOut == "function";
}
function jr(r2, e2) {
  return r2.open === e2.open && r2.view === e2.view && r2.error === e2.error && r2.processing === e2.processing;
}
function zr(r2, e2) {
  return r2.mode === e2.mode && r2.payload === e2.payload && r2.storage === e2.storage;
}
function je(r2) {
  if (!r2) return null;
  const e2 = new URLSearchParams(r2), t2 = e2.get(G.status);
  return t2 ? {
    status: t2,
    priceId: e2.get(G.priceId),
    sessionId: e2.get(G.sessionId)
  } : null;
}
function Rr(r2) {
  if (!(typeof window > "u" || !window.opener))
    try {
      window.opener.postMessage(
        {
          type: "paywall_purchase",
          status: r2.status,
          priceId: r2.priceId,
          sessionId: r2.sessionId
        },
        "*"
      );
    } catch {
    }
}
function Dr(r2) {
  const e2 = (i2, n2) => {
    if (!i2) return "";
    const s2 = new URLSearchParams(i2.replace(/^[?#]/, ""));
    s2.delete(G.status), s2.delete(G.priceId), s2.delete(G.sessionId);
    const o3 = s2.toString();
    return o3 ? n2 + o3 : "";
  }, t2 = r2.pathname + e2(r2.search, "?") + e2(r2.hash, "#");
  window.history.replaceState(null, "", t2);
}
class qr {
  constructor(e2, t2, i2) {
    this.transport = e2, this.paywallId = t2, this.config = i2;
  }
  async check() {
    return this.transport.request("trial.check", {
      paywallId: this.paywallId,
      config: this.config
    });
  }
  async recordBlock() {
    return this.transport.request("trial.recordBlock", {
      paywallId: this.paywallId,
      config: this.config
    });
  }
  async reset() {
    await this.transport.request("trial.reset", {
      paywallId: this.paywallId,
      config: this.config
    });
  }
}
class Fr {
  constructor(e2, t2) {
    this.transport = e2, this.cachedBootstrap = null, this.cachedUser = null, this.cachedBalances = null, this.identity = null, this.userListeners = /* @__PURE__ */ new Set(), this.balanceListeners = /* @__PURE__ */ new Set(), this.bootstrapListeners = /* @__PURE__ */ new Set(), this.unsubUserBroadcast = null, this.unsubBalancesBroadcast = null, this.paywallId = t2.paywallId, this.apiOrigin = t2.apiOrigin, this.remoteStorageAdapter = {
      getItem: (i2) => this.transport.request("storage.get", { key: i2 }),
      setItem: async (i2, n2) => {
        await this.transport.request("storage.set", { key: i2, value: n2 });
      },
      removeItem: async (i2) => {
        await this.transport.request("storage.remove", { key: i2 });
      }
      // We don't implement watch — for cross-context notifications consumers
      // (AuthClient, TrialStore) subscribe to broadcast events directly through
      // transport. If it's ever needed, we'll add a storage.watch broadcast.
    }, this.unsubUserBroadcast = this.transport.on("userChange", (i2) => {
      this.applyUser(i2);
    }), this.unsubBalancesBroadcast = this.transport.on("balancesChange", (i2) => {
      this.applyBalances([...i2]);
    });
  }
  // === Bootstrap ===
  async bootstrap(e2 = {}) {
    const t2 = await this.transport.request(
      "billing.bootstrap",
      { force: e2.force },
      { signal: e2.signal }
    );
    return this.applyBootstrap(t2), t2.user && this.applyUser(t2.user), t2;
  }
  getCachedBootstrap() {
    return this.cachedBootstrap;
  }
  /** Mirrors `BillingClient.activeApiOrigin`. The edge failover state lives in
   *  the offscreen BillingClient and this method must stay sync, so the mirror
   *  returns the configured origin: the content script never builds sibling
   *  API URLs itself (the only consumer — the events endpoint — is the
   *  offscreen tracker, which reads the real BillingClient). */
  activeApiOrigin() {
    return this.apiOrigin ?? "";
  }
  /** Sticky A/B assignment of this device. Mirrors
   *  `BillingClient.getExperimentAssignment`: the offscreen BillingClient
   *  resolves the assignment and materializes `experiment.assigned_variant`
   *  into the bootstrap, which arrives here through the proxied bootstrap() —
   *  so the mirror only needs to read the cached copy. */
  getExperimentAssignment() {
    const e2 = this.cachedBootstrap?.experiment;
    return e2?.assigned_variant ? { experimentId: e2.id, variant: e2.assigned_variant } : null;
  }
  /** Subscribe to bootstrap state. Structurally compatible with
   *  `BillingClient.onBootstrapChange` — same microtask semantics for the
   *  initial snapshot. In extension mode offscreen does not yet broadcast
   *  bootstrapChange, so the listener fires only on self-initiated `bootstrap()`
   *  calls within this RemoteBillingClient (popup re-fetches bootstrap → mirror
   *  updates → listener fires). A cross-surface revalidate (another tab updated
   *  bootstrap) does not reach the popup — that would require a separate
   *  bootstrapChange broadcast in protocol.ts/server.ts. */
  onBootstrapChange(e2, t2 = {}) {
    this.bootstrapListeners.add(e2);
    const i2 = t2.immediate ?? "microtask";
    if (this.cachedBootstrap && i2 !== "none") {
      const n2 = this.cachedBootstrap;
      if (i2 === "sync")
        try {
          e2(n2);
        } catch (s2) {
          console.warn("[paywall] onBootstrapChange initial sync threw", s2);
        }
      else
        queueMicrotask(() => {
          this.bootstrapListeners.has(e2) && e2(n2);
        });
    }
    return () => {
      this.bootstrapListeners.delete(e2);
    };
  }
  /** Shortcut over `bootstrap()` — returns the paywall prices (locale overrides
   *  already applied in offscreen). Same caching semantics as `bootstrap()`. */
  async getPrices(e2 = {}) {
    return (await this.bootstrap(e2)).prices;
  }
  /** Sync snapshot of prices from the local bootstrap mirror. null = not loaded yet. */
  getCachedPrices() {
    return this.cachedBootstrap?.prices ?? null;
  }
  /** Sync snapshot of offers. null = bootstrap not loaded, [] = paywall has no
   *  offers. Server-side targeting (countries/email/mode) is already applied by
   *  the backend — only what's applicable to the current user is exposed. */
  getCachedOffers() {
    return this.cachedBootstrap?.offers ?? null;
  }
  // === Visitor ===
  async getVisitorId() {
    return this.transport.request("billing.getVisitorId", void 0);
  }
  // === User ===
  async getUser(e2 = {}) {
    const t2 = await this.transport.request(
      "billing.getUser",
      { force: e2.force },
      { signal: e2.signal }
    );
    return this.applyUser(t2), t2;
  }
  getCachedUser() {
    return this.cachedUser;
  }
  /** Settled user for subscription-gate decisions — proxied to the offscreen
   *  BillingClient, where auth hydration / identity sync / persisted caches
   *  actually live (see BillingClient.getSettledUser). The mirror is updated so
   *  a subsequent getCachedUser() stays consistent with the gate's answer. */
  async getSettledUser(e2 = {}) {
    try {
      const t2 = await this.transport.request("billing.getSettledUser", void 0, {
        signal: e2.signal
      });
      return t2 && this.applyUser(t2), t2;
    } catch {
      return this.cachedUser;
    }
  }
  /** Subscribe to user state. We mirror the offscreen broadcasts; the initial
   *  snapshot is delivered via microtask from the local cache (if present) —
   *  exactly like in BillingClient.onUserChange. Returns an unsubscribe function. */
  onUserChange(e2, t2 = {}) {
    this.userListeners.add(e2);
    const i2 = t2.immediate ?? "microtask";
    if (this.cachedUser && i2 !== "none") {
      const n2 = this.cachedUser;
      if (i2 === "sync")
        try {
          e2(n2);
        } catch (s2) {
          console.warn("[paywall] onUserChange initial sync threw", s2);
        }
      else
        queueMicrotask(() => {
          this.userListeners.has(e2) && e2(n2);
        });
    }
    return () => {
      this.userListeners.delete(e2);
    };
  }
  // === Balances ===
  async getBalances(e2 = {}) {
    const i2 = [...await this.transport.request(
      "billing.getBalances",
      { force: e2.force },
      { signal: e2.signal }
    )];
    return this.applyBalances(i2), i2;
  }
  getCachedBalances() {
    return this.cachedBalances;
  }
  onBalanceChange(e2, t2 = {}) {
    this.balanceListeners.add(e2);
    const i2 = t2.immediate ?? "microtask";
    if (this.cachedBalances && i2 !== "none") {
      const n2 = this.cachedBalances;
      if (i2 === "sync")
        try {
          e2(n2);
        } catch (s2) {
          console.warn("[paywall] onBalanceChange initial sync threw", s2);
        }
      else
        queueMicrotask(() => {
          this.balanceListeners.has(e2) && e2(n2);
        });
    }
    return () => {
      this.balanceListeners.delete(e2);
    };
  }
  // === Checkout ===
  async createCheckout(e2) {
    const { signal: t2, ...i2 } = e2;
    return this.transport.request("billing.createCheckout", i2, { signal: t2 });
  }
  // === Customer portal: list/cancel purchases ===
  /** Rich-shape list of the user's purchases (with price, currency, interval,
   *  discount, cancel metadata). Through offscreen — there the real BillingClient
   *  hits `/api/v1/paywall/[id]/user` with a Bearer token. Useful for the
   *  customer-portal UI: cards + Cancel/Renew buttons. */
  async listPurchases(e2 = {}) {
    return [...await this.transport.request("billing.listPurchases", void 0, {
      signal: e2.signal
    })];
  }
  /** Support ticket through the offscreen BillingClient. File objects do NOT
   *  survive chrome.runtime ports (messages are JSON-serialized, a File
   *  degrades to `{}` — crbug.com/248548), so attachments are shipped as
   *  base64: each file is staged in offscreen with its own request, then the
   *  ticket references the staged ids. Bearer token / email substitution is
   *  done by offscreen, as in the regular BillingClient. */
  async createSupportTicket(e2) {
    const t2 = e2.files ?? [];
    if (t2.length > ie)
      throw new o$3("too_many_files", `Up to ${ie} files`, {
        status: 400
      });
    for (const n2 of t2)
      if (!(n2 instanceof File) || n2.size > ae$1)
        throw new o$3(
          "invalid_file",
          `Each attachment must be a File ≤ ${ae$1} bytes`,
          { status: 400 }
        );
    const i2 = [];
    for (const n2 of t2) {
      const s2 = new Uint8Array(await n2.arrayBuffer()), { fileId: o3 } = await this.transport.request("billing.stageSupportFile", {
        name: n2.name,
        type: n2.type,
        dataBase64: ee$1(s2)
      });
      i2.push(o3);
    }
    return this.transport.request("billing.createSupportTicket", {
      subject: e2.subject,
      content: e2.content,
      email: e2.email,
      fileIds: i2.length > 0 ? i2 : void 0
    });
  }
  /** Cancel a subscription through the backend. By default cancels at the end
   *  of the current period (the user keeps access until the renewal date).
   *  reason is required (validated by the backend) — collected via a reason
   *  selector in the host UI. */
  async cancelSubscription(e2) {
    const { signal: t2, ...i2 } = e2;
    return this.transport.request("billing.cancelSubscription", i2, { signal: t2 });
  }
  /** URL of the Stripe/Paddle/Chargebee customer portal. Proxies to the
   *  offscreen BillingClient, which owns the Bearer session — so this works
   *  from popup/options/content without access to the token. Same contract as
   *  `BillingClient.getCustomerPortalUrl`: a backend 403 (no active
   *  subscription / acquiring without a portal) surfaces as
   *  PaywallError('forbidden') with `status: 403`. */
  async getCustomerPortalUrl(e2 = {}) {
    return this.transport.request(
      "billing.getCustomerPortalUrl",
      { returnUrl: e2.returnUrl },
      { signal: e2.signal }
    );
  }
  // === Storage ===
  /** PaywallUI asks the billing client for storage for TrialStore and other
   *  consumers. Returns a proxy: get/set/remove go through transport to the
   *  offscreen storage = single source of truth for all tabs. */
  getStorage() {
    return this.remoteStorageAdapter;
  }
  /** Factory method for PaywallUI: instead of a local createTrialStore over the
   *  storage proxy, we return a RemoteTrialStore — it sends each operation as
   *  one atomic RPC to offscreen, where navigator.locks serializes the
   *  read-modify-write. PaywallUI duck-types this method and prefers it over the
   *  local factory when present. */
  createTrialStore(e2) {
    return new qr(this.transport, this.paywallId, e2);
  }
  // === Identity ===
  getIdentity() {
    return this.identity;
  }
  async setIdentity(e2) {
    this.identity = e2, await this.transport.request("billing.setIdentity", { identity: e2 });
  }
  /** Load identity from offscreen. Used on the first connection of a
   *  content-script — if another tab has already logged the user in, the current
   *  one immediately picks up the identity without waiting for authChange. */
  async syncIdentity() {
    const e2 = await this.transport.request("billing.getIdentity", void 0);
    return this.identity = e2, e2;
  }
  destroy() {
    this.unsubUserBroadcast?.(), this.unsubBalancesBroadcast?.(), this.unsubUserBroadcast = null, this.unsubBalancesBroadcast = null, this.userListeners.clear(), this.balanceListeners.clear(), this.bootstrapListeners.clear(), this.cachedBootstrap = null, this.cachedUser = null, this.cachedBalances = null, this.identity = null;
  }
  applyBootstrap(e2) {
    this.cachedBootstrap = e2;
    for (const t2 of [...this.bootstrapListeners])
      try {
        t2(e2);
      } catch (i2) {
        console.warn("[paywall] onBootstrapChange listener threw", i2);
      }
  }
  /** Update the user mirror and emit to listeners if it actually changed. Used
   *  both for self-initiated RPCs (bootstrap/getUser) and for broadcasts from
   *  offscreen — so the host's onUserChange handler gets a signal regardless of
   *  who triggered the update. */
  applyUser(e2) {
    Nr(this.cachedUser, e2) || (this.cachedUser = e2, this.fireUserListeners(e2));
  }
  applyBalances(e2) {
    Vr(this.cachedBalances, e2) || (this.cachedBalances = e2, this.fireBalanceListeners(e2));
  }
  fireUserListeners(e2) {
    for (const t2 of [...this.userListeners])
      try {
        t2(e2);
      } catch (i2) {
        console.warn("[paywall] onUserChange listener threw", i2);
      }
  }
  fireBalanceListeners(e2) {
    for (const t2 of [...this.balanceListeners])
      try {
        t2(e2);
      } catch (i2) {
        console.warn("[paywall] onBalanceChange listener threw", i2);
      }
  }
}
function Nr(r2, e2) {
  return r2 === e2 ? true : !r2 || !e2 ? false : r2.has_active_subscription === e2.has_active_subscription && (r2.purchases?.length ?? 0) === (e2.purchases?.length ?? 0);
}
function Vr(r2, e2) {
  if (r2 === e2) return true;
  if (!r2 || !e2 || r2.length !== e2.length) return false;
  for (let t2 = 0; t2 < r2.length; t2++)
    if (r2[t2].type !== e2[t2].type || r2[t2].count !== e2[t2].count) return false;
  return true;
}
class $r {
  constructor(e2, t2) {
    this.transport = e2, this.session = null, this.listeners = /* @__PURE__ */ new Set(), this.unsubBroadcast = null, this.paywallId = t2.paywallId, this.apiOrigin = t2.apiOrigin, this.unsubBroadcast = this.transport.on("authChange", ({ event: i2, session: n2 }) => {
      this.applySession(i2, n2);
    }), this.hydrated = this.transport.request("auth.getCachedSession", void 0).then((i2) => {
      this.session === null && i2 !== null && (this.session = i2);
    }).catch(() => {
    });
  }
  /** A promise that resolves after the initial session sync from offscreen.
   *  The analog of AuthClient.ready(). */
  ready() {
    return this.hydrated;
  }
  getCachedSession() {
    return this.session;
  }
  getCachedUser() {
    return this.session?.user ?? null;
  }
  onAuthChange(e2) {
    return this.listeners.add(e2), this.hydrated.then(() => {
      if (this.listeners.has(e2))
        try {
          e2("INITIAL_SESSION", this.session);
        } catch (t2) {
          console.warn("[paywall] onAuthChange INITIAL_SESSION threw", t2);
        }
    }), () => {
      this.listeners.delete(e2);
    };
  }
  // === Email/password ===
  async signInWithEmail(e2) {
    const t2 = await this.transport.request("auth.signInWithEmail", e2);
    return this.applySession("SIGNED_IN", t2), t2;
  }
  async signUp(e2) {
    const t2 = await this.transport.request("auth.signUp", e2);
    return t2.kind === "signed_in" && this.applySession("SIGNED_IN", t2.session), t2;
  }
  async signOut() {
    await this.transport.request("auth.signOut", void 0);
  }
  async refresh() {
    const e2 = await this.transport.request("auth.refresh", void 0);
    return this.applySession(e2 ? "TOKEN_REFRESHED" : "SIGNED_OUT", e2), e2;
  }
  // === OTP / password reset / confirmation ===
  async sendOtp(e2) {
    await this.transport.request("auth.sendOtp", e2);
  }
  async verifyOtp(e2) {
    const t2 = await this.transport.request("auth.verifyOtp", e2);
    return this.applySession(e2.type === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", t2), t2;
  }
  async resendConfirmation(e2) {
    await this.transport.request("auth.resendConfirmation", e2);
  }
  async requestPasswordReset(e2) {
    await this.transport.request("auth.requestPasswordReset", e2);
  }
  async updatePassword(e2) {
    await this.transport.request("auth.updatePassword", e2);
  }
  async revokeAllSessions() {
    await this.transport.request("auth.revokeAllSessions", void 0);
  }
  /** Last-used auth method + email — read from offscreen storage. AuthPanel uses
   *  it for the "Last used" badge and email pre-fill. Storage is paywall-scoped,
   *  and offscreen is the single source of truth for all tabs/popups. */
  async getLastLogin() {
    return this.transport.request("auth.getLastLogin", void 0);
  }
  // === Anonymous sign-in ===
  /** Anonymous sign-in (a Supabase user without an email). The logic (an
   *  idempotent check + resume via a stored refresh_token + fresh signin) lives
   *  in the offscreen AuthClient — content only proxies. captchaToken and
   *  forceNewAnon are pass-through for forward-compat / the switch-account flow. */
  async signInAnonymously(e2 = {}) {
    const t2 = await this.transport.request("auth.signInAnonymously", {
      captchaToken: e2.captchaToken,
      userMeta: e2.userMeta,
      forceNewAnon: e2.forceNewAnon
    });
    return this.applySession("SIGNED_IN", t2), t2;
  }
  /** The current access token (lazily refreshable in offscreen). content/popup
   *  uses it for the Bearer in external fetches — the ApiGatewayClient in the
   *  content-script, direct requests from the demo UI. null if signed out or the
   *  offscreen AuthClient couldn't refresh. */
  async getAccessToken() {
    return this.transport.request("auth.getAccessToken", void 0);
  }
  // === OAuth (web-flow via split-API) ===
  /** OAuth via the web variant: window.open in the content-script, a provider
   *  redirect, and the callback page posts the code back to the opener. Under
   *  the hood it's a split into two requests to offscreen — startOAuthFlow (hit
   *  /init, get authorize_url) → open the popup → waitForOAuthCode → exchange.
   *
   *  The PKCE verifier lives ONLY in offscreen (inside the AuthClient) and never
   *  crosses the runtime boundary. Content gets only authorize_url and state.
   *
   *  Popup gesture: `window.open(authorize_url, ...)` runs in the same synchronous
   *  flow as the startOAuthFlow response; the user-gesture is preserved because
   *  the content-script isn't unloaded within that tick (the gesture survives
   *  through all microtasks of a single call stack). If in some browser the
   *  gesture is lost anyway — the host gets `popup_blocked` (the same as in @monetize.software/sdk).
   */
  async signInWithOAuth(e2) {
    if (typeof window > "u")
      throw new o$3("oauth_unavailable", "window is required for OAuth");
    const t2 = `pw-oauth-pending-${Math.random().toString(36).slice(2, 10)}`, i2 = window.open("about:blank", t2, "width=480,height=640,popup=yes");
    if (!i2)
      throw new o$3(
        "popup_blocked",
        "browser blocked auth popup — call from a user gesture"
      );
    Wr(i2, e2.provider);
    try {
      const { authorizeUrl: n2, state: s2 } = await this.transport.request("auth.oauthStart", {
        provider: e2.provider,
        scopes: e2.scopes,
        userMeta: e2.userMeta,
        switchAccount: e2.switchAccount
      });
      i2.name = `pw-oauth-${s2}`, i2.location.replace(n2), e2.onPopupOpened?.();
      const o3 = await Tt$3(i2, s2);
      try {
        i2.close();
      } catch {
      }
      if (o3.kind === "cancelled")
        throw new o$3("oauth_cancelled", "auth popup was closed");
      if (o3.kind === "timeout")
        throw new o$3("oauth_timeout", "OAuth flow timed out");
      if (o3.kind === "error")
        throw new o$3(
          Ut$3(o3) ? "oauth_identity_already_linked" : "oauth_failed",
          o3.description || o3.error || "OAuth provider returned error"
        );
      const c2 = await this.transport.request("auth.oauthExchange", {
        state: s2,
        code: o3.code
      });
      return this.applySession("SIGNED_IN", c2), c2;
    } catch (n2) {
      try {
        i2.close();
      } catch {
      }
      throw n2;
    }
  }
  destroy() {
    this.unsubBroadcast?.(), this.unsubBroadcast = null, this.listeners.clear(), this.session = null;
  }
  applySession(e2, t2) {
    if (!Hr(this.session, t2)) {
      this.session = t2;
      for (const i2 of [...this.listeners])
        try {
          i2(e2, t2);
        } catch (n2) {
          console.warn("[paywall] onAuthChange listener threw", n2);
        }
    }
  }
}
function Hr(r2, e2) {
  return r2 === e2 ? true : !r2 || !e2 ? false : r2.access_token === e2.access_token && r2.refresh_token === e2.refresh_token && r2.expires_at === e2.expires_at && r2.user.id === e2.user.id;
}
const Gr = {
  google: "Google",
  apple: "Apple",
  github: "GitHub",
  facebook: "Facebook"
};
function Wr(r2, e2) {
  const t2 = Gr[e2] ?? e2;
  try {
    const i2 = r2.document;
    i2.title = `Sign in with ${t2}`;
    const n2 = i2.createElement("style");
    n2.textContent = "html,body{margin:0;padding:0;height:100%;font-family:-apple-system,system-ui,sans-serif;background:#fafafa;color:#475569}.pw-oauth-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px}.pw-oauth-spinner{width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#7c3aed;border-radius:50%;animation:pw-oauth-spin 800ms linear infinite}.pw-oauth-label{font-size:14px;font-weight:500;letter-spacing:-0.01em}@keyframes pw-oauth-spin{to{transform:rotate(360deg)}}", i2.head.appendChild(n2);
    const s2 = i2.createElement("div");
    s2.className = "pw-oauth-wrap";
    const o3 = i2.createElement("div");
    o3.className = "pw-oauth-spinner";
    const c2 = i2.createElement("div");
    c2.className = "pw-oauth-label", c2.textContent = `Connecting to ${t2}…`, s2.appendChild(o3), s2.appendChild(c2), i2.body.appendChild(s2);
  } catch {
  }
}
class Zr {
  constructor(e2) {
    this.transport = e2;
  }
  /** Send an event. Fire-and-forget — returns no Promise and doesn't throw.
   *  Network/transport errors are logged to the console and don't block the caller. */
  track(e2, t2) {
    typeof e2 != "string" || e2.length === 0 || this.transport.request("tracker.track", { name: e2, props: t2 }).catch((i2) => {
      console.warn("[paywall] track failed", i2);
    });
  }
}
class Yr {
  constructor(e2) {
    this.factory = e2, this.channel = null, this.channelDisposers = [], this.pending = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Map(), this.destroyed = false, this.nextId = 0, this.clientId = `c-${Math.random().toString(36).slice(2, 10)}`;
  }
  /** Ensures a live channel exists. Lazy — brought up on the first request.
   *  Right after connect it fire-and-forget sends a handshake — on mismatch
   *  we log a warning but do not block further requests. */
  ensureChannel() {
    if (this.destroyed) throw new Error("TransportClient destroyed");
    if (this.channel) return this.channel;
    const e2 = this.factory();
    this.channel = e2;
    const t2 = e2.onMessage((n2) => this.handleMessage(n2)), i2 = e2.onDisconnect(() => this.handleDisconnect());
    return this.channelDisposers = [t2, i2], this.request("handshake", {
      protocolVersion: re,
      clientId: this.clientId
    }).then((n2) => {
      n2.protocolVersion !== re && console.warn(
        `[sdk-extension] protocol version mismatch: client=${re}, offscreen=${n2.protocolVersion}. Update host's @monetize.software/sdk-extension.`
      );
    }).catch(() => {
    }), e2;
  }
  handleMessage(e2) {
    if (Xr(e2)) {
      if (e2.type === "response") {
        const t2 = this.pending.get(e2.id);
        if (!t2) return;
        this.pending.delete(e2.id), t2.signal?.removeEventListener("abort", t2.abortListener), e2.ok ? t2.resolve(e2.result) : t2.reject(oe$2(e2.error));
        return;
      }
      if (e2.type === "event") {
        const t2 = this.listeners.get(e2.kind);
        if (!t2) return;
        for (const i2 of [...t2])
          try {
            i2(e2.payload);
          } catch (n2) {
            console.error("[sdk-extension] event handler threw", n2);
          }
      }
    }
  }
  handleDisconnect() {
    for (const t2 of this.channelDisposers) t2();
    this.channelDisposers = [], this.channel = null;
    const e2 = Array.from(this.pending.values());
    this.pending.clear();
    for (const t2 of e2)
      t2.signal?.removeEventListener("abort", t2.abortListener), t2.reject(new Kr());
  }
  request(e2, t2, i2 = {}) {
    if (this.destroyed)
      return Promise.reject(new Error("TransportClient destroyed"));
    if (i2.signal?.aborted)
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    const n2 = this.ensureChannel(), s2 = `r${++this.nextId}`;
    return new Promise((o3, c2) => {
      const l2 = {
        resolve: o3,
        reject: c2,
        signal: i2.signal
      };
      i2.signal && (l2.abortListener = () => {
        if (this.pending.delete(s2)) {
          c2(new DOMException("Aborted", "AbortError"));
          try {
            n2.send({ type: "cancel", id: s2 });
          } catch {
          }
        }
      }, i2.signal.addEventListener("abort", l2.abortListener)), this.pending.set(s2, l2);
      const h2 = {
        type: "request",
        id: s2,
        kind: e2,
        params: t2
      };
      try {
        n2.send(h2);
      } catch (u2) {
        this.pending.delete(s2), i2.signal?.removeEventListener("abort", l2.abortListener), c2(u2);
      }
    });
  }
  on(e2, t2) {
    let i2 = this.listeners.get(e2);
    i2 || (i2 = /* @__PURE__ */ new Set(), this.listeners.set(e2, i2));
    const n2 = t2;
    return i2.add(n2), this.ensureChannel(), () => {
      i2.delete(n2);
    };
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const t2 of this.channelDisposers) t2();
    this.channelDisposers = [], this.listeners.clear();
    const e2 = Array.from(this.pending.values());
    this.pending.clear();
    for (const t2 of e2)
      t2.signal?.removeEventListener("abort", t2.abortListener), t2.reject(new Error("TransportClient destroyed"));
    this.channel?.close(), this.channel = null;
  }
}
class Kr extends Error {
  constructor() {
    super("Transport channel disconnected mid-request"), this.code = "transport_disconnected", this.name = "TransportDisconnectedError";
  }
}
function Xr(r2) {
  if (typeof r2 != "object" || r2 === null) return false;
  const e2 = r2.type;
  return e2 === "request" || e2 === "response" || e2 === "event";
}
let Q = null;
function Jr() {
  return Q || (Q = new Yr(() => ce$2(e$2)), Q);
}
class ai extends Br {
  constructor(e2) {
    const t2 = Jr(), i2 = new Fr(t2, {
      paywallId: e2.paywallId,
      apiOrigin: e2.apiOrigin
    });
    let n2;
    e2.auth === true ? n2 = new $r(t2, {
      paywallId: e2.paywallId,
      apiOrigin: e2.apiOrigin
    }) : e2.auth && console.warn(
      "[sdk-extension] passing AuthClient instance to PaywallUI.opts.auth is not supported in extension mode — pass `auth: true` to use offscreen-shared auth, or omit for hybrid identity-only mode."
    ), n2 && (i2.auth = n2), super({
      ...e2,
      // The casts are safe: PaywallUI's resolveAuth duck-types auth (see
      // sdk/src/ui/PaywallUI.ts isAuthClientLike), and the billing param goes
      // through `opts.client ?? new BillingClient(...)` — RemoteBillingClient is
      // used there as-is, all the methods line up.
      client: i2,
      auth: n2,
      // Disable the internal EventTracker — the only tracker lives in offscreen.
      // We subscribe manually below.
      analytics: false
    }), this.remoteTracker = null, this.trackerUnsubs = [], e2.analytics !== false && (this.remoteTracker = new Zr(t2), this.bindAnalytics());
  }
  /** A mirror of sdk/PaywallUI.initTracker's bindings, but with RemoteEventTracker.
   *  Once @monetize.software/sdk exposes a public hook for injecting a tracker,
   *  this method will be replaced with a single line. */
  bindAnalytics() {
    const e2 = this.remoteTracker;
    e2 && this.trackerUnsubs.push(
      // paywall_viewed/paywall_closed only for the real paywall ('layout') —
      // same gate as the base initTracker: 'ready'/'close' fire for
      // support/auth/awaiting_payment mounts too, but that's not a paywall view.
      this.on("ready", (t2) => {
        this.lastMountedView === "layout" && (this.viewedTracked = true, e2.track("paywall_viewed", {
          is_test_mode: t2.settings.is_test_mode,
          prices_count: t2.prices.length,
          offers_count: t2.offers.length
        }));
      }),
      this.on(
        "price_selected",
        (t2) => e2.track("price_selected", { price_id: t2.priceId })
      ),
      this.on(
        "checkout_started",
        (t2) => e2.track("checkout_started", { price_id: t2.priceId, acquiring: t2.acquiring })
      ),
      this.on("purchase_completed", (t2) => {
        t2.restored || e2.track("purchase_completed", { price_id: t2.priceId, session_id: t2.sessionId });
      }),
      this.on("purchase_failed", (t2) => e2.track("purchase_failed", { reason: t2.reason })),
      this.on("close", () => {
        this.viewedTracked && e2.track("paywall_closed"), this.viewedTracked = false;
      }),
      this.on(
        "trial_blocked",
        (t2) => e2.track("trial_blocked", {
          mode: t2.mode,
          ...t2.mode === "time" ? { remaining_ms: t2.remainingMs, total_ms: t2.totalMs } : t2.mode === "opens" ? { remaining_actions: t2.remainingActions, total_actions: t2.totalActions } : {}
        })
      ),
      this.on("trial_expired", () => e2.track("trial_expired")),
      this.on(
        "visibility_blocked",
        (t2) => e2.track("visibility_blocked", { reason: t2.reason, country: t2.country, tier: t2.tier })
      ),
      this.on("error", (t2) => e2.track("error", { code: t2.code, message: t2.message }))
    );
  }
  /** A proxy through RemoteEventTracker. Hosts can call paywall.track for
   *  arbitrary analytics events — it flies to the single offscreen tracker
   *  alongside PaywallUI's auto-emits. */
  track(e2, t2) {
    this.remoteTracker?.track(e2, t2);
  }
  destroy() {
    for (const e2 of this.trackerUnsubs) e2();
    this.trackerUnsubs = [], this.remoteTracker = null, super.destroy();
  }
}
const EV_PREFIX = "__probe_ev_";
const HB_PREFIX = "__probe_hb_";
const VARIANT_KEY = "__probe_variant";
const CFG_ID = "__demo_paywall_id";
const CFG_ORIGIN = "__demo_api_origin";
const runId = Date.now();
let seq = 0;
function mark(ev, data) {
  const key = `${EV_PREFIX}${runId}_${String(seq++).padStart(4, "0")}`;
  const crumb = { t: Date.now() - runId, ev, ...data };
  try {
    void chrome.storage.local.set({ [key]: crumb });
  } catch {
  }
}
function activation() {
  const ua = navigator.userActivation;
  return ua ? ua.isActive : void 0;
}
function readAllStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => resolve(items));
  });
}
function shortUrl(u2) {
  const s2 = typeof u2 === "string" ? u2 : String(u2 ?? "");
  if (!s2) return "(empty)";
  if (!/^https?:/i.test(s2)) return s2.slice(0, 48);
  try {
    const parsed = new URL(s2);
    return `${parsed.origin}${parsed.pathname.slice(0, 32)}`;
  } catch {
    return s2.slice(0, 48);
  }
}
const nativeOpen = window.open.bind(window);
window.open = function patchedOpen(url, target, features) {
  mark("window.open CALLED", {
    url: shortUrl(url),
    target: target ?? "(none)",
    features: features ?? "(none)",
    activation: activation()
  });
  let handle = null;
  try {
    handle = nativeOpen(url, target, features);
  } catch (e2) {
    mark("window.open THREW", { message: e2?.message });
    throw e2;
  }
  mark("window.open RETURNED", { handle: handle ? "Window" : "null (blocked)" });
  return handle;
};
async function init() {
  const app = document.getElementById("app");
  const cfg = await chrome.storage.local.get([VARIANT_KEY, CFG_ID, CFG_ORIGIN]);
  const stored = cfg[VARIANT_KEY];
  const variant = stored === "ext" || stored === "plain-sync" || stored === "plain-tab" ? stored : "plain";
  const paywallId = cfg[CFG_ID] ?? "3";
  const apiOrigin = cfg[CFG_ORIGIN] ?? "https://onlineapp.stream";
  const surface = window.__PROBE_SURFACE ?? "action-popup";
  mark(`OPENED — surface=${surface} variant=${variant}`, { paywallId, apiOrigin });
  const uaData = navigator.userAgentData;
  mark("environment", {
    platform: uaData?.platform ?? navigator.platform ?? "?",
    ua: navigator.userAgent.slice(0, 110),
    screen: `${screen.width}x${screen.height}`
  });
  const beat = () => {
    try {
      void chrome.storage.local.set({ [`${HB_PREFIX}${runId}`]: Date.now() - runId });
    } catch {
    }
  };
  beat();
  setInterval(beat, 250);
  document.addEventListener("visibilitychange", () => {
    mark(`document ${document.visibilityState}`);
    beat();
  });
  window.addEventListener("pagehide", () => mark("pagehide (popup closing)"));
  window.addEventListener("message", (e2) => {
    const d2 = e2.data;
    if (d2 && d2.type === "pw-oauth") {
      mark("pw-oauth MESSAGE received", { status: d2.status, hasCode: !!d2.code });
    }
  });
  window.addEventListener("unhandledrejection", (e2) => {
    mark("unhandledrejection", { reason: String(e2.reason).slice(0, 120) });
  });
  const plainAuthOption = variant === "plain-tab" ? {
    // No feature string → a tab, not a separate OS window. Everything else
    // about the flow (window.name, postMessage back to the opener,
    // self-close) is identical.
    openPopup: (url, name) => window.open(url, name)
  } : true;
  const paywall = variant === "ext" ? new ai({ paywallId, apiOrigin, auth: true, shadowMode: "open" }) : new Or$1({
    paywallId,
    apiOrigin,
    auth: plainAuthOption,
    shadowMode: "open"
  });
  paywall.on?.("error", (e2) => mark("paywall error event", { message: e2?.message }));
  const session = await Promise.resolve(paywall.auth?.getCachedSession?.() ?? null);
  async function signInDirect() {
    mark("CLICK sign-in (direct signInWithOAuth)", { activation: activation() });
    try {
      const s2 = await paywall.auth.signInWithOAuth({
        provider: "google",
        onPopupOpened: () => mark("onPopupOpened callback")
      });
      mark("signInWithOAuth RESOLVED ✅", { email: s2?.user?.email ?? "(none)" });
    } catch (e2) {
      const err = e2;
      mark("signInWithOAuth REJECTED ❌", {
        code: err?.code ?? "(none)",
        message: (err?.message ?? String(e2)).slice(0, 120)
      });
    }
    render();
  }
  function waitForCode(win, state) {
    return new Promise((resolve) => {
      let settled = false;
      const cleanup = () => {
        window.removeEventListener("message", onMsg);
        clearInterval(closedTimer);
        clearTimeout(timeoutTimer);
      };
      const done = (v2) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(v2);
      };
      const onMsg = (e2) => {
        const d2 = e2.data;
        if (!d2 || d2.type !== "pw-oauth" || d2.messageId !== state) return;
        done(d2.status === "success" && d2.code ? d2.code : null);
      };
      const closedTimer = setInterval(() => {
        try {
          if (win.closed) done(null);
        } catch {
        }
      }, 500);
      const timeoutTimer = setTimeout(() => done(null), 5 * 6e4);
      window.addEventListener("message", onMsg);
    });
  }
  async function signInPlainSync() {
    mark("CLICK sign-in (plain sdk + sync-open fix)", { activation: activation() });
    const tempName = `pw-oauth-pending-${Math.random().toString(36).slice(2, 10)}`;
    const win = window.open("about:blank", tempName, "width=480,height=640,popup=yes");
    if (!win) {
      mark("sync-open FAILED ❌ — window.open returned null");
      void render();
      return;
    }
    try {
      const { authorize_url, state } = await paywall.auth.startOAuthFlow({ provider: "google" });
      mark("startOAuthFlow resolved", { state: state.slice(0, 8) + "…" });
      win.name = `pw-oauth-${state}`;
      win.location.replace(authorize_url);
      mark("navigated the pre-opened window");
      const code = await waitForCode(win, state);
      if (!code) {
        mark("no code — cancelled, closed, or timed out ❌");
        void render();
        return;
      }
      try {
        win.close();
      } catch {
      }
      const s2 = await paywall.auth.completeOAuthFlow({ state, code });
      mark("completeOAuthFlow RESOLVED ✅", { email: s2?.user?.email ?? "(none)" });
    } catch (e2) {
      const err = e2;
      mark("plain-sync REJECTED ❌", {
        code: err?.code ?? "(none)",
        message: (err?.message ?? String(e2)).slice(0, 120)
      });
    }
    void render();
  }
  function signInViaUI() {
    mark("CLICK openAuth() — modal UI path", { activation: activation() });
    paywall.openAuth();
  }
  async function setVariant(v2) {
    await chrome.storage.local.set({ [VARIANT_KEY]: v2 });
    location.reload();
  }
  async function clearLog() {
    const all = await readAllStorage();
    const keys = Object.keys(all).filter(
      (k2) => k2.startsWith(EV_PREFIX) || k2.startsWith(HB_PREFIX)
    );
    if (keys.length) await chrome.storage.local.remove(keys);
    location.reload();
  }
  async function readRuns() {
    const all = await readAllStorage();
    const byRun = /* @__PURE__ */ new Map();
    const beats = /* @__PURE__ */ new Map();
    for (const [k2, v2] of Object.entries(all)) {
      if (k2.startsWith(EV_PREFIX)) {
        const id = Number(k2.slice(EV_PREFIX.length).split("_")[0]);
        if (!Number.isFinite(id)) continue;
        const list = byRun.get(id) ?? [];
        list.push(v2);
        byRun.set(id, list);
      } else if (k2.startsWith(HB_PREFIX)) {
        const id = Number(k2.slice(HB_PREFIX.length));
        if (Number.isFinite(id)) beats.set(id, v2);
      }
    }
    return [...byRun.entries()].map(([id, crumbs]) => ({
      id,
      crumbs: crumbs.sort((a2, b) => a2.t - b.t),
      lastBeat: beats.get(id) ?? null
    })).sort((a2, b) => b.id - a2.id).slice(0, 4);
  }
  function verdictFor(run) {
    const has = (needle) => run.crumbs.some((c2) => c2.ev.includes(needle));
    const opened = run.crumbs.find((c2) => c2.ev === "window.open CALLED");
    const clicked = run.crumbs.find((c2) => c2.ev.startsWith("CLICK"));
    const gap = opened && clicked ? `${Math.round(opened.t - clicked.t)}ms after the click` : "n/a";
    const act = opened && "activation" in opened ? `activation at open: ${String(opened.activation)}` : "activation: unknown";
    if (has("RESOLVED")) {
      return { cls: "ok", text: `SIGN-IN COMPLETED ✅ — window.open ${gap}, ${act}` };
    }
    if (has("null (blocked)")) {
      return { cls: "bad", text: `POPUP BLOCKED — window.open returned null, ${gap}, ${act}` };
    }
    if (has("pw-oauth MESSAGE") && !has("RESOLVED")) {
      return { cls: "bad", text: `code came back but exchange did not finish — ${act}` };
    }
    if (has("window.open CALLED") && !has("pw-oauth MESSAGE")) {
      return {
        cls: "bad",
        text: `NO CODE RETURNED — popup last alive at +${run.lastBeat ?? "?"}ms; window.open ${gap}, ${act}`
      };
    }
    if (!clicked) return { cls: "idle", text: "no sign-in attempted in this run" };
    return { cls: "idle", text: `incomplete — popup last alive at +${run.lastBeat ?? "?"}ms` };
  }
  async function render() {
    const runs = await readRuns();
    app.innerHTML = "";
    const h2 = document.createElement("h1");
    h2.textContent = "OAuth probe — action popup";
    app.appendChild(h2);
    const varCard = document.createElement("div");
    varCard.className = "card";
    varCard.innerHTML = '<div class="muted" style="margin-bottom:6px">SDK package under test — reload happens automatically</div>';
    const varRow = document.createElement("div");
    varRow.className = "row";
    [
      ["plain", "plain sdk (what the client uses)"],
      ["plain-tab", "plain sdk + tab instead of window"],
      ["plain-sync", "plain sdk + sync-open"],
      ["ext", "sdk-extension (our demo)"]
    ].forEach(([v2, label]) => {
      const b = document.createElement("button");
      b.textContent = label;
      if (variant === v2) b.className = "on";
      b.onclick = () => void setVariant(v2);
      varRow.appendChild(b);
    });
    varCard.appendChild(varRow);
    app.appendChild(varCard);
    const actCard = document.createElement("div");
    actCard.className = "card";
    const who = session?.user?.email ? `signed in as ${session.user.email}` : session ? "anonymous session" : "not signed in";
    actCard.innerHTML = `<div class="muted" style="margin-bottom:6px">${who} · paywall ${paywallId} · ${apiOrigin.replace(/^https?:\/\//, "")}</div>`;
    const actRow = document.createElement("div");
    actRow.className = "row";
    const b1 = document.createElement("button");
    b1.className = "primary";
    b1.textContent = "Sign in with Google (direct)";
    b1.onclick = () => void (variant === "plain-sync" ? signInPlainSync() : signInDirect());
    const b2 = document.createElement("button");
    b2.textContent = "via openAuth() UI";
    b2.onclick = signInViaUI;
    const b3 = document.createElement("button");
    b3.textContent = "Clear log";
    b3.onclick = () => void clearLog();
    actRow.append(b1, b2, b3);
    if (surface !== "side-panel") {
      const b4 = document.createElement("button");
      b4.textContent = "Open in side panel ▸";
      b4.onclick = () => {
        const sp = chrome.sidePanel;
        if (!sp) {
          mark("side panel API unavailable (needs Chrome 114+)");
          return;
        }
        void chrome.windows.getCurrent().then((w2) => {
          if (w2.id != null) void sp.open({ windowId: w2.id });
        });
      };
      actRow.appendChild(b4);
    }
    actCard.appendChild(actRow);
    app.appendChild(actCard);
    const cfgCard = document.createElement("div");
    cfgCard.className = "card";
    cfgCard.innerHTML = '<div class="muted" style="margin-bottom:6px">Target paywall — point this at your own to test your OAuth setup</div>';
    const cfgRow = document.createElement("div");
    cfgRow.className = "row";
    const idInput = document.createElement("input");
    idInput.value = paywallId;
    idInput.placeholder = "id";
    idInput.style.width = "56px";
    const originInput = document.createElement("input");
    originInput.value = apiOrigin;
    originInput.placeholder = "https://your-custom-domain";
    originInput.style.flex = "1";
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save & reload";
    saveBtn.onclick = () => {
      void chrome.storage.local.set({
        [CFG_ID]: idInput.value.trim() || "3",
        [CFG_ORIGIN]: originInput.value.trim().replace(/\/+$/, "")
      }).then(() => location.reload());
    };
    cfgRow.append(idInput, originInput, saveBtn);
    cfgCard.appendChild(cfgRow);
    app.appendChild(cfgCard);
    const h22 = document.createElement("h2");
    h22.textContent = "Recorded runs (newest first)";
    app.appendChild(h22);
    if (!runs.length) {
      const p2 = document.createElement("div");
      p2.className = "muted";
      p2.textContent = "Nothing recorded yet. Click sign-in, finish Google, then reopen this popup.";
      app.appendChild(p2);
      return;
    }
    for (const run of runs) {
      const card = document.createElement("div");
      card.className = "card";
      const v2 = verdictFor(run);
      const badge = document.createElement("div");
      badge.className = `verdict ${v2.cls}`;
      const isCurrent = run.id === runId;
      badge.textContent = `${new Date(run.id).toLocaleTimeString()}${isCurrent ? " (current)" : ""} — ${v2.text}`;
      card.appendChild(badge);
      const pre = document.createElement("div");
      pre.className = "log";
      pre.textContent = run.crumbs.map((c2) => {
        const extras = Object.entries(c2).filter(([k2]) => k2 !== "t" && k2 !== "ev").map(([k2, val]) => `${k2}=${String(val)}`).join(" ");
        return `+${String(c2.t).padStart(6)}ms  ${c2.ev}${extras ? "  " + extras : ""}`;
      }).join("\n");
      card.appendChild(pre);
      app.appendChild(card);
    }
  }
  await render();
}
void init();
//# sourceMappingURL=popup.js.map
