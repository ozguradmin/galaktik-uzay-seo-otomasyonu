(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // .wrangler/tmp/bundle-K8pDwF/checked-fetch.js
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

  // .wrangler/tmp/bundle-K8pDwF/middleware-insertion-facade.js
  __facade_registerInternal__([middleware_ensure_req_body_drained_default, middleware_miniflare3_json_error_default]);

  // cloudflare_worker_indexing.js
  var SITEMAP_INDEX_URL = "https://galaktikuzay.com/sitemap_index.xml";
  var SITE_URL = "https://galaktikuzay.com/";
  var SITEMAP_UPDATE_TRIGGER_URL = "https://galaktikuzay.com/sitemap_index.xml";
  var logContainer = {
    logs: [],
    errors: [],
    indexedUrls: []
  };
  var URL_BATCH_SIZE = 2;
  var logMessage = /* @__PURE__ */ __name(async (message) => {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    logContainer.logs.push(logEntry);
    console.log(logEntry);
    try {
      if (typeof LOGS_KV === "undefined") {
        console.error("LOGS_KV binding bulunamad\u0131!");
        return;
      }
      if (logContainer.logs.length % 5 === 0 || logContainer.logs.length === 1) {
        const existingLogsJSON = await LOGS_KV.get("seo_logs");
        const allLogs = existingLogsJSON ? JSON.parse(existingLogsJSON) : [];
        allLogs.push(...logContainer.logs.slice(-5));
        const recentLogs = allLogs.slice(-1e3);
        await LOGS_KV.put("seo_logs", JSON.stringify(recentLogs));
        console.log(`KV'ye log yaz\u0131ld\u0131: ${recentLogs.length} adet (batch: ${logContainer.logs.length})`);
      }
    } catch (e) {
      console.error("KV log yazma hatas\u0131:", e.message);
      console.error("KV hata detay\u0131:", e);
    }
  }, "logMessage");
  var logIndexedUrl = /* @__PURE__ */ __name((url) => {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    logContainer.indexedUrls.push(`[${timestamp}] ${url}`);
  }, "logIndexedUrl");
  addEventListener("scheduled", (event) => {
    event.waitUntil(handleScheduled(event));
  });
  addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request, event));
  });
  async function handleRequest(request, event) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/test") {
        await logMessage("\u{1F9EA} Test ba\u015Flat\u0131ld\u0131");
        const fakeEvent = {
          waitUntil: /* @__PURE__ */ __name((promise) => promise, "waitUntil")
        };
        event.waitUntil(handleScheduled(fakeEvent));
        return new Response(`
        \u{1F9EA} SEO Otomasyonu ba\u015Flat\u0131ld\u0131!
        
        \u{1F4F1} Telegram'\u0131n\u0131z\u0131 ve /logs sayfas\u0131n\u0131 kontrol edin. \u0130\u015Flemler arka planda y\xFCr\xFCyor.
        
        \u{1F504} \u0130\u015Flem Ad\u0131mlar\u0131:
        1. \u{1F4DD} Loglar KV'ye yaz\u0131l\u0131yor
        2. \u{1F680} Ba\u015Flang\u0131\xE7 mesaj\u0131 g\xF6nderiliyor
        3. \u{1F310} Sitemap tetikleyicisi ziyaret ediliyor
        4. \u23F3 10 saniye bekleniyor...
        5. \u{1F4C4} Sitemap okunuyor
        6. \u{1F50D} URL'ler kontrol ediliyor
        7. \u{1F4E4} Dizine ekleme talepleri g\xF6nderiliyor
        8. \u{1F4F1} Telegram raporu g\xF6nderiliyor
        
        \u23F0 Bu sayfa kapanabilir, Telegram'\u0131 bekleyin!
      `, {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
      if (url.pathname === "/logs") {
        try {
          const logsJSON = await LOGS_KV.get("seo_logs");
          const logs = logsJSON ? JSON.parse(logsJSON) : [];
          const logsHTML = logs.map((log) => `<div class="log-entry">${log}</div>`).join("");
          return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>SEO Otomasyon Loglar\u0131</title>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { background: #4285f4; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .log-entry { background: #f8f9fa; padding: 8px; margin: 2px 0; border-left: 3px solid #4285f4; font-family: monospace; font-size: 12px; }
              .stats { background: #e8f0fe; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .btn { background: #34a853; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; text-decoration: none; display: inline-block; }
              .btn:hover { background: #2d8f47; }
              .btn-danger { background: #ea4335; }
              .btn-danger:hover { background: #d33b2c; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>\u{1F4CB} SEO Otomasyon Loglar\u0131</h1>
              </div>
              
              <div class="stats">
                <h3>\u{1F4CA} Toplam Log: ${logs.length} adet</h3>
                <h3>\u{1F550} Son G\xFCncelleme: ${(/* @__PURE__ */ new Date()).toLocaleString("tr-TR")}</h3>
              </div>
              
              <div class="logs">
                ${logs.length > 0 ? logsHTML : '<div class="log-entry">Hen\xFCz log bulunmuyor...</div>'}
              </div>
              
              <div style="margin-top: 20px;">
                <button class="btn" onclick="location.reload()">\u{1F504} Loglar\u0131 Yenile</button>
                <a href="/logs/clear" class="btn btn-danger" onclick="return confirm('T\xFCm loglar\u0131 silmek istedi\u011Finizden emin misiniz?')">\u{1F5D1}\uFE0F Loglar\u0131 Temizle</a>
                <p style="margin-top: 10px;">
                  \u{1F9EA} Test yapmak i\xE7in <a href="/test">/test</a> adresine gidin<br>
                  \u{1F4CA} Sistem durumu i\xE7in <a href="/status">/status</a> adresine gidin<br>
                  \u{1F4A1} Loglar KV Storage'da saklan\u0131yor ve otomatik olarak g\xFCncelleniyor.
                </p>
              </div>
            </div>
          </body>
          </html>
        `, {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        } catch (error) {
          await logMessage(`Logs endpoint hatas\u0131: ${error.message}`);
          return new Response(`Logs endpoint hatas\u0131: ${error.message}`, { status: 500 });
        }
      }
      if (url.pathname === "/logs/clear") {
        try {
          await LOGS_KV.delete("seo_logs");
          await logMessage("\u{1F5D1}\uFE0F Loglar temizlendi");
          const redirectUrl = new URL("/logs", url.origin);
          return Response.redirect(redirectUrl.toString(), 302);
        } catch (error) {
          await logMessage(`Log temizleme hatas\u0131: ${error.message}`);
          return new Response(`Log temizleme hatas\u0131: ${error.message}`, { status: 500 });
        }
      }
      if (url.pathname === "/auth/login") {
        const authUrl = new URL("https://accounts.google.com/o/oauth2/auth");
        authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", GOOGLE_SCOPE);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        return Response.redirect(authUrl.toString(), 302);
      }
      if (url.pathname === "/auth/callback") {
        const code = url.searchParams.get("code");
        if (!code) {
          return new Response("Authorization code bulunamad\u0131", { status: 400 });
        }
        try {
          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              code,
              grant_type: "authorization_code",
              redirect_uri: GOOGLE_REDIRECT_URI
            })
          });
          const tokenData = await tokenResponse.json();
          if (tokenData.error) {
            await logMessage(`OAuth token hatas\u0131: ${tokenData.error_description}`);
            return new Response(`OAuth token hatas\u0131: ${tokenData.error_description}`, { status: 400 });
          }
          await LOGS_KV.put("google_oauth_token", JSON.stringify({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + tokenData.expires_in * 1e3,
            token_type: tokenData.token_type
          }));
          await logMessage("\u2705 Google OAuth token ba\u015Far\u0131yla al\u0131nd\u0131 ve sakland\u0131");
          return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>OAuth Ba\u015Far\u0131l\u0131</title>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success">
                <h2>\u2705 OAuth Ba\u015Far\u0131l\u0131!</h2>
                <p>Google Search Console API eri\u015Fimi ba\u015Far\u0131yla kuruldu.</p>
                <p>Art\u0131k otomasyon Google API'sini kullanabilir.</p>
              </div>
              <p><a href="/test">\u{1F9EA} Test yapmak i\xE7in t\u0131klay\u0131n</a></p>
              <p><a href="/logs">\u{1F4CB} Loglar\u0131 g\xF6r\xFCnt\xFClemek i\xE7in t\u0131klay\u0131n</a></p>
            </div>
          </body>
          </html>
        `, {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        } catch (error) {
          await logMessage(`OAuth callback hatas\u0131: ${error.message}`);
          return new Response(`OAuth callback hatas\u0131: ${error.message}`, { status: 500 });
        }
      }
      if (url.pathname === "/status") {
        try {
          const tokenJSON = await LOGS_KV.get("google_oauth_token");
          const token = tokenJSON ? JSON.parse(tokenJSON) : null;
          const hasValidToken = token && token.expires_at > Date.now();
          return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Sistem Durumu</title>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .status-ok { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .status-error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>\u{1F4CA} Sistem Durumu</h1>
              
              <div class="${hasValidToken ? "status-ok" : "status-error"}">
                <h3>\u{1F510} Google OAuth Token: ${hasValidToken ? "\u2705 Ge\xE7erli" : "\u274C Ge\xE7ersiz/Eksik"}</h3>
                ${token ? `<p>Token s\xFCresi: ${new Date(token.expires_at).toLocaleString("tr-TR")}</p>` : "<p>Token bulunamad\u0131</p>"}
              </div>
              
              <div class="status-ok">
                <h3>\u{1F916} Telegram Bot: \u2705 Aktif</h3>
                <p>Bot Token: ${TELEGRAM_BOT_TOKEN ? "\u2705 Ayarland\u0131" : "\u274C Eksik"}</p>
                <p>Chat ID: ${TELEGRAM_CHAT_ID ? "\u2705 Ayarland\u0131" : "\u274C Eksik"}</p>
              </div>
              
              <div class="status-ok">
                <h3>\u{1F4BE} KV Storage: \u2705 Aktif</h3>
                <p>Logs KV: \u2705 Ba\u011Fl\u0131</p>
              </div>
              
              <div style="margin-top: 20px;">
                ${!hasValidToken ? '<p><a href="/auth/login">\u{1F510} Google ile Giri\u015F Yap</a></p>' : ""}
                <p><a href="/test">\u{1F9EA} Test Yap</a></p>
                <p><a href="/logs">\u{1F4CB} Loglar\u0131 G\xF6r\xFCnt\xFCle</a></p>
              </div>
            </div>
          </body>
          </html>
        `, {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        } catch (error) {
          return new Response(`Status endpoint hatas\u0131: ${error.message}`, { status: 500 });
        }
      }
      if (url.pathname === "/") {
        return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Galaktik Uzay SEO Otomasyonu</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .btn { display: inline-block; background: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; }
            .btn:hover { background: #3367d6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>\u{1F680} Galaktik Uzay SEO Otomasyonu</h1>
            <p>Google Search Console API ile otomatik URL indeksleme sistemi.</p>
            
            <h3>\u{1F527} \u0130\u015Flemler:</h3>
            <a href="/auth/login" class="btn">\u{1F510} Google ile Giri\u015F Yap</a>
            <a href="/test" class="btn">\u{1F9EA} Test Yap</a>
            <a href="/logs" class="btn">\u{1F4CB} Loglar\u0131 G\xF6r\xFCnt\xFCle</a>
            <a href="/status" class="btn">\u{1F4CA} Sistem Durumu</a>
            
            <h3>\u2139\uFE0F Bilgi:</h3>
            <p>\u0130lk kullan\u0131mda Google ile giri\u015F yapman\u0131z gerekiyor.</p>
            <p>Giri\u015F yapt\u0131ktan sonra test yapabilir ve loglar\u0131 g\xF6r\xFCnt\xFCleyebilirsiniz.</p>
          </div>
        </body>
        </html>
      `, {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
      return new Response("Endpoint bulunamad\u0131", { status: 404 });
    } catch (error) {
      await logMessage(`handleRequest hatas\u0131: ${error.message}`);
      return new Response(`handleRequest hatas\u0131: ${error.message}`, { status: 500 });
    }
  }
  __name(handleRequest, "handleRequest");
  async function refreshOAuthToken() {
    try {
      const tokenJSON = await LOGS_KV.get("google_oauth_token");
      if (!tokenJSON) {
        await logMessage("OAuth token bulunamad\u0131, l\xFCtfen /auth/login ile giri\u015F yap\u0131n");
        return null;
      }
      const token = JSON.parse(tokenJSON);
      if (token.expires_at > Date.now()) {
        return token;
      }
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: token.refresh_token,
          grant_type: "refresh_token"
        })
      });
      const refreshData = await refreshResponse.json();
      if (refreshData.error) {
        await logMessage(`Token yenileme hatas\u0131: ${refreshData.error_description}`);
        return null;
      }
      const newToken = {
        access_token: refreshData.access_token,
        refresh_token: token.refresh_token,
        // refresh token değişmez
        expires_at: Date.now() + refreshData.expires_in * 1e3,
        token_type: refreshData.token_type
      };
      await LOGS_KV.put("google_oauth_token", JSON.stringify(newToken));
      await logMessage("\u2705 OAuth token ba\u015Far\u0131yla yenilendi");
      return newToken;
    } catch (error) {
      await logMessage(`Token yenileme hatas\u0131: ${error.message}`);
      return null;
    }
  }
  __name(refreshOAuthToken, "refreshOAuthToken");
  async function checkUrlIndexingStatus(url) {
    try {
      const token = await refreshOAuthToken();
      if (!token) {
        return { error: "OAuth token bulunamad\u0131" };
      }
      const apiUrl = `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl: SITE_URL
        })
      });
      if (!response.ok) {
        const responseText2 = await response.text();
        await logMessage(`URL denetim hatas\u0131: ${response.status} - ${responseText2.substring(0, 100)}`);
        return { error: `HTTP ${response.status}: ${responseText2.substring(0, 100)}` };
      }
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        await logMessage(`URL denetim JSON parse hatas\u0131: ${parseError.message}`);
        await logMessage(`API yan\u0131t\u0131 (ilk 200 karakter): ${responseText.substring(0, 200)}`);
        return { error: `JSON parse hatas\u0131: ${parseError.message}` };
      }
      return {
        url,
        indexingState: data.inspectionResult?.indexStatusResult?.verdict || "UNKNOWN",
        coverageState: data.inspectionResult?.indexStatusResult?.coverageState || "UNKNOWN",
        lastCrawlTime: data.inspectionResult?.indexStatusResult?.lastCrawlTime || null
      };
    } catch (error) {
      await logMessage(`URL denetim hatas\u0131: ${error.message}`);
      return { error: error.message };
    }
  }
  __name(checkUrlIndexingStatus, "checkUrlIndexingStatus");
  async function requestIndexing(url) {
    try {
      const token = await refreshOAuthToken();
      if (!token) {
        return { error: "OAuth token bulunamad\u0131" };
      }
      const apiUrl = `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inspectionUrl: url,
          siteUrl: SITE_URL
        })
      });
      if (!response.ok) {
        const responseText2 = await response.text();
        await logMessage(`\u0130ndeksleme iste\u011Fi hatas\u0131: ${response.status} - ${responseText2.substring(0, 100)}`);
        return { error: `HTTP ${response.status}: ${responseText2.substring(0, 100)}` };
      }
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        await logMessage(`\u0130ndeksleme JSON parse hatas\u0131: ${parseError.message}`);
        await logMessage(`API yan\u0131t\u0131 (ilk 200 karakter): ${responseText.substring(0, 200)}`);
        return { error: `JSON parse hatas\u0131: ${parseError.message}` };
      }
      return {
        url,
        success: true,
        message: "\u0130ndeksleme iste\u011Fi ba\u015Far\u0131yla g\xF6nderildi"
      };
    } catch (error) {
      await logMessage(`\u0130ndeksleme iste\u011Fi hatas\u0131: ${error.message}`);
      return { error: error.message };
    }
  }
  __name(requestIndexing, "requestIndexing");
  async function sendTelegramMessage(message) {
    try {
      if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        await logMessage("Telegram bot token veya chat ID bulunamad\u0131");
        return;
      }
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown"
        })
      });
      if (response.ok) {
        await logMessage(`\u2705 Telegram mesaj\u0131 g\xF6nderildi: ${message.substring(0, 50)}...`);
      } else {
        const errorData = await response.json();
        await logMessage(`Telegram mesaj hatas\u0131: ${errorData.description}`);
      }
    } catch (error) {
      await logMessage(`Telegram mesaj hatas\u0131: ${error.message}`);
    }
  }
  __name(sendTelegramMessage, "sendTelegramMessage");
  async function getSitemapUrls() {
    try {
      await logMessage("Sitemap URL'leri al\u0131n\u0131yor...");
      const response = await fetch(SITEMAP_INDEX_URL);
      if (!response.ok) {
        throw new Error(`Sitemap yan\u0131t hatas\u0131: ${response.status}`);
      }
      const xmlText = await response.text();
      await logMessage(`Sitemap yan\u0131t\u0131 al\u0131nd\u0131, boyut: ${xmlText.length} karakter`);
      const urls2 = [];
      const sitemapMatches = xmlText.match(/<loc>(.*?)<\/loc>/g);
      if (sitemapMatches) {
        for (const match of sitemapMatches) {
          const sitemapUrl = match.replace(/<\/?loc>/g, "");
          if (sitemapUrl.includes("sitemap") && sitemapUrl !== SITEMAP_INDEX_URL) {
            await logMessage(`Alt sitemap bulundu: ${sitemapUrl}`);
            try {
              const subResponse = await fetch(sitemapUrl);
              if (subResponse.ok) {
                const subXmlText = await subResponse.text();
                const urlMatches = subXmlText.match(/<loc>(.*?)<\/loc>/g);
                if (urlMatches) {
                  for (const urlMatch of urlMatches) {
                    const url = urlMatch.replace(/<\/?loc>/g, "");
                    if (url.startsWith("https://galaktikuzay.com/")) {
                      urls2.push(url);
                    }
                  }
                }
              }
            } catch (error) {
              await logMessage(`Alt sitemap hatas\u0131 ${sitemapUrl}: ${error.message}`);
            }
          }
        }
      }
      await logMessage(`Sitemap'ten ${urls2.length} adet URL bulundu.`);
      return urls2;
    } catch (error) {
      await logMessage(`Sitemap URL alma hatas\u0131: ${error.message}`);
      return [];
    }
  }
  __name(getSitemapUrls, "getSitemapUrls");
  async function sendReport(logs, indexedUrls, startIndex, totalUrls, batchSize) {
    try {
      await logMessage("Telegram ile rapor g\xF6nderilmeye \xE7al\u0131\u015F\u0131l\u0131yor...");
      const now = /* @__PURE__ */ new Date();
      const dateStr = now.toLocaleDateString("tr-TR");
      const timeStr = now.toLocaleTimeString("tr-TR");
      let report = `\u{1F680} \u{1F680} Galaktik Uzay SEO Raporu - ${dateStr} \u{1F680}

`;
      report += `GALAKTIK UZAY SEO OTOMASYON RAPORU
`;
      report += `=====================================
`;
      report += `Tarih: ${dateStr} ${timeStr}

`;
      report += `\u{1F4CA} \u0130STAT\u0130ST\u0130KLER:
`;
      report += `- Toplam URL Say\u0131s\u0131 (Sitemap): ${totalUrls}
`;
      report += `- Bu \xC7al\u0131\u015Fmada \u0130\u015Flenen Aral\u0131k: ${startIndex + 1} - ${Math.min(startIndex + batchSize, totalUrls)}
`;
      report += `- Bu Aral\u0131kta \u0130\u015Flenen URL: ${batchSize}
`;
      report += `- \u0130ndekse G\xF6nderilen URL: ${indexedUrls.length}
`;
      report += `- Hata Say\u0131s\u0131: ${logs.filter((log) => log.includes("hata") || log.includes("error")).length}

`;
      report += `\u{1F4C2} URL KATEGOR\u0130LER\u0130 (Batch \u0130\xE7in):
`;
      report += `- Ana Sayfa: ${indexedUrls.filter((url) => url.includes("/") && url.split("/").length === 4).length}
`;
      report += `- Blog: ${indexedUrls.filter((url) => url.includes("/blog/")).length}
`;
      report += `- \xDCr\xFCn: ${indexedUrls.filter((url) => url.includes("/urun/")).length}
`;
      report += `- Kategori: ${indexedUrls.filter((url) => url.includes("/kategori/")).length}
`;
      report += `- Di\u011Fer: ${indexedUrls.filter((url) => !url.includes("/blog/") && !url.includes("/urun/") && !url.includes("/kategori/")).length}

`;
      if (indexedUrls.length > 0) {
        report += `\u2705 BA\u015EARIYLA \u0130\u015ELENEN URL'LER:
`;
        indexedUrls.slice(0, 10).forEach((url) => {
          report += `- ${url}
`;
        });
        if (indexedUrls.length > 10) {
          report += `... ve ${indexedUrls.length - 10} URL daha
`;
        }
        report += `
`;
      }
      report += `\u{1F4DD} SON S\u0130STEM LOGLARI:
`;
      logs.slice(-10).forEach((log) => {
        report += `- ${log}
`;
      });
      report += `
\u{1F916} Bu rapor otomatik olarak olu\u015Fturulmu\u015Ftur.`;
      await sendTelegramMessage(report);
      await logMessage("\u2705 Telegram ile rapor ba\u015Far\u0131yla g\xF6nderildi.");
    } catch (error) {
      await logMessage(`Rapor g\xF6nderme hatas\u0131: ${error.message}`);
    }
  }
  __name(sendReport, "sendReport");
  async function handleScheduled(event) {
    const indexedUrls = [];
    try {
      await logMessage("Otomasyon ba\u015Flat\u0131ld\u0131.");
      try {
        await sendTelegramMessage("\u{1F680} SEO Otomasyonu ba\u015Flat\u0131ld\u0131!\n\n\u23F0 Tarih: " + (/* @__PURE__ */ new Date()).toLocaleString("tr-TR") + "\n\u{1F504} \u0130\u015Flem ba\u015Fl\u0131yor...");
      } catch (e) {
        await logMessage(`Telegram ba\u015Flang\u0131\xE7 mesaj\u0131 hatas\u0131: ${e.message}`);
      }
      try {
        await logMessage(`Sitemap g\xFCncelleme tetikleyici URL ziyaret ediliyor: ${SITEMAP_UPDATE_TRIGGER_URL}`);
        const triggerResponse = await fetch(SITEMAP_UPDATE_TRIGGER_URL);
        if (triggerResponse.ok) {
          const triggerText = await triggerResponse.text();
          await logMessage(`\u2705 Telegram mesaj\u0131 g\xF6nderildi: \u2705 Sitemap tetikleyicisi ba\u015Far\u0131l\u0131!...`);
          await sendTelegramMessage(`\u2705 Sitemap tetikleyicisi ba\u015Far\u0131l\u0131!
\u{1F4C4} Sitemap yan\u0131t\u0131: ${triggerText.substring(0, 100)}...`);
        } else {
          await logMessage(`Sitemap tetikleyicisi yan\u0131t hatas\u0131: ${triggerResponse.status}`);
          await sendTelegramMessage(`\u274C Sitemap tetikleyicisi hatas\u0131: ${triggerResponse.status}`);
        }
      } catch (error) {
        await logMessage(`Sitemap tetikleyicisi hatas\u0131: ${error.message}`);
        await sendTelegramMessage(`\u274C Sitemap tetikleyicisi hatas\u0131: ${error.message}`);
      }
      await logMessage("\u23F3 10 saniye bekleniyor...");
      await sendTelegramMessage("\u23F3 10 saniye bekleniyor...");
      await new Promise((resolve) => setTimeout(resolve, 1e4));
      await sendTelegramMessage("\u{1F4C4} Sitemap URL'leri al\u0131n\u0131yor...");
      const urls2 = await getSitemapUrls();
      if (urls2.length === 0) {
        await logMessage("Sitemap'ten URL al\u0131namad\u0131. \u0130\u015Flem sonland\u0131r\u0131l\u0131yor.");
        await sendTelegramMessage("\u274C Sitemap'ten URL al\u0131namad\u0131. \u0130\u015Flem sonland\u0131r\u0131l\u0131yor.");
        return;
      }
      await logMessage(`\u2705 Telegram mesaj\u0131 g\xF6nderildi: \u2705 Sitemap'ten ${urls2.length} adet URL bulundu!...`);
      await sendTelegramMessage(`\u2705 Sitemap'ten ${urls2.length} adet URL bulundu!
\u{1F50D} URL'ler kontrol ediliyor...`);
      const lastProcessedIndexStr = await LOGS_KV.get("LAST_PROCESSED_URL_INDEX");
      let lastProcessedIndex = lastProcessedIndexStr ? parseInt(lastProcessedIndexStr, 10) : 0;
      if (lastProcessedIndex >= urls2.length) {
        lastProcessedIndex = 0;
        await logMessage("\u{1F504} T\xFCm URL'ler i\u015Flendi, i\u015Flem s\u0131f\u0131rlan\u0131yor.");
        await sendTelegramMessage("\u{1F504} T\xFCm URL'ler i\u015Flendi, i\u015Flem s\u0131f\u0131rlan\u0131yor.");
      }
      await logMessage(`Son i\u015Flenen index: ${lastProcessedIndex}. Bu \xE7al\u0131\u015Ft\u0131rmada ${URL_BATCH_SIZE} URL i\u015Flenecek.`);
      const urlsToProcess = urls2.slice(lastProcessedIndex, lastProcessedIndex + URL_BATCH_SIZE);
      let newIndex = lastProcessedIndex + urlsToProcess.length;
      const token = await refreshOAuthToken();
      if (!token) {
        await logMessage("OAuth token bulunamad\u0131, l\xFCtfen /auth/login ile giri\u015F yap\u0131n");
        await sendTelegramMessage("\u274C OAuth token bulunamad\u0131, l\xFCtfen /auth/login ile giri\u015F yap\u0131n");
        return;
      }
      await logMessage("\u2705 OAuth token ge\xE7erli, API i\u015Flemleri ba\u015Fl\u0131yor...");
      for (const url of urlsToProcess) {
        try {
          await logMessage(`URL kontrol ediliyor: ${url}`);
          const statusResult = await checkUrlIndexingStatus(url);
          if (statusResult.error) {
            await logMessage(`URL durum kontrol hatas\u0131: ${statusResult.error}`);
            continue;
          }
          await logMessage(`URL durumu: ${statusResult.indexingState} (${statusResult.coverageState})`);
          const nonIndexableVerdicts = ["PASS", "PARTIAL"];
          if (!nonIndexableVerdicts.includes(statusResult.indexingState)) {
            await logMessage(`\u0130ndeksleme iste\u011Fi g\xF6nderiliyor: ${url}`);
            const indexingResult = await requestIndexing(url);
            if (indexingResult.error) {
              await logMessage(`\u0130ndeksleme iste\u011Fi hatas\u0131: ${indexingResult.error}`);
            } else {
              await logMessage(`\u2705 \u0130ndeksleme iste\u011Fi ba\u015Far\u0131l\u0131: ${url}`);
              indexedUrls.push(url);
              logIndexedUrl(url);
            }
          } else {
            await logMessage(`URL'in indekse eklenmesi gerekmiyor (Durum: ${statusResult.indexingState}): ${url}`);
          }
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        } catch (error) {
          await logMessage(`URL i\u015Fleme hatas\u0131 ${url}: ${error.message}`);
        }
      }
      await sendReport(logContainer.logs, indexedUrls, lastProcessedIndex, urls2.length, urlsToProcess.length);
      await LOGS_KV.put("LAST_PROCESSED_URL_INDEX", newIndex.toString());
      await logMessage(`Yeni index kaydedildi: ${newIndex}`);
      await logMessage("\u{1F680} Otomasyon raporu Telegram ile ba\u015Far\u0131yla g\xF6nderildi.");
    } catch (error) {
      console.error("handleScheduled genel hatas\u0131:", error);
      try {
        await logMessage(`\u274C BEKLENMED\u0130K HATA: ${error.message}
${error.stack}`);
        await sendTelegramMessage(`\u{1F6A8} Sistemsel Hata: Otomasyon beklenmedik bir hata nedeniyle durdu. L\xFCtfen loglar\u0131 kontrol edin.`);
      } catch (logErr) {
        console.error("Genel hata logunu yazma hatas\u0131:", logErr);
      }
    }
  }
  __name(handleScheduled, "handleScheduled");
})();
//# sourceMappingURL=cloudflare_worker_indexing.js.map
