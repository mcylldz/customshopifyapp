/**
 * Netlify Serverless Function
 * Handles all proxy requests: WordPress scraping, Shopify API, OpenAI Vision
 */

const https = require('https');
const http = require('http');

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        console.log('📋 Action:', data.action);

        const { store_domain, access_token, product_id, image_url, position, replace_mode, old_image_id, action, wp_url } = data;

        // Route to appropriate handler
        if (action === 'wp_scrape') {
            return await scrapeWordPress(wp_url);
        }

        if (action === 'openai_vision') {
            return await proxyOpenAI(data);
        }

        if (action === 'create_product') {
            if (!store_domain || !access_token) {
                return errorResponse(400, 'Missing store credentials');
            }
            return await createProduct(store_domain, access_token, data.product);
        }

        if (action === 'get_images') {
            if (!store_domain || !access_token || !product_id) {
                return errorResponse(400, 'Missing required fields');
            }
            return await getProductImages(store_domain, access_token, product_id);
        }

        // Default: image upload
        if (!store_domain || !access_token || !product_id) {
            return errorResponse(400, 'Missing required fields');
        }

        if (replace_mode && old_image_id) {
            await deleteImage(store_domain, access_token, product_id, old_image_id);
        }

        return await uploadImage(store_domain, access_token, product_id, image_url, position);

    } catch (error) {
        console.error('❌ Error:', error.message);
        return errorResponse(500, error.message);
    }
};

// Helper functions

function errorResponse(statusCode, message) {
    return {
        statusCode,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: message })
    };
}

function successResponse(data) {
    return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
}

// WordPress Scraping
async function scrapeWordPress(wpUrl) {
    return new Promise((resolve) => {
        const urlObj = new URL(wpUrl);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const protocol = urlObj.protocol === 'https:' ? https : http;
        const req = protocol.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode,
                    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html' },
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            resolve(errorResponse(500, error.message));
        });

        req.end();
    });
}

// OpenAI Vision Proxy
async function proxyOpenAI(data) {
    return new Promise((resolve) => {
        const payload = JSON.stringify(data.payload);

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${data.api_key}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (response) => {
            let responseData = '';
            response.on('data', chunk => responseData += chunk);
            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode,
                    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                    body: responseData
                });
            });
        });

        req.on('error', (error) => {
            resolve(errorResponse(500, error.message));
        });

        req.write(payload);
        req.end();
    });
}

// Shopify Product Creation
async function createProduct(domain, token, productData) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({ product: productData });

        const options = {
            hostname: domain,
            path: '/admin/api/2024-01/products.json',
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    const result = JSON.parse(data);
                    resolve(successResponse({
                        success: true,
                        product_id: result.product.id,
                        product_url: `https://${domain}/admin/products/${result.product.id}`
                    }));
                } else {
                    resolve({
                        statusCode: response.statusCode,
                        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                        body: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve(errorResponse(500, error.message));
        });

        req.write(payload);
        req.end();
    });
}

// Get Product Images
async function getProductImages(domain, token, productId) {
    return new Promise((resolve) => {
        const options = {
            hostname: domain,
            path: `/admin/api/2024-01/products/${productId}/images.json`,
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': token
            }
        };

        const req = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                resolve({
                    statusCode: response.statusCode,
                    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            resolve(errorResponse(500, error.message));
        });

        req.end();
    });
}

// Upload Image
async function uploadImage(domain, token, productId, imageUrl, position) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({
            image: {
                src: imageUrl,
                position: position
            }
        });

        const options = {
            hostname: domain,
            path: `/admin/api/2024-01/products/${productId}/images.json`,
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    const result = JSON.parse(data);
                    resolve(successResponse({
                        success: true,
                        image_id: result.image.id,
                        position: result.image.position,
                        src: result.image.src
                    }));
                } else {
                    resolve({
                        statusCode: response.statusCode,
                        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                        body: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve(errorResponse(500, error.message));
        });

        req.write(payload);
        req.end();
    });
}

// Delete Image
async function deleteImage(domain, token, productId, imageId) {
    return new Promise((resolve) => {
        const options = {
            hostname: domain,
            path: `/admin/api/2024-01/products/${productId}/images/${imageId}.json`,
            method: 'DELETE',
            headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve());
        });

        req.on('error', () => resolve()); // Continue anyway
        req.end();
    });
}
