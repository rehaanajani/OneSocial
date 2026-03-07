/**
 * services/captionService.js
 *
 * Provider-agnostic caption generation.
 * Supports: "openrouter" (default), "bedrock", "mock".
 *
 * If AI_PROVIDER=mock OR the API key is missing, returns
 * realistic placeholder captions so the UI works without real creds.
 */

const { buildCaptionPrompt } = require('./promptService');

// ── Mock captions per platform ─────────────────────────────────────────────
const MOCK_CAPTIONS = {
    instagram: `✨ Living for moments like these! Sometimes the best things in life are the ones you didn't plan for. Embrace the chaos, enjoy the ride, and never stop chasing what makes your soul happy. 🌊🔥

Drop a 💬 below — what's your favourite unplanned memory?

#instadaily #lifestyle #goodvibes #explorepage #motivation #authentic #contentcreator #viral`,

    linkedin: `The biggest lesson I've learned in my career isn't about strategy or execution — it's about clarity.

When you know exactly WHY you're doing something, the HOW becomes surprisingly simple. Most teams struggle not because they lack talent, but because they lack direction.

Here's what changed everything for me: I started asking "what does success look like in 90 days?" before starting any project. No more busy work. No more misaligned teams.

Try it. The answers will surprise you.

What's your go-to framework for staying focused? Drop it in the comments 👇

#leadership #productivity #professionalgrowth`,

    twitter: `The secret to going viral isn't luck — it's timing, relevance, and one sentence that makes people stop scrolling. 🧵 Thread:`,
};

// ── Stub guard ─────────────────────────────────────────────────────────────
function isMockMode() {
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();
    const hasKey = !!process.env.OPENROUTER_API_KEY || !!process.env.AWS_ACCESS_KEY_ID;
    return provider === 'mock' || !hasKey;
}

// ── Provider loader ────────────────────────────────────────────────────────
function getProvider() {
    const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
    if (provider === 'bedrock') return require('../providers/bedrockProvider');
    return require('../providers/openrouterProvider');
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a platform-specific caption for the given content.
 *
 * @param {string} platform    - "instagram" | "linkedin" | "twitter"
 * @param {string} content     - Raw topic or idea from the request
 * @param {object} options     - { vibe, accountType, context }
 * @param {string} [manualCaption] - If provided, skip AI and return this directly
 * @returns {Promise<string>} Caption text
 */
async function generateCaption(platform, content, options = {}, manualCaption = null) {
    // If user wrote their own caption — use it as-is
    if (manualCaption && manualCaption.trim()) {
        return manualCaption.trim();
    }

    // Mock mode — no real API call
    if (isMockMode()) {
        console.log(`[captionService] MOCK mode — returning stub caption for ${platform}`);
        await new Promise((r) => setTimeout(r, 400)); // simulate latency
        return MOCK_CAPTIONS[platform] || MOCK_CAPTIONS.instagram;
    }

    const prompt = buildCaptionPrompt(platform, content, options);
    const provider = getProvider();
    return provider.generateCaption(prompt);
}

module.exports = { generateCaption };
