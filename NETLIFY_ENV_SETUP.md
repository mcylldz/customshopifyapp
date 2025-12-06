# Netlify Environment Variables Setup

## 🚨 kritik: Bu değişkenleri Netlify Dashboard'da set etmelisiniz!

Shopify publish özelliğinin çalışması için aşağıdaki environment variables'ların Netlify'da tanımlanması gerekiyor.

## Netlify Dashboard'da Nasıl Eklenir

1. https://app.netlify.com → Sitenizi seçin
2. **Site Settings** → **Environment Variables** 
3. Her bir değişken için **Add a variable** butonuna tıklayın
4. Name ve Value alanlarını doldurun
5. Tüm değişkenleri ekledikten sonra site'yi **redeploy** edin

## Gerekli Environment Variables

```bash
# Shopify Store Credentials (STORE_B)
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx

# OpenAI API (AI Title & Description için)
OPENAI_API_KEY=sk-xxxxx

# FAL.ai API (VTON işlemler için)
FAL_AI_KEY=xxxxx

# Google Sheets Webhook (Loglama için)
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/xxxxx
```

## Değerleri Nereden Alınır?

### Shopify Credentials
Eğer `config-WORKING.js` dosyanız varsa:
```javascript
SHOPIFY: {
    STORE_B: {
        DOMAIN: "buradan-kopyala",
        ACCESS_TOKEN: "buradan-kopyala"
    }
}
```

### OpenAI API Key
`config-WORKING.js` dosyasından:
```javascript
OPENAI: {
    API_KEY: "buradan-kopyala"
}
```

### FAL.ai Key
`config-WORKING.js` dosyasından:
```javascript
FAL_AI: {
    KEY: "buradan-kopyala"
}
```

### Google Sheets Webhook
`config-WORKING.js` dosyasından:
```javascript
GOOGLE_SHEETS: {
    WEBHOOK_URL: "buradan-kopyala"
}
```

## Doğrulama

Environment variables'ı ekledikten sonra:

1. Netlify'da siteyi **Redeploy** edin (Deploys → Trigger deploy → Clear cache and deploy)
2. Deploy tamamlandığında app'i açın
3. Browser Console'da şu mesaj görünmemeli: `"Missing store credentials"`
4. Test için bir ürün publish etmeyi deneyin

## Güvenlik Notu

⚠️ **ÖNEMLİ**: 
- `config.js` ve `config-WORKING.js` dosyaları `.gitignore`'da olmalı (zaten var)
- API key'leri asla GitHub'a pushlamamalısınız  
- Sadece Netlify Environment Variables kullanın

## Sorun Giderme

### "Missing store credentials" Hatası
- Netlify environment variables eklenmiş mi kontrol edin
- Variable isimleri tam olarak yukarıdaki gibi mi? (büyük/küçük harf önemli)
- Redeploy yaptınız mı?

### "OpenAI API key not configured" Hatası
- `OPENAI_API_KEY` variable'ı eklendi mi?  
- Redeploy yapıldı mı?

### Google Sheets Loglama Çalışmıyor
- `GOOGLE_SHEETS_WEBHOOK_URL` doğru mu?
- Webhook URL'i çalışıyor mu? (Postman ile test edebilirsiniz)
