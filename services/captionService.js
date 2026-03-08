/**
 * services/captionService.js
 *
 * Caption generation via AWS Bedrock (Claude 3.5 Haiku).
 * In mock mode, returns platform-native stub captions.
 */

const { buildCaptionPrompt } = require('./promptService');
const bedrockProvider = require('../providers/bedrockProvider');

// ── Mock captions ──────────────────────────────────────────────────────────────
const MOCK_CAPTIONS = {
    instagram: `couldn't be more unbothered rn 😌

fr though, this has been living rent free in my head. sometimes the simplest things hit different when you actually slow down and notice them. no big deal, just another tuesday

tap if you needed this reminder today 💙

#aesthetic #vibes #realtalk #instadaily #goodvibes #authentic #mood #weekendvibes`,

    linkedin: `Most people optimise for the wrong thing.

We spend years chasing bigger titles, more visibility, louder achievements — and somewhere in that pursuit, we forget to ask: is this actually working?

The teams I've seen sustain high performance share one trait: radical clarity. Not just on goals, but on *why* those goals matter. When everybody understands the north star, prioritisation becomes obvious and wasted effort disappears.

What's one thing your team needs more clarity on right now? 👇

#leadership #strategy #futureofwork`,

    x: `Reminder: you're not behind. You're on a different timeline. 🌊 #perspective`,
};

function isMockMode() {
    const provider = (process.env.AI_PROVIDER || '').toLowerCase();
    const hasKey = !!process.env.AWS_ACCESS_KEY_ID;
    return provider === 'mock' || !hasKey;
}

/**
 * Generate a platform-specific caption.
 *
 * @param {string} platform        - "instagram" | "linkedin" | "x"
 * @param {string} content         - Raw topic or idea
 * @param {object} options         - { vibe, accountType, context, engineeredPrompt }
 * @param {string} [manualCaption] - If provided, skip AI and return directly
 * @returns {Promise<string>} Caption text
 */
async function generateCaption(platform, content, options = {}, manualCaption = null) {
    if (manualCaption && manualCaption.trim()) return manualCaption.trim();

    if (isMockMode()) {
        console.log(`[captionService] MOCK — stub caption for ${platform}`);
        await new Promise((r) => setTimeout(r, 400));
        return MOCK_CAPTIONS[platform] || MOCK_CAPTIONS.instagram;
    }

    const { engineeredPrompt, vibe, accountType, context } = options;
    const prompt = engineeredPrompt || buildCaptionPrompt(platform, content, { vibe, accountType, context });

    console.log(`[captionService] Claude 3.5 Haiku — ${platform} (${engineeredPrompt ? 'engineered' : 'legacy'} prompt)`);
    return bedrockProvider.generateCaption(prompt);
}

module.exports = { generateCaption };
