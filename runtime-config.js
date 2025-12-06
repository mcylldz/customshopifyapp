/**
 * Runtime Config Loader for Netlify
 * Provides API keys in production without exposing them in frontend code
 */

// Check if we're on Netlify
const isNetlify = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// In local mode, try to load from config.js if it exists
let localConfig = {};
if (!isNetlify && typeof API_CONFIG !== 'undefined') {
    localConfig = API_CONFIG;
}

// Create API_CONFIG object
window.API_CONFIG = {
    SHOPIFY: {
        STORE_B: {
            DOMAIN: localConfig.SHOPIFY?.STORE_B?.DOMAIN || '',
            ACCESS_TOKEN: localConfig.SHOPIFY?.STORE_B?.ACCESS_TOKEN || ''
        },
        ADMIN_API_TOKEN: localConfig.SHOPIFY?.ADMIN_API_TOKEN || '',
        API_VERSION: '2024-01'
    },

    OPENAI: {
        API_KEY: localConfig.OPENAI?.API_KEY || localConfig.BRAND?.API_KEY || ''
    },

    FAL_AI: {
        API_KEY: isNetlify ? '' : (typeof API_CONFIG !== 'undefined' ? API_CONFIG.FAL_AI.API_KEY : ''),
        MODELS: {
            VTON: 'fal-ai/nano-banana-pro',
            IMAGE_GEN: 'fal-ai/flux-pro'
        }
    },

    GOOGLE_SHEETS: {
        WEBHOOK_URL: isNetlify ? '' : (typeof API_CONFIG !== 'undefined' ? API_CONFIG.GOOGLE_SHEETS.WEBHOOK_URL : '')
    },

    BRAND: {
        API_KEY: localConfig.BRAND?.API_KEY || localConfig.OPENAI?.API_KEY || '',
        ORGANIZATION_ID: localConfig.BRAND?.ORGANIZATION_ID || '',
        MODEL: 'gpt-4o',
        MODELS: {
            SEO_OPTIMIZATION: 'gpt-4o',
            PRODUCT_DESCRIPTION: 'gpt-4o-mini',
            IMAGE_ANALYSIS: 'gpt-4o'
        }
    }
};

// Set global API_BASE_URL
window.API_BASE_URL = isNetlify ? '/.netlify/functions/proxy' : 'http://localhost:3001';

// Log environment
console.log('🌍 Environment:', isNetlify ? 'Netlify' : 'Local');
console.log('🔗 API URL:', window.API_BASE_URL);
console.log('📋 API_CONFIG loaded');
