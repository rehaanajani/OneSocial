/**
 * services/imageService.js
 *
 * Provider-agnostic image generation / editing.
 * Supports: "openrouter" (default), "bedrock", "mock".
 *
 * If AI_PROVIDER=mock OR the API key is missing, returns
 * placeholder image URLs so the UI works without real creds.
 *
 * Multi-image handling:
 *   - If the user uploads multiple images, the PRIMARY image (index 0 of
 *     the primaryImage field) is forwarded to the AI provider.
 *   - All other images are ignored at this stage (reserved for future
 *     multi-image composition features).
 */

const { buildImagePrompt } = require('./promptService');

// ── Platform image sizes ─────────────────────────────────────────────────
const PLATFORM_IMAGE_SIZES = {
  instagram: '1024x1024',
  linkedin: '1200x627',
  twitter: '1280x720',
};

// ── Mock placeholder images (royalty-free Unsplash for demo) ─────────────
const MOCK_IMAGES = {
  instagram: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1024&h=1024&fit=crop&auto=format',
  linkedin: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=627&fit=crop&auto=format',
  twitter: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1280&h=720&fit=crop&auto=format',
};

// ── Stub guard ───────────────────────────────────────────────────────────
function isMockMode() {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();
  const hasKey = !!process.env.OPENROUTER_API_KEY || !!process.env.AWS_ACCESS_KEY_ID;
  return provider === 'mock' || !hasKey;
}

// ── Provider loader ──────────────────────────────────────────────────────
function getProvider() {
  const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
  if (provider === 'bedrock') return require('../providers/bedrockProvider');
  return require('../providers/openrouterProvider');
}

// ─────────────────────────────────────────────────────────────────────────

/**
 * Generate or process an image for the given platform and content.
 *
 * @param {string} platform      - "instagram" | "linkedin" | "twitter"
 * @param {string} content       - Raw topic or idea
 * @param {string} imageAction   - Key from imageActionPrompts (e.g. "enhance", "remove_bg")
 * @param {string|null} primaryImageUrl - URL/base64 of the primary uploaded image (or null)
 * @returns {Promise<string>} image URL or base64 string
 */
async function generateImage(platform, content, imageAction = 'generate_new', primaryImageUrl = null) {
  // "keep_original" — pass the uploaded image straight through
  if (imageAction === 'keep_original' && primaryImageUrl) {
    return primaryImageUrl;
  }

  // Mock mode — no real API call
  if (isMockMode()) {
    console.log(`[imageService] MOCK mode — returning stub image for ${platform} (action: ${imageAction})`);
    await new Promise((r) => setTimeout(r, 600)); // simulate latency
    return MOCK_IMAGES[platform] || MOCK_IMAGES.instagram;
  }

  const prompt = buildImagePrompt(platform, content, imageAction);
  const size = PLATFORM_IMAGE_SIZES[platform] || '1024x1024';
  const provider = getProvider();

  return provider.generateImage(prompt, size, primaryImageUrl);
}

module.exports = { generateImage };