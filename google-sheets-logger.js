/**
 * Google Sheets Logger
 * Logs product creation to Google Sheets via Apps Script webhook
 */

const GoogleSheets = {
    // User needs to set this webhook URL from Apps Script
    WEBHOOK_URL: API_CONFIG.GOOGLE_SHEETS?.WEBHOOK_URL || '',

    async appendRow(rowData) {
        console.log('📊 Logging to Google Sheets via proxy:', rowData);

        try {
            // Use proxy endpoint for Netlify compatibility
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'google_sheets_log',
                    row_data: rowData
                })
            });

            console.log('📨 Google Sheets proxy response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Google Sheets logging failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Logged to Google Sheets successfully:', result);
            return result;

        } catch (e) {
            console.error('❌ Google Sheets logging failed:', e);
            // Don't show toast - this is non-critical
            // showToast('Google Sheets log failed: ' + e.message, 'error');
            return { success: false, error: e.message };
        }
    }
};

// Make globally available
window.GoogleSheets = GoogleSheets;
