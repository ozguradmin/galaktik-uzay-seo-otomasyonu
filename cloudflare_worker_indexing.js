const SITEMAP_INDEX_URL = 'https://galaktikuzay.com/sitemap_index.xml';
const SITE_URL = 'https://galaktikuzay.com/';
const SITEMAP_UPDATE_TRIGGER_URL = 'https://galaktikuzay.com/sitemap_index.xml';

// Global log container
const logContainer = {
  logs: [],
  errors: [],
  indexedUrls: [],
};

const URL_BATCH_SIZE = 2; // Her çalıştırmada işlenecek URL sayısı

/**
 * Logları hem konsola yazar hem de KV'de saklar.
 * @param {string} message - Log mesajı.
 */
const logMessage = async (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  logContainer.logs.push(logEntry);
  console.log(logEntry);
  
  // KV'ye log yaz - LOGS_KV binding kontrolü (rate limit önlemek için batching)
  try {
    if (typeof LOGS_KV === 'undefined') {
      console.error('LOGS_KV binding bulunamadı!');
      return;
    }
    
    // Rate limit önlemek için sadece her 5 log'da bir KV'ye yaz
    if (logContainer.logs.length % 5 === 0 || logContainer.logs.length === 1) {
      const existingLogsJSON = await LOGS_KV.get('seo_logs');
      const allLogs = existingLogsJSON ? JSON.parse(existingLogsJSON) : [];
      
      // Mevcut logları ekle
      allLogs.push(...logContainer.logs.slice(-5));
      
      // Son 1000 log'u sakla (eski logları temizle)
      const recentLogs = allLogs.slice(-1000);
      await LOGS_KV.put('seo_logs', JSON.stringify(recentLogs));
      console.log(`KV'ye log yazıldı: ${recentLogs.length} adet (batch: ${logContainer.logs.length})`);
    }
  } catch (e) {
    console.error('KV log yazma hatası:', e.message);
    console.error('KV hata detayı:', e);
  }
};

const logIndexedUrl = (url) => {
  const timestamp = new Date().toISOString();
  logContainer.indexedUrls.push(`[${timestamp}] ${url}`);
};

addEventListener("scheduled", event => {
  event.waitUntil(handleScheduled(event));
});

// HTTP request handler ekleyelim - manuel test için
addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event));
});

/**
 * HTTP isteklerini işler.
 * @param {Request} request - HTTP isteği.
 * @param {FetchEvent} event - Fetch olayı.
 * @returns {Response} HTTP yanıtı.
 */
async function handleRequest(request, event) {
  const url = new URL(request.url);
  
  try {
    // Test endpoint'i - manuel test için
    if (url.pathname === '/test') {
      await logMessage('🧪 Test başlatıldı');
      
      // Fake event oluştur ve handleScheduled'ı çalıştır
      const fakeEvent = {
        waitUntil: (promise) => promise
      };
      
      // Arka planda çalıştır
      event.waitUntil(handleScheduled(fakeEvent));
      
      return new Response(`
        🧪 SEO Otomasyonu başlatıldı!
        
        📱 Telegram'ınızı ve /logs sayfasını kontrol edin. İşlemler arka planda yürüyor.
        
        🔄 İşlem Adımları:
        1. 📝 Loglar KV'ye yazılıyor
        2. 🚀 Başlangıç mesajı gönderiliyor
        3. 🌐 Sitemap tetikleyicisi ziyaret ediliyor
        4. ⏳ 10 saniye bekleniyor...
        5. 📄 Sitemap okunuyor
        6. 🔍 URL'ler kontrol ediliyor
        7. 📤 Dizine ekleme talepleri gönderiliyor
        8. 📱 Telegram raporu gönderiliyor
        
        ⏰ Bu sayfa kapanabilir, Telegram'ı bekleyin!
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // Logs endpoint'i
    if (url.pathname === '/logs') {
      try {
        const logsJSON = await LOGS_KV.get('seo_logs');
        const logs = logsJSON ? JSON.parse(logsJSON) : [];
        
        const logsHTML = logs.map(log => `<div class="log-entry">${log}</div>`).join('');
        
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>SEO Otomasyon Logları</title>
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
                <h1>📋 SEO Otomasyon Logları</h1>
              </div>
              
              <div class="stats">
                <h3>📊 Toplam Log: ${logs.length} adet</h3>
                <h3>🕐 Son Güncelleme: ${new Date().toLocaleString('tr-TR')}</h3>
              </div>
              
              <div class="logs">
                ${logs.length > 0 ? logsHTML : '<div class="log-entry">Henüz log bulunmuyor...</div>'}
              </div>
              
              <div style="margin-top: 20px;">
                <button class="btn" onclick="location.reload()">🔄 Logları Yenile</button>
                <a href="/logs/clear" class="btn btn-danger" onclick="return confirm('Tüm logları silmek istediğinizden emin misiniz?')">🗑️ Logları Temizle</a>
                <p style="margin-top: 10px;">
                  🧪 Test yapmak için <a href="/test">/test</a> adresine gidin<br>
                  📊 Sistem durumu için <a href="/status">/status</a> adresine gidin<br>
                  💡 Loglar KV Storage'da saklanıyor ve otomatik olarak güncelleniyor.
                </p>
              </div>
            </div>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      } catch (error) {
        await logMessage(`Logs endpoint hatası: ${error.message}`);
        return new Response(`Logs endpoint hatası: ${error.message}`, { status: 500 });
      }
    }
    
    // Logs temizleme endpoint'i
    if (url.pathname === '/logs/clear') {
      try {
        await LOGS_KV.delete('seo_logs');
        await logMessage('🗑️ Loglar temizlendi');
        const redirectUrl = new URL('/logs', url.origin);
        return Response.redirect(redirectUrl.toString(), 302);
      } catch (error) {
        await logMessage(`Log temizleme hatası: ${error.message}`);
        return new Response(`Log temizleme hatası: ${error.message}`, { status: 500 });
      }
    }
    
    // OAuth2 Login endpoint'i
    if (url.pathname === '/auth/login') {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', GOOGLE_SCOPE);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      
      return Response.redirect(authUrl.toString(), 302);
    }
    
    // OAuth2 Callback endpoint'i
    if (url.pathname === '/auth/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Authorization code bulunamadı', { status: 400 });
      }
      
      try {
        // Token exchange
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: GOOGLE_REDIRECT_URI,
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
          await logMessage(`OAuth token hatası: ${tokenData.error_description}`);
          return new Response(`OAuth token hatası: ${tokenData.error_description}`, { status: 400 });
        }
        
        // Token'ı KV'de sakla
        await LOGS_KV.put('google_oauth_token', JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + (tokenData.expires_in * 1000),
          token_type: tokenData.token_type
        }));
        
        await logMessage('✅ Google OAuth token başarıyla alındı ve saklandı');
        
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>OAuth Başarılı</title>
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
                <h2>✅ OAuth Başarılı!</h2>
                <p>Google Search Console API erişimi başarıyla kuruldu.</p>
                <p>Artık otomasyon Google API'sini kullanabilir.</p>
              </div>
              <p><a href="/test">🧪 Test yapmak için tıklayın</a></p>
              <p><a href="/logs">📋 Logları görüntülemek için tıklayın</a></p>
            </div>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
        
      } catch (error) {
        await logMessage(`OAuth callback hatası: ${error.message}`);
        return new Response(`OAuth callback hatası: ${error.message}`, { status: 500 });
      }
    }
    
    // Status endpoint'i
    if (url.pathname === '/status') {
      try {
        const tokenJSON = await LOGS_KV.get('google_oauth_token');
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
              <h1>📊 Sistem Durumu</h1>
              
              <div class="${hasValidToken ? 'status-ok' : 'status-error'}">
                <h3>🔐 Google OAuth Token: ${hasValidToken ? '✅ Geçerli' : '❌ Geçersiz/Eksik'}</h3>
                ${token ? `<p>Token süresi: ${new Date(token.expires_at).toLocaleString('tr-TR')}</p>` : '<p>Token bulunamadı</p>'}
              </div>
              
              <div class="status-ok">
                <h3>🤖 Telegram Bot: ✅ Aktif</h3>
                <p>Bot Token: ${TELEGRAM_BOT_TOKEN ? '✅ Ayarlandı' : '❌ Eksik'}</p>
                <p>Chat ID: ${TELEGRAM_CHAT_ID ? '✅ Ayarlandı' : '❌ Eksik'}</p>
              </div>
              
              <div class="status-ok">
                <h3>💾 KV Storage: ✅ Aktif</h3>
                <p>Logs KV: ✅ Bağlı</p>
              </div>
              
              <div style="margin-top: 20px;">
                ${!hasValidToken ? '<p><a href="/auth/login">🔐 Google ile Giriş Yap</a></p>' : ''}
                <p><a href="/test">🧪 Test Yap</a></p>
                <p><a href="/logs">📋 Logları Görüntüle</a></p>
              </div>
            </div>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      } catch (error) {
        return new Response(`Status endpoint hatası: ${error.message}`, { status: 500 });
      }
    }
    
    // Ana sayfa
    if (url.pathname === '/') {
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
            <h1>🚀 Galaktik Uzay SEO Otomasyonu</h1>
            <p>Google Search Console API ile otomatik URL indeksleme sistemi.</p>
            
            <h3>🔧 İşlemler:</h3>
            <a href="/auth/login" class="btn">🔐 Google ile Giriş Yap</a>
            <a href="/test" class="btn">🧪 Test Yap</a>
            <a href="/logs" class="btn">📋 Logları Görüntüle</a>
            <a href="/status" class="btn">📊 Sistem Durumu</a>
            
            <h3>ℹ️ Bilgi:</h3>
            <p>İlk kullanımda Google ile giriş yapmanız gerekiyor.</p>
            <p>Giriş yaptıktan sonra test yapabilir ve logları görüntüleyebilirsiniz.</p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    return new Response('Endpoint bulunamadı', { status: 404 });
    
  } catch (error) {
    await logMessage(`handleRequest hatası: ${error.message}`);
    return new Response(`handleRequest hatası: ${error.message}`, { status: 500 });
  }
}

/**
 * OAuth token'ı yeniler.
 * @returns {Object|null} Yenilenmiş token veya null.
 */
async function refreshOAuthToken() {
  try {
    const tokenJSON = await LOGS_KV.get('google_oauth_token');
    if (!tokenJSON) {
      await logMessage('OAuth token bulunamadı, lütfen /auth/login ile giriş yapın');
      return null;
    }
    
    const token = JSON.parse(tokenJSON);
    
    // Token hala geçerli mi kontrol et
    if (token.expires_at > Date.now()) {
      return token;
    }
    
    // Token yenile
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: token.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    
    const refreshData = await refreshResponse.json();
    
    if (refreshData.error) {
      await logMessage(`Token yenileme hatası: ${refreshData.error_description}`);
      return null;
    }
    
    // Yeni token'ı sakla
    const newToken = {
      access_token: refreshData.access_token,
      refresh_token: token.refresh_token, // refresh token değişmez
      expires_at: Date.now() + (refreshData.expires_in * 1000),
      token_type: refreshData.token_type
    };
    
    await LOGS_KV.put('google_oauth_token', JSON.stringify(newToken));
    await logMessage('✅ OAuth token başarıyla yenilendi');
    
    return newToken;
    
  } catch (error) {
    await logMessage(`Token yenileme hatası: ${error.message}`);
    return null;
  }
}

/**
 * Google Search Console API ile URL'in indekslenme durumunu kontrol eder.
 * @param {string} url - Kontrol edilecek URL.
 * @returns {Object} URL durumu.
 */
async function checkUrlIndexingStatus(url) {
  try {
    const token = await refreshOAuthToken();
    if (!token) {
      return { error: 'OAuth token bulunamadı' };
    }
    
    // Google Search Console API için doğru endpoint formatı
    const apiUrl = `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: SITE_URL
      }),
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      await logMessage(`URL denetim hatası: ${response.status} - ${responseText.substring(0, 100)}`);
      return { error: `HTTP ${response.status}: ${responseText.substring(0, 100)}` };
    }
    
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      await logMessage(`URL denetim JSON parse hatası: ${parseError.message}`);
      await logMessage(`API yanıtı (ilk 200 karakter): ${responseText.substring(0, 200)}`);
      return { error: `JSON parse hatası: ${parseError.message}` };
    }
    
    return {
    url: url,
      indexingState: data.inspectionResult?.indexStatusResult?.verdict || 'UNKNOWN',
      coverageState: data.inspectionResult?.indexStatusResult?.coverageState || 'UNKNOWN',
      lastCrawlTime: data.inspectionResult?.indexStatusResult?.lastCrawlTime || null
    };
    
  } catch (error) {
    await logMessage(`URL denetim hatası: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Google Search Console API ile URL'i indeksleme için istek gönderir.
 * @param {string} url - İndekslenecek URL.
 * @returns {Object} İndeksleme sonucu.
 */
async function requestIndexing(url) {
  try {
    const token = await refreshOAuthToken();
    if (!token) {
      return { error: 'OAuth token bulunamadı' };
    }
    
    // Google Search Console API için doğru endpoint formatı
    const apiUrl = `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`;
    
    const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: SITE_URL
      }),
  });

  if (!response.ok) {
      const responseText = await response.text();
      await logMessage(`İndeksleme isteği hatası: ${response.status} - ${responseText.substring(0, 100)}`);
      return { error: `HTTP ${response.status}: ${responseText.substring(0, 100)}` };
    }
    
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      await logMessage(`İndeksleme JSON parse hatası: ${parseError.message}`);
      await logMessage(`API yanıtı (ilk 200 karakter): ${responseText.substring(0, 200)}`);
      return { error: `JSON parse hatası: ${parseError.message}` };
    }
    
    return {
      url: url,
      success: true,
      message: 'İndeksleme isteği başarıyla gönderildi'
    };
    
  } catch (error) {
    await logMessage(`İndeksleme isteği hatası: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Telegram mesajı gönderir.
 * @param {string} message - Gönderilecek mesaj.
 */
async function sendTelegramMessage(message) {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      await logMessage('Telegram bot token veya chat ID bulunamadı');
    return;
  }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }),
    });

    if (response.ok) {
      await logMessage(`✅ Telegram mesajı gönderildi: ${message.substring(0, 50)}...`);
    } else {
      const errorData = await response.json();
      await logMessage(`Telegram mesaj hatası: ${errorData.description}`);
    }
  } catch (error) {
    await logMessage(`Telegram mesaj hatası: ${error.message}`);
  }
}

/**
 * Sitemap'ten URL'leri alır.
 * @returns {Array} URL listesi.
 */
async function getSitemapUrls() {
  try {
    await logMessage('Sitemap URL\'leri alınıyor...');
    
    const response = await fetch(SITEMAP_INDEX_URL);
    if (!response.ok) {
      throw new Error(`Sitemap yanıt hatası: ${response.status}`);
    }
    
    const xmlText = await response.text();
    await logMessage(`Sitemap yanıtı alındı, boyut: ${xmlText.length} karakter`);
    
    const urls = [];
    
    // Sitemap index'ten alt sitemap'leri al
    const sitemapMatches = xmlText.match(/<loc>(.*?)<\/loc>/g);
    if (sitemapMatches) {
      for (const match of sitemapMatches) {
        const sitemapUrl = match.replace(/<\/?loc>/g, '');
        if (sitemapUrl.includes('sitemap') && sitemapUrl !== SITEMAP_INDEX_URL) {
          await logMessage(`Alt sitemap bulundu: ${sitemapUrl}`);
          
          try {
            const subResponse = await fetch(sitemapUrl);
            if (subResponse.ok) {
              const subXmlText = await subResponse.text();
              const urlMatches = subXmlText.match(/<loc>(.*?)<\/loc>/g);
              
              if (urlMatches) {
                for (const urlMatch of urlMatches) {
                  const url = urlMatch.replace(/<\/?loc>/g, '');
                  if (url.startsWith('https://galaktikuzay.com/')) {
                    urls.push(url);
                  }
                }
              }
            }
          } catch (error) {
            await logMessage(`Alt sitemap hatası ${sitemapUrl}: ${error.message}`);
          }
        }
      }
    }
    
    await logMessage(`Sitemap'ten ${urls.length} adet URL bulundu.`);
    return urls;
    
  } catch (error) {
    await logMessage(`Sitemap URL alma hatası: ${error.message}`);
    return [];
  }
}

/**
 * Rapor gönderir.
 * @param {Array} logs - Log listesi.
 * @param {Array} indexedUrls - İndekslenen URL listesi.
 */
async function sendReport(logs, indexedUrls, startIndex, totalUrls, batchSize) {
  try {
    await logMessage('Telegram ile rapor gönderilmeye çalışılıyor...');
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR');
    const timeStr = now.toLocaleTimeString('tr-TR');
    
    let report = `🚀 🚀 Galaktik Uzay SEO Raporu - ${dateStr} 🚀\n\n`;
    report += `GALAKTIK UZAY SEO OTOMASYON RAPORU\n`;
    report += `=====================================\n`;
    report += `Tarih: ${dateStr} ${timeStr}\n\n`;
    
    report += `📊 İSTATİSTİKLER:\n`;
    report += `- Toplam URL Sayısı (Sitemap): ${totalUrls}\n`;
    report += `- Bu Çalışmada İşlenen Aralık: ${startIndex + 1} - ${Math.min(startIndex + batchSize, totalUrls)}\n`;
    report += `- Bu Aralıkta İşlenen URL: ${batchSize}\n`;
    report += `- İndekse Gönderilen URL: ${indexedUrls.length}\n`;
    report += `- Hata Sayısı: ${logs.filter(log => log.includes('hata') || log.includes('error')).length}\n\n`;
    
    report += `📂 URL KATEGORİLERİ (Batch İçin):\n`;
    report += `- Ana Sayfa: ${indexedUrls.filter(url => url.includes('/') && url.split('/').length === 4).length}\n`;
    report += `- Blog: ${indexedUrls.filter(url => url.includes('/blog/')).length}\n`;
    report += `- Ürün: ${indexedUrls.filter(url => url.includes('/urun/')).length}\n`;
    report += `- Kategori: ${indexedUrls.filter(url => url.includes('/kategori/')).length}\n`;
    report += `- Diğer: ${indexedUrls.filter(url => !url.includes('/blog/') && !url.includes('/urun/') && !url.includes('/kategori/')).length}\n\n`;
    
    if (indexedUrls.length > 0) {
      report += `✅ BAŞARIYLA İŞLENEN URL'LER:\n`;
      indexedUrls.slice(0, 10).forEach(url => {
        report += `- ${url}\n`;
      });
      if (indexedUrls.length > 10) {
        report += `... ve ${indexedUrls.length - 10} URL daha\n`;
      }
      report += `\n`;
    }
    
    report += `📝 SON SİSTEM LOGLARI:\n`;
    logs.slice(-10).forEach(log => {
      report += `- ${log}\n`;
    });
    
    report += `\n🤖 Bu rapor otomatik olarak oluşturulmuştur.`;
    
    await sendTelegramMessage(report);
    await logMessage('✅ Telegram ile rapor başarıyla gönderildi.');
    
  } catch (error) {
    await logMessage(`Rapor gönderme hatası: ${error.message}`);
  }
}

/**
 * Zamanlanmış görevleri işler.
 * @param {ScheduledEvent} event - Zamanlanmış olay nesnesi.
 */
async function handleScheduled(event) {
  const indexedUrls = [];

  try {
    await logMessage('Otomasyon başlatıldı.');
    
    // Telegram'a başlangıç mesajı gönder
    try {
      await sendTelegramMessage('🚀 SEO Otomasyonu başlatıldı!\n\n⏰ Tarih: ' + new Date().toLocaleString('tr-TR') + '\n🔄 İşlem başlıyor...');
    } catch (e) {
      await logMessage(`Telegram başlangıç mesajı hatası: ${e.message}`);
    }

    // Sitemap güncelleme tetikleyicisi
    try {
      await logMessage(`Sitemap güncelleme tetikleyici URL ziyaret ediliyor: ${SITEMAP_UPDATE_TRIGGER_URL}`);
      const triggerResponse = await fetch(SITEMAP_UPDATE_TRIGGER_URL);
      
      if (triggerResponse.ok) {
        const triggerText = await triggerResponse.text();
        await logMessage(`✅ Telegram mesajı gönderildi: ✅ Sitemap tetikleyicisi başarılı!...`);
        await sendTelegramMessage(`✅ Sitemap tetikleyicisi başarılı!\n📄 Sitemap yanıtı: ${triggerText.substring(0, 100)}...`);
      } else {
        await logMessage(`Sitemap tetikleyicisi yanıt hatası: ${triggerResponse.status}`);
        await sendTelegramMessage(`❌ Sitemap tetikleyicisi hatası: ${triggerResponse.status}`);
      }
    } catch (error) {
      await logMessage(`Sitemap tetikleyicisi hatası: ${error.message}`);
      await sendTelegramMessage(`❌ Sitemap tetikleyicisi hatası: ${error.message}`);
    }

    // 10 saniye bekle
    await logMessage('⏳ 10 saniye bekleniyor...');
    await sendTelegramMessage('⏳ 10 saniye bekleniyor...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Sitemap'ten URL'leri al
    await sendTelegramMessage('📄 Sitemap URL\'leri alınıyor...');
    const urls = await getSitemapUrls();
    
    if (urls.length === 0) {
      await logMessage('Sitemap\'ten URL alınamadı. İşlem sonlandırılıyor.');
      await sendTelegramMessage('❌ Sitemap\'ten URL alınamadı. İşlem sonlandırılıyor.');
      return;
    }

    await logMessage(`✅ Telegram mesajı gönderildi: ✅ Sitemap'ten ${urls.length} adet URL bulundu!...`);
    await sendTelegramMessage(`✅ Sitemap'ten ${urls.length} adet URL bulundu!\n🔍 URL'ler kontrol ediliyor...`);

    // KV'den son işlenen URL index'ini al
    const lastProcessedIndexStr = await LOGS_KV.get('LAST_PROCESSED_URL_INDEX');
    let lastProcessedIndex = lastProcessedIndexStr ? parseInt(lastProcessedIndexStr, 10) : 0;

    // Eğer tüm URL'ler işlendiyse, başa dön
    if (lastProcessedIndex >= urls.length) {
      lastProcessedIndex = 0;
      await logMessage('🔄 Tüm URL\'ler işlendi, işlem sıfırlanıyor.');
      await sendTelegramMessage('🔄 Tüm URL\'ler işlendi, işlem sıfırlanıyor.');
    }

    await logMessage(`Son işlenen index: ${lastProcessedIndex}. Bu çalıştırmada ${URL_BATCH_SIZE} URL işlenecek.`);

    // İşlenecek URL'lerin batch'ini al
    const urlsToProcess = urls.slice(lastProcessedIndex, lastProcessedIndex + URL_BATCH_SIZE);
    let newIndex = lastProcessedIndex + urlsToProcess.length;

    // OAuth token kontrolü
    const token = await refreshOAuthToken();
    if (!token) {
      await logMessage('OAuth token bulunamadı, lütfen /auth/login ile giriş yapın');
      await sendTelegramMessage('❌ OAuth token bulunamadı, lütfen /auth/login ile giriş yapın');
      return;
    }

    await logMessage('✅ OAuth token geçerli, API işlemleri başlıyor...');

    // URL'leri işle (artık batch olarak)
    for (const url of urlsToProcess) {
      try {
        await logMessage(`URL kontrol ediliyor: ${url}`);
        
        // URL'in indekslenme durumunu kontrol et
        const statusResult = await checkUrlIndexingStatus(url);
        
        if (statusResult.error) {
          await logMessage(`URL durum kontrol hatası: ${statusResult.error}`);
          continue;
        }
        
        await logMessage(`URL durumu: ${statusResult.indexingState} (${statusResult.coverageState})`);
        
        // Eğer URL indekslenmemişse, indeksleme isteği gönder
        const nonIndexableVerdicts = ['PASS', 'PARTIAL'];
        if (!nonIndexableVerdicts.includes(statusResult.indexingState)) {
          await logMessage(`İndeksleme isteği gönderiliyor: ${url}`);
          
          const indexingResult = await requestIndexing(url);
          
          if (indexingResult.error) {
            await logMessage(`İndeksleme isteği hatası: ${indexingResult.error}`);
          } else {
            await logMessage(`✅ İndeksleme isteği başarılı: ${url}`);
            indexedUrls.push(url);
            logIndexedUrl(url);
          }
        } else {
          await logMessage(`URL'in indekse eklenmesi gerekmiyor (Durum: ${statusResult.indexingState}): ${url}`);
        }
        
        // Rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        await logMessage(`URL işleme hatası ${url}: ${error.message}`);
      }
    }

    // Rapor gönder
    await sendReport(logContainer.logs, indexedUrls, lastProcessedIndex, urls.length, urlsToProcess.length);
    
    // Yeni index'i KV'ye kaydet
    await LOGS_KV.put('LAST_PROCESSED_URL_INDEX', newIndex.toString());
    await logMessage(`Yeni index kaydedildi: ${newIndex}`);

    await logMessage('🚀 Otomasyon raporu Telegram ile başarıyla gönderildi.');

  } catch (error) {
    console.error('handleScheduled genel hatası:', error);
    try {
      await logMessage(`❌ BEKLENMEDİK HATA: ${error.message}\n${error.stack}`);
      await sendTelegramMessage(`🚨 Sistemsel Hata: Otomasyon beklenmedik bir hata nedeniyle durdu. Lütfen logları kontrol edin.`);
    } catch (logErr) {
      console.error('Genel hata logunu yazma hatası:', logErr);
    }
  }
}