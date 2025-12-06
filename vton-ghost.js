/**
 * Ghost Mode VTON - Mannequin-less Product Photography
 * Replicates ghost.json N8N workflow
 */

/**
 * Analyze Garment for Ghost Mode
 * Uses OpenAI Vision to describe garment for invisible mannequin effect
 */
async function analyzeGarmentForGhost(garmentImageUrl, productTitle, garmentCategory, fabricInfo = '') {
    const fabricHint = fabricInfo ? `\n\n**USER PROVIDED FABRIC INFO:** ${fabricInfo} - Use this information to enhance your fabric and physics description.` : '';

    const prompt = `Act as a technical fashion designer and expert product photographer. Analyze the garment in this image to create a high-fidelity description for an AI image generator.

Your goal is to describe ONLY the garment so it can be recreated on an invisible ghost mannequin.

**ANALYZE AND DESCRIBE STRICTLY:**
1. **Fabric & Physics:** Exact material name (e.g., heavy french terry, sheer chiffon, rigid denim), texture weight, and how the fabric drapes or folds.
2. **Construction Details:** Visible seams, stitching types (e.g., contrast stitch, overlock), hem style (raw, ribbed, folded).
3. **Neckline & Hardware:** Collar shape, zippers, buttons, drawstrings, or metal accents.
4. **Silhouette:** Fit type (oversized, boxy, bodycon) and sleeve style (raglan, drop shoulder).
5. **Color:** Precise color shade (e.g., "heather grey" instead of "grey", "navy blue" instead of "blue").${fabricHint}

Product Name: ${productTitle}
Product Category: ${garmentCategory}

**CRITICAL CONSTRAINTS:**
- **IGNORE** the human model, skin, hair, face, and hands.
- **IGNORE** the background or any props.
- **DO NOT** use introductory phrases like "The image shows...".
- **OUTPUT FORMAT:** A single, concise, comma-separated string of descriptive keywords.`;

    // Route through Netlify proxy for secure API key management
    const response = await fetch(window.API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'openai_vision',
            payload: {
                model: VTON_API.OPENAI_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: garmentImageUrl } }
                        ]
                    }
                ],
                max_tokens: 500
            }
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI Ghost Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

/**
 * Process Ghost Mode VTON
 * Creates invisible mannequin effect (floating garment on white background)
 */
async function processGhostMode(garmentImageUrl, garmentCategory, productTitle, fabricInfo = '') {
    try {
        // Step 1: Analyze garment with OpenAI
        showToast('Analyzing garment for ghost mode...', 'success');
        const garmentDesc = await analyzeGarmentForGhost(garmentImageUrl, productTitle, garmentCategory, fabricInfo);

        console.log('Ghost Mode - Garment Description:', garmentDesc);

        // Step 2: Create ghost mode prompt
        const ghostPrompt = `Professional studio product photography of a ${garmentDesc}. Invisible ghost mannequin effect: The garment is shown worn by an invisible form, creating a realistic 3D shape with natural volume, folds, and drape, as if floating. Details: Show only the clean inside fabric texture through the neck opening. Background: Pure, seamless flat white studio background. Lighting: Soft, even studio lighting to highlight fabric texture. View: Front view, centered. No: No visible mannequin, no hangers, no human models, no neck labels, no brand tags.`;

        // Step 3: Submit to FAL AI through proxy
        showToast('Creating ghost mannequin effect...', 'success');
        const response = await fetch(window.API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'fal_submit',
                payload: {
                    image_urls: [garmentImageUrl],
                    prompt: ghostPrompt,
                    aspect_ratio: "9:16",
                    resolution: "2K"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ghost mode FAL submission failed: ${response.status}`);
        }

        const data = await response.json();

        // Step 4: Poll for result (using same logic as regular VTON)
        showToast('Polling for ghost mode result...', 'success');
        const resultUrl = await pollGhostResult(data.request_id);

        return {
            output_image: resultUrl,
            request_id: data.request_id,
            mode: 'ghost'
        };

    } catch (error) {
        console.error('Ghost Mode Error:', error);
        throw error;
    }
}

/**
 * Poll for Ghost Mode Result
 * Same as regular VTON polling but simpler
 */
async function pollGhostResult(requestId, maxAttempts = 120) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        // Poll status through proxy
        const statusRes = await fetch(window.API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'fal_status',
                path: `/fal-ai/nano-banana-pro/requests/${requestId}/status`
            })
        });

        if (!statusRes.ok) {
            throw new Error(`Ghost status check failed: ${statusRes.status}`);
        }

        const statusData = await statusRes.json();

        if (statusData.status === 'COMPLETED') {
            // Fetch result through proxy
            const resultRes = await fetch(window.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'fal_status',
                    path: `/fal-ai/nano-banana-pro/requests/${requestId}`
                })
            });

            if (!resultRes.ok) {
                throw new Error(`Ghost result fetch failed: ${resultRes.status}`);
            }

            const resultData = await resultRes.json();
            return resultData.images[0].url;
        }

        if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
            throw new Error('Ghost mode generation failed');
        }

        console.log(`Ghost polling ${attempt + 1}/${maxAttempts}, status: ${statusData.status}`);
    }

    throw new Error('Ghost mode timeout');
}

// Add to window.VTON exports
if (typeof window !== 'undefined') {
    if (!window.VTON) {
        window.VTON = {};
    }
    window.VTON.processGhostMode = processGhostMode;
    window.VTON.pollGhostResult = pollGhostResult;
}
