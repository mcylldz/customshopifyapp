# Google Sheets Apps Script Webhook Setup

Bu rehber, Google Sheets'e veri yazmak için Apps Script webhook'u nasıl oluşturacağınızı gösterir.

---

## Adım 1: Google Sheets'i Açın

1. https://sheets.google.com adresine gidin
2. Spreadsheet'inizi açın (ID: `1HDZm8HvKp9OYtubNuQLUIAE3eY14WdN9EADo7TjFcc0`)
3. "stok" sayfasının mevcut olduğundan emin olun

---

## Adım 2: Apps Script'i Açın

1. Menüden **Extensions** > **Apps Script** seçin
2. Yeni bir script projesi açılacak

---

## Adım 3: Kodu Yapıştırın

Aşağıdaki kodu Apps Script editörüne yapıştırın:

```javascript
function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    const rowData = data.data; // [productName, sku, stock]
    
    // Get the active spreadsheet and "stok" sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('stok');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({error: 'Sheet "stok" not found'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Append the row
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, row: rowData}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## Adım 4: Deploy Edin

1. Sağ üst köşede **Deploy** > **New deployment** tıklayın
2. **Select type** yanındaki ⚙️ ikonuna tıklayın
3. **Web app** seçin
4. Ayarlar:
   - **Description:** "Stok Logger"
   - **Execute as:** Me
   - **Who has access:** Anyone
5. **Deploy** butonuna tıklayın
6. **Authorize access** diyecek, izin verin
7. **Web app URL** kopyalayın (şuna benzer olacak):
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

---

## Adım 5: config.js'e Ekleyin

`config.js` dosyanızı açın ve şunu ekleyin:

```javascript
GOOGLE_SHEETS: {
    WEBHOOK_URL: "https://script.google.com/macros/s/AKfycby.../exec"
}
```

---

## Test

1. config.js'i kaydedin
2. `cp config-WORKING.js config.js` çalıştırın
3. Sayfayı yenileyin (F5)
4. Bir ürün pushlayın
5. Google Sheets'te "stok" sayfasını kontrol edin

---

## Veri Formatı

Her varyant için ayrı satır:

| A (Ürün Adı) | B (SKU) | C (Stok) |
|--------------|---------|----------|
| Leopar Desenli... | PFT-179033-S-M | 5 |
| Leopar Desenli... | PFT-179033-L-XL | 3 |

---

## Sorun Giderme

**"Sheet 'stok' not found" hatası:**
- Spreadsheet'te "stok" adında bir sayfa olduğundan emin olun

**403 hatası:**
- Apps Script deployment'ta "Who has access" = "Anyone" olmalı

**CORS hatası:**
- Apps Script otomatik olarak CORS izinlerini handle ediyor, sorun olmamalı
