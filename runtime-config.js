/**
 * Runtime Config Loader for Netlify
 * Provides API keys in production without exposing them in frontend code
 */

// Check if we're on Netlify
const isNetlify = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Create API_CONFIG object
window.API_CONFIG = {
    SHOPIFY: {
        STORE_B: {
            DOMAIN: isNetlify ? '' : 'thebritishwoman.myshopify.com', // Not needed on Netlify
            ACCESS_TOKEN: '' // Not needed on Netlify - function uses env vars
        },
        ADMIN_API_TOKEN: '',
        API_VERSION: '2024-01'
    },

    OPENAI: {
        API_KEY: '' // Not needed on Netlify - function uses env vars
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
        API_KEY: '',
        ORGANIZATION_ID: '',
        MODEL: 'gpt-4o'
    }
};

// Log environment
console.log('🌍 Environment:', isNetlify ? 'Netlify' : 'Local');
console.log('📋 API_CONFIG loaded');
