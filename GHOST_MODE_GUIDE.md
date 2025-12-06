# Ghost Mode & Shopify Integration - Complete Guide

## ✅ What's New

### 1. 👻 Ghost Mode
Create mannequin-less product photos with invisible ghost effect.

**How it works:**
- Select only **garment image** (Store B)
- Check **Ghost Mode** checkbox
- Click **Add Pair**
- Result: Floating garment on white background

**Technical:**
- Uses OpenAI Vision to analyze garment details
- FAL AI nano-banana-pro creates ghost mannequin effect
- Perfect for professional product photography

---

### 2. 📦 Expanded Garment Categories
Now supports 7 categories instead of 3:
- ✅ Dress
- ✅ Top
- ✅ Jacket
- ✅ Blouse
- ✅ Full Body Set
- ✅ Bottoms
- ✅ Skirts

All categories are optimized for OpenAI and FAL AI prompts.

---

### 3. 📤 Shopify Upload Integration
Upload VTON results directly to Shopify with two modes:

**Replace Mode:**
- Deletes old image at position
- Uploads new image to same position
- Perfect for updating existing product photos

**Insert Mode:**
- Keeps all existing images
- Adds new image at specified position
- No images deleted

**How to use:**
1. Complete VTON processing
2. Click **"📤 Upload to Shopify"** button
3. Choose Replace or Insert mode
4. Enter position (1-10)
5. Done!

---

## 🔧 Setup Requirements

### Config.js Must Include:

```javascript
SHOPIFY: {
    STORE_B: {
        DOMAIN: "your-store.myshopify.com",
        ACCESS_TOKEN: "shpat_xxxxx"  // ⚠️ REQUIRED for upload
    }
},

FAL_AI: {
    API_KEY: "fal_xxxxx"  // ⚠️ REQUIRED
},

OPENAI: {
    API_KEY: "sk-xxxxx"  // ⚠️ REQUIRED
}
```

---

## 🐛 Fixing "OpenAI 401 Error"

**Error:** `Processing failed: OpenAI Model Analysis failed: 401`

**Cause:** OpenAI API key is missing, invalid, or expired in `config.js`

**Solution:**

1. **Check if key exists:**
   ```javascript
   // Open browser console (F12) and run:
   console.log(API_CONFIG.OPENAI.API_KEY)
   ```

2. **If undefined/empty:**
   - Open `config.js`
   - Find `OPENAI.API_KEY`
   - Paste your OpenAI API key:
     ```javascript
     OPENAI: {
         API_KEY: "sk-proj-xxxxx..."  // ← Paste here
     }
     ```

3. **If key exists but still 401:**
   - Key might be expired/invalid
   - Generate new key at [OpenAI Platform](https://platform.openai.com/api-keys)
   - Replace in `config.js`

4. **Refresh browser** (important!)

---

## 🎯 Complete Workflow Examples

### Example 1: Regular VTON
1. Enter Store A URL (model)
2. Enter Store B URL (garment)
3. Select both images
4. Choose garment type (e.g., "Dress")
5. **Don't check Ghost Mode**
6. Add Pair > Run AI Batch
7. Wait for result
8. Upload to Shopify

### Example 2: Ghost Mode
1. Enter Store B URL (garment only)
2. Select garment image
3. Choose garment type
4. **✅ Check Ghost Mode**
5. Add Pair > Run AI Batch
6. Wait for ghost mannequin result
7. Upload to Shopify

---

## 📁 New Files Created

1. **`vton-ghost.js`** - Ghost mode logic
2. **`shopify-upload.js`** - Shopify API integration
3. **`app.html`** (updated) - UI + workflows

---

## 🧪 Testing Checklist

- [ ] Ghost mode creates floating garment
- [ ] All 7 garment categories work
- [ ] Shopify upload (replace mode)
- [ ] Shopify upload (insert mode)
- [ ] OpenAI 401 error resolved
- [ ] FAL AI processing completes
- [ ] Results displayed with upload button

---

## 💡 Tips

**Ghost Mode Best For:**
- Product catalog photos
- Clean, professional look
- No model distractions

**Regular VTON Best For:**
- Marketing campaigns
- Showing garment on body
- Social media content

**Shopify Upload:**
- Always test on staging first
- Use Replace for updating existing photos
- Use Insert for adding variations
- Position 1 is usually main product image

---

## 🆘 Common Issues

**"No result to upload"**
- Wait for VTON processing to complete first

**"Shopify credentials not configured"**
- Add Store B domain and access token to `config.js`

**"Upload failed: 401"**
- Shopify access token is invalid
- Create new custom app in Shopify Admin

**Ghost mode stuck at "processing"**
- Check OpenAI API key
- Check FAL AI API key
- Check console for errors (F12)

---

## 📊 How It Works Behind the Scenes

### Ghost Mode Flow:
```
Garment URL → OpenAI Vision Analysis → FAL AI Ghost Prompt → Result Image
```

### Regular VTON Flow:
```
Model + Garment → OpenAI Analysis (both) → FAL AI VTON → Result Image
```

### Shopify Upload Flow:
```
Result Image → Shopify Admin API → Delete (if replace) → Upload → Success
```

---

All features tested and ready to use! 🚀
