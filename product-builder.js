/**
 * Product Builder Main App
 * Manages multi-step workflow from WP to Shopify
 */

const productBuilderApp = {

    startBuilding() {
        if (!productBuilder.wpData) {
            showToast('Please scrape a product first', 'error');
            return;
        }

        productBuilder.step = 2;
        this.renderModelSelection();
    },

    renderModelSelection() {
        const container = document.getElementById('wp-result');
        container.innerHTML = `
            <div style="background:white; padding:20px; border-radius:12px; box-shadow:var(--shadow); margin-top:20px;">
                <h3 style="margin:0 0 15px 0;">Step 2: Select Model Images 👥</h3>
                
                <div style="margin-bottom:15px;">
                    <label style="display:block; margin-bottom:5px; font-size:13px; font-weight:500;">Model Store URL (Shopify):</label>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="pb-model-url" placeholder="https://yourstore.myshopify.com/products/model-product" style="flex:1; padding:10px; border:1px solid #ddd; border-radius:6px;">
                        <button class="primary" onclick="productBuilderApp.fetchModelImages()">Fetch Images</button>
                    </div>
                </div>
                
                <div id="pb-model-grid"></div>
                
                <div id="pb-model-actions" style="display:none; margin-top:20px;">
                    <button class="success" onclick="productBuilderApp.startVTON()" style="width:100%; padding:12px;">
                        ➡️ Continue to VTON Pairing
                    </button>
                </div>
            </div>
        `;
    },

    async fetchModelImages() {
        const url = document.getElementById('pb-model-url').value.trim();
        if (!url) return showToast('Enter model URL', 'error');

        try {
            showToast('Fetching model images...');

            const parsed = this.parseShopifyUrl(url);
            if (!parsed) return showToast('Invalid Shopify URL', 'error');

            const apiUrl = `https://${parsed.domain}/products/${parsed.handle}.json`;
            const res = await fetch(apiUrl);
            const data = await res.json();

            productBuilder.modelImages = data.product.images.map(img => img.src);

            const grid = document.getElementById('pb-model-grid');
            grid.innerHTML = `
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(120px, 1fr)); gap:10px; margin-top:15px;">
                    ${productBuilder.modelImages.map(src => `
                        <img src="${src}" style="width:100%; aspect-ratio:9/16; object-fit:cover; border-radius:8px; border:2px solid #e0e0e0;">
                    `).join('')}
                </div>
            `;

            document.getElementById('pb-model-actions').style.display = 'block';
            showToast(`✅ Fetched ${productBuilder.modelImages.length} model images`);

        } catch (e) {
            showToast('Failed to fetch: ' + e.message, 'error');
        }
    },

    parseShopifyUrl(url) {
        try {
            if (!url.startsWith('http')) url = 'https://' + url;
            const urlObj = new URL(url);
            const handle = urlObj.pathname.split('/products/')[1]?.split('?')[0];
            return handle ? { domain: urlObj.hostname, handle } : null;
        } catch {
            return null;
        }
    },

    startVTON() {
        productBuilder.step = 3;
        this.renderVTON();
    },

    renderVTON() {
        const container = document.getElementById('wp-result');
        const wpData = productBuilder.wpData;

        container.innerHTML = `
            <div style="background:white; padding:20px; border-radius:12px; box-shadow:var(--shadow); margin-top:20px;">
                <h3 style="margin:0 0 15px 0;">Step 3: Create VTON Pairs 🎨</h3>
                
                <!-- Mode Selection -->
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Select Mode:</label>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                            <input type="radio" name="pb-vton-mode" value="regular" checked>
                            <span>👔 Regular VTON</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                            <input type="radio" name="pb-vton-mode" value="ghost">
                            <span>👻 Ghost Mode</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                            <input type="radio" name="pb-vton-mode" value="fabric">
                            <span>🧵 Fabric Mode</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                            <input type="radio" name="pb-vton-mode" value="sizechart">
                            <span>📏 Size Chart</span>
                        </label>
                    </div>
                </div>
                
                <!-- Garment Type Selection -->
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Garment Type:</label>
                    <select id="pb-garment-type" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
                        <option value="DRESS">Dress</option>
                        <option value="TOP">Top</option>
                        <option value="JACKET">Jacket</option>
                        <option value="BLOUSE">Blouse</option>
                        <option value="FULL_BODY">Full Body Set</option>
                        <option value="BOTTOMS">Bottoms</option>
                        <option value="SKIRTS">Skirts</option>
                    </select>
                </div>
                
                <!-- Fabric Info (for Fabric Mode) -->
                <div id="pb-fabric-info-container" style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:5px; font-weight:500;">Fabric Information (optional):</label>
                    <input type="text" id="pb-fabric-info" placeholder="e.g., Cotton, Silk, Wool..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
                </div>
                
                <!-- Image Grids -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                    <!-- Model Images -->
                    <div>
                        <h4 style="margin:0 0 10px 0; font-size:14px;">Model Images</h4>
                        <div id="pb-vton-models" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; max-height:400px; overflow-y:auto;">
                            ${productBuilder.modelImages.map((src, i) => `
                                <img src="${src}" onclick="productBuilderApp.selectModel('${src}')" style="width:100%; aspect-ratio:9/16; object-fit:cover; border-radius:6px; cursor:pointer; border:3px solid transparent;" data-url="${src}">
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Garment Images (WP) -->
                    <div>
                        <h4 style="margin:0 0 10px 0; font-size:14px;">Garment Images (WP)</h4>
                        <div id="pb-vton-garments" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; max-height:400px; overflow-y:auto;">
                            ${wpData.images.map((src, i) => `
                                <img src="${src}" onclick="productBuilderApp.selectGarment('${src}')" style="width:100%; aspect-ratio:9/16; object-fit:cover; border-radius:6px; cursor:pointer; border:3px solid transparent;" data-url="${src}">
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Add Pair Button -->
                <button class="primary" onclick="productBuilderApp.addVTONPair()" style="width:100%; padding:10px; margin-bottom:15px;">
                    ➕ Add Selected Pair
                </button>
                
                <!-- Pairs List -->
                <div id="pb-vton-pairs" style="margin-bottom:20px;"></div>
                
                <!-- Actions -->
                <div style="display:flex; gap:10px;">
                    <button class="success" onclick="productBuilderApp.processAllPairs()" style="flex:1; padding:12px;" id="pb-process-btn">
                        🎬 Process All Pairs
                    </button>
                    <button class="primary" onclick="productBuilderApp.continueToAI()" style="flex:1; padding:12px;" id="pb-continue-ai-btn">
                        AI Title & Description ➡️ (Skip VTON)
                    </button>
                </div>
            </div>
        `;

        this.selectedModel = null;
        this.selectedGarment = null;
        this.renderVTONPairs();
    },

    selectModel(url) {
        this.selectedModel = url;
        document.querySelectorAll('#pb-vton-models img').forEach(img => {
            img.style.border = img.dataset.url === url ? '3px solid #007aff' : '3px solid transparent';
        });
    },

    selectGarment(url) {
        this.selectedGarment = url;
        document.querySelectorAll('#pb-vton-garments img').forEach(img => {
            img.style.border = img.dataset.url === url ? '3px solid #007aff' : '3px solid transparent';
        });
    },

    addVTONPair() {
        const mode = document.querySelector('input[name="pb-vton-mode"]:checked').value;

        // Validate based on mode
        if (mode === 'ghost' || mode === 'fabric' || mode === 'sizechart') {
            // Only garment needed
            if (!this.selectedGarment) return showToast('Select a garment image', 'error');
        } else {
            // Both needed for regular VTON
            if (!this.selectedModel || !this.selectedGarment) return showToast('Select both model and garment', 'error');
        }

        const pair = {
            id: 'pb-' + Date.now(),
            modelUrl: this.selectedModel || 'NONE',
            garmentUrl: this.selectedGarment,
            mode,
            status: 'pending',
            resultUrl: null
        };

        productBuilder.vtonPairs.push(pair);
        this.renderVTONPairs();

        // Clear selection
        this.selectedModel = null;
        this.selectedGarment = null;
        document.querySelectorAll('#pb-vton-models img, #pb-vton-garments img').forEach(img => {
            img.style.border = '3px solid transparent';
        });

        showToast(`✅ Pair added (${productBuilder.vtonPairs.length} total)`);
    },

    renderVTONPairs() {
        const container = document.getElementById('pb-vton-pairs');
        if (!container) return;

        if (productBuilder.vtonPairs.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">No pairs yet. Select images and add them.</p>';
            return;
        }

        container.innerHTML = `
            <h4 style="margin:0 0 10px 0; font-size:14px;">AI Pairs (${productBuilder.vtonPairs.length})</h4>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${productBuilder.vtonPairs.map(p => `
                    <div style="display:flex; align-items:center; gap:10px; padding:10px; background:#f9f9fb; border-radius:8px;">
                        ${p.modelUrl !== 'NONE' ? `<img src="${p.modelUrl}" style="width:50px; height:75px; object-fit:cover; border-radius:4px;">` : '<div style="width:50px; height:75px; background:#e0e0e0; border-radius:4px;"></div>'}
                        <span style="font-size:20px;">+</span>
                        <img src="${p.garmentUrl}" style="width:50px; height:75px; object-fit:cover; border-radius:4px;">
                        <div style="flex:1;">
                            <strong>${p.mode.toUpperCase()}</strong>
                            <div style="font-size:12px; color:#666;">${p.status}</div>
                        </div>
                        ${p.status === 'done' ? `<a href="${p.resultUrl}" target="_blank" style=="padding:6px 12px; background:#28a745; color:white; text-decoration:none; border-radius:6px; font-size:12px;">View</a>` : ''}
                        <button class="danger" onclick="productBuilderApp.removePair('${p.id}')" style="padding:6px 10px;">Remove</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    removePair(id) {
        productBuilder.vtonPairs = productBuilder.vtonPairs.filter(p => p.id !== id);
        this.renderVTONPairs();
    },

    async processAllPairs() {
        const btn = document.getElementById('pb-process-btn');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        for (const pair of productBuilder.vtonPairs) {
            if (pair.status === 'done') continue;

            try {
                pair.status = 'processing';
                this.renderVTONPairs();

                let resultUrl;

                if (pair.mode === 'sizechart') {
                    // Upload logo.png to get URL
                    const logoUrl = window.location.origin + '/logo.png';
                    const result = await window.VTON.processSizeChartMode(pair.garmentUrl, logoUrl);
                    resultUrl = result.output_image;
                } else if (pair.mode === 'fabric') {
                    const result = await window.VTON.processFabricMode(pair.garmentUrl, pair.fabricInfo);
                    resultUrl = result.output_image;
                } else if (pair.mode === 'ghost') {
                    const result = await window.VTON.processGhostMode(pair.garmentUrl, pair.garmentType, 'Product', pair.fabricInfo);
                    resultUrl = result.output_image;
                } else {
                    // Regular VTON
                    const result = await window.VTON.processVTONPair(pair.modelUrl, pair.garmentUrl, pair.garmentType, 'Product', pair.fabricInfo);
                    resultUrl = await window.VTON.pollVTONResult(result.request_id);
                }

                pair.resultUrl = resultUrl;
                pair.status = 'done';
                this.renderVTONPairs();
                showToast(`✅ Pair ${productBuilder.vtonPairs.indexOf(pair) + 1} completed`);

            } catch (e) {
                pair.status = 'error';
                this.renderVTONPairs();
                showToast(`❌ Pair ${productBuilder.vtonPairs.indexOf(pair) + 1} failed: ${e.message}`, 'error');
            }
        }

        btn.disabled = false;
        btn.textContent = '🎬 Process All Pairs';
        showToast('✅ All pairs processed!');
    },

    continueToAI() {
        productBuilder.step = 4;
        this.renderAIGeneration();
    },

    renderAIGeneration() {
        const container = document.getElementById('wp-result');
        const wpData = productBuilder.wpData;
        const vtonResults = productBuilder.vtonPairs.filter(p => p.status === 'done');

        // Combine WP images + VTON results for selection
        const allImages = [
            ...wpData.images.map(src => ({ src, type: 'WP Original' })),
            ...vtonResults.map(p => ({ src: p.resultUrl, type: p.mode.toUpperCase() }))
        ];

        container.innerHTML = `
            <div style="background:white; padding:20px; border-radius:12px; box-shadow:var(--shadow); margin-top:20px;">
                <h3 style="margin:0 0 15px 0;">Step 4: AI Title & Description 🤖</h3>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Select Image for AI Analysis:</label>
                    <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:8px;">
                        ${allImages.map((img, i) => `
                            <div onclick="productBuilderApp.selectAIImage('${img.src}')" style="cursor:pointer; border:3px solid transparent; border-radius:8px; overflow:hidden;" data-img="${img.src}">
                                <img src="${img.src}" style="width:100%; aspect-ratio:9/16; object-fit:cover;">
                                <div style="font-size:10px; text-align:center; padding:3px; background:#f5f5f7;">${img.type}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <button class="primary" onclick="productBuilderApp.generateAI()" id="pb-generate-ai-btn" style="width:100%; padding:12px; margin-bottom:20px;">
                    ✨ Generate AI Title & Description
                </button>
                
                <div id="pb-ai-result" style="display:none;">
                    <div style="margin-bottom:15px;">
                        <label style="display:block; margin-bottom:5px; font-weight:500;">SEO Title (max 60 chars):</label>
                        <input type="text" id="pb-ai-title" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
                        <div id="pb-title-count" style="font-size:12px; color:#999; margin-top:3px;"></div>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <label style="display:block; margin-bottom:5px; font-weight:500;">SEO Description:</label>
                        <textarea id="pb-ai-description" rows="4" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;"></textarea>
                    </div>
                    
                    <button class="success" onclick="productBuilderApp.continueToPricing()" style="width:100%; padding:12px;">
                        💰 Continue to Pricing ➡️
                    </button>
                </div>
            </div>
        `;

        this.selectedAIImage = null;
    },

    selectAIImage(src) {
        this.selectedAIImage = src;
        document.querySelectorAll('[data-img]').forEach(el => {
            el.style.border = el.dataset.img === src ? '3px solid #007aff' : '3px solid transparent';
        });
    },

    async generateAI() {
        if (!this.selectedAIImage) return showToast('Select an image first', 'error');

        const btn = document.getElementById('pb-generate-ai-btn');
        btn.disabled = true;
        btn.textContent = 'Generating with AI...';

        try {
            const originalTitle = productBuilder.wpData.title;

            const prompt = `Sen bir moda editörüsün — Network, Massimo Dutti ve COS gibi markaların editoryal dilinde yazıyorsun. Pazarlama metni değil, stil rehberi yazıyorsun.

GÖREV:
Sana bir kadın giyim ürününün görseli ve ham ürün adı verilecek. Görseli analiz et, ardından markanın premium kimliğine uygun SEO başlığı ve açıklaması üret.

MARKA SESİ:
- Şehirli, minimal, özgüvenli
- "Siz" hitabı, ama mesafeli değil; samimi bir zarafet
- Ürünü övme, ürünün ne hissettirdiğini anlat
- Moda dergisi editörü gibi yaz, e-ticaret robotu gibi değil

YASAK KELİMELER VE İFADELER (bunları asla kullanma):
× "şıklık" → ✓ "duruş", "karakter", "atmosfer"
× "zarif siluet" → ✓ "akışkan hat", "rahat düşüş", "temiz çizgi"
× "sofistike" → ✓ "düşünülmüş", "bilinçli", "rafine"
× "modern kadın" → ✓ "şehirli tempo", "gündelik ritim"
× "geniş kullanım alanı" → ✓ doğrudan yaz: "sabah toplantısından akşam buluşmasına"
× "vücut hattınızı vurgular" → ✓ "beli tanımlar", "formu takip eder"
× "tamamlar" → ✓ "bütünler", "taşır", "dengeler"
× "Harika/muhteşem/şık bir ürün" → ✓ hiç değerlendirme yapma, betimle

YAZI STİLİ KURALLARI:
1. İlk cümle ürünü tanıtsın ama sıfat yığını olmasın
2. İkinci cümle kullanım anlarını somutlaştırsın (yer, zaman, his)
3. Üçüncü cümle (opsiyonel) detay veya styling önerisi
4. Kısa cümleler tercih et. Virgülle uzayan cümlelerden kaçın.
5. Kumaş türünü SADECE görselden net olarak anlayabiliyorsan belirt

SEO BAŞLIĞI KURALLARI:
- Maksimum 60 karakter
- Ana ürün türü + ayırt edici özellik + varsa desen/renk
- Örnek format: "Leopar Desenli Kuşaklı Midi Elbise"
- Gereksiz sıfat ekleme (zarif, şık, muhteşem gibi)

ÇIKTI FORMATI:
Yanıtını YALNIZCA aşağıdaki JSON yapısında ver. Başka hiçbir metin, açıklama veya markdown ekleme:

{"seo_title": "...", "seo_description": "..."}

HAM ÜRÜN ADI: ${originalTitle}`;

            console.log('🤖 Calling OpenAI Vision API via proxy...');
            console.log('API Key present:', !!API_CONFIG.OPENAI.API_KEY);
            console.log('Image URL:', this.selectedAIImage);

            // Call via local proxy to avoid CORS
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'openai_vision',
                    api_key: API_CONFIG.OPENAI?.API_KEY || '', // For local mode, Netlify ignores this
                    payload: {
                        model: 'gpt-4o',
                        messages: [{
                            role: 'user',
                            content: [
                                { type: 'text', text: prompt },
                                { type: 'image_url', image_url: { url: this.selectedAIImage } }
                            ]
                        }],
                        max_tokens: 500
                    }
                })
            });

            console.log('📨 Proxy response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ OpenAI proxy error:', errorText);
                throw new Error(`OpenAI API failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ OpenAI response received');

            let content = data.choices[0].message.content.trim();
            console.log('Raw content:', content.substring(0, 100));

            // Strip markdown code blocks if present
            if (content.startsWith('```')) {
                content = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
                console.log('Stripped markdown, new content:', content.substring(0, 100));
            }

            const result = JSON.parse(content);

            productBuilder.aiTitle = result.seo_title;
            productBuilder.aiDescription = result.seo_description;

            // Display results
            document.getElementById('pb-ai-title').value = result.seo_title;
            document.getElementById('pb-ai-description').value = result.seo_description;
            document.getElementById('pb-ai-result').style.display = 'block';

            // Character counter
            const updateCount = () => {
                const len = document.getElementById('pb-ai-title').value.length;
                document.getElementById('pb-title-count').textContent = `${len}/60 characters`;
                document.getElementById('pb-title-count').style.color = len > 60 ? 'red' : '#999';
            };
            updateCount();
            document.getElementById('pb-ai-title').addEventListener('input', updateCount);

            showToast('✅ AI generation complete!');

        } catch (e) {
            showToast('AI generation failed: ' + e.message, 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = '✨ Generate AI Title & Description';
        }
    },

    continueToPricing() {
        // Save any manual edits
        productBuilder.aiTitle = document.getElementById('pb-ai-title').value;
        productBuilder.aiDescription = document.getElementById('pb-ai-description').value;

        productBuilder.step = 5;
        this.renderPricing();
    },

    renderPricing() {
        const container = document.getElementById('wp-result');
        const wpData = productBuilder.wpData;
        const originalPrice = wpData.price;

        container.innerHTML = `
            <div style="background:white; padding:20px; border-radius:12px; box-shadow:var(--shadow); margin-top:20px;">
                <h3 style="margin:0 0 15px 0;">Step 5: Price Revision 💰</h3>
                
                <div style="background:#f9f9fb; padding:15px; border-radius:8px; margin-bottom:20px;">
                    <p style="margin:0 0 8px 0;"><strong>Original Price:</strong> ${originalPrice.toFixed(2)} TL</p>
                    <p style="margin:0; font-size:13px; color:#666;">Formula: (Original + 360) × Multiplier, rounded to nearest 100</p>
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Select Multiplier:</label>
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px;">
                        ${[
                { mult: 2, label: '2 Katı' },
                { mult: 2.5, label: '2.5 Katı' },
                { mult: 3.5, label: '3.5 Katı' },
                { mult: 4, label: '4 Katı' }
            ].map(item => {
                const calc = Math.round(((originalPrice + 360) * item.mult) / 100) * 100;
                return `
                                <button onclick="productBuilderApp.selectMultiplier(${item.mult})" data-mult="${item.mult}" style="padding:15px; border:2px solid #e0e0e0; border-radius:8px; background:white; cursor:pointer; text-align:center;">
                                    <div style="font-size:14px; font-weight:600; color:#666; margin-bottom:3px;">${item.label}</div>
                                    <div style="font-size:16px; font-weight:700;">×${item.mult}</div>
                                    <div style="font-size:13px; color:#666; margin-top:5px;">${calc.toLocaleString('tr-TR')} TL</div>
                                </button>
                            `;
            }).join('')}
                    </div>
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block; margin-bottom:5px; font-weight:500;">Or Enter Custom Price:</label>
                    <input type="number" id="pb-custom-price" placeholder="Enter price..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
                </div>
                
                <div id="pb-final-price" style="background:#28a745; color:white; padding:20px; border-radius:8px; text-align:center; margin-bottom:20px; display:none;">
                    <div style="font-size:14px; opacity:0.9; margin-bottom:5px;">Final Price:</div>
                    <div style="font-size:32px; font-weight:700;" id="pb-price-display"></div>
                </div>
                
                <button class="success" onclick="productBuilderApp.continueToReview()" id="pb-continue-review-btn" style="width:100%; padding:12px;" disabled>
                    📋 Review & Publish ➡️
                </button>
            </div>
        `;
    },

    selectMultiplier(mult) {
        const originalPrice = productBuilder.wpData.price;
        const finalPrice = Math.round(((originalPrice + 360) * mult) / 100) * 100;

        productBuilder.finalPrice = finalPrice;
        productBuilder.priceMultiplier = mult;

        // Update UI
        document.querySelectorAll('[data-mult]').forEach(btn => {
            btn.style.border = btn.dataset.mult == mult ? '2px solid #007aff' : '2px solid #e0e0e0';
            btn.style.background = btn.dataset.mult == mult ? '#e3f2fd' : 'white';
        });

        document.getElementById('pb-final-price').style.display = 'block';
        document.getElementById('pb-price-display').textContent = finalPrice.toLocaleString('tr-TR') + ' TL';
        document.getElementById('pb-continue-review-btn').disabled = false;
        document.getElementById('pb-custom-price').value = '';
    },

    continueToReview() {
        // Check for custom price
        const customPrice = document.getElementById('pb-custom-price').value;
        if (customPrice && parseFloat(customPrice) > 0) {
            productBuilder.finalPrice = parseFloat(customPrice);
            productBuilder.priceMultiplier = null;
        }

        if (!productBuilder.finalPrice) {
            return showToast('Select a price first', 'error');
        }

        productBuilder.step = 6;
        this.renderReview();
    },

    renderReview() {
        const container = document.getElementById('wp-result');
        const wpData = productBuilder.wpData;
        const vtonResults = productBuilder.vtonPairs.filter(p => p.status === 'done');
        const allImages = [
            ...vtonResults.map(p => p.resultUrl),
            ...wpData.images
        ];

        container.innerHTML = `
            <div style="background:white; padding:20px; border-radius:12px; box-shadow:var(--shadow); margin-top:20px;">
                <h3 style="margin:0 0 15px 0;">Step 6: Review & Publish 🚀</h3>
                
                <!-- Product Info -->
                <div style="background:#f9f9fb; padding:15px; border-radius:8px; margin-bottom:20px;">
                    <h4 style="margin:0 0 10px 0; font-size:14px;">Product Information</h4>
                    <p style="margin:0 0 5px 0;"><strong>Title:</strong> ${productBuilder.aiTitle}</p>
                    <p style="margin:0 0 5px 0;"><strong>Price:</strong> ${productBuilder.finalPrice.toLocaleString('tr-TR')} TL</p>
                    <p style="margin:0; font-size:13px;"><strong>Description:</strong><br>${productBuilder.aiDescription}</p>
                </div>
                
                <!-- Images -->
                <div style="margin-bottom:20px;">
                    <h4 style="margin:0 0 10px 0; font-size:14px;">Product Images - Select images to publish</h4>
                    <div id="pb-sortable-images" style="display:grid; grid-template-columns:repeat(6, 1fr); gap:8px;">
                        ${allImages.map((src, i) => `
                            <div data-index="${i}" data-src="${src}" style="position:relative; border:2px solid #e0e0e0; border-radius:6px; padding:3px;">
                                <input type="checkbox" checked onclick="productBuilderApp.toggleImageSelection(this)" style="position:absolute; top:8px; right:8px; width:20px; height:20px; cursor:pointer; z-index:10;">
                                <img src="${src}" style="width:100%; aspect-ratio:9/16; object-fit:cover; border-radius:4px;">
                                <div style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); color:white; padding:3px 8px; border-radius:4px; font-size:11px;">${i + 1}</div>
                                <button onclick="productBuilderApp.removeImage(${i})" style="position:absolute; bottom:8px; right:8px; padding:4px 8px; background:#dc3545; color:white; border:none; border-radius:4px; font-size:10px; cursor:pointer;">Remove</button>
                            </div>
                        `).join('')}
                    </div>
                    <p style="margin-top:8px; font-size:12px; color:#666;">Uncheck images to exclude them from publish. Selected: <span id="pb-selected-count">${allImages.length}</span>/${allImages.length}</p>
                </div>
                
                <!-- Variants -->
                <div style="margin-bottom:20px;">
                    <h4 style="margin:0 0 10px 0; font-size:14px;">Variants (${wpData.sizes.length})</h4>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f5f5f7;">
                                <th style="padding:8px; text-align:left; border:1px solid #e0e0e0;">Size</th>
                                <th style="padding:8px; text-align:left; border:1px solid #e0e0e0;">SKU</th>
                                <th style="padding:8px; text-align:left; border:1px solid #e0e0e0;">Stock</th>
                                <th style="padding:8px; text-align:left; border:1px solid #e0e0e0;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${wpData.sizes.map(s => `
                                <tr>
                                    <td style="padding:8px; border:1px solid #e0e0e0;">${s.size}</td>
                                    <td style="padding:8px; border:1px solid #e0e0e0; font-family:monospace;">PFT-${wpData.productCode}-${s.size}</td>
                                    <td style="padding:8px; border:1px solid #e0e0e0;">${s.stock}</td>
                                    <td style="padding:8px; border:1px solid #e0e0e0;">${productBuilder.finalPrice.toLocaleString('tr-TR')} TL</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <button class="success" onclick="productBuilderApp.publishToShopify()" id="pb-publish-btn" style="width:100%; padding:15px; font-size:16px;">
                    🎉 Publish to Shopify
                </button>
                
                <div id="pb-publish-result" style="margin-top:20px;"></div>
            </div>
        `;

        // Store full image list
        this.allReviewImages = allImages;

        // Setup drag & drop for images
        this.setupImageReordering();
    },

    toggleImageSelection(checkbox) {
        const count = document.querySelectorAll('#pb-sortable-images input[type="checkbox"]:checked').length;
        document.getElementById('pb-selected-count').textContent = count;
    },

    removeImage(index) {
        const container = document.querySelector(`[data-index="${index}"]`);
        if (container) {
            container.remove();
            const count = document.querySelectorAll('#pb-sortable-images input[type="checkbox"]:checked').length;
            document.getElementById('pb-selected-count').textContent = count;
            showToast('Image removed');
        }
    },

    setupImageReordering() {
        const containers = document.querySelectorAll('#pb-sortable-images > div');
        let draggedElement = null;

        containers.forEach(container => {
            // Drag start
            container.setAttribute('draggable', 'true');
            container.addEventListener('dragstart', (e) => {
                draggedElement = container;
                container.style.opacity = '0.5';
                e.dataTransfer.effectAllowed = 'move';
            });

            // Drag end
            container.addEventListener('dragend', () => {
                container.style.opacity = '1';
                draggedElement = null;
                // Update numbers
                this.updateImageNumbers();
            });

            // Drag over
            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (draggedElement && draggedElement !== container) {
                    container.style.border = '2px solid #007aff';
                }
            });

            // Drag leave
            container.addEventListener('dragleave', () => {
                container.style.border = '2px solid #e0e0e0';
            });

            // Drop
            container.addEventListener('drop', (e) => {
                e.preventDefault();
                container.style.border = '2px solid #e0e0e0';

                if (draggedElement && draggedElement !== container) {
                    const parent = container.parentNode;
                    const draggedIndex = Array.from(parent.children).indexOf(draggedElement);
                    const targetIndex = Array.from(parent.children).indexOf(container);

                    if (draggedIndex < targetIndex) {
                        parent.insertBefore(draggedElement, container.nextSibling);
                    } else {
                        parent.insertBefore(draggedElement, container);
                    }
                }
            });
        });
    },

    updateImageNumbers() {
        const containers = document.querySelectorAll('#pb-sortable-images > div');
        containers.forEach((container, index) => {
            const numberDiv = container.querySelector('div[style*="position:absolute"][style*="bottom:8px"][style*="left:8px"]');
            if (numberDiv) {
                numberDiv.textContent = index + 1;
            }
            container.dataset.index = index;
        });
        showToast('Image order updated');
    },

    async publishToShopify() {
        const btn = document.getElementById('pb-publish-btn');
        btn.disabled = true;
        btn.textContent = 'Publishing...';

        try {
            const wpData = productBuilder.wpData;

            // Get only selected images
            const selectedImages = [];
            document.querySelectorAll('#pb-sortable-images > div').forEach(container => {
                const checkbox = container.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    selectedImages.push(container.dataset.src);
                }
            });

            if (selectedImages.length === 0) {
                throw new Error('Select at least one image');
            }

            // Create product payload
            const payload = {
                action: 'create_product',
                store_domain: API_CONFIG.SHOPIFY.STORE_B.DOMAIN,
                access_token: API_CONFIG.SHOPIFY.STORE_B.ACCESS_TOKEN,
                product: {
                    title: productBuilder.aiTitle,
                    body_html: productBuilder.aiDescription.replace(/\n/g, '<br>'),
                    vendor: 'Atelier Paftalı',
                    product_type: 'Kadın Giyim',
                    images: selectedImages.map(src => ({ src })),
                    variants: wpData.sizes.map(s => ({
                        sku: `PFT-${wpData.productCode}-${s.size}`,
                        price: productBuilder.finalPrice.toFixed(2),
                        inventory_quantity: s.stock,
                        inventory_management: 'shopify',
                        inventory_policy: 'deny',
                        option1: s.size
                    })),
                    options: [{ name: 'Size', values: wpData.sizes.map(s => s.size) }]
                }
            };

            // Send to proxy
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Publish failed: ${response.status}`);
            }

            const result = await response.json();

            // Log to Google Sheets
            await this.logToGoogleSheets(result);

            // Show success
            document.getElementById('pb-publish-result').innerHTML = `
                <div style="background:#d4edda; border:1px solid #c3e6cb; color:#155724; padding:15px; border-radius:8px;">
                    <h4 style="margin:0 0 10px 0;">✅ Product Published Successfully!</h4>
                    <p style="margin:0;"><strong>Product ID:</strong> ${result.product_id}</p>
                    <p style="margin:5px 0 0 0;"><a href="${result.product_url}" target="_blank" style="color:#155724; font-weight:600;">View in Shopify →</a></p>
                </div>
            `;

            showToast('✅ Product published to Shopify!');

        } catch (e) {
            showToast('Publish failed: ' + e.message, 'error');
            document.getElementById('pb-publish-result').innerHTML = `
                <div style="background:#f8d7da; border:1px solid #f5c6cb; color:#721c24; padding:15px; border-radius:8px;">
                    <strong>❌ Error:</strong> ${e.message}
                </div>
            `;
        } finally {
            btn.disabled = false;
            btn.textContent = '🎉 Publish to Shopify';
        }
    },

    async logToGoogleSheets(result) {
        try {
            const wpData = productBuilder.wpData;

            // Create a row for each variant
            for (const size of wpData.sizes) {
                const row = [
                    productBuilder.aiTitle,
                    `PFT-${wpData.productCode}-${size.size}`,
                    size.stock
                ];
                await window.GoogleSheets.appendRow(row);
            }

            console.log('✅ Logged all variants to Google Sheets');
        } catch (e) {
            console.error('Google Sheets logging failed:', e);
        }
    }
};
