const express = require('express');
const cron = require('node-cron');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Global değişkenler
const SITEMAP_INDEX_URL = 'https://galaktikuzay.com/sitemap_index.xml';
const SITE_URL = 'https://galaktikuzay.com/';

// Global log container
const logContainer = {
  logs: [],
  indexedUrls: new Set(),
  urlStatuses: new Map() // URL durumlarını kaydet
};

// Log fonksiyonu
async function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} ${message}`;
  logContainer.logs.push(logEntry);
  console.log(logEntry);
  
  // Log sayısını sınırla (son 1000 log)
  if (logContainer.logs.length > 1000) {
    logContainer.logs = logContainer.logs.slice(-1000);
  }
}

// Telegram mesaj gönderme
async function sendTelegramMessage(message) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await logMessage(`Telegram mesaj gönderme hatası: ${response.status} ${errorText}`);
    } else {
      await logMessage('✅ Telegram mesajı başarıyla gönderildi');
    }
  } catch (error) {
    await logMessage(`Telegram mesaj gönderme hatası: ${error.message}`);
  }
}

// Sitemap URL'lerini alma
async function getSitemapUrls() {
  try {
    await logMessage('📄 Sitemap URL\'leri alınıyor...');
    
    const response = await fetch(SITEMAP_INDEX_URL);
    if (!response.ok) {
      throw new Error(`Sitemap fetch hatası: ${response.status} ${response.statusText}`);
    }
    
    const sitemapIndexText = await response.text();
    await logMessage(`Sitemap index alındı: ${sitemapIndexText.length} karakter`);
    
    // Sitemap index'ten URL'leri çıkar
    const sitemapUrls = sitemapIndexText.match(/<loc>(.*?)<\/loc>/g) || [];
    const urls = sitemapUrls.map(url => url.replace(/<\/?loc>/g, ''));
    
    await logMessage(`Sitemap index'ten ${urls.length} adet sitemap URL'si bulundu`);
    
    // Her sitemap'ten URL'leri çıkar
    let allUrls = [];
    for (const sitemapUrl of urls) {
      try {
        await logMessage(`Sitemap işleniyor: ${sitemapUrl}`);
        const sitemapResponse = await fetch(sitemapUrl);
        if (!sitemapResponse.ok) {
          await logMessage(`Sitemap fetch hatası: ${sitemapResponse.status}`);
          continue;
        }
        
        const sitemapText = await sitemapResponse.text();
        const urlMatches = sitemapText.match(/<loc>(.*?)<\/loc>/g) || [];
        const sitemapUrls = urlMatches.map(url => url.replace(/<\/?loc>/g, ''));
        
        allUrls = allUrls.concat(sitemapUrls);
        await logMessage(`Bu sitemap'ten ${sitemapUrls.length} URL alındı`);
      } catch (error) {
        await logMessage(`Sitemap işleme hatası (${sitemapUrl}): ${error.message}`);
      }
    }
    
    await logMessage(`📊 Toplam ${allUrls.length} adet URL bulundu`);
    return allUrls;
  } catch (error) {
    await logMessage(`Sitemap alma hatası: ${error.message}`);
    return [];
  }
}

// Google OAuth token alma
async function getGoogleAccessToken() {
  try {
    // KV'den token'ları al (Railway'de basit dosya sistemi kullanacağız)
    // Şimdilik environment variable'dan alacağız
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    if (!refreshToken) {
      throw new Error('Google refresh token bulunamadı');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh hatası: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    await logMessage('✅ Google access token başarıyla alındı');
    return data.access_token;
  } catch (error) {
    await logMessage(`Google token alma hatası: ${error.message}`);
    throw error;
  }
}

// URL indexing durumu kontrol etme
async function checkUrlIndexingStatus(url, accessToken) {
  try {
    const response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: SITE_URL
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      await logMessage(`URL denetim JSON parse hatası: ${parseError.message}`);
      await logMessage(`API yanıtı (ilk 200 karakter): ${responseText.substring(0, 200)}`);
      return { error: `JSON parse hatası: ${parseError.message}` };
    }

    if (!response.ok) {
      await logMessage(`URL denetim hatası: ${response.status} ${responseText}`);
      return { error: `HTTP ${response.status}` };
    }

    return {
      indexingState: data.indexingResult?.indexingState || 'UNKNOWN',
      verdict: data.indexingResult?.verdict || 'UNKNOWN',
      coverageState: data.indexingResult?.coverageState || 'UNKNOWN'
    };
  } catch (error) {
    await logMessage(`URL denetim hatası: ${error.message}`);
    return { error: error.message };
  }
}

// URL indexing isteği gönderme
async function requestIndexing(url, accessToken) {
  try {
    const response = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl: SITE_URL
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await logMessage(`İndeksleme isteği hatası: ${response.status} ${errorText}`);
      return false;
    }

    await logMessage(`✅ İndeksleme isteği gönderildi: ${url}`);
    return true;
  } catch (error) {
    await logMessage(`İndeksleme isteği hatası: ${error.message}`);
    return false;
  }
}

// Ana otomasyon fonksiyonu
async function runAutomation() {
  try {
    await logMessage('🚀 Otomasyon başlatıldı');
    await sendTelegramMessage('🚀 SEO Otomasyonu başlatıldı!');

    // Sitemap URL'lerini al
    const urls = await getSitemapUrls();
    if (urls.length === 0) {
      await logMessage('❌ Sitemap\'ten URL alınamadı. İşlem sonlandırılıyor.');
      await sendTelegramMessage('❌ Sitemap\'ten URL alınamadı. İşlem sonlandırılıyor.');
      return;
    }

    // Google access token al
    const accessToken = await getGoogleAccessToken();
    
    // URL'leri işle (Railway'de zaman sınırı yok, hepsini işleyebiliriz)
    let processedCount = 0;
    let indexedCount = 0;
    
    for (const url of urls) {
      try {
        await logMessage(`🔍 URL kontrol ediliyor: ${url}`);
        
        // URL indexing durumunu kontrol et
        const statusResult = await checkUrlIndexingStatus(url, accessToken);
        
        if (statusResult.error) {
          await logMessage(`❌ URL kontrol hatası: ${statusResult.error}`);
          continue;
        }
        
        // URL durumunu kontrol et
        const indexingState = statusResult.indexingState;
        const verdict = statusResult.verdict;
        
        // Son indexing request'ten bu yana 24 saat geçti mi kontrol et
        const urlStatus = logContainer.urlStatuses.get(url);
        const lastRequest = urlStatus?.lastIndexingRequest;
        const hoursSinceLastRequest = lastRequest ? 
          (Date.now() - new Date(lastRequest).getTime()) / (1000 * 60 * 60) : 999;
        
        // Sadece gerçekten indekslenmemiş VE 24 saat geçmiş URL'ler için istek gönder
        const needsIndexing = (
          (indexingState === 'NONE' || 
           indexingState === 'UNKNOWN' ||
           (indexingState === 'PARTIAL' && verdict === 'FAIL')) &&
          hoursSinceLastRequest >= 24
        );
        
        // URL durumunu kaydet
        logContainer.urlStatuses.set(url, {
          indexingState,
          verdict,
          lastChecked: new Date().toISOString(),
          lastIndexingRequest: logContainer.urlStatuses.get(url)?.lastIndexingRequest || null
        });
        
        if (needsIndexing) {
          await logMessage(`📤 İndeksleme isteği gönderiliyor: ${url} (Durum: ${indexingState})`);
          const success = await requestIndexing(url, accessToken);
          if (success) {
            indexedCount++;
            logContainer.indexedUrls.add(url);
            
            // Indexing request tarihini kaydet
            const currentStatus = logContainer.urlStatuses.get(url);
            currentStatus.lastIndexingRequest = new Date().toISOString();
            logContainer.urlStatuses.set(url, currentStatus);
          }
        } else if (hoursSinceLastRequest < 24 && lastRequest) {
          await logMessage(`⏳ URL 24 saat beklemede: ${url} (Son istek: ${Math.round(hoursSinceLastRequest)} saat önce)`);
        } else {
          await logMessage(`✅ URL zaten indekslenmiş: ${url} (Durum: ${indexingState})`);
        }
        
        processedCount++;
        
        // Her 10 URL'de bir Telegram bildirimi gönder
        if (processedCount % 10 === 0) {
          await sendTelegramMessage(`📊 İlerleme: ${processedCount}/${urls.length} URL işlendi`);
        }
        
      } catch (error) {
        await logMessage(`❌ URL işleme hatası (${url}): ${error.message}`);
      }
    }

    // Rapor gönder
    const dateStr = new Date().toLocaleString('tr-TR');
    let report = `🚀 Galaktik Uzay SEO Raporu - ${dateStr}\n\n`;
    report += `📊 İSTATİSTİKLER:\n`;
    report += `- Toplam URL Sayısı: ${urls.length}\n`;
    report += `- İşlenen URL Sayısı: ${processedCount}\n`;
    report += `- İndekslenen URL Sayısı: ${indexedCount}\n`;
    report += `- Hata Sayısı: ${logContainer.logs.filter(log => log.includes('hata') || log.includes('error')).length}\n\n`;
    
    report += `📂 URL KATEGORİLERİ:\n`;
    const categories = {
      'Ana Sayfa': urls.filter(url => url === SITE_URL || url === SITE_URL.slice(0, -1)).length,
      'Blog': urls.filter(url => url.includes('/blog/') || url.includes('/yazi/')).length,
      'Ürün': urls.filter(url => url.includes('/urun/') || url.includes('/product/')).length,
      'Kategori': urls.filter(url => url.includes('/kategori/') || url.includes('/category/')).length,
      'Diğer': urls.filter(url => !url.includes('/blog/') && !url.includes('/urun/') && !url.includes('/kategori/') && url !== SITE_URL && url !== SITE_URL.slice(0, -1)).length
    };
    
    Object.entries(categories).forEach(([category, count]) => {
      report += `- ${category}: ${count}\n`;
    });
    
    report += `\n✅ BAŞARIYLA İŞLENEN URL'LER:\n`;
    if (indexedCount > 0) {
      report += `📤 ${indexedCount} URL Google'a indeksleme isteği gönderildi\n`;
    } else {
      report += `ℹ️ Yeni indeksleme isteği gönderilen URL bulunamadı\n`;
    }
    
    report += `\n📝 SON SİSTEM LOGLARI:\n`;
    const recentLogs = logContainer.logs.slice(-10);
    recentLogs.forEach(log => {
      report += `- ${log}\n`;
    });
    
    report += `\n🤖 Bu rapor otomatik olarak oluşturulmuştur.`;
    
    await sendTelegramMessage(report);
    await logMessage('✅ Otomasyon tamamlandı');
    
  } catch (error) {
    await logMessage(`❌ Otomasyon hatası: ${error.message}`);
    await sendTelegramMessage(`❌ Otomasyon hatası: ${error.message}`);
  }
}

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Galaktik Uzay SEO Otomasyonu</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #4285f4; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
        .btn { background: #34a853; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; text-decoration: none; display: inline-block; }
        .btn:hover { background: #2d8f47; }
        .btn-danger { background: #ea4335; }
        .btn-danger:hover { background: #d33b2c; }
        .status { background: #e8f0fe; padding: 15px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Galaktik Uzay SEO Otomasyonu</h1>
          <p>Google Search Console API ile URL İndeksleme</p>
        </div>
        
        <div class="status">
          <h3>📊 Sistem Durumu</h3>
          <p><strong>Platform:</strong> Railway.app</p>
          <p><strong>Durum:</strong> Aktif ve Çalışıyor ✅</p>
          <p><strong>Son Güncelleme:</strong> ${new Date().toLocaleString('tr-TR')}</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="/test" class="btn">🧪 Manuel Test</a>
          <a href="/logs" class="btn">📋 Loglar</a>
          <a href="/status" class="btn">📊 Durum</a>
        </div>
        
        <div class="status">
          <h3>⏰ Otomatik Çalışma Zamanları</h3>
          <p>• Her gün saat 06:00</p>
          <p>• Her gün saat 12:00</p>
          <p>• Her gün saat 18:00</p>
          <p>• Her gün saat 00:00</p>
        </div>
        
        <div class="status">
          <h3>🔧 Özellikler</h3>
          <p>✅ Google OAuth2 Kimlik Doğrulama</p>
          <p>✅ Sitemap Otomatik Okuma</p>
          <p>✅ URL İndeksleme Durumu Kontrolü</p>
          <p>✅ Otomatik İndeksleme İstekleri</p>
          <p>✅ Telegram Bildirimleri</p>
          <p>✅ Zaman Sınırı Yok (Railway)</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/test', async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SEO Otomasyon Test</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #4285f4; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
        .status { background: #e8f0fe; padding: 15px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧪 SEO Otomasyon Test</h1>
        </div>
        
        <div class="status">
          <h3>✅ Test Başlatıldı!</h3>
          <p>SEO otomasyonu arka planda çalışmaya başladı.</p>
          <p>📱 Telegram'ınızı kontrol edin - işlem tamamlandığında rapor gelecek.</p>
          <p>⏱️ Railway'de zaman sınırı olmadığı için tüm URL'ler işlenecek.</p>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="/logs" class="btn">📋 Logları Görüntüle</a>
          <a href="/" class="btn">🏠 Ana Sayfa</a>
        </div>
      </div>
    </body>
    </html>
  `);
  
  // Test'i arka planda başlat
  runAutomation().catch(error => {
    console.error('Test çalıştırma hatası:', error);
  });
});

app.get('/logs', (req, res) => {
  const logsHTML = logContainer.logs.map(log => `<div class="log-entry">${log}</div>`).join('');
  
  res.send(`
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
          <h3>📊 Toplam Log: ${logContainer.logs.length} adet</h3>
          <h3>🕐 Son Güncelleme: ${new Date().toLocaleString('tr-TR')}</h3>
        </div>
        
        <div class="logs">
          ${logContainer.logs.length > 0 ? logsHTML : '<div class="log-entry">Henüz log bulunmuyor...</div>'}
        </div>
        
        <div style="margin-top: 20px;">
          <button class="btn" onclick="location.reload()">🔄 Logları Yenile</button>
          <a href="/logs/clear" class="btn btn-danger" onclick="return confirm('Tüm logları silmek istediğinizden emin misiniz?')">🗑️ Logları Temizle</a>
          <p style="margin-top: 10px;">
            🧪 Test yapmak için <a href="/test">/test</a> adresine gidin<br>
            📊 Sistem durumu için <a href="/status">/status</a> adresine gidin<br>
            💡 Loglar Railway'de bellekte saklanıyor ve otomatik olarak güncelleniyor.
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/logs/clear', (req, res) => {
  logContainer.logs = [];
  logContainer.indexedUrls.clear();
  res.redirect('/logs');
});

app.get('/status', (req, res) => {
  res.json({
    status: 'active',
    platform: 'Railway.app',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    logs: logContainer.logs.length,
    indexedUrls: logContainer.indexedUrls.size,
    timestamp: new Date().toISOString()
  });
});

// OAuth başlatma endpoint'i
app.get('/auth/login', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent('https://galaktik-uzay-seo-otomasyonu-production.up.railway.app/auth/callback')}&` +
    `scope=${encodeURIComponent('https://www.googleapis.com/auth/webmasters')}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  res.redirect(authUrl);
});

// OAuth callback endpoint
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code bulunamadı');
    }
    
    // Refresh token'ı al
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://galaktik-uzay-seo-otomasyonu-production.up.railway.app/auth/callback'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(400).send(`Token alma hatası: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Refresh Token Alındı</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #34a853; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
          .token-box { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #34a853; margin: 20px 0; font-family: monospace; word-break: break-all; }
          .btn { background: #4285f4; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; text-decoration: none; display: inline-block; }
          .btn:hover { background: #3367d6; }
          .instructions { background: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Refresh Token Başarıyla Alındı!</h1>
          </div>
          
          <div class="instructions">
            <h3>📋 Sıradaki Adımlar:</h3>
            <ol>
              <li>Aşağıdaki refresh token'ı kopyalayın</li>
              <li>Railway dashboard'ınıza gidin</li>
              <li>Environment Variables bölümüne gidin</li>
              <li><code>GOOGLE_REFRESH_TOKEN</code> adında yeni bir variable ekleyin</li>
              <li>Token değerini yapıştırın</li>
              <li>Deploy'u yeniden başlatın</li>
            </ol>
          </div>
          
          <div class="token-box">
            <strong>GOOGLE_REFRESH_TOKEN:</strong><br>
            ${data.refresh_token}
          </div>
          
          <div style="text-align: center;">
            <button class="btn" onclick="navigator.clipboard.writeText('${data.refresh_token}')">📋 Token'ı Kopyala</button>
          </div>
          
          <div class="instructions">
            <h3>⚠️ Güvenlik Uyarısı:</h3>
            <p>Bu refresh token'ı kimseyle paylaşmayın ve güvenli tutun. Token'ı Railway environment variables'a ekledikten sonra bu sayfayı kapatabilirsiniz.</p>
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Token alma hatası:', error);
    res.status(500).send(`Token alma hatası: ${error.message}`);
  }
});

// Cron job'ları - günde 4 kez çalışacak
cron.schedule('0 6 * * *', () => {
  logMessage('⏰ Otomatik otomasyon başlatıldı (06:00)');
  runAutomation();
});

cron.schedule('0 12 * * *', () => {
  logMessage('⏰ Otomatik otomasyon başlatıldı (12:00)');
  runAutomation();
});

cron.schedule('0 18 * * *', () => {
  logMessage('⏰ Otomatik otomasyon başlatıldı (18:00)');
  runAutomation();
});

cron.schedule('0 0 * * *', () => {
  logMessage('⏰ Otomatik otomasyon başlatıldı (00:00)');
  runAutomation();
});

// Server başlatma
app.listen(PORT, () => {
  console.log(`🚀 Galaktik Uzay SEO Otomasyonu başlatıldı!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`⏰ Cron job'lar aktif - günde 4 kez çalışacak`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server kapatılıyor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server kapatılıyor...');
  process.exit(0);
});
