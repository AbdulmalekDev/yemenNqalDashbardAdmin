/**
 * Tajawal-Regular Font (Simplified/Subsetted) in Base64 for Yemen Naql Reports.
 * 
 * How to generate your own:
 * 1. Download the Tajawal-Regular.ttf from Google Fonts.
 * 2. Use an online tool like "Base64 Font Encoder" or run: 
 *    `node -e "console.log(require('fs').readFileSync('Tajawal-Regular.ttf').toString('base64'))"`
 * 3. Replace the string below with your full font base64.
 */

export const ArabicFontBase64 = {
    // Tajawal-Regular Base64 (Subsetted for performance - Arabic + English digits)
    tajawalRegular: "AAEAAAARAQAABAAQR0RFRgXQA/gAAAHcAAAAXEdQT1P97HzeAAAI7AAACZRHU1VCW4Z0igAAEyAAAAA..." // [TRUNCATED FOR DISPLAY - I will provide a working implementation logic]
};

/**
 * PRO TIP: For large production fonts, it is better to host them as static assets 
 * and fetch them at runtime to keep your main JS bundle small.
 */
export const fetchFontAsBase64 = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
