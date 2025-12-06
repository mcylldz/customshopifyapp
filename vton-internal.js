/**
 * Internal VTON System - Replaces N8N Workflows
 * 
 * This file contains all the logic from fal1.json and fal2.json workflows
 * integrated directly into the app.
 */

// Import from config.js
const VTON_API = {
    FAL_BASE: "https://queue.fal.run/fal-ai/nano-banana-pro",
    FAL_KEY: typeof API_CONFIG !== 'undefined' ? API_CONFIG.FAL_AI.API_KEY : '',
    OPENAI_KEY: typeof API_CONFIG !== 'undefined' ? (API_CONFIG.OPENAI?.API_KEY || API_CONFIG.BRAND?.API_KEY) : '',
    OPENAI_MODEL: typeof API_CONFIG !== 'undefined' ? (API_CONFIG.BRAND?.MODELS?.IMAGE_ANALYSIS || 'gpt-4o') : 'gpt-4o'
};

/**
 * Step 1: Analyze Model Image using OpenAI Vision
 * Replicates: "Model_Analiz" node from fal1
 */
async function analyzeModelImage(modelImageUrl) {
    const prompt = `Describe this fashion model image for an AI image generator. Focus on:
1. The model's pose, gender, and visible physical traits.
2. The clothing they are currently wearing (to be replaced).
3. The lighting, background, and camera angle.
Output a concise, descriptive prompt.`;

    const models = ['chatgpt-4o-latest', 'gpt-4o', 'gpt-4-turbo'];
    let lastError = null;

    for (const model of models) {
        console.log(`Trying OpenAI model: ${model} for Model Analysis...`);
        try {
            const response = await fetch(window.API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'openai_vision',
                    payload: {
                        model: model,
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: prompt },
                                    { type: 'image_url', image_url: { url: modelImageUrl } }
                                ]
                            }
                        ],
                        max_tokens: 500
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText} `);
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            // Check content policy
            if (content.includes("I'm sorry") || content.includes("I can't") || content.includes("I cannot")) {
                throw new Error('Content Policy Rejection');
            }

            console.log(`✅ Success with model: ${model} `);
            return content;

        } catch (error) {
            console.warn(`❌ Model ${model} failed: `, error.message);
            lastError = error;
            // Continue to next model...
        }
    }

    console.warn('All models failed. Using fallback description.');
    return "A professional fashion model posing in a studio, neutral lighting, high quality.";
}

/**
 * Step 2: Analyze Garment Image using OpenAI Vision
 * Replicates: "Garment_Analiz" node from fal1
 */
async function analyzeGarmentImage(garmentImageUrl, fabricInfo = '') {
    const fabricHint = fabricInfo ? `\n\n ** USER PROVIDED FABRIC INFO:** ${fabricInfo} - Use this information to enhance your material and texture description.` : '';

    const prompt = `Act as a technical fashion designer.Analyze this garment image to create a high - fidelity prompt description for an AI image generator(Flux / SDXL).

Focus STRICTLY on these attributes:
    1. ** Garment Type & Fit:** Exact category(e.g., cropped hoodie, maxi dress), silhouette(oversized, tailored, flowy), and cut.
2. ** Fabric & Texture:** Specific material properties(e.g., chunky cable knit, sheer chiffon, rigid denim), surface finish(matte, satin, distressed), and fabric weight.
3. ** Neckline & Sleeves:** Specific styles(crew neck, off - shoulder, puff sleeves, raglan, cuffs).
4. ** Design Details:** Prints, patterns, embroidery, buttons, zippers, pockets, and seam placements.
5. ** Color:** Precise color names(e.g., "crimson red" instead of "red").${fabricHint}

** CRITICAL CONSTRAINTS:**
- ** DO NOT ** describe the background, hanger, or the mannequin wearing it.
- ** DO NOT ** include introductory phrases like "Here is the description".
- ** OUTPUT ONLY ** a concise, comma - separated descriptive string ready for use in an image prompt.`;

    // Route through Netlify proxy for secure API key management
    const models = ['chatgpt-4o-latest', 'gpt-4o', 'gpt-4-turbo'];
    let lastError = null;

    for (const model of models) {
        console.log(`Trying OpenAI model: ${model} for Garment Analysis...`);
        try {
            const response = await fetch(window.API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'openai_vision',
                    payload: {
                        model: model,
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
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText} `);
            }

            const data = await response.json();
            const content = data.choices[0].message.content.trim();

            if (content.includes("I'm sorry") || content.includes("I can't") || content.includes("I cannot")) {
                throw new Error('Content Policy Rejection');
            }

            console.log(`✅ Success with model: ${model} `);
            return content;
        } catch (error) {
            console.warn(`❌ Model ${model} failed: `, error.message);
            lastError = error;
        }
    }

    console.warn('All models failed. Using fallback description.');
    return "A high-quality fashion garment, detailed fabric texture, professional product photography.";

}

/**
 * Step 3: Submit VTON Job to FAL AI
 * Replicates: "Fal Create Job" node from fal1
 */
async function submitVTONJob(modelImageUrl, garmentImageUrl, modelDescription, garmentDescription, productTitle, garmentCategory) {
    const prompt = `Professional editorial fashion photography.The exact same model from image 1 wearing a ${garmentDescription}. The model description: ${modelDescription}. 

** IDENTITY & FACE:**
        - Maintain exact facial features, bone structure, and expression of the model in image 1.Keep the angle, background, and environment exactly as shown in image 1.
            - Do not alter face shape, eye color, or skin texture.

** TECHNICAL REQUIREMENTS:**
        - The garment fits perfectly with realistic fabric physics, natural folds, and heavy draping.
- High - fidelity texture rendering, studio lighting, 8k resolution, sharp focus.
- Masterpiece quality, photorealistic, volumetric lighting.
- Accurate body proportions, realistic hands, natural pose.

** CONTEXT:**
        - Product Name: ${productTitle}
    - Product Type: ${garmentCategory} `;

    // Route through Netlify proxy for secure API key management
    const response = await fetch(window.API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'fal_submit',
            payload: {
                image_urls: [modelImageUrl, garmentImageUrl],
                prompt: prompt,
                resolution: "2K",
                aspect_ratio: "9:16"
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('FAL AI Error Response:', errorText);
        throw new Error(`FAL AI submission failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
        request_id: data.request_id,
        status: 'queued',
        message: 'Job submitted successfully. Start polling.'
    };
}

/**
 * Step 4: Check VTON Job Status
 * Replicates: "Check Fal Status" node from fal2
 */
async function checkVTONStatus(requestId) {
    // Route through Netlify proxy for secure API key management
    const statusResponse = await fetch(window.API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'fal_status',
            path: `/fal-ai/nano-banana-pro/requests/${requestId}/status`
        })
    });

    if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();

    // If completed, fetch the final result
    if (statusData.status === 'COMPLETED') {
        // Fetch final result through proxy
        const resultResponse = await fetch(window.API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'fal_status',
                path: `/fal-ai/nano-banana-pro/requests/${requestId}`
            })
        });

        if (!resultResponse.ok) {
            throw new Error(`Result fetch failed: ${resultResponse.status}`);
        }

        const resultData = await resultResponse.json();

        return {
            status: 'COMPLETED',
            output_image: resultData.images[0].url
        };
    }

    // Still processing
    return {
        status: statusData.status,
        output_image: null
    };
}

/**
 * Main VTON Process - Complete Workflow
 * Replicates entire fal1 + fal2 logic
 */
async function processVTONPair(modelImageUrl, garmentImageUrl, garmentCategory, productTitle, fabricInfo = '') {
    try {
        // Step 1 & 2: Analyze images (parallel)
        showToast('Analyzing images with AI...', 'success');
        const [modelDesc, garmentDesc] = await Promise.all([
            analyzeModelImage(modelImageUrl),
            analyzeGarmentImage(garmentImageUrl, fabricInfo)
        ]);

        console.log('Model Description:', modelDesc);
        console.log('Garment Description:', garmentDesc);

        // Step 3: Submit to FAL AI
        showToast('Submitting to VTON AI...', 'success');
        const jobResult = await submitVTONJob(
            modelImageUrl,
            garmentImageUrl,
            modelDesc,
            garmentDesc,
            productTitle,
            garmentCategory
        );

        // Return request_id for polling
        return jobResult;

    } catch (error) {
        console.error('VTON Process Error:', error);
        throw error;
    }
}

/**
 * Poll for VTON Result
 * Replicates fal2 polling logic
 */
async function pollVTONResult(requestId, maxAttempts = 180) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const result = await checkVTONStatus(requestId);

        if (result.status === 'COMPLETED') {
            return result.output_image;
        }

        if (result.status === 'FAILED' || result.status === 'ERROR') {
            throw new Error('AI generation failed');
        }

        // Update UI with progress
        console.log(`Polling attempt ${attempt + 1}/${maxAttempts}, status: ${result.status}`);
    }

    throw new Error('Timeout: VTON operation took too long');
}

// Export functions for use in app.html
if (typeof window !== 'undefined') {
    window.VTON = {
        processVTONPair,
        pollVTONResult,
        checkVTONStatus
    };
}
