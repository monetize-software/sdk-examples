import { e, s } from "./chunks/port-name-ervLBWAQ-B1dz9CHi.js";
let r = null;
async function l(e2) {
  return r || (r = m(e2).finally(() => {
    r = null;
  }), r);
}
async function m(e2) {
  if (!await h(e2.url))
    try {
      await chrome.offscreen.createDocument({
        url: e2.url,
        reasons: e2.reasons,
        justification: e2.justification
      });
    } catch (s2) {
      if (s2 instanceof Error && /single offscreen document/i.test(s2.message)) return;
      throw s2;
    }
}
async function h(e2) {
  return typeof chrome.runtime.getContexts == "function" ? (await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [e2]
  })).length > 0 : false;
}
const y = [chrome.offscreen.Reason.LOCAL_STORAGE], g = "Persist auth session and bootstrap cache across all extension surfaces via localStorage, which is unavailable in service workers.";
function w(e$1) {
  const s2 = e$1.offscreenReasons ?? y, o = e$1.offscreenJustification ?? g;
  chrome.runtime.onConnect.addListener((c) => {
    c.name === e && E(c, e$1.offscreenUrl, s2, o);
  });
}
async function E(e2, s$1, o, c) {
  const i = [], a = (n) => {
    i.push(n);
  };
  e2.onMessage.addListener(a);
  let f = false;
  e2.onDisconnect.addListener(() => {
    f = true;
  });
  try {
    const n = typeof s$1 == "function" ? await s$1() : s$1;
    await l({ url: n, reasons: o, justification: c });
  } catch (n) {
    console.error("[sdk-extension/sw] ensureOffscreen failed", n), e2.disconnect();
    return;
  }
  if (f) return;
  let t;
  try {
    t = chrome.runtime.connect({ name: s });
  } catch (n) {
    console.error("[sdk-extension/sw] connect to offscreen failed", n), e2.disconnect();
    return;
  }
  e2.onMessage.removeListener(a), e2.onMessage.addListener((n) => {
    try {
      t.postMessage(n);
    } catch {
    }
  }), t.onMessage.addListener((n) => {
    try {
      e2.postMessage(n);
    } catch {
    }
  }), e2.onDisconnect.addListener(() => {
    try {
      t.disconnect();
    } catch {
    }
  }), t.onDisconnect.addListener(() => {
    try {
      e2.disconnect();
    } catch {
    }
  });
  for (const n of i)
    try {
      t.postMessage(n);
    } catch {
      break;
    }
}
function x(e2) {
  if (typeof chrome > "u" || !chrome.runtime)
    throw new Error("@monetize.software/sdk-extension/sw requires chrome.runtime");
  w(e2);
}
x({
  offscreenUrl: async () => {
    const cfg = await chrome.storage.local.get([
      "__demo_paywall_id",
      "__demo_api_origin"
    ]);
    const params = new URLSearchParams({
      paywallId: cfg.__demo_paywall_id ?? "3",
      apiOrigin: cfg.__demo_api_origin ?? "https://onlineapp.stream"
    });
    return `${chrome.runtime.getURL("offscreen.html")}?${params.toString()}`;
  },
  offscreenReasons: [chrome.offscreen.Reason.LOCAL_STORAGE],
  offscreenJustification: "Persist auth session and bootstrap cache across extension surfaces via localStorage, unavailable in service workers."
});
//# sourceMappingURL=sw.js.map
