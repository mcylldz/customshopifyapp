/**
 * Google Sheets Logger
 * Logs product creation to Google Sheets via Apps Script webhook
 */

const GoogleSheets = {
    // User needs to set this webhook URL from Apps Script
    WEBHOOK_URL: API_CONFIG.GOOGLE_SHEETS?.WEBHOOK_URL || '',

    async appendRow(rowData) {
        if (!this.WEBHOOK_URL) {
            console.error('❌ Google Sheets webhook URL not configured in config.js');
            console.log('ℹ️ Please create Google Apps Script webhook (see documentation)');
            showToast('Google Sheets webhook not configured', 'error');
            return;
        }

        console.log('📊 Logging to Google Sheets:', rowData);
        console.log('📍 Webhook URL:', this.WEBHOOK_URL);

        try {
            const response = await fetch(this.WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors', // Apps Script sometimes has CORS issues
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: rowData
                }),
                redirect: 'follow'
            });

            console.log('📨 Google Sheets response status:', response.status);
            console.log('📨 Response type:', response.type);

            // With no-cors, we can't read the response, but if no error thrown, it worked
            if (response.type === 'opaque') {
                console.log('✅ Request sent to Google Sheets (opaque response - likely successful)');
                return { success: true };
            }

            const responseText = await response.text();
            console.log('📨 Google Sheets response:', response.status, responseText);

            if (!response.ok) {
                throw new Error(`Google Sheets webhook failed: ${response.status} - ${responseText}`);
            }

            console.log('✅ Logged to Google Sheets successfully');
            return responseText;

        } catch (e) {
            console.error('❌ Google Sheets logging failed:', e);
            showToast('Google Sheets log failed: ' + e.message, 'error');
            throw e;
        }
    }
};

// Make globally available
window.GoogleSheets = GoogleSheets;
