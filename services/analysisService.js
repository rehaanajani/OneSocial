/**
 * services/analysisService.js
 *
 * Stage 1 of the smart AI pipeline.
 * Uses Claude 3.5 Sonnet on AWS Bedrock (vision-capable).
 * In mock mode, returns hard-coded analysis so the app works without creds.
 */

const bedrockProvider = require('../providers/bedrockProvider');

// ── Mock analysis ─────────────────────────────────────────────────────────────
const MOCK_ANALYSIS = {
    subject: 'A product or concept being launched or promoted',
    niche: 'technology',
    mood: 'energetic',
    aesthetic: 'modern and clean',
    colorRecommendation: 'vibrant blues and whites with accent orange',
    audience: 'young professionals and enthusiasts',
    keyThemes: ['innovation', 'productivity', 'digital lifestyle'],
    instagramImageConcept: 'Bold, eye-catching product shot with clean background, vibrant lighting, square composition. Modern tech aesthetic with a human touch.',
    linkedinImageConcept: 'Professional corporate visual. Clean modern workspace or product elegantly displayed. Landscape format. Blue-white palette.',
    xImageConcept: 'High-contrast, thumb-stopping visual. Dynamic angle, bold colours. Wide banner format. Minimal clutter.',
};

function isMockMode() {
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();
    const hasKey = !!process.env.AWS_ACCESS_KEY_ID;
    return provider === 'mock' || !hasKey;
}

/**
 * Analyse the user's content and return a structured context object.
 *
 * @param {string} content          - User's raw idea / text
 * @param {string|null} primaryImage - Base64 image data (no prefix) or null
 * @param {string} userNiche        - Optional niche hint from the UI
 * @returns {Promise<object>}       - Analysis object
 */
async function analyse(content, primaryImage = null, userNiche = '') {
    if (isMockMode()) {
        console.log('[analysisService] MOCK mode — returning stub analysis');
        await new Promise((r) => setTimeout(r, 300));
        return { ...MOCK_ANALYSIS, niche: userNiche || MOCK_ANALYSIS.niche };
    }

    try {
        console.log(`[analysisService] Invoking Claude 3.5 Sonnet${primaryImage ? ' (vision)' : ''}`);
        const analysis = await bedrockProvider.generateAnalysis(content, primaryImage, userNiche);
        console.log(`[analysisService] Done — niche: ${analysis.niche}, mood: ${analysis.mood}`);
        return analysis;
    } catch (err) {
        console.error('[analysisService] Error:', err.message);
        console.warn('[analysisService] Falling back to mock analysis');
        return { ...MOCK_ANALYSIS, niche: userNiche || MOCK_ANALYSIS.niche };
    }
}

module.exports = { analyse };
