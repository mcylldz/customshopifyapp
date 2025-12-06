# Shopify Management Tool - API Setup Guide

## 📋 Dosyalar

Projenizde şu dosyalar oluşturuldu:

1. **`config.js`** - API anahtarlarınızı buraya gireceksiniz (GİZLİ)
2. **`config.example.js`** - Örnek config dosyası (paylaşılabilir)
3. **`.gitignore`** - Git'e commit edilmemesi gereken dosyaları listeler
4. **`app.html`** - Ana uygulama (config.js'i otomatik import eder)

## 🔑 API Anahtarlarını Doldurma

`config.js` dosyasını açın ve aşağıdaki bölümleri doldurun:

### 1. Shopify API

```javascript
SHOPIFY: {
    STORE_DOMAIN: "your-store.myshopify.com",  // Ana mağaza domain'iniz
    ADMIN_API_TOKEN: "shpat_xxxxx",            // Admin API Token (sadece Store B için)
    API_VERSION: "2024-01",
    
    // Store A (Models) - CONFIG'E GEREKLİ DEĞİL
    // URL direkt olarak app'te input alanına girilir
    
    // Store B (Garments/Main Store) - API access gerekli (görsel yükleme için)
    STORE_B: {
        DOMAIN: "store-b.myshopify.com", 
        ACCESS_TOKEN: "shpat_xxxxx"
    }
}
```

**Store A vs Store B:**
- **Store A (Models):** 
  - ❌ Config'de DOMAIN veya ACCESS_TOKEN **gerekmez**
  - ✅ App'te URL input alanına istediğiniz Shopify ürün sayfasının URL'sini yapıştırın
  - ✅ Public `.json` endpoint kullanır (örn: `https://store.com/products/urun-adi.json`)
  
- **Store B (Garments):** 
  - ✅ Config'de DOMAIN ve ACCESS_TOKEN **gereklidir**
  - ✅ AI ile oluşturulan görseller bu mağazaya yüklenir

**Shopify Admin API Token nasıl alınır (sadece Store B için):**
1. Shopify Admin'e girin
2. Settings > Apps and sales channels
3. "Develop apps" tıklayın
4. "Create an app" > İsim verin
5. "Configure Admin API scopes" > Gerekli izinleri seçin:
   - `read_products`, `write_products`
   - `read_files`, `write_files`
6. "Install app" > Access token'ı kopyalayın

---

### 2. Google Sheets API

```javascript
GOOGLE_SHEETS: {
    API_KEY: "AIzaSyXXXXXXXX",              // API Key
    CLIENT_ID: "xxxxx.apps.googleusercontent.com",
    SHEET_ID: "1BxiMVs0XRA5nFMdKv...",     // Sheet ID (URL'den)
    SHEET_NAME: "Sheet1"
}
```

**Google Sheets API Key nasıl alınır:**
1. [Google Cloud Console](https://console.cloud.google.com/) açın
2. Yeni proje oluşturun veya mevcut projeyi seçin
3. "APIs & Services" > "Enable APIs and Services"
4. "Google Sheets API" arayın ve aktifleştirin
5. "Credentials" > "Create Credentials" > "API Key"
6. API Key'i kopyalayın

---

### 3. FAL AI API

```javascript
FAL_AI: {
    API_KEY: "fal_xxxxxxxxxxxxx",
    MODELS: {
        // Virtual Try-On model
        VTON: "fal-ai/nano-banana-pro",
        
        // Image generation
        IMAGE_GEN: "fal-ai/flux-pro"
    }
}
```

**Model:** `nano-banana-pro` - Virtual Try-On için optimize edilmiş model

**FAL AI API Key nasıl alınır:**
1. [fal.ai](https://fal.ai/) hesap oluşturun
2. [Dashboard](https://fal.ai/dashboard) > API Keys
3. "Create new key" tıklayın
4. Key'i kopyalayın

---

### 4. OpenAI API

```javascript
OPENAI: {
    API_KEY: "sk-xxxxxxxxxxxxxxxxxxxxx",
    ORGANIZATION_ID: "org-xxxxxxxx",  // Opsiyonel
    MODEL: "gpt-4o-mini",
    MODELS: {
        SEO_OPTIMIZATION: "gpt-4o",
        PRODUCT_DESCRIPTION: "gpt-4o-mini",
        IMAGE_ANALYSIS: "gpt-4o"
    }
}
```

**OpenAI API Key nasıl alınır:**
1. [OpenAI Platform](https://platform.openai.com/) hesabınıza girin
2. Sağ üst köşe > "API keys"
3. "Create new secret key" tıklayın
4. İsim verin ve key'i kopyalayın (**bir kere gösterilir!**)

---

## 🔒 Güvenlik Uyarıları

> **ÖNEMLİ:** API anahtarlarınızı **ASLA** paylaşmayın veya public repository'e yüklemeyin!

✅ **Yapılması gerekenler:**
- `config.js` dosyasını sadece local'de tutun
- `.gitignore` dosyası `config.js`'i Git'ten hariç tutar
- API anahtarlarını düzenli olarak rotate edin

❌ **Yapılmaması gerekenler:**
- `config.js`'i Git'e commit etmeyin
- API anahtarlarını screenshot olarak paylaşmayın
- API anahtarlarını Discord/Slack gibi platformlara yazmayın

---

## 🧪 Test Etme

Config dosyasını doldurduktan sonra:

1. `app.html`'i tarayıcıda açın
2. F12 > Console açın
3. Şu komutu çalıştırın:
   ```javascript
   validateConfig()
   ```
4. Eksik anahtarlar varsa uyarı göreceksiniz

---

## 📝 Config Dosyası Kullanımı

App içinde API'leri şöyle kullanabilirsiniz:

```javascript
// Shopify API çağrısı
const response = await fetch(`https://${CONFIG.SHOPIFY.STORE_DOMAIN}/admin/api/${CONFIG.SHOPIFY.API_VERSION}/products.json`, {
    headers: {
        'X-Shopify-Access-Token': CONFIG.SHOPIFY.ADMIN_API_TOKEN,
        'Content-Type': 'application/json'
    }
});

// OpenAI API çağrısı
const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${CONFIG.OPENAI.API_KEY}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        model: CONFIG.OPENAI.MODEL,
        messages: [{ role: 'user', content: 'Hello!' }]
    })
});
```

---

## 🆘 Sorun Giderme

**"CONFIG is not defined" hatası:**
- `config.js` dosyasının `app.html` ile aynı klasörde olduğundan emin olun
- Tarayıcıda cache'i temizleyip sayfayı yenileyin

**API çağrısı 401/403 hatası:**
- API anahtarlarının doğru olduğunu kontrol edin
- API anahtarlarının geçerli olduğundan emin olun (süresi dolmamış)

**CORS hatası:**
- Frontend'den direkt API çağrısı yapmak güvenli değil
- N8N webhook'larını kullanmaya devam edin
- Veya backend/proxy servisi kurun

---

## 📞 Yardım

Sorun yaşarsanız:
1. Console'da hata mesajlarını kontrol edin
2. API anahtarlarının doğru kopyalandığından emin olun
3. Her API için provider'ın dokümantasyonuna bakın
