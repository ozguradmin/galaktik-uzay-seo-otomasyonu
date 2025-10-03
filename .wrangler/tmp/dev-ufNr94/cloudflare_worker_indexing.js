(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // .wrangler/tmp/bundle-73KLtp/checked-fetch.js
  var urls = /* @__PURE__ */ new Set();
  function checkURL(request, init) {
    const url = request instanceof URL ? request : new URL(
      (typeof request === "string" ? new Request(request, init) : request).url
    );
    if (url.port && url.port !== "443" && url.protocol === "https:") {
      if (!urls.has(url.toString())) {
        urls.add(url.toString());
        console.warn(
          `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
        );
      }
    }
  }
  __name(checkURL, "checkURL");
  globalThis.fetch = new Proxy(globalThis.fetch, {
    apply(target, thisArg, argArray) {
      const [request, init] = argArray;
      checkURL(request, init);
      return Reflect.apply(target, thisArg, argArray);
    }
  });

  // ../../Users/ozgur/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
  var __facade_middleware__ = [];
  function __facade_register__(...args) {
    __facade_middleware__.push(...args.flat());
  }
  __name(__facade_register__, "__facade_register__");
  function __facade_registerInternal__(...args) {
    __facade_middleware__.unshift(...args.flat());
  }
  __name(__facade_registerInternal__, "__facade_registerInternal__");
  function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
    const [head, ...tail] = middlewareChain;
    const middlewareCtx = {
      dispatch,
      next(newRequest, newEnv) {
        return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
      }
    };
    return head(request, env, ctx, middlewareCtx);
  }
  __name(__facade_invokeChain__, "__facade_invokeChain__");
  function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
    return __facade_invokeChain__(request, env, ctx, dispatch, [
      ...__facade_middleware__,
      finalMiddleware
    ]);
  }
  __name(__facade_invoke__, "__facade_invoke__");

  // ../../Users/ozgur/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/loader-sw.ts
  var __FACADE_EVENT_TARGET__;
  if (globalThis.MINIFLARE) {
    __FACADE_EVENT_TARGET__ = new (Object.getPrototypeOf(WorkerGlobalScope))();
  } else {
    __FACADE_EVENT_TARGET__ = new EventTarget();
  }
  function __facade_isSpecialEvent__(type) {
    return type === "fetch" || type === "scheduled";
  }
  __name(__facade_isSpecialEvent__, "__facade_isSpecialEvent__");
  var __facade__originalAddEventListener__ = globalThis.addEventListener;
  var __facade__originalRemoveEventListener__ = globalThis.removeEventListener;
  var __facade__originalDispatchEvent__ = globalThis.dispatchEvent;
  globalThis.addEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.addEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalAddEventListener__(type, listener, options);
    }
  };
  globalThis.removeEventListener = function(type, listener, options) {
    if (__facade_isSpecialEvent__(type)) {
      __FACADE_EVENT_TARGET__.removeEventListener(
        type,
        listener,
        options
      );
    } else {
      __facade__originalRemoveEventListener__(type, listener, options);
    }
  };
  globalThis.dispatchEvent = function(event) {
    if (__facade_isSpecialEvent__(event.type)) {
      return __FACADE_EVENT_TARGET__.dispatchEvent(event);
    } else {
      return __facade__originalDispatchEvent__(event);
    }
  };
  globalThis.addMiddleware = __facade_register__;
  globalThis.addMiddlewareInternal = __facade_registerInternal__;
  var __facade_waitUntil__ = Symbol("__facade_waitUntil__");
  var __facade_response__ = Symbol("__facade_response__");
  var __facade_dispatched__ = Symbol("__facade_dispatched__");
  var __Facade_ExtendableEvent__ = class ___Facade_ExtendableEvent__ extends Event {
    static {
      __name(this, "__Facade_ExtendableEvent__");
    }
    [__facade_waitUntil__] = [];
    waitUntil(promise) {
      if (!(this instanceof ___Facade_ExtendableEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this[__facade_waitUntil__].push(promise);
    }
  };
  var __Facade_FetchEvent__ = class ___Facade_FetchEvent__ extends __Facade_ExtendableEvent__ {
    static {
      __name(this, "__Facade_FetchEvent__");
    }
    #request;
    #passThroughOnException;
    [__facade_response__];
    [__facade_dispatched__] = false;
    constructor(type, init) {
      super(type);
      this.#request = init.request;
      this.#passThroughOnException = init.passThroughOnException;
    }
    get request() {
      return this.#request;
    }
    respondWith(response) {
      if (!(this instanceof ___Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      if (this[__facade_response__] !== void 0) {
        throw new DOMException(
          "FetchEvent.respondWith() has already been called; it can only be called once.",
          "InvalidStateError"
        );
      }
      if (this[__facade_dispatched__]) {
        throw new DOMException(
          "Too late to call FetchEvent.respondWith(). It must be called synchronously in the event handler.",
          "InvalidStateError"
        );
      }
      this.stopImmediatePropagation();
      this[__facade_response__] = response;
    }
    passThroughOnException() {
      if (!(this instanceof ___Facade_FetchEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#passThroughOnException();
    }
  };
  var __Facade_ScheduledEvent__ = class ___Facade_ScheduledEvent__ extends __Facade_ExtendableEvent__ {
    static {
      __name(this, "__Facade_ScheduledEvent__");
    }
    #scheduledTime;
    #cron;
    #noRetry;
    constructor(type, init) {
      super(type);
      this.#scheduledTime = init.scheduledTime;
      this.#cron = init.cron;
      this.#noRetry = init.noRetry;
    }
    get scheduledTime() {
      return this.#scheduledTime;
    }
    get cron() {
      return this.#cron;
    }
    noRetry() {
      if (!(this instanceof ___Facade_ScheduledEvent__)) {
        throw new TypeError("Illegal invocation");
      }
      this.#noRetry();
    }
  };
  __facade__originalAddEventListener__("fetch", (event) => {
    const ctx = {
      waitUntil: event.waitUntil.bind(event),
      passThroughOnException: event.passThroughOnException.bind(event)
    };
    const __facade_sw_dispatch__ = /* @__PURE__ */ __name(function(type, init) {
      if (type === "scheduled") {
        const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
          scheduledTime: Date.now(),
          cron: init.cron ?? "",
          noRetry() {
          }
        });
        __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
        event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      }
    }, "__facade_sw_dispatch__");
    const __facade_sw_fetch__ = /* @__PURE__ */ __name(function(request, _env, ctx2) {
      const facadeEvent = new __Facade_FetchEvent__("fetch", {
        request,
        passThroughOnException: ctx2.passThroughOnException
      });
      __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
      facadeEvent[__facade_dispatched__] = true;
      event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
      const response = facadeEvent[__facade_response__];
      if (response === void 0) {
        throw new Error("No response!");
      }
      return response;
    }, "__facade_sw_fetch__");
    event.respondWith(
      __facade_invoke__(
        event.request,
        globalThis,
        ctx,
        __facade_sw_dispatch__,
        __facade_sw_fetch__
      )
    );
  });
  __facade__originalAddEventListener__("scheduled", (event) => {
    const facadeEvent = new __Facade_ScheduledEvent__("scheduled", {
      scheduledTime: event.scheduledTime,
      cron: event.cron,
      noRetry: event.noRetry.bind(event)
    });
    __FACADE_EVENT_TARGET__.dispatchEvent(facadeEvent);
    event.waitUntil(Promise.all(facadeEvent[__facade_waitUntil__]));
  });

  // ../../Users/ozgur/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
  var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } finally {
      try {
        if (request.body !== null && !request.bodyUsed) {
          const reader = request.body.getReader();
          while (!(await reader.read()).done) {
          }
        }
      } catch (e) {
        console.error("Failed to drain the unused request body.", e);
      }
    }
  }, "drainBody");
  var middleware_ensure_req_body_drained_default = drainBody;

  // ../../Users/ozgur/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
  function reduceError(e) {
    return {
      name: e?.name,
      message: e?.message ?? String(e),
      stack: e?.stack,
      cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
    };
  }
  __name(reduceError, "reduceError");
  var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
    try {
      return await middlewareCtx.next(request, env);
    } catch (e) {
      const error = reduceError(e);
      return Response.json(error, {
        status: 500,
        headers: { "MF-Experimental-Error-Stack": "true" }
      });
    }
  }, "jsonError");
  var middleware_miniflare3_json_error_default = jsonError;

  // .wrangler/tmp/bundle-73KLtp/middleware-insertion-facade.js
  __facade_registerInternal__([middleware_ensure_req_body_drained_default, middleware_miniflare3_json_error_default]);

  // cloudflare_worker_indexing.js
  addEventListener("scheduled", (event) => {
    event.waitUntil(handleScheduled(event));
  });
  addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
  });
  async function handleRequest(request) {
    const url = new URL(request.url);
    if (url.pathname === "/test") {
      try {
        await LOGS_KV.put("seo_logs", JSON.stringify([`[${(/* @__PURE__ */ new Date()).toISOString()}] \u{1F9EA} Test ba\u015Flat\u0131ld\u0131`]));
      } catch (e) {
        console.error("Test log yazma hatas\u0131:", e);
      }
      const fakeEvent = { scheduledTime: Date.now() };
      handleScheduled(fakeEvent).catch(async (err) => {
        console.error("Test \xE7al\u0131\u015Ft\u0131rma hatas\u0131:", err);
        try {
          const existingLogs = await LOGS_KV.get("seo_logs");
          const allLogs = existingLogs ? JSON.parse(existingLogs) : [];
          allLogs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] \u274C Test \xE7al\u0131\u015Ft\u0131rma hatas\u0131: ${err.message}`);
          await LOGS_KV.put("seo_logs", JSON.stringify(allLogs.slice(-1e3)));
        } catch (logErr) {
          console.error("Hata log yazma hatas\u0131:", logErr);
        }
      });
      return new Response(`
\u{1F9EA} SEO Otomasyonu Test Modu

\u{1F4F1} Telegram'\u0131n\u0131z\u0131 kontrol edin - 30 saniye i\xE7inde rapor gelecek.

\u{1F504} \u0130\u015Flem Ad\u0131mlar\u0131:
1. \u2705 Sitemap tetikleyicisi ziyaret edildi
2. \u23F3 10 saniye bekleniyor...
3. \u{1F4C4} Sitemap okunuyor
4. \u{1F50D} URL'ler kontrol ediliyor
5. \u{1F4E4} Dizine ekleme talepleri g\xF6nderiliyor
6. \u{1F4F1} Telegram raporu g\xF6nderiliyor

\u23F0 Bu sayfa kapanabilir, Telegram'\u0131 bekleyin!

\u{1F4A1} Telegram mesajlar\u0131 gelmezse, /logs sayfas\u0131n\u0131 kontrol edin.
    `, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    if (url.pathname === "/logs") {
      try {
        const logsData = await LOGS_KV.get("seo_logs");
        const logs = logsData ? JSON.parse(logsData) : [];
        const recentLogs = logs.slice(-50);
        return new Response(`
\u{1F4CB} SEO Otomasyon Loglar\u0131

\u{1F4CA} Toplam Log: ${logs.length} adet
\u{1F550} Son G\xFCncelleme: ${(/* @__PURE__ */ new Date()).toLocaleString("tr-TR")}

${recentLogs.length > 0 ? recentLogs.join("\n") : "Hen\xFCz log bulunmuyor..."}

\u{1F504} Loglar\u0131 yenilemek i\xE7in sayfay\u0131 yenileyin.
\u{1F9EA} Test yapmak i\xE7in /test adresine gidin
\u{1F4CA} Sistem durumu i\xE7in /status adresine gidin

\u{1F4A1} Loglar KV Storage'da saklan\u0131yor ve otomatik olarak g\xFCncelleniyor.
      `, {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      } catch (e) {
        return new Response(`
\u{1F4CB} SEO Otomasyon Loglar\u0131

\u274C Loglar al\u0131n\u0131rken hata olu\u015Ftu: ${e.message}

\u{1F9EA} Test yapmak i\xE7in /test adresine gidin
\u{1F4CA} Sistem durumu i\xE7in /status adresine gidin
      `, {
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    }
    if (url.pathname === "/status") {
      const now = /* @__PURE__ */ new Date();
      const nextRuns = [
        { time: "10:00", desc: "Sabah" },
        { time: "13:00", desc: "\xD6\u011Fle" },
        { time: "18:00", desc: "Ak\u015Fam" },
        { time: "22:00", desc: "Gece" }
      ];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      let nextRun = "Bilinmiyor";
      for (const run of nextRuns) {
        const [hour, minute] = run.time.split(":").map(Number);
        if (currentHour < hour || currentHour === hour && currentMinute < minute) {
          nextRun = `${run.time} (${run.desc})`;
          break;
        }
      }
      return new Response(`
\u{1F4CA} Galaktik Uzay SEO Otomasyon Durumu

\u{1F550} \u015Eu Anki Zaman: ${now.toLocaleString("tr-TR")}
\u23F0 Sonraki \xC7al\u0131\u015Fma: ${nextRun}

\u{1F4C5} G\xFCnl\xFCk \xC7al\u0131\u015Fma Zamanlar\u0131:
- 10:00 (Sabah)
- 13:00 (\xD6\u011Fle) 
- 18:00 (Ak\u015Fam)
- 22:00 (Gece)

\u{1F9EA} Manuel Test: /test
\u{1F4CB} Test Loglar\u0131: /logs

\u{1F4F1} Telegram: @GalaktikUzaySEOBot
\u{1F517} Worker URL: ${url.origin}

\u{1F4A1} \u0130pu\xE7lar\u0131:
- Test etmek i\xE7in /test adresine gidin
- Loglar\u0131 g\xF6rmek i\xE7in /logs adresine gidin
- Otomatik \xE7al\u0131\u015Fma zamanlar\u0131n\u0131 yukar\u0131da g\xF6rebilirsiniz
    `, {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    return new Response(`
\u{1F680} Galaktik Uzay SEO Otomasyonu

\u{1F4C5} \xC7al\u0131\u015Fma Zamanlar\u0131:
- 10:00 (Sabah)
- 13:00 (\xD6\u011Fle) 
- 18:00 (Ak\u015Fam)
- 22:00 (Gece)

\u{1F9EA} Manuel Test: /test
\u{1F4CB} Test Loglar\u0131: /logs
\u{1F4CA} Sistem Durumu: /status

\u{1F4F1} Telegram: @GalaktikUzaySEOBot

\u{1F4A1} Kullan\u0131m:
1. Test etmek i\xE7in /test adresine gidin
2. Loglar\u0131 g\xF6rmek i\xE7in /logs adresine gidin
3. Sistem durumunu g\xF6rmek i\xE7in /status adresine gidin
  `, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
  __name(handleRequest, "handleRequest");
  async function handleScheduled(event) {
    try {
      const SITEMAP_INDEX_URL = "https://galaktikuzay.com/sitemap_index.xml";
      const SITE_URL = "https://galaktikuzay.com/";
      const SITEMAP_UPDATE_TRIGGER_URL = "https://galaktikuzay.com/sitemap_index.xml";
      const SERVICE_ACCOUNT_CLIENT_EMAIL = "galaktik-uzay-otomasyonu@galaktik-uzay-sc-otomasyonu.iam.gserviceaccount.com";
      const SERVICE_ACCOUNT_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC0IW4C7Jlct4eg\ngWAozYPGVIkKtOjgVyhXKY5cfK+qBhfhttUQh6UmkcA8Y9Im44/dMGonn94IYrkn\n3QNS9JXfioJgnDE2+TgA0xHKFZpwZj2t92PQSka9pBcY+Rsrp2cYooJOZ2lCRvr+\nsXB76bEX54KVrEwbGTSrhwmqiCe2uv727Y4aWlGCEPWbqSIN2+63nKgEQzz1d0ge\neFALTqtPEnnfr6/UhaxW0ZMmh2pcrkwufIKTmpcxT45hXGhtgNohR9t9i+QB2sPgE\nUhUBKi7HUkdgGFx3IO8RssQdX2ZdTamRh/BwiyTMxiuGNuINNmH4nwzGr99qam1E\nut5UggwPAgMBAAECggEADuUOxDt36P9HaJcaHPWgK7Jfd0et/qhRA81st1VwxHXm\n2/ldf+rqK0N1FRP0qNY7VgEZXg0YSTLkou5hxnvGuCqAt71iomw+3G6Xnia607LY\nmdMxk+PNxVkADJwYn5D4SO9d0rQ2s3jMFhW/uoyrN1H47dMb+Jz/ynPgRujQTonf\nYH2Eox6Vps/35sfX60QynBQD9xmnAs4Z7J0BgxEw80nFtGnl+3DKjNlkWrgLc3X/\ncyPBWjD9j8nObhQKh4vAZzOBX+WLY3Jq2x0wIF/30mQtMJnfEi7Gv8ochqIhkb3k\n09u9DfCkJTKlYH5Qpn7Edo45hQN0PRoFxEDN65jCQQKBgQDdgK7HpYnfJpcH1qY7\nvOktdrf4E//giDpwAaxmaEdhbt8Y0WS7K/yPQ2V+hRvkVK9GG+BNpwV0qjS3XOXE\n7n9h6DjkWpkjkAJ13UOVvXLwS3VuSS3MOGcM3e3TisxApd6pGtP0+0Z2NB7MVDUr\nM0MBZrucI8zssq7cG349vzmjwQKBgQDQLz2wyFLY2Ussypb8n7kOsqgLjfWlfCb6\nI3n0IuebCuEQcLhD9zldjzFqO0jbeM6ddjCSRbs6ybYTOtyBjN19qSz1epKNrC82\n6fc4XtW2WHbmnE99q1xwUeIifk80/yk3stoTzT44zcLYmk2PCYhppfTaJpWSwWOE\ntVCmE1NjzwKBgQCiLGhLNjFGl6t2irr0+/BBYC17zbDHRRZ8EU2XQPwaIyHmutCk\nlaT5g1/ZDT4Jo9McYqaMVCATddbY9YQo9nF/TpXw40BCIFsczp6AENAJjUXyNFP6\ntMUGT6qj+nhnUMpAR6suL5c8ThbKhVDUS1jgusXboP6VwpFyCBMaxFpAQQKBgC9A\nebUVUtCLSWfKN8jxC9TNMh0lRHsiGcquoLCL95uWNY1AuGIcy/VzWdjtydSer+7H\nc7DPiPaH7/6fXos9CMzLyDuTbY4gZbsGEanGxKUVoS8ojVZNvbZ0r2n610mFHLra\nqmrSK+xCr5XwN+heVor8Mv4MwehEYq0tZje7rTK7AoGBAI6cl8AVjEqbStNGYPQL\nmKPMLI39J5CLDuJKN5GAQJPPZ3n943HXJpMWkY87Yroqv6xlgAHb1hpx1+I2LER+\nu5krYJkp0wKjHR4GS0BnBgUvsqS76l5xRKShvQwrHKZ+bm3EpIkDWYHYIplcz5L5\nFdNF3MdblIJy0V90Xx91FGRm\n-----END PRIVATE KEY-----\n";
      const SENDER_EMAIL = "noreply@galaktikuzay.com";
      const RECEIVER_EMAIL = "ozgurkonsept20@gmail.com";
      const logs = [];
      const indexedUrls = [];
      const logMessage = /* @__PURE__ */ __name(async (message) => {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        logs.push(logEntry);
        console.log(logEntry);
        try {
          if (!LOGS_KV) {
            console.error("LOGS_KV binding bulunamad\u0131!");
            return;
          }
          const existingLogs = await LOGS_KV.get("seo_logs");
          const allLogs = existingLogs ? JSON.parse(existingLogs) : [];
          allLogs.push(logEntry);
          const recentLogs = allLogs.slice(-1e3);
          await LOGS_KV.put("seo_logs", JSON.stringify(recentLogs));
          console.log(`KV'ye log yaz\u0131ld\u0131: ${recentLogs.length} adet`);
        } catch (e) {
          console.error("KV log yazma hatas\u0131:", e.message);
          console.error("KV hata detay\u0131:", e);
        }
      }, "logMessage");
      const logIndexedUrl = /* @__PURE__ */ __name((url) => {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        indexedUrls.push(`[${timestamp}] ${url}`);
      }, "logIndexedUrl");
      await logMessage("Otomasyon ba\u015Flat\u0131ld\u0131.");
      try {
        await sendTelegramMessage("\u{1F680} SEO Otomasyonu ba\u015Flat\u0131ld\u0131!\n\n\u23F0 Tarih: " + (/* @__PURE__ */ new Date()).toLocaleString("tr-TR") + "\n\u{1F504} \u0130\u015Flem ba\u015Fl\u0131yor...", logMessage);
      } catch (e) {
        await logMessage(`Telegram ba\u015Flang\u0131\xE7 mesaj\u0131 hatas\u0131: ${e.message}`);
      }
      await logMessage(`Sitemap g\xFCncelleme tetikleyici URL ziyaret ediliyor: ${SITEMAP_UPDATE_TRIGGER_URL}`);
      try {
        await sendTelegramMessage("\u{1F310} Sitemap tetikleyicisi ziyaret ediliyor...", logMessage);
      } catch (e) {
        await logMessage(`Telegram sitemap mesaj\u0131 hatas\u0131: ${e.message}`);
      }
      try {
        const triggerResponse = await fetch(SITEMAP_UPDATE_TRIGGER_URL, { method: "GET", cf: { cacheTtl: 0 } });
        if (triggerResponse.ok) {
          const triggerText = await triggerResponse.text();
          await logMessage(`Sitemap g\xFCncelleme tetikleyici yan\u0131t\u0131: ${triggerText.trim()}`);
          try {
            await sendTelegramMessage("\u2705 Sitemap tetikleyicisi ba\u015Far\u0131l\u0131!", logMessage);
          } catch (e) {
            await logMessage(`Telegram ba\u015Far\u0131 mesaj\u0131 hatas\u0131: ${e.message}`);
          }
        } else {
          await logMessage(`Sitemap g\xFCncelleme tetikleyici ziyaret edilirken hata olu\u015Ftu: ${triggerResponse.status} ${triggerResponse.statusText}`);
          try {
            await sendTelegramMessage(`\u274C Sitemap tetikleyici hatas\u0131: ${triggerResponse.status}`, logMessage);
          } catch (e) {
            await logMessage(`Telegram hata mesaj\u0131 hatas\u0131: ${e.message}`);
          }
        }
      } catch (e) {
        await logMessage(`Sitemap g\xFCncelleme tetikleyici ziyaret edilirken istisna olu\u015Ftu: ${e.message}`);
        try {
          await sendTelegramMessage(`\u274C Sitemap tetikleyici istisna: ${e.message}`, logMessage);
        } catch (e2) {
          await logMessage(`Telegram istisna mesaj\u0131 hatas\u0131: ${e2.message}`);
        }
      }
      try {
        await sendTelegramMessage("\u23F3 10 saniye bekleniyor...", logMessage);
      } catch (e) {
        await logMessage(`Telegram bekleme mesaj\u0131 hatas\u0131: ${e.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1e4));
      await logMessage("Sitemap URL'leri al\u0131n\u0131yor...");
      try {
        await sendTelegramMessage("\u{1F4C4} Sitemap URL'leri al\u0131n\u0131yor...", logMessage);
      } catch (e) {
        await logMessage(`Telegram sitemap okuma mesaj\u0131 hatas\u0131: ${e.message}`);
      }
      let sitemapUrls = /* @__PURE__ */ new Set();
      try {
        sitemapUrls = await getSitemapUrls(SITEMAP_INDEX_URL, logMessage);
        await logMessage(`Sitemap'ten ${sitemapUrls.size} adet URL bulundu.`);
        try {
          await sendTelegramMessage(`\u2705 Sitemap'ten ${sitemapUrls.size} adet URL bulundu!`, logMessage);
        } catch (e2) {
          await logMessage(`Telegram sitemap ba\u015Far\u0131 mesaj\u0131 hatas\u0131: ${e2.message}`);
        }
      } catch (e) {
        await logMessage(`Sitemap URL'leri al\u0131n\u0131rken hata olu\u015Ftu: ${e.message}`);
        try {
          await sendTelegramMessage(`\u274C Sitemap okuma hatas\u0131: ${e.message}`, logMessage);
        } catch (e2) {
          await logMessage(`Telegram sitemap hata mesaj\u0131 hatas\u0131: ${e2.message}`);
        }
        await sendEmailWithLogs(logs, indexedUrls, logMessage, SENDER_EMAIL, RECEIVER_EMAIL);
        return;
      }
      if (sitemapUrls.size === 0) {
        await logMessage("Sitemap'ten URL al\u0131namad\u0131. \u0130\u015Flem sonland\u0131r\u0131l\u0131yor.");
        await sendEmailWithLogs(logs, indexedUrls, logMessage, SENDER_EMAIL, RECEIVER_EMAIL);
        return;
      }
      let accessToken;
      try {
        accessToken = await getGoogleAuthClient(logMessage, SERVICE_ACCOUNT_CLIENT_EMAIL, SERVICE_ACCOUNT_PRIVATE_KEY);
      } catch (e) {
        await logMessage(`Google kimlik do\u011Frulama hatas\u0131: ${e.message}`);
        await sendEmailWithLogs(logs, indexedUrls, logMessage, SENDER_EMAIL, RECEIVER_EMAIL);
        return;
      }
      const unindexedUrls = [];
      await logMessage("URL'lerin dizine eklenme durumu kontrol ediliyor...");
      for (const url of sitemapUrls) {
        try {
          const urlStatus = await checkUrlIndexingStatus(accessToken, url, logMessage);
          if (urlStatus && urlStatus.indexStatus !== "SUBMITTED_AND_INDEXED") {
            unindexedUrls.push(url);
            logMessage(`\u{1F50D} URL dizine eklenmemi\u015F: ${url} (Durum: ${urlStatus.indexStatus}, Coverage: ${urlStatus.coverageState})`);
          } else if (urlStatus) {
            logMessage(`\u2705 URL zaten dizine eklenmi\u015F: ${url} (Son crawl: ${urlStatus.lastCrawlTime || "Bilinmiyor"})`);
          } else {
            logMessage(`\u2753 URL durumu belirlenemedi: ${url} - Dizine ekleme listesine eklendi`);
            unindexedUrls.push(url);
          }
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (e) {
          logMessage(`URL durumu kontrol edilirken hata olu\u015Ftu ${url}: ${e.message}`);
          unindexedUrls.push(url);
        }
      }
      await logMessage(`Dizine eklenmemi\u015F (veya kontrol edilemeyen) ${unindexedUrls.length} adet URL i\xE7in talep g\xF6nderiliyor...`);
      if (unindexedUrls.length > 0) {
        for (let i = 0; i < unindexedUrls.length; i++) {
          const url = unindexedUrls[i];
          await logMessage(`[${i + 1}/${unindexedUrls.length}] Dizine ekleme talebi g\xF6nderiliyor: ${url}`);
          try {
            await requestIndexing(accessToken, url, logMessage);
            logIndexedUrl(url);
          } catch (e) {
            await logMessage(`Dizine ekleme talebi g\xF6nderilirken hata olu\u015Ftu ${url}: ${e.message}`);
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        await logMessage("T\xFCm dizine ekleme talepleri g\xF6nderildi.");
      } else {
        await logMessage("Dizine eklenmemi\u015F URL bulunamad\u0131.");
      }
      await logMessage("Otomasyon tamamland\u0131.");
      await sendEmailWithLogs(logs, indexedUrls, logMessage, SENDER_EMAIL, RECEIVER_EMAIL);
    } catch (error) {
      console.error("handleScheduled genel hatas\u0131:", error);
      try {
        const existingLogs = await LOGS_KV.get("seo_logs");
        const allLogs = existingLogs ? JSON.parse(existingLogs) : [];
        allLogs.push(`[${(/* @__PURE__ */ new Date()).toISOString()}] \u274C handleScheduled genel hatas\u0131: ${error.message}`);
        await LOGS_KV.put("seo_logs", JSON.stringify(allLogs.slice(-1e3)));
      } catch (logErr) {
        console.error("Hata log yazma hatas\u0131:", logErr);
      }
    }
  }
  __name(handleScheduled, "handleScheduled");
  async function getSitemapUrls(sitemapUrl, logMessage) {
    let urls2 = /* @__PURE__ */ new Set();
    try {
      const response = await fetch(sitemapUrl, { cf: { cacheTtl: 0 } });
      if (!response.ok) {
        throw new Error(`HTTP hata kodu: ${response.status}`);
      }
      const text = await response.text();
      const parseXml = /* @__PURE__ */ __name((xmlString) => {
        const doc2 = { documentElement: { tagName: "", querySelectorAll: /* @__PURE__ */ __name(() => [], "querySelectorAll") } };
        const sitemapIndexMatch = xmlString.match(/<sitemapindex[^>]*>/);
        const urlsetMatch = xmlString.match(/<urlset[^>]*>/);
        if (sitemapIndexMatch) {
          doc2.documentElement.tagName = "sitemapindex";
          doc2.documentElement.querySelectorAll = (selector) => {
            if (selector === "sitemap loc") {
              const locs = [];
              const regex = /<sitemap><loc>(.*?)<\/loc>/g;
              let match;
              while ((match = regex.exec(xmlString)) !== null) {
                locs.push({ textContent: match[1] });
              }
              return locs;
            }
            return [];
          };
        } else if (urlsetMatch) {
          doc2.documentElement.tagName = "urlset";
          doc2.documentElement.querySelectorAll = (selector) => {
            if (selector === "url loc") {
              const locs = [];
              const regex = /<url><loc>(.*?)<\/loc>/g;
              let match;
              while ((match = regex.exec(xmlString)) !== null) {
                locs.push({ textContent: match[1] });
              }
              return locs;
            }
            return [];
          };
        }
        if (!sitemapIndexMatch && !urlsetMatch) {
          doc2.querySelector = (selector) => {
            if (selector === "parsererror") {
              return { textContent: "XML format\u0131 tan\u0131nmad\u0131 veya hatal\u0131." };
            }
            return null;
          };
        }
        return doc2;
      }, "parseXml");
      const doc = parseXml(text);
      const errorNode = doc.querySelector && doc.querySelector("parsererror");
      if (errorNode) {
        throw new Error(`XML ayr\u0131\u015Ft\u0131rma hatas\u0131: ${errorNode.textContent}`);
      }
      if (doc.documentElement.tagName === "sitemapindex") {
        const sitemaps = doc.documentElement.querySelectorAll("sitemap loc");
        for (const sitemapLoc of sitemaps) {
          const loc = sitemapLoc.textContent;
          if (loc) {
            await logMessage(`Alt sitemap i\u015Fleniyor: ${loc}`);
            const subUrls = await getSitemapUrls(loc, logMessage);
            subUrls.forEach((u) => urls2.add(u));
          }
        }
      } else if (doc.documentElement.tagName === "urlset") {
        const urlElements = doc.documentElement.querySelectorAll("url loc");
        for (const urlLoc of urlElements) {
          const loc = urlLoc.textContent;
          if (loc) {
            urls2.add(loc);
          }
        }
      }
    } catch (e) {
      await logMessage(`Sitemap al\u0131n\u0131rken veya ayr\u0131\u015Ft\u0131r\u0131l\u0131rken hata olu\u015Ftu ${sitemapUrl}: ${e.message}`);
    }
    return urls2;
  }
  __name(getSitemapUrls, "getSitemapUrls");
  async function getGoogleAuthClient(logMessage, serviceAccountEmail, privateKey) {
    if (!serviceAccountEmail || !privateKey) {
      throw new Error("Google Hizmet Hesab\u0131 kimlik bilgileri (email veya private key) eksik.");
    }
    const jwtHeader = {
      alg: "RS256",
      typ: "JWT"
    };
    const now = Math.floor(Date.now() / 1e3);
    const jwtPayload = {
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      // 1 saat geçerlilik süresi
      iat: now
    };
    const base64Header = btoa(JSON.stringify(jwtHeader)).replace(/=/g, "");
    const base64Payload = btoa(JSON.stringify(jwtPayload)).replace(/=/g, "");
    const assertion = `${base64Header}.${base64Payload}`;
    const privateKeyPem = privateKey;
    const privateKeyCrypto = await crypto.subtle.importKey(
      "pkcs8",
      Uint8Array.from(atob(privateKeyPem.replace(/\n/g, "").replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "")), (c) => c.charCodeAt(0)),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      privateKeyCrypto,
      new TextEncoder().encode(assertion)
    );
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "");
    const signedJwt = `${assertion}.${base64Signature}`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedJwt
      }).toString()
    });
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Access token al\u0131namad\u0131: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
    }
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  }
  __name(getGoogleAuthClient, "getGoogleAuthClient");
  async function checkUrlIndexingStatus(accessToken, url, logMessage) {
    const INSPECTION_API_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
    const encodedUrl = encodeURIComponent(url);
    const body = {
      inspectionUrl: url,
      siteUrl: "https://galaktikuzay.com"
    };
    try {
      const response = await fetch(INSPECTION_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorText = await response.text();
        logMessage(`URL inspection API hatas\u0131: ${response.status} ${response.statusText} - ${errorText}`);
        return null;
      }
      const responseData = await response.json();
      if (responseData.inspectionResult && responseData.inspectionResult.indexStatusResult) {
        const indexStatus = responseData.inspectionResult.indexStatusResult.indexStatus;
        const coverageState = responseData.inspectionResult.indexStatusResult.coverageState;
        logMessage(`URL inspection sonucu: ${url} - Durum: ${indexStatus}, Coverage: ${coverageState}`);
        return {
          indexStatus,
          coverageState,
          lastCrawlTime: responseData.inspectionResult.indexStatusResult.lastCrawlTime,
          pageFetchState: responseData.inspectionResult.indexStatusResult.pageFetchState
        };
      }
      return null;
    } catch (e) {
      logMessage(`URL inspection s\u0131ras\u0131nda hata: ${e.message}`);
      return null;
    }
  }
  __name(checkUrlIndexingStatus, "checkUrlIndexingStatus");
  async function requestIndexing(accessToken, url, logMessage) {
    const INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
    const body = {
      url,
      type: "URL_UPDATED"
    };
    const response = await fetch(INDEXING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dizine ekleme talebi g\xF6nderilirken hata olu\u015Ftu: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const responseData = await response.json();
    logMessage(`Dizine ekleme talebi ba\u015Far\u0131yla g\xF6nderildi: ${url}. Yan\u0131t: ${JSON.stringify(responseData)}`);
  }
  __name(requestIndexing, "requestIndexing");
  async function sendEmailWithLogs(logs, indexedUrls, logMessage, senderEmail, receiverEmail) {
    if (!senderEmail || !receiverEmail) {
      logMessage("E-posta g\xF6nderme kimlik bilgileri eksik (senderEmail veya receiverEmail). E-posta g\xF6nderilemedi.");
      return;
    }
    const totalUrls = logs.find((log) => log.includes("Sitemap")) ? logs.find((log) => log.includes("Sitemap")).match(/\d+/)?.[0] || "0" : "0";
    const indexedCount = indexedUrls.length;
    const errorCount = logs.filter((log) => log.includes("hata") || log.includes("Hata")).length;
    const successRate = totalUrls > 0 ? (indexedCount / parseInt(totalUrls) * 100).toFixed(1) : "0";
    const urlCategories = analyzeUrlCategories(indexedUrls);
    const emailSubject = `\u{1F680} Galaktik Uzay SEO Raporu - ${(/* @__PURE__ */ new Date()).toLocaleDateString("tr-TR")} (${indexedCount} URL i\u015Flendi)`;
    const emailBodyHtml = generateHtmlReport(logs, indexedUrls, {
      totalUrls,
      indexedCount,
      errorCount,
      successRate,
      urlCategories,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString("tr-TR")
    });
    const emailBodyText = generateTextReport(logs, indexedUrls, {
      totalUrls,
      indexedCount,
      errorCount,
      successRate,
      urlCategories,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString("tr-TR")
    });
    const emailSent = await sendEmailWithOptions(emailSubject, emailBodyHtml, emailBodyText, senderEmail, receiverEmail, logMessage);
    if (emailSent) {
      logMessage(`\u{1F4E7} Otomasyon raporu e-posta ile ba\u015Far\u0131yla g\xF6nderildi. (${indexedCount} URL, %${successRate} ba\u015Far\u0131 oran\u0131)`);
    } else {
      logMessage(`\u274C E-posta g\xF6nderilemedi. L\xFCtfen e-posta yap\u0131land\u0131rmas\u0131n\u0131 kontrol edin.`);
    }
  }
  __name(sendEmailWithLogs, "sendEmailWithLogs");
  function analyzeUrlCategories(urls2) {
    const categories = {
      "Ana Sayfa": 0,
      "Blog": 0,
      "\xDCr\xFCn": 0,
      "Kategori": 0,
      "Di\u011Fer": 0
    };
    urls2.forEach((url) => {
      if (url.includes("/blog/") || url.includes("/post/")) {
        categories["Blog"]++;
      } else if (url.includes("/urun/") || url.includes("/product/")) {
        categories["\xDCr\xFCn"]++;
      } else if (url.includes("/kategori/") || url.includes("/category/")) {
        categories["Kategori"]++;
      } else if (url === "https://galaktikuzay.com/" || url === "https://galaktikuzay.com") {
        categories["Ana Sayfa"]++;
      } else {
        categories["Di\u011Fer"]++;
      }
    });
    return categories;
  }
  __name(analyzeUrlCategories, "analyzeUrlCategories");
  function generateHtmlReport(logs, indexedUrls, stats) {
    const { totalUrls, indexedCount, errorCount, successRate, urlCategories, timestamp } = stats;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0 0 0; opacity: 0.9; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; padding: 30px; background: #f8f9fa; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
    .stat-number { font-size: 32px; font-weight: bold; color: #667eea; margin-bottom: 5px; }
    .stat-label { color: #666; font-size: 14px; }
    .section { padding: 30px; border-bottom: 1px solid #eee; }
    .section:last-child { border-bottom: none; }
    .section h2 { color: #333; margin-bottom: 20px; font-size: 20px; }
    .url-list { background: #f8f9fa; padding: 20px; border-radius: 8px; max-height: 300px; overflow-y: auto; }
    .url-item { padding: 8px 0; border-bottom: 1px solid #eee; font-family: monospace; font-size: 13px; }
    .url-item:last-child { border-bottom: none; }
    .categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; }
    .category { background: white; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #eee; }
    .category-count { font-size: 24px; font-weight: bold; color: #28a745; margin-bottom: 5px; }
    .category-name { color: #666; font-size: 12px; }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .error { color: #dc3545; }
    .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>\u{1F680} Galaktik Uzay SEO Otomasyon Raporu</h1>
      <p>${timestamp}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">${totalUrls}</div>
        <div class="stat-label">Toplam URL</div>
      </div>
      <div class="stat-card">
        <div class="stat-number success">${indexedCount}</div>
        <div class="stat-label">\u0130\u015Flenen URL</div>
      </div>
      <div class="stat-card">
        <div class="stat-number warning">${errorCount}</div>
        <div class="stat-label">Hata Say\u0131s\u0131</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">%${successRate}</div>
        <div class="stat-label">Ba\u015Far\u0131 Oran\u0131</div>
      </div>
    </div>

    <div class="section">
      <h2>\u{1F4CA} URL Kategorileri</h2>
      <div class="categories">
        ${Object.entries(urlCategories).map(([name, count]) => `
          <div class="category">
            <div class="category-count">${count}</div>
            <div class="category-name">${name}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="section">
      <h2>\u2705 Ba\u015Far\u0131yla \u0130\u015Flenen URL'ler</h2>
      <div class="url-list">
        ${indexedUrls.map((url) => `<div class="url-item">${url}</div>`).join("")}
      </div>
    </div>

    <div class="section">
      <h2>\u{1F4DD} Sistem Loglar\u0131</h2>
      <div class="url-list">
        ${logs.slice(-20).map((log) => `<div class="url-item">${log}</div>`).join("")}
      </div>
    </div>

    <div class="footer">
      \u{1F916} Bu rapor Galaktik Uzay SEO Otomasyon sistemi taraf\u0131ndan otomatik olarak olu\u015Fturulmu\u015Ftur.
    </div>
  </div>
</body>
</html>`;
  }
  __name(generateHtmlReport, "generateHtmlReport");
  function generateTextReport(logs, indexedUrls, stats) {
    const { totalUrls, indexedCount, errorCount, successRate, urlCategories, timestamp } = stats;
    return `
\u{1F680} GALAKTIK UZAY SEO OTOMASYON RAPORU
=====================================
Tarih: ${timestamp}

\u{1F4CA} \u0130STAT\u0130ST\u0130KLER:
- Toplam URL Say\u0131s\u0131: ${totalUrls}
- \u0130\u015Flenen URL Say\u0131s\u0131: ${indexedCount}
- Hata Say\u0131s\u0131: ${errorCount}
- Ba\u015Far\u0131 Oran\u0131: %${successRate}

\u{1F4C2} URL KATEGOR\u0130LER\u0130:
${Object.entries(urlCategories).map(([name, count]) => `- ${name}: ${count}`).join("\n")}

\u2705 BA\u015EARIYLA \u0130\u015ELENEN URL'LER:
${indexedUrls.map((url) => `- ${url}`).join("\n")}

\u{1F4DD} SON S\u0130STEM LOGLARI:
${logs.slice(-10).map((log) => `- ${log}`).join("\n")}

\u{1F916} Bu rapor otomatik olarak olu\u015Fturulmu\u015Ftur.
`;
  }
  __name(generateTextReport, "generateTextReport");
  async function sendTelegramMessage(message, logMessage) {
    try {
      const botToken = "7301046008:AAGpYNjdY6hdjGiuGfTcfW168YpeTCLiANc";
      const chatId = "1104321474";
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown"
        })
      });
      if (telegramResponse.ok) {
        logMessage(`\u2705 Telegram mesaj\u0131 g\xF6nderildi: ${message.substring(0, 50)}...`);
        return true;
      } else {
        const errorText = await telegramResponse.text();
        logMessage(`\u274C Telegram hatas\u0131: ${telegramResponse.status} - ${errorText}`);
        return false;
      }
    } catch (e) {
      logMessage(`\u274C Telegram istisna hatas\u0131: ${e.message}`);
      return false;
    }
  }
  __name(sendTelegramMessage, "sendTelegramMessage");
  async function sendEmailWithOptions(subject, htmlContent, textContent, senderEmail, receiverEmail, logMessage) {
    if (await sendWithGmailSMTP(subject, htmlContent, textContent, senderEmail, receiverEmail, logMessage)) {
      return true;
    }
    if (await sendWithMailchannels(subject, htmlContent, textContent, senderEmail, receiverEmail, logMessage)) {
      return true;
    }
    if (await sendWithWebhook(subject, textContent, receiverEmail, logMessage)) {
      return true;
    }
    return false;
  }
  __name(sendEmailWithOptions, "sendEmailWithOptions");
  async function sendWithGmailSMTP(subject, htmlContent, textContent, senderEmail, receiverEmail, logMessage) {
    try {
      logMessage("Gmail SMTP ile e-posta g\xF6nderilmeye \xE7al\u0131\u015F\u0131l\u0131yor...");
      return false;
    } catch (e) {
      logMessage(`Gmail SMTP hatas\u0131: ${e.message}`);
      return false;
    }
  }
  __name(sendWithGmailSMTP, "sendWithGmailSMTP");
  async function sendWithMailchannels(subject, htmlContent, textContent, senderEmail, receiverEmail, logMessage) {
    try {
      logMessage("Mailchannels ile e-posta g\xF6nderilmeye \xE7al\u0131\u015F\u0131l\u0131yor...");
      const emailResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: receiverEmail }]
          }],
          from: { email: senderEmail },
          subject,
          content: [
            {
              type: "text/html",
              value: htmlContent
            },
            {
              type: "text/plain",
              value: textContent
            }
          ]
        })
      });
      if (emailResponse.ok) {
        logMessage("\u2705 Mailchannels ile e-posta ba\u015Far\u0131yla g\xF6nderildi.");
        return true;
      } else {
        const errorText = await emailResponse.text();
        logMessage(`\u274C Mailchannels hatas\u0131: ${emailResponse.status} - ${errorText}`);
        return false;
      }
    } catch (e) {
      logMessage(`\u274C Mailchannels istisna hatas\u0131: ${e.message}`);
      return false;
    }
  }
  __name(sendWithMailchannels, "sendWithMailchannels");
  async function sendWithWebhook(subject, textContent, receiverEmail, logMessage) {
    if (await sendWithTelegram(subject, textContent, logMessage)) {
      return true;
    }
    if (await sendWithSlack(subject, textContent, logMessage)) {
      return true;
    }
    if (await sendWithWhatsApp(subject, textContent, receiverEmail, logMessage)) {
      return true;
    }
    return false;
  }
  __name(sendWithWebhook, "sendWithWebhook");
  async function sendWithTelegram(subject, textContent, logMessage) {
    try {
      logMessage("Telegram ile bildirim g\xF6nderilmeye \xE7al\u0131\u015F\u0131l\u0131yor...");
      const botToken = "7301046008:AAGpYNjdY6hdjGiuGfTcfW168YpeTCLiANc";
      const chatId = "1104321474";
      if (botToken === "YOUR_TELEGRAM_BOT_TOKEN" || chatId === "YOUR_TELEGRAM_CHAT_ID") {
        logMessage("Telegram bot bilgileri yap\u0131land\u0131r\u0131lmam\u0131\u015F.");
        return false;
      }
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: `\u{1F680} *${subject}*

${textContent}`,
          parse_mode: "Markdown"
        })
      });
      if (telegramResponse.ok) {
        logMessage("\u2705 Telegram ile bildirim ba\u015Far\u0131yla g\xF6nderildi.");
        return true;
      } else {
        logMessage(`\u274C Telegram hatas\u0131: ${telegramResponse.status}`);
        return false;
      }
    } catch (e) {
      logMessage(`\u274C Telegram istisna hatas\u0131: ${e.message}`);
      return false;
    }
  }
  __name(sendWithTelegram, "sendWithTelegram");
  async function sendWithSlack(subject, textContent, logMessage) {
    try {
      logMessage("Slack ile bildirim g\xF6nderilmeye \xE7al\u0131\u015F\u0131l\u0131yor...");
      const slackWebhookUrl = "YOUR_SLACK_WEBHOOK_URL";
      if (slackWebhookUrl === "YOUR_SLACK_WEBHOOK_URL") {
        logMessage("Slack webhook URL yap\u0131land\u0131r\u0131lmam\u0131\u015F.");
        return false;
      }
      const slackResponse = await fetch(slackWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: `\u{1F680} *${subject}*`,
          attachments: [{
            color: "good",
            text: textContent,
            footer: "Galaktik Uzay SEO Bot",
            ts: Math.floor(Date.now() / 1e3)
          }]
        })
      });
      if (slackResponse.ok) {
        logMessage("\u2705 Slack ile bildirim ba\u015Far\u0131yla g\xF6nderildi.");
        return true;
      } else {
        logMessage(`\u274C Slack hatas\u0131: ${slackResponse.status}`);
        return false;
      }
    } catch (e) {
      logMessage(`\u274C Slack istisna hatas\u0131: ${e.message}`);
      return false;
    }
  }
  __name(sendWithSlack, "sendWithSlack");
  async function sendWithWhatsApp(subject, textContent, receiverEmail, logMessage) {
    try {
      logMessage("WhatsApp ile bildirim g\xF6nderilmeye \xE7al\u0131\u015F\u0131l\u0131yor...");
      const whatsappToken = "YOUR_WHATSAPP_TOKEN";
      const whatsappPhoneNumber = "YOUR_WHATSAPP_PHONE_NUMBER";
      if (whatsappToken === "YOUR_WHATSAPP_TOKEN" || whatsappPhoneNumber === "YOUR_WHATSAPP_PHONE_NUMBER") {
        logMessage("WhatsApp API bilgileri yap\u0131land\u0131r\u0131lmam\u0131\u015F.");
        return false;
      }
      const whatsappResponse = await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneNumber}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${whatsappToken}`
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: whatsappPhoneNumber,
          type: "text",
          text: {
            body: `\u{1F680} ${subject}

${textContent}`
          }
        })
      });
      if (whatsappResponse.ok) {
        logMessage("\u2705 WhatsApp ile bildirim ba\u015Far\u0131yla g\xF6nderildi.");
        return true;
      } else {
        logMessage(`\u274C WhatsApp hatas\u0131: ${whatsappResponse.status}`);
        return false;
      }
    } catch (e) {
      logMessage(`\u274C WhatsApp istisna hatas\u0131: ${e.message}`);
      return false;
    }
  }
  __name(sendWithWhatsApp, "sendWithWhatsApp");
})();
//# sourceMappingURL=cloudflare_worker_indexing.js.map
