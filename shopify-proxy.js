/**
 * Simple Shopify Proxy Server
 * Avoids CORS by proxying requests from browser to Shopify
 * 
 * Usage:
 *   node shopify-proxy.js
 *   Server runs on http://localhost:3001
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

const server = http.createServer((req, res) => {
    console.log('📥 Incoming request:', req.method, req.url);

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        console.log('✅ Preflight request handled');
        res.writeHead(200);
        res.end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        console.log('❌ Method not allowed:', req.method);
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    // Read request body
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        console.log('📦 Raw body received:', body.substring(0, 200));

        try {
            const data = JSON.parse(body);
            console.log('✅ JSON parsed successfully');
            console.log('📋 Data keys:', Object.keys(data));

            const { store_domain, access_token, product_id, image_url, position, replace_mode, old_image_id, action, wp_url } = data;

            // Handle WordPress scraping (no auth required)
            if (action === 'wp_scrape') {
                console.log('🌐 Scraping WordPress URL...');
                if (!wp_url) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing wp_url' }));
                    return;
                }
                scrapeWordPress(wp_url, res);
                return;
            }

            // Handle OpenAI Vision API (no Shopify auth needed)
            if (action === 'openai_vision') {
                console.log('🤖 Proxying OpenAI Vision request...');
                proxyOpenAI(data, res);
                return;
            }

            // Handle create_product action (doesn't need product_id)
            if (action === 'create_product') {
                console.log('🆕 Creating new product...');
                if (!store_domain || !access_token) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Missing store credentials' }));
                    return;
                }
                createProduct(store_domain, access_token, data.product, res);
                return;
            }

            // Validate Shopify credentials for other actions that need product_id
            if (!store_domain || !access_token || !product_id) {
                console.log('❌ Missing required fields:', { store_domain: !!store_domain, access_token: !!access_token, product_id: !!product_id });
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Missing required fields' }));
                return;
            }

            console.log('✅ All required fields present');
            console.log('🎯 Action:', action || 'upload');

            // Handle get_images action
            if (action === 'get_images') {
                console.log('📸 Getting product images...');
                getProductImages(store_domain, access_token, product_id, res);
                return;
            }

            // Handle upload
            console.log('📤 Starting upload process...');
            if (replace_mode && old_image_id) {
                console.log('🔄 Replace mode - deleting old image first');
                // Delete old image first
                deleteImage(store_domain, access_token, product_id, old_image_id, () => {
                    // Then upload new image
                    uploadImage(store_domain, access_token, product_id, image_url, position, res);
                });
            } else {
                console.log('➕ Insert mode - uploading directly');
                // Just upload
                uploadImage(store_domain, access_token, product_id, image_url, position, res);
            }

        } catch (error) {
            console.log('❌ JSON parse error:', error.message);
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
});

function deleteImage(domain, token, productId, imageId, callback) {
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
        response.on('end', () => {
            console.log('Image deleted:', imageId);
            callback();
        });
    });

    req.on('error', (error) => {
        console.error('Delete error:', error);
        callback(); // Continue anyway
    });

    req.end();
}

function uploadImage(domain, token, productId, imageUrl, position, res) {
    console.log('🚀 uploadImage called with:', { domain, productId, imageUrl, position });

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

    console.log('📡 Shopify API URL:', `https://${domain}${options.path}`);
    console.log('📦 Payload:', payload);

    const req = https.request(options, (response) => {
        console.log('📨 Shopify response status:', response.statusCode);

        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            console.log('📄 Shopify response data:', data.substring(0, 500));

            if (response.statusCode >= 200 && response.statusCode < 300) {
                const result = JSON.parse(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    image_id: result.image.id,
                    position: result.image.position,
                    src: result.image.src
                }));
                console.log('✅ Upload successful!');
            } else {
                console.log('❌ Upload failed with status:', response.statusCode);
                res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ HTTPS request error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    });

    req.write(payload);
    req.end();
    console.log('📤 Request sent to Shopify');
}

function getProductImages(domain, token, productId, res) {
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
            res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    });

    req.on('error', (error) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    });

    req.end();
}

function scrapeWordPress(wpUrl, res) {
    console.log('📄 Fetching WordPress page:', wpUrl);

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
        console.log('📨 WP response status:', response.statusCode);

        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
                console.log('✅ WordPress page scraped successfully');
            } else {
                console.log('❌ WP scraping failed:', response.statusCode);
                res.writeHead(response.statusCode);
                res.end(data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ WP scraping error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    });

    req.end();
}

function proxyOpenAI(data, res) {
    console.log('🤖 Forwarding to OpenAI Vision API...');

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
        console.log('📨 OpenAI response:', response.statusCode);

        let responseData = '';
        response.on('data', chunk => responseData += chunk);
        response.on('end', () => {
            console.log('📄 OpenAI response length:', responseData.length);

            // Forward the response as-is
            res.writeHead(response.statusCode, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(responseData);
        });
    });

    req.on('error', (error) => {
        console.log('❌ OpenAI proxy error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    });

    req.write(payload);
    req.end();
}

function createProduct(domain, token, productData, res) {
    console.log('🆕 Creating product:', productData.title);

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
        console.log('📨 Shopify create product response:', response.statusCode);

        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
            console.log('📄 Shopify response:', data.substring(0, 300));

            if (response.statusCode >= 200 && response.statusCode < 300) {
                const result = JSON.parse(data);
                const productId = result.product.id;
                const productUrl = `https://${domain}/admin/products/${productId}`;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    product_id: productId,
                    product_url: productUrl
                }));
                console.log('✅ Product created successfully! ID:', productId);
            } else {
                console.log('❌ Product creation failed:', response.statusCode);
                res.writeHead(response.statusCode, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Product creation error:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    });

    req.write(payload);
    req.end();
}

server.listen(PORT, () => {
    console.log(`✅ Shopify Proxy Server running on http://localhost:${PORT}`);
    console.log('   Ready to accept requests from app.html');
});
