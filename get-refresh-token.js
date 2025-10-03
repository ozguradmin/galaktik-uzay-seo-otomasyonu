const express = require('express');
const { google } = require('googleapis');

const app = express();
const PORT = 3001;

// OAuth2 credentials
const CLIENT_ID = 'your_google_client_id_here';
const CLIENT_SECRET = 'your_google_client_secret_here';
const REDIRECT_URI = 'http://localhost:3001/auth/callback';
const SCOPE = 'https://www.googleapis.com/auth/webmasters';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

app.get('/', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [SCOPE],
    prompt: 'consent'
  });
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google OAuth2 Refresh Token Alma</title>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #4285f4; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
        .btn { background: #34a853; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; font-size: 16px; }
        .btn:hover { background: #2d8f47; }
        .instructions { background: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔑 Google OAuth2 Refresh Token Alma</h1>
        </div>
        
        <div class="instructions">
          <h3>📋 Adımlar:</h3>
          <ol>
            <li>Aşağıdaki "Google'a Giriş Yap" butonuna tıklayın</li>
            <li>Google hesabınızla giriş yapın</li>
            <li>İzinleri onaylayın</li>
            <li>Refresh token'ı alın ve Railway environment variables'a ekleyin</li>
          </ol>
        </div>
        
        <div style="text-align: center;">
          <a href="${authUrl}" class="btn">🚀 Google'a Giriş Yap</a>
        </div>
        
        <div class="instructions">
          <h3>⚠️ Önemli Notlar:</h3>
          <ul>
            <li>Bu işlem sadece bir kez yapılır</li>
            <li>Refresh token'ı güvenli tutun</li>
            <li>Token'ı Railway environment variables'a eklemeyi unutmayın</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code bulunamadı');
    }
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
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
            ${tokens.refresh_token}
          </div>
          
          <div style="text-align: center;">
            <button class="btn" onclick="navigator.clipboard.writeText('${tokens.refresh_token}')">📋 Token'ı Kopyala</button>
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

app.listen(PORT, () => {
  console.log(`🔑 Refresh Token Alma Sunucusu başlatıldı!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📋 Railway environment variables'a ekleyeceğiniz refresh token'ı almak için yukarıdaki URL'ye gidin`);
});
