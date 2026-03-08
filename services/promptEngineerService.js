/**
 * services/promptEngineerService.js
 *
 * Stage 2 of the smart AI pipeline — LOCAL (no extra API call).
 *
 * Takes the structured analysis from analysisService + all user preferences
 * and builds highly targeted, platform-specific prompts for:
 *   - Image generation (rich Flux/DALL-E style prompts)
 *   - Caption generation (full system + user prompt per platform)
 *
 * By operating locally (template + logic based), this stage adds zero
 * latency and zero cost while dramatically improving output quality.
 */

// ── Visual style descriptors ─────────────────────────────────────────────────
const IMAGE_STYLE_DESCRIPTORS = {
    cinematic: 'cinematic film photography, anamorphic lens, dramatic lighting, shallow depth of field, movie-grade colour grading, 35mm aesthetic',
    minimal: 'ultra-clean minimal design, white space, simple geometric composition, flat lay, studio lighting, no clutter',
    vibrant: 'vibrant bold colours, high saturation, energetic composition, dynamic angles, vivid pop-art inspired palette',
    dark_moody: 'dark and moody atmosphere, deep shadows, rich contrast, noir lighting, dramatic chiaroscuro, muted earth tones with single accent colour',
    illustration: 'flat vector illustration style, bold outlines, clean colours, geometric shapes, modern editorial design',
    photorealistic: 'ultra-photorealistic, sharp details, professional DSLR photography, natural lighting, lifelike textures',
    neon_glow: 'neon glow aesthetic, cyberpunk vibes, electric neon colours against dark background, light trails, futuristic urban',
    auto: '', // determined by analysis
};

// ── Color palette descriptors ────────────────────────────────────────────────
const COLOR_PALETTE_DESCRIPTORS = {
    warm: 'warm colour palette — amber, terracotta, burnt orange, cream, soft gold',
    cool: 'cool colour palette — deep navy, sky blue, slate grey, icy white, cool cyan',
    monochrome: 'monochromatic colour scheme — shades of grey, black and white, high contrast',
    pastel: 'soft pastel colour palette — blush pink, mint green, baby blue, lavender, soft yellow',
    earth: 'earth tone palette — olive green, warm brown, beige, rust, natural sand',
    neon: 'electric neon palette — hot pink, electric blue, lime green, purple, against dark background',
    auto: '', // determined by analysis
};

// ── Platform image specs ─────────────────────────────────────────────────────
const PLATFORM_IMAGE_SPECS = {
    instagram: 'Square 1:1 composition. Optimised for mobile feed. Visually striking at small thumbnail size.',
    linkedin: 'Landscape 1200×627. Professional and clean. Readable at small size in a feed.',
    x: 'Wide banner 16:9. High contrast, bold. Must grab attention in a busy timeline.',
};

// ── Caption personality per platform × account type ──────────────────────────
function getCaptionPersonality(platform, accountType, platformContext = {}) {
    if (platform === 'instagram') {
        if (accountType === 'personal') {
            // Determine if private or public from the platform context
            const accountVis = platformContext.account || 'public';
            if (accountVis === 'private' || accountVis === 'spam') {
                return `You are a Gen-Z social media user texting your close friends. 
Write a single-line caption that is dry, sarcastic, effortlessly cool, or darkly funny. 
Maximum 60 characters. Zero effort aesthetic. No hashtags. Max 1 emoji.
Do NOT sound like a brand or marketer. Sound like a real person who doesn't care.`;
            }
        }
        return `You are a professional Instagram content creator with 500k+ followers.
Write an Instagram caption with:
- A scroll-stopping first line (the hook)
- Short punchy paragraphs (2-3 sentences max each)
- A relatable or aspirational angle
- Natural emoji use (3-6 total, scattered throughout)
- 5-8 relevant hashtags on the LAST line only
- Total length: 80-150 words
Sound authentic and engaging, not salesy.`;
    }

    if (platform === 'linkedin') {
        const goal = platformContext.goal || 'thought_leadership';
        const audience = platformContext.audience || 'professionals';
        return `You are a top LinkedIn creator and thought leader writing for ${audience}.
Write a LinkedIn post that:
- Opens with a POWERFUL single sentence (surprising stat, bold claim, or relatable moment) — NO "I am excited to announce" opener
- Uses short paragraphs (1-2 sentences) for readability
- Tells a story OR shares a genuine insight OR gives actionable advice
- Is ${goal === 'networking' ? 'conversational and community-focused' : goal === 'company_update' ? 'proud and milestone-focused' : 'thought-provoking and insightful'}
- Ends with a genuine question to invite discussion
- 3 relevant professional hashtags at the very end
- Total length: 150-250 words
- Zero emojis. Zero buzzwords. Sound human.`;
    }

    if (platform === 'x') {
        const format = platformContext.format || 'single';
        if (format === 'thread') {
            return `You are a viral X (Twitter) writer crafting a thread opener.
Write ONLY the opening tweet that:
- Makes a bold, surprising, or controversial statement
- Immediately creates curiosity or FOMO
- Ends with "🧵" or "Thread:" to signal a thread
- Is under 260 characters
- Uses 1-2 hashtags max`;
        }
        return `You are a viral X (Twitter) writer.
Write a single tweet that:
- Stops the scroll in the first 5 words
- Is witty, bold, or offers a hot take
- Is under 270 characters (HARD LIMIT — count carefully)
- Uses 1-2 hashtags max
- May include 1 emoji if it adds punch
Do NOT pad it. Short is powerful.`;
    }

    return 'Write a compelling social media caption optimised for engagement.';
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build rich, targeted prompts for image generation and caption generation
 * for each platform, using the analysis result and user preferences.
 *
 * @param {object} analysis        - Result from analysisService.analyse()
 * @param {object} userPrefs       - { vibe, accountType, imageStyle, colorPalette, contentNiche, imageAction }
 * @param {string[]} platforms     - ['instagram', 'linkedin', 'x']
 * @param {object} platformContexts - Per-platform context (postType, audience, etc.)
 * @returns {object} { perPlatform: { [platform]: { imagePrompt, captionPrompt } } }
 */
function buildPrompts(analysis, userPrefs, platforms, platformContexts = {}) {
    const {
        vibe = '',
        accountType = 'personal',
        imageStyle = 'auto',
        colorPalette = 'auto',
        imageAction = 'generate_new',
    } = userPrefs;

    const styleDesc = IMAGE_STYLE_DESCRIPTORS[imageStyle] || IMAGE_STYLE_DESCRIPTORS.auto;
    const colorDesc = COLOR_PALETTE_DESCRIPTORS[colorPalette] || COLOR_PALETTE_DESCRIPTORS.auto;

    // Vibe → extra caption instruction
    const vibeInstructions = {
        trending: 'Use viral hooks, trending formats, bold openers. Make it feel current and shareable.',
        funny: 'Be witty, use humour, puns, or unexpected observations. Make them laugh.',
        inspirational: 'Use uplifting, emotionally resonant language. Focus on empowerment and hope.',
        promotional: 'Write persuasively with a clear CTA. Highlight value and urgency.',
        storytelling: 'Narrate in a personal story-driven style. Build tension, make it relatable.',
        informative: 'Be clear, factual, educational. Use data, tips, or structured points.',
        conversational: 'Write like talking to a close friend. Casual, warm, no jargon.',
        bold: 'Be provocative and confident. Make strong statements. Never hedge.',
    };
    const vibeInstruction = vibe && vibeInstructions[vibe] ? `\nVibe directive: ${vibeInstructions[vibe]}` : '';

    const perPlatform = {};

    for (const platform of platforms) {
        const platformCtx = platformContexts[platform] || {};

        // ── Image Prompt ────────────────────────────────────────────────────────
        let imagePrompt = null;
        if (imageAction !== 'keep_original') {
            const imageConcept = analysis[`${platform}ImageConcept`] || analysis.instagramImageConcept || '';
            const parts = [
                // Core concept from analysis
                imageConcept,
                // Style overlay from user preference or analysis aesthetic
                styleDesc || `${analysis.aesthetic} style`,
                // Color override or analysis recommendation
                colorDesc || analysis.colorRecommendation,
                // Platform dimension requirement
                PLATFORM_IMAGE_SPECS[platform],
                // Niche grounding
                `Content niche: ${analysis.niche}. Mood: ${analysis.mood}.`,
                // Quality tags
                'High quality, professional, social media ready. No text overlays. No watermarks.',
            ].filter(Boolean);

            if (imageAction !== 'generate_new') {
                const actionInstructions = {
                    enhance: 'Enhance the provided image: improve lighting, sharpness, colour vibrancy. Preserve all original content exactly.',
                    remove_bg: 'Remove the background cleanly. Keep only the main subject on a transparent/white backdrop.',
                    remove_people: 'Remove background people. Reconstruct the background naturally. Keep the main subject.',
                    change_bg: `Replace the background with: ${imageConcept}. Keep the main subject identical.`,
                    smart_crop: `Smart crop to fit ${PLATFORM_IMAGE_SPECS[platform]}. Do not cut the main subject.`,
                    color_grade: `Apply a ${styleDesc || analysis.aesthetic} colour grade. ${colorDesc || analysis.colorRecommendation}.`,
                    upscale: 'Upscale to HD/4K. Recover fine details. Remove pixelation.',
                };
                parts.unshift(actionInstructions[imageAction] || '');
            }

            imagePrompt = parts.filter(Boolean).join(', ');
        }

        // ── Caption Prompt ───────────────────────────────────────────────────────
        const personality = getCaptionPersonality(platform, accountType, platformCtx);
        const captionPrompt = `${personality}
${vibeInstruction}

Subject / Content: ${analysis.subject}
Niche: ${analysis.niche}
Audience: ${analysis.audience}
Mood: ${analysis.mood}
Key themes: ${(analysis.keyThemes || []).join(', ')}
Account type: ${accountType === 'business' ? 'Business/Brand — professional and consistent' : 'Personal — authentic and individual'}

Write the caption now. Respond with ONLY the caption text.`;

        perPlatform[platform] = { imagePrompt, captionPrompt };
    }

    return { perPlatform };
}

module.exports = { buildPrompts };
