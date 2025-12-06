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

        if (action === 'fal_submit') {
            return await proxyFALSubmit(data);
        }

        if (action === 'fal_status') {
            return await proxyFALStatus(data);
        }

        if (action === 'create_product') {
            const domain = store_domain || process.env.SHOPIFY_STORE_DOMAIN;
            const token = access_token || process.env.SHOPIFY_ACCESS_TOKEN;

            if (!domain || !token) {
                return errorResponse(400, 'Missing store credentials (server-side env vars not set)');
            }
            return await createProduct(domain, token, data.product);
        }

        if (action === 'google_sheets_log') {
            return await proxyGoogleSheetsLog(data.row_data);
        }

        if (action === 'get_images') {
            const domain = store_domain || process.env.SHOPIFY_STORE_DOMAIN;
            const token = access_token || process.env.SHOPIFY_ACCESS_TOKEN;

            if (!domain || !token || !product_id) {
                return errorResponse(400, 'Missing required fields for get_images');
            }
            return await getProductImages(domain, token, product_id);
        }

        // Default: image upload
        const domain = store_domain || process.env.SHOPIFY_STORE_DOMAIN;
        const token = access_token || process.env.SHOPIFY_ACCESS_TOKEN;

        if (!domain || !token || !product_id) {
            return errorResponse(400, 'Missing required fields for image upload');
        }

        if (replace_mode && old_image_id) {
            await deleteImage(domain, token, product_id, old_image_id);
        }

        return await uploadImage(domain, token, product_id, image_url, position);

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
        // Use environment variable instead of data.api_key
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            resolve(errorResponse(500, 'OpenAI API key not configured in environment'));
            return;
        }

        const payload = JSON.stringify(data.payload);

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
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

// FAL AI Submit Job Proxy
async function proxyFALSubmit(data) {
    return new Promise((resolve) => {
        const apiKey = process.env.FAL_AI_KEY;

        if (!apiKey) {
            resolve(errorResponse(500, 'FAL AI key not configured in environment'));
            return;
        }

        const payload = JSON.stringify(data.payload);

        const options = {
            hostname: 'queue.fal.run',
            path: '/fal-ai/nano-banana-pro/edit',
            method: 'POST',
            headers: {
                'Authorization': `KEY ${apiKey}`,
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

// FAL AI Status Check Proxy  
// FAL AI Status Check Proxy  
async function proxyFALStatus(data) {
    return new Promise((resolve) => {
        const apiKey = process.env.FAL_AI_KEY;

        if (!apiKey) {
            resolve(errorResponse(500, 'FAL AI key not configured in environment'));
            return;
        }

        const options = {
            hostname: 'queue.fal.run',
            path: data.path, // e.g., '/fal-ai/nano-banana-pro/requests/REQUEST_ID/status'
            method: 'GET',
            headers: {
                'Authorization': `KEY ${apiKey}`,
                'Content-Type': 'application/json'
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

        req.end();
    });
}

// Google Sheets Proxy
async function proxyGoogleSheetsLog(rowData) {
    return new Promise((resolve) => {
        const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
        if (!webhookUrl) {
            resolve(errorResponse(500, 'Google Sheets Webhook URL not configured in environment'));
            return;
        }

        const payload = JSON.stringify({ data: rowData });
        const parsedUrl = new URL(webhookUrl);

        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (response) => {
            // Google Apps Script usually returns 302 or 200 with opaque response
            resolve({
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: true, message: 'Logged to Sheets' })
            });
        });

        req.on('error', (error) => {
            console.error('Google Sheets Error:', error);
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

        console.log('=== 🔍 SHOPIFY CREATE PRODUCT DEBUG (NETLIFY) ===');
        console.log('Domain:', domain);
        console.log('Payload size:', payload.length, 'bytes');
        console.log('Product title:', productData.title);
        console.log('Variants count:', productData.variants?.length);
        console.log('Images count:', productData.images?.length);
        console.log('🔍 FULL PRODUCT DATA:');
        console.log(JSON.stringify(productData, null, 2));
        console.log('🔍 FULL PAYLOAD TO SHOPIFY:');
        console.log(payload);

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

        console.log('🔍 API URL:', `https://${domain}${options.path}`);

        const req = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                console.log('📨 Shopify Response Status:', response.statusCode);
                console.log('📨 Response Headers:', JSON.stringify(response.headers, null, 2));
                console.log('📄 FULL Shopify Response Body:');
                console.log(data);

                if (response.statusCode === 201) {
                    const result = JSON.parse(data);
                    console.log('✅ SUCCESS - Product ID:', result.product.id);
                    resolve({
                        statusCode: 201,
                        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            success: true,
                            product_id: result.product.id,
                            product_url: `https://${domain}/admin/products/${result.product.id}`
                        })
                    });
                } else {
                    // Return detailed error for debugging
                    console.error('❌ Shopify API Error:', response.statusCode);
                    console.error('❌ Error Response:', data);

                    let errorDetails;
                    try {
                        errorDetails = JSON.parse(data);
                    } catch {
                        errorDetails = { raw: data };
                    }

                    resolve({
                        statusCode: response.statusCode,
                        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            error: true,
                            statusCode: response.statusCode,
                            shopify_error: errorDetails,
                            sent_payload: productData // Include payload for debugging
                        })
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ HTTPS Request Error:', error);
            resolve(errorResponse(500, error.message));
        });

        req.write(payload);
        req.end();
        console.log('📤 Request sent to Shopify API');
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
