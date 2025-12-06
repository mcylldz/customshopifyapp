# Netlify Deployment Rehberi

WordPress'ten Shopify'a Ürün Aktarma Aracı - Tam deployment talimatları.

---

## ✅ Ön Gereksinimler

- GitHub hesabı
- Netlify hesabı (ücretsiz plan yeterli)
- Hazır API keyleriniz:
  - Shopify Store B bilgileri
  - OpenAI API key
  - FAL AI key
  - Google Sheets webhook URL

---

## 📦 Adım 1: Yerel Repository Hazırlığı

### 1.1 `.gitignore` Dosyasını Kontrol Edin

Şu dosyalar Git'e yüklenmemeli:
```
config.js
.env
node_modules/
```

✅ Zaten `.gitignore` dosyanızda mevcut

### 1.2 `config.js` Oluşturun

```bash
cp config-WORKING.js config.js
```

⚠️ **ÖNEMLİ**: `config.js` dosyasını asla Git'e yüklemeyin!

---

## 🌐 Adım 2: GitHub'a Yükleyin

### 2.1 Git'i Başlatın (henüz yapmadıysanız)

```bash
git init
git add .
git commit -m "Initial commit - WP to Shopify Product Builder"
```

### 2.2 GitHub Repository Oluşturun

1. https://github.com/new adresine gidin
2. Repository adı: `shopify-product-builder` (veya istediğiniz ad)
3. README ile başlatma seçeneğini **kapatın** (zaten dosyalarınız var)
4. Repository'yi oluşturun

### 2.3 GitHub'a Push Yapın

```bash
git remote add origin https://github.com/KULLANICI_ADINIZ/shopify-product-builder.git
git branch -M main
git push -u origin main
```

---

## 🚀 Adım 3: Netlify'de Deploy Edin

### 3.1 Repository'yi Import Edin

1. [Netlify](https://netlify.com)'a giriş yapın
2. "Add new site" → "Import an existing project" tıklayın
3. "GitHub" seçin
4. Netlify'a repository'lerinize erişim izni verin
5. `shopify-product-builder` repository'sini seçin

### 3.2 Build Ayarlarını Yapılandırın

Netlify `netlify.toml` dosyasından ayarları otomatik algılamalı:

- **Build command:** (boş bırakın)
- **Publish directory:** `.` (root)
- **Functions directory:** `netlify/functions`

"Deploy site" butonuna tıklayın

---

## 🔐 Adım 4: Environment Variables (Ortam Değişkenlerini) Ayarlayın

### 4.1 Environment Variables Ekleyin

1. Site settings → Environment variables gidin
2. Şu değişkenleri ekleyin:

#### Shopify Bilgileri
```
SHOPIFY_STORE_B_DOMAIN = thebritishwoman.myshopify.com
SHOPIFY_STORE_B_TOKEN = shpat_gercek_tokeniniz_buraya
```

#### OpenAI API
```
OPENAI_API_KEY = sk-proj-gercek_keyiniz_buraya
```

#### FAL AI
```
FAL_AI_KEY = fal_ai_keyiniz_buraya
```

#### Google Sheets
```
GOOGLE_SHEETS_WEBHOOK_URL = https://script.google.com/macros/s/webhook_urliniz_buraya/exec
```

### 4.2 Yeniden Deploy Edin

Environment variables ekledikten sonra:
1. Deploys sekmesine gidin
2. "Trigger deploy" → "Deploy site" tıklayın

---

## ✅ Adım 5: Deployed Uygulamayı Test Edin

### 5.1 Sitenizi Açın

Site URL'iniz: `https://SITE_ADINIZ.netlify.app`

### 5.2 Tüm İş Akışını Test Edin

1. **WordPress Scraping**
   - Bir WordPress ürün URL'si girin
   - "Scrape" tıklayın
   - Ürün verilerinin yüklendiğini doğrulayın

2. **Model Görsel Seçimi**
   - Shopify model URL'si girin
   - Görsellerin yüklendiğini doğrulayın

3. **VTON İşleme** (opsiyonel)
   - VTON pair'leri oluşturun
   - İşleyin ve sonuçları doğrulayın

4. **AI Üretimi**
   - Bir görsel seçin
   - "Generate AI Title & Description" tıklayın
   - Türkçe metinlerin geldiğini doğrulayın

5. **Fiyatlandırma**
   - Çarpan seçin
   - Hesaplamanın doğru olduğunu kontrol edin

6. **Shopify'a Yayınlama**
   - Tüm verileri gözden geçirin
   - "Publish to Shopify" tıklayın
   - Başarı mesajını doğrulayın
   - Shopify admin'i kontrol edin

7. **Google Sheets**
   - "stok" sayfasında yeni satırları kontrol edin

---

## 🐛 Sorun Giderme

### Console'da Functions için 404 Hatası

**Sorun:** `/.netlify/functions/proxy` 404 döndürüyor

**Çözüm:**
1. `netlify.toml` dosyasının root dizinde olduğundan emin olun
2. `/netlify/functions/proxy.js` dosyasının var olduğunu doğrulayın
3. Siteyi yeniden deploy edin

### Environment Variables Çalışmıyor

**Sorun:** API çağrıları 401 veya eksik credentials hatası veriyor

**Çözüm:**
1. Site settings → Environment variables gidin
2. Tüm değişkenlerin ayarlanmış olduğunu doğrulayın
3. "Trigger deploy" ile yeniden deploy edin

### WordPress Scraping Başarısız

**Sorun:** CORS hatası veya timeout

**Çözüm:**
- Bu bir Netlify Function sorunu
- Function loglarını kontrol edin: Site → Functions → proxy
- Function'ın doğru deploy edildiğinden emin olun

### OpenAI Generation Başarısız

**Sorun:** 401 veya "invalid API key"

**Çözüm:**
1. `OPENAI_API_KEY` environment variable'ı doğrulayın
2. Key'i önce local'de test edin
3. Doğru key'i ayarladıktan sonra yeniden deploy edin

---

## 📊 İzleme

### Function Loglarını Görüntüleyin

1. Netlify site dashboard'unuza gidin
2. Functions tab → proxy
3. Son çağrıları ve logları görüntüleyin

### Analytics

Netlify dashboard'u gösterir:
- Bandwidth kullanımı
- Function çağrı sayısı
- Build dakikaları

Ücretsiz plan limitleri:
- Ayda 125K function isteği
- Ayda 100GB bandwidth

---

## 🔄 Güncellemeler ve Yeniden Deployment

### Değişiklik Yapmak

1. Dosyaları local'de düzenleyin
2. Local'de test edin:
   ```bash
   python3 -m http.server 8000
   node shopify-proxy.js  # Local test için
   ```

3. Commit ve push yapın:
   ```bash
   git add .
   git commit -m "Güncelleme: yapılan değişikliklerin açıklaması"
   git push
   ```

4. Netlify push'ta otomatik deploy yapar ✅

---

## 🎯 Local vs Production

Uygulama otomatik olarak ortamı algılar:

**Local** (`localhost:8000`):
- `http://localhost:3001` proxy kullanır
- `config.js` dosyasından yükler

**Netlify** (production):
- `/.netlify/functions/proxy` kullanır
- Environment variables kullanır

Kod değişikliği gerekmiyor! 🎉

---

## 🔒 Güvenlik En İyi Uygulamaları

1. ✅ `config.js` dosyasını **asla** Git'e yüklemeyin
2. ✅ Production için **Netlify environment variables** kullanın
3. ✅ **API keylerini kısıtlayın**:
   - Shopify: Sadece gerekli izinleri verin
   - OpenAI: Kullanım limitleri ayarlayın
   - Google Sheets: Service account kullanın

4. ✅ **Kullanımı izleyin**:
   - Netlify analytics'i kontrol edin
   - İlgili platformlarda API kullanımını izleyin

---

## 📞 Destek

Sorunla karşılaşırsanız:

1. Netlify'deki function loglarını kontrol edin
2. Önce local'de test edin
3. Tüm environment variables'ların ayarlandığından emin olun
4. API key izinlerini kontrol edin

---

## ✨ Çalıştığı Onaylanmış Özellikler

- ✅ WordPress ürün scraping
- ✅ Shopify model görselleri getirme
- ✅ VTON işleme (4 mod)
- ✅ OpenAI Vision AI üretimi
- ✅ Fiyatlandırma hesaplayıcı
- ✅ Shopify ürün oluşturma
- ✅ Google Sheets loglama
- ✅ Görsel sıralama
- ✅ SKU üretimi

**WP-to-Shopify otomasyonunuz canlıda! 🚀**
