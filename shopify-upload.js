/**
 * Shopify Image Upload Integration
 * Upload VTON results to Shopify via N8N webhooks (avoids CORS)
 */

const SHOPIFY_API = {
    get STORE_DOMAIN() {
        return typeof API_CONFIG !== 'undefined' ? API_CONFIG.SHOPIFY.STORE_B.DOMAIN : '';
    },
    get ACCESS_TOKEN() {
        return typeof API_CONFIG !== 'undefined' ? API_CONFIG.SHOPIFY.STORE_B.ACCESS_TOKEN : '';
    },
    getProxyUrl() {
        // Use global API_BASE_URL if available (set in app.html)
        return typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://localhost:3001';
    },
    API_VERSION: '2024-01'
};

/**
 * Upload image to Shopify product via proxy
 * @param {string} productId - Shopify product ID  
 * @param {string} imageUrl - URL of image to upload
 * @param {number} position - Position in product images (1-10)
 * @param {boolean} replaceMode - If true, delete old image at position first
 * @param {string|null} oldImageId - ID of image to delete (if replace mode)
 */
async function uploadToShopify(productId, imageUrl, position, replaceMode = false, oldImageId = null) {
    console.log('🔍 Upload called with:', { productId, imageUrl, position, replaceMode, oldImageId });

    try {
        showToast('Uploading to Shopify...', 'success');

        // Use proxy endpoint for Netlify compatibility
        const payload = {
            store_domain: SHOPIFY_API.STORE_DOMAIN || '',
            access_token: SHOPIFY_API.ACCESS_TOKEN || '',
            product_id: productId,
            image_url: imageUrl,
            position: position,
            replace_mode: replaceMode,
            old_image_id: oldImageId
        };

        const proxyUrl = SHOPIFY_API.getProxyUrl();
        console.log('📤 Sending to proxy:', proxyUrl);
        console.log('📦 Payload:', payload);

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        showToast('✅ Image uploaded to Shopify!', 'success');

        return {
            success: true,
            imageId: result.image_id || result.imageId,
            position: result.position,
            src: result.src || result.image_url
        };

    } catch (error) {
        console.error('Shopify Upload Error:', error);
        throw error;
    }
}

/**
 * Get product images via proxy
 */
async function getProductImages(productId) {
    try {
        const payload = {
            store_domain: SHOPIFY_API.STORE_DOMAIN || '',
            access_token: SHOPIFY_API.ACCESS_TOKEN || '',
            product_id: productId,
            action: 'get_images'
        };

        const proxyUrl = SHOPIFY_API.getProxyUrl();
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch images: ${response.status}`);
        }

        const data = await response.json();
        return data.images || [];

    } catch (error) {
        console.error('Get Images Error:', error);
        // Return empty array on error
        return [];
    }
}

// Export for use in app
if (typeof window !== 'undefined') {
    window.ShopifyUpload = {
        uploadToShopify,
        getProductImages
    };
}
