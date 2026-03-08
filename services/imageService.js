/**
 * services/imageService.js
 *
 * Image generation via AWS Bedrock (Amazon Nova Canvas).
 * In mock mode, returns Unsplash placeholder URLs.
 */

const { buildImagePrompt } = require('./promptService');
const bedrockProvider = require('../providers/bedrockProvider');

// ── Mock placeholders ─────────────────────────────────────────────────────────
const MOCK_IMAGES = {
  instagram: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1024&h=1024&fit=crop&auto=format',
  linkedin: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&h=720&fit=crop&auto=format',
  x: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1280&h=720&fit=crop&auto=format',
};

function isMockMode() {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();
  const hasKey = !!process.env.AWS_ACCESS_KEY_ID;
  return provider === 'mock' || !hasKey;
}

/**
 * Generate or edit an image for a given platform.
 *
 * @param {string} platform           - "instagram" | "linkedin" | "x"
 * @param {string} content            - Raw topic (fallback if no engineered prompt)
 * @param {string} imageAction        - Action key (generate_new, enhance, etc.)
 * @param {string|null} primaryImage  - Base64 of uploaded image or null
 * @param {string|null} engineeredPrompt - Pre-built rich prompt from pipeline
 * @returns {Promise<string>} Data-URL or image URL
 */
async function generateImage(platform, content, imageAction = 'generate_new', primaryImage = null, engineeredPrompt = null) {
  // Pass through original image unchanged
  if (imageAction === 'keep_original' && primaryImage) return primaryImage;

  if (isMockMode()) {
    console.log(`[imageService] MOCK — stub image for ${platform}`);
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_IMAGES[platform] || MOCK_IMAGES.instagram;
  }

  const prompt = engineeredPrompt || buildImagePrompt(platform, content, imageAction);

  // Only pass primaryImage to Nova Canvas when the action needs it
  const needsReferenceImage = imageAction !== 'generate_new' && !!primaryImage;

  console.log(`[imageService] Nova Canvas — ${platform} | action: ${imageAction} | ${engineeredPrompt ? 'engineered' : 'legacy'} prompt`);
  return bedrockProvider.generateImage(prompt, platform, needsReferenceImage ? primaryImage : null);
}

module.exports = { generateImage };