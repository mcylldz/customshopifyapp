/**
 * Fabric Mode - High-Resolution Fabric Texture Generation
 * Creates premium e-commerce fabric macro shots
 */

/**
 * Process Fabric Mode
 * Generates high-resolution fabric texture close-up for product pages
 */
async function processFabricMode(garmentImageUrl, fabricInfo = null) {
    try {
        // Base fabric mode prompt
        let prompt = `Generate a high-resolution fabric texture close-up for a Shopify product page. 
Use the provided product image (and optional fabric information) to recreate the fabric with natural realism.

The fabric surface should include gentle, authentic micro-folds and soft waves — similar to a garment slightly gathered or lightly bunched during a professional studio macro shoot. 
These waves must be subtle, clean, and consistent with the actual behavior of the material, avoiding dramatic draping.

The entire frame must remain fully sharp:
– no blur,
– no depth of field,
– no soft gradients,
– edge-to-edge clarity.

Lighting should be neutral and evenly distributed to highlight the weave pattern, fiber detail, and the three-dimensional surface without creating harsh shadows.  
Color accuracy and fabric structure must stay true to the original product.

Output should look like a premium e-commerce textile macro: realistic micro-folds, natural volume, full-frame sharpness, neutral lighting, and trustworthy material representation.`;

        // Add fabric info if provided
        if (fabricInfo && fabricInfo.trim()) {
            prompt += `\n\nFabric type: ${fabricInfo}. Reflect this material's real texture characteristics in the generated macro shot.`;
        }

        showToast('Creating fabric texture with FAL AI...', 'success');

        // Submit to FAL AI
        const response = await fetch(`${VTON_API.FAL_BASE}/edit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `KEY ${VTON_API.FAL_KEY}`
            },
            body: JSON.stringify({
                image_urls: [garmentImageUrl],
                prompt: prompt,
                aspect_ratio: "9:16",
                resolution: "2K"
            })
        });

        if (!response.ok) {
            throw new Error(`Fabric mode FAL submission failed: ${response.status}`);
        }

        const data = await response.json();

        // Poll for result
        showToast('Polling for fabric texture result...', 'success');
        const resultUrl = await pollFabricResult(data.request_id);

        return {
            output_image: resultUrl,
            request_id: data.request_id,
            mode: 'fabric'
        };

    } catch (error) {
        console.error('Fabric Mode Error:', error);
        throw error;
    }
}

/**
 * Poll for Fabric Mode Result
 */
async function pollFabricResult(requestId, maxAttempts = 120) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const statusRes = await fetch(`${VTON_API.FAL_BASE}/requests/${requestId}/status`, {
            headers: { 'Authorization': `KEY ${VTON_API.FAL_KEY}` }
        });

        if (!statusRes.ok) {
            throw new Error(`Fabric status check failed: ${statusRes.status}`);
        }

        const statusData = await statusRes.json();

        if (statusData.status === 'COMPLETED') {
            // Fetch final result
            const resultRes = await fetch(`${VTON_API.FAL_BASE}/requests/${requestId}`, {
                headers: { 'Authorization': `KEY ${VTON_API.FAL_KEY}` }
            });

            if (!resultRes.ok) {
                throw new Error(`Fabric result fetch failed: ${resultRes.status}`);
            }

            const resultData = await resultRes.json();
            return resultData.images[0].url;
        }

        if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
            throw new Error('Fabric texture generation failed');
        }

        console.log(`Fabric polling ${attempt + 1}/${maxAttempts}, status: ${statusData.status}`);
    }

    throw new Error('Fabric mode timeout');
}

// Add to window exports
if (typeof window !== 'undefined') {
    if (!window.VTON) window.VTON = {};
    window.VTON.processFabricMode = processFabricMode;
    window.VTON.pollFabricResult = pollFabricResult;
}
