/**
 * Size Chart Mode - Turkish Size Chart Generator
 * Converts size chart images to clean, minimalist Turkish format
 */

/**
 * Process Size Chart Mode
 * Creates premium black-and-white Turkish size chart
 */
async function processSizeChartMode(sizeChartImageUrl) {
    try {
        const prompt = `Create a clean, minimalist and premium black-and-white size chart visual for a women's fashion e-commerce website. Use the provided size chart image and replace all text with fully Turkish content. Do NOT include any product code, model code, or fabric code in the visual. Preserve the same measurement categories but redesign the layout in a more modern, balanced and high-end style. The composition must include: a refined table with clear borders, evenly spaced columns for S-M, L-XL and 2XL-3XL, and neatly aligned measurement rows labeled "Boy", "Göğüs", "Bel", "Etek Ucu", "Kol Boyu". On the right side, include a simplified female silhouette with numbered measurement indicators (1–5) corresponding to the table rows. All numbers and labels must appear in Turkish. Use only black, white and grey tones. No color allowed. The overall look must be consistent across all generations: minimalist, editorial, monochrome, high-legibility typography, perfectly aligned layout, no decorative elements, no gradients, no shadows. Output must ALWAYS follow this exact layout structure and must NEVER include product codes or any additional information.`;

        showToast('Creating Turkish size chart...', 'success');

        // Submit to FAL AI through proxy
        const response = await fetch(window.API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'fal_submit',
                payload: {
                    image_urls: [sizeChartImageUrl],
                    prompt: prompt,
                    aspect_ratio: "9:16",
                    resolution: "2K"
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Size chart FAL submission failed: ${response.status}`);
        }

        const data = await response.json();

        // Poll for result
        showToast('Polling for size chart result...', 'success');
        const resultUrl = await pollSizeChartResult(data.request_id);

        return {
            output_image: resultUrl,
            request_id: data.request_id,
            mode: 'sizechart'
        };

    } catch (error) {
        console.error('Size Chart Mode Error:', error);
        throw error;
    }
}

/**
 * Poll for Size Chart Result
 */
async function pollSizeChartResult(requestId, maxAttempts = 120) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000));

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
            throw new Error(`Size chart status check failed: ${statusRes.status}`);
        }

        const statusData = await statusRes.json();

        if (statusData.status === 'COMPLETED') {
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
                throw new Error(`Size chart result fetch failed: ${resultRes.status}`);
            }

            const resultData = await resultRes.json();
            return resultData.images[0].url;
        }

        if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
            throw new Error('Size chart generation failed');
        }

        console.log(`Size chart polling ${attempt + 1}/${maxAttempts}, status: ${statusData.status}`);
    }

    throw new Error('Size chart mode timeout');
}

// Export
if (typeof window !== 'undefined') {
    if (!window.VTON) window.VTON = {};
    window.VTON.processSizeChartMode = processSizeChartMode;
    window.VTON.pollSizeChartResult = pollSizeChartResult;
}
