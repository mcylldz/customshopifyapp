# Shopify Upload - Local Proxy Çözümü

## 🎯 N8N Olmadan Çalışma

Artık Shopify upload için N8N'e gerek yok! Basit bir local proxy server kullanıyoruz.

---

## 🚀 Kurulum (5 Dakika)

### 1. Proxy Server'ı Başlatın

Terminal'de shopifytool klasörüne gidin:

```bash
cd /Users/mehmetcanyildiz/Desktop/shopifytool
node shopify-proxy.js
```

**Çıktı:**
```
✅ Shopify Proxy Server running on http://localhost:3001
   Ready to accept requests from app.html
```

### 2. App'i Çalıştırın

Python server ile:
```bash
python3 -m http.server 8000
```

Tarayıcıda:
```
http://localhost:8000/app.html
```

---

## ✅ Nasıl Çalışır

```
Browser (app.html)
    ↓ (HTTP request to localhost:3001)
Local Proxy (shopify-proxy.js)
    ↓ (HTTPS request to Shopify)
Shopify API
    ↓ (Response)
Local Proxy
    ↓ (Response with CORS headers)
Browser
```

**CORS Sorunu yok!** Çünkü:
- Browser → localhost:3001 (same origin ✅)
- localhost:3001 → Shopify (server-side, no CORS ✅)

---

## 📦 Kullanım

### Normal Kullanım:

1. **Terminal 1:** Proxy server çalıştır
   ```bash
   node shopify-proxy.js
   ```

2. **Terminal 2:** Python server çalıştır  
   ```bash
   python3 -m http.server 8000
   ```

3. **Browser:** `http://localhost:8000/app.html`

4. **Upload:** VTON/Ghost/Fabric/Size Chart yapın → Upload butonuna basın ✅

---

## 🔄 Otomatik Başlatma (İsteğe Bağlı)

Her seferinde iki terminal açmak yerine tek komutla başlatın:

### package.json Oluşturun:

```json
{
  "name": "shopifytool",
  "scripts": {
    "start": "node shopify-proxy.js & python3 -m http.server 8000"
  }
}
```

### Tek Komutla Başlat:

```bash
npm start
```

---

## 🐛 Sorun Giderme

### "Error: listen EADDRINUSE"
Port 3001 zaten kullanılıyor.

**Çözüm:**
```bash
# Port'u değiştir shopify-proxy.js içinde
const PORT = 3002; // veya başka bir port
```

Sonra `shopify-upload.js` içinde de değiştir:
```javascript
return 'http://localhost:3002';
```

### "Connection refused"
Proxy server çalışmıyor.

**Çözüm:**
```bash
node shopify-proxy.js
```

### Upload başarısız
API token'ları kontrol edin `config.js`:
```javascript
SHOPIFY: {
    STORE_B: {
        DOMAIN: "britishwoman.myshopify.com",
        ACCESS_TOKEN: "shpat_xxxxx" // ← Doğru mu?
    }
}
```

---

## 💡 Avantajlar

✅ **N8N Gerekmez** - Tamamen lokal  
✅ **Her Güncelleme için N8N Akışı Kurmaya Gerek Yok**  
✅ **Hızlı** - Direkt localhost  
✅ **Basit** - 20 satır kod  
✅ **Güvenli** - API token'lar local'de  
✅ **Ücretsiz** - Hiçbir servis gerekmiyor  

---

## 📊 Production İçin

Eğer uygulamayı production'a deploy edecekseniz:

### Seçenek 1: Vercel/Netlify Function
```javascript
// /api/shopify-upload.js
export default async function handler(req, res) {
    // shopify-proxy.js kodunu buraya kopyala
}
```

### Seçenek 2: Cloud Run / Heroku
`shopify-proxy.js`'i deploy et

### Seçenek 3: Nginx Reverse Proxy
Config nginx as proxy

---

## 🎉 Özet

**Şimdi:**
1. Proxy başlat: `node shopify-proxy.js`
2. App aç: `python3 -m http.server 8000`
3. Upload çalışır! ✅

**N8N'e gerek yok!** 🎊
