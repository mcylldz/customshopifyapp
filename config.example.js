/**
 * API Configuration Example File
 * 
 * Copy this file to config.js and fill in your actual API keys
 * Command: cp config.example.js config.js
 */

const API_CONFIG = {
    SHOPIFY: {
        STORE_DOMAIN: "your-store.myshopify.com",
        ADMIN_API_TOKEN: "shpat_xxxxxxxxxxxxxxxxxxxxx",
        API_VERSION: "2024-01",

        // Store A (Models) - NO CONFIG NEEDED
        // Domain is entered directly in the app via URL input field

        // Store B (Garments/Main Store) - Requires API access for uploads
        STORE_B: {
            DOMAIN: "store-b.myshopify.com",
            ACCESS_TOKEN: "shpat_xxxxxxxxxxxxxxxxxxxxx"
        }
    },

    GOOGLE_SHEETS: {
        API_KEY: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        CLIENT_ID: "xxxxxxxxxxxxx.apps.googleusercontent.com",
        SHEET_ID: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
        SHEET_NAME: "Sheet1"
    },

    FAL_AI: {
        API_KEY: "fal_xxxxxxxxxxxxxxxxxxxxx",
        MODELS: {
            // Virtual Try-On model - nano-banana-pro
            VTON: "fal-ai/nano-banana-pro",

            // Image generation (if needed)
            IMAGE_GEN: "fal-ai/flux-pro"
        }
    },

    OPENAI: {
        API_KEY: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        ORGANIZATION_ID: "org-xxxxxxxxxxxxxxxx",
        MODEL: "gpt-4o-mini",
        MODELS: {
            SEO_OPTIMIZATION: "gpt-4o",
            PRODUCT_DESCRIPTION: "gpt-4o-mini",
            IMAGE_ANALYSIS: "gpt-4o"
        }
    },

    N8N: {
        BASE_URL: "https://dtt1z7t3.rcsrv.com",
        WEBHOOKS: {
            VTON_SUBMIT: "https://dtt1z7t3.rcsrv.com/webhook/vton-submit",
            VTON_STATUS: "https://dtt1z7t3.rcsrv.com/webhook/vton-status",
            VTON_GHOST: "https://dtt1z7t3.rcsrv.com/webhook/ghost-vton",
            REPLACE_IMAGE: "https://dtt1z7t3.rcsrv.com/webhook/replace-image",
            SEO_GET_PRODUCTS: "https://dtt1z7t3.rcsrv.com/webhook/get-products",
            SEO_PROCESS: "https://dtt1z7t3.rcsrv.com/webhook/process-products"
        }
    },

    SETTINGS: {
        CORS_PROXY: "https://api.allorigins.win/raw?url=",
        CONCURRENCY_LIMIT: 20,
        TIMEOUT: 30000,
        DEBUG: false
    }
};

function validateConfig() {
    const warnings = [];

    if (!API_CONFIG.SHOPIFY.ADMIN_API_TOKEN) {
        warnings.push("⚠️ Shopify Admin API Token not set");
    }
    if (!API_CONFIG.GOOGLE_SHEETS.API_KEY) {
        warnings.push("⚠️ Google Sheets API Key not set");
    }
    if (!API_CONFIG.FAL_AI.API_KEY) {
        warnings.push("⚠️ FAL AI API Key not set");
    }
    if (!API_CONFIG.OPENAI.API_KEY) {
        warnings.push("⚠️ OpenAI API Key not set");
    }

    if (warnings.length > 0 && API_CONFIG.SETTINGS.DEBUG) {
        console.warn("Config warnings:", warnings);
    }

    return warnings;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
