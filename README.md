# 🚀 Galaktik Uzay SEO Otomasyonu

Google Search Console API ile URL indeksleme otomasyonu.

## ✨ Özellikler

- ✅ **Google OAuth2** kimlik doğrulama
- ✅ **Sitemap otomatik okuma** (XML sitemap'lerden URL çıkarma)
- ✅ **URL indeksleme durumu kontrolü** (Google Search Console API)
- ✅ **Otomatik indeksleme istekleri** (henüz indekslenmemiş URL'ler için)
- ✅ **Telegram bildirimleri** (raporlar ve hata bildirimleri)
- ✅ **Cron job'lar** (günde 4 kez otomatik çalışma)
- ✅ **Web arayüzü** (test, loglar, durum sayfaları)
- ✅ **Zaman sınırı yok** (Railway.app platformu)

## 🚂 Railway.app Deploy

### 1. Repository Oluştur
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/galaktik-uzay-seo-otomasyonu.git
git push -u origin main
```

### 2. Railway'de Proje Oluştur
1. [Railway.app](https://railway.app) adresine git
2. "New Project" → "Deploy from GitHub repo"
3. Repository'yi seç ve deploy et

### 3. Environment Variables Ayarla
Railway dashboard'da şu environment variable'ları ekle:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REFRESH_TOKEN=your_google_refresh_token_here
TELEGRAM_BOT_TOKEN=7301046008:AAGpYNjdY6hdjGiuGfTcfW168YpeTCLiANc
TELEGRAM_CHAT_ID=1104321474
```

## 🔧 Google OAuth2 Kurulumu

### 1. Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com) → "APIs & Services" → "Credentials"
2. OAuth client ID oluştur
3. Authorized redirect URIs'ye ekle: `https://your-railway-domain.railway.app/auth/callback`

### 2. Refresh Token Alma
```bash
# OAuth2 flow ile refresh token al
node get-refresh-token.js
```

## 📱 Kullanım

### Web Arayüzü
- **Ana Sayfa**: `https://your-app.railway.app/`
- **Manuel Test**: `https://your-app.railway.app/test`
- **Loglar**: `https://your-app.railway.app/logs`
- **Durum**: `https://your-app.railway.app/status`

### Otomatik Çalışma
- Her gün saat 06:00
- Her gün saat 12:00  
- Her gün saat 18:00
- Her gün saat 00:00

## 🔍 API Endpoints

- `GET /` - Ana sayfa
- `GET /test` - Manuel test başlat
- `GET /logs` - Logları görüntüle
- `GET /logs/clear` - Logları temizle
- `GET /status` - Sistem durumu (JSON)

## 📊 Rapor Örneği

```
🚀 Galaktik Uzay SEO Raporu - 03.10.2025 15:30:00

📊 İSTATİSTİKLER:
- Toplam URL Sayısı: 80
- İşlenen URL Sayısı: 80
- İndekslenen URL Sayısı: 15
- Hata Sayısı: 0

📂 URL KATEGORİLERİ:
- Ana Sayfa: 1
- Blog: 25
- Ürün: 30
- Kategori: 15
- Diğer: 9

✅ BAŞARIYLA İŞLENEN URL'LER:
📤 15 URL Google'a indeksleme isteği gönderildi
```

## 🛠️ Geliştirme

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme modunda çalıştır
npm run dev

# Production modunda çalıştır
npm start
```

## 📝 Notlar

- Railway.app ücretsiz planda 500 saat/ay limiti var
- Loglar bellekte saklanıyor (restart'ta sıfırlanır)
- Google Search Console API günlük limitleri: 2,000 sorgu/gün
- Telegram bot token'ı güvenli tutun

## 🆘 Sorun Giderme

### OAuth2 Hatası
- Google Cloud Console'da redirect URI'yi kontrol edin
- Refresh token'ın geçerli olduğundan emin olun

### Telegram Mesajları Gelmiyor
- Bot token'ını kontrol edin
- Chat ID'yi doğrulayın
- Bot'un mesaj gönderme iznine sahip olduğundan emin olun

### URL'ler İşlenmiyor
- Sitemap URL'lerinin erişilebilir olduğunu kontrol edin
- Google Search Console'da sitenizin doğrulandığından emin olun
