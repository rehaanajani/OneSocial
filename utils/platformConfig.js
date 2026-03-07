/**
 * utils/platformConfig.js
 *
 * Central configuration for each supported social-media platform.
 * Used by promptService to build platform-specific AI prompts.
 */

// ── Caption Vibes ──────────────────────────────────────────────────────────
const vibeModifiers = {
  trending: "Use viral hooks, trending formats, bold openers, and attention-grabbing phrasing that feels current and shareable.",
  funny: "Use humour, wit, and light-hearted language. Jokes, puns, or playful observations are encouraged.",
  inspirational: "Use uplifting, motivational, and emotionally resonant language. Focus on empowerment and positive energy.",
  promotional: "Write persuasively with a clear call-to-action. Highlight value, benefits, and urgency.",
  storytelling: "Narrate in a personal, story-driven style. Build tension, make it relatable, and lead to a satisfying point.",
  informative: "Be clear, factual, and educational. Use data, tips, or structured points. Prioritise usefulness.",
  conversational: "Write like you are talking to a close friend. Casual, warm, approachable, no jargon.",
  bold: "Be provocative, confident, and assertive. Make strong statements. Do not hedge.",
};

// ── Image Actions ──────────────────────────────────────────────────────────
const imageActionPrompts = {
  generate_new:
    "Generate a brand-new high-quality social media image based on the topic. No reference image is provided.",
  enhance:
    "Enhance the image: improve lighting, sharpness, colour vibrancy, and overall quality. Preserve ALL original content — do not change the subject, background, or composition.",
  remove_bg:
    "Remove the background of the image, leaving only the main subject on a clean transparent or white backdrop.",
  remove_people:
    "Identify and remove all people in the background of the image while perfectly reconstructing the background using surrounding textures and context. Preserve the main subject.",
  change_bg:
    "Keep the main subject identical. Replace the existing background with a visually appealing, platform-optimised backdrop that complements the subject and the social media context.",
  smart_crop:
    "Intelligently detect the main subject and crop/reframe the image to fit the target platform's optimal aspect ratio without cutting off important content.",
  color_grade:
    "Apply a professional cinematic colour grade that enhances mood and visual appeal. Maintain the authenticity of the original scene.",
  upscale:
    "Upscale the image resolution to HD/4K quality, recovering fine details and removing noise or pixelation.",
  keep_original:
    null, // no image AI call needed — pass the original image through as-is
};

// ── Platform Configurations ───────────────────────────────────────────────
const platformConfig = {
  instagram: {
    captionStyle: `
      Write an Instagram caption that is:
      - Engaging and conversational
      - Includes 3–5 relevant emojis scattered naturally throughout
      - Ends with 5–8 relevant hashtags on a new line
      - Feels authentic and speaks directly to the audience
      - Between 100 and 200 words
    `.trim(),

    imageStyle: `
      Vibrant, high-quality, eye-catching social media image.
      Bright colours, modern aesthetic, suitable for Instagram feed.
      Aspect ratio 1:1 (square). No text overlay.
    `.trim(),

    // Context-specific prompt modifiers
    contextPrompts: {
      postType: {
        feed: "Optimise the caption for an Instagram Feed post — evergreen, discoverable, and save-worthy.",
        reel: "Optimise the caption for an Instagram Reel — punchy hook in the first line, energetic, and short.",
        story: "Optimise the caption for an Instagram Story — ultra-short, direct, with a CTA (poll/swipe/reply).",
        carousel: "Optimise the caption for a Carousel post — tease multiple insights, encourage swiping.",
      },
      account: {
        public: "The account is public — prioritise discoverability and broad appeal.",
        private: "The account is private/personal — write in an intimate, personal tone for a close audience.",
        spam: "This is a spam/close-friends account — be completely unfiltered, raw, and extremely casual.",
        group: "This is a group/collab account — acknowledge multiple creators, inclusive language.",
      },
      tone: {
        casual: "Keep the tone light, everyday, and unpretentious.",
        influencer: "Sound like a polished content creator — aspirational yet authentic.",
        brand: "Sound like an established brand — consistent, professional, on-brand.",
      },
    },
  },

  linkedin: {
    captionStyle: `
      Write a LinkedIn post that is:
      - Professional and authoritative in tone
      - Structured with a compelling opening line, 2–3 insightful paragraphs, and a clear call-to-action
      - No emojis or slang
      - Between 150 and 300 words
      - Ends with 3 relevant professional hashtags
    `.trim(),

    imageStyle: `
      Clean, professional business image.
      Corporate aesthetic, neutral colours, modern design.
      Landscape orientation (1200x627). No decorative borders.
    `.trim(),

    contextPrompts: {
      postType: {
        regular: "Format as a standard LinkedIn post — readable paragraphs, strong first sentence.",
        article: "Write the introduction for a long-form LinkedIn Article — frame the thesis and promise value.",
        poll: "Write a LinkedIn Poll caption — ask one clear, debatable question and give context.",
      },
      audience: {
        recruiters: "The primary audience is recruiters — highlight skills, credibility, and professional value.",
        founders: "The primary audience is founders/entrepreneurs — speak to growth, leadership, and innovation.",
        professionals: "Write for a broad professional audience — universally relatable career insights.",
        students: "The audience includes students/early career — make it accessible, educational, and encouraging.",
      },
      goal: {
        thought_leadership: "Position the author as a thought leader — share a unique insight or contrarian take.",
        networking: "Encourage connection and conversation — end with an open question.",
        job_seeking: "Subtly signal availability and skills without being desperate.",
        company_update: "Announce a company milestone, launch, or news in an engaging, proud tone.",
      },
    },
  },

  twitter: {
    captionStyle: `
      Write a Tweet (X post) that is:
      - Punchy and attention-grabbing
      - Strictly under 280 characters (this is a hard limit)
      - May include 1–2 emojis if they add value
      - Includes 1–2 relevant hashtags
      - Ends with impact — no filler words
    `.trim(),

    imageStyle: `
      Bold, simple, thumb-stopping image for Twitter/X.
      High contrast, minimal composition, 16:9 ratio.
      No text overlay.
    `.trim(),

    contextPrompts: {
      format: {
        single: "Write a single, self-contained tweet under 280 characters.",
        thread: "Write the opening tweet of a thread — end with '🧵 Thread:' and make people want to read more.",
      },
      audience: {
        general: "Write for a broad, general Twitter audience.",
        niche: "Write for a specific niche community — use insider language and shared references.",
        tech: "Write for the tech and developer community on X — precise, nerdy, confident.",
      },
      goal: {
        engagement: "Maximise replies and retweets — provoke thought or ask a question.",
        awareness: "Build brand/topic awareness — clear, memorable, shareable.",
        viral: "Go for virality — use humour, a hot take, or a surprising fact.",
      },
    },
  },
};

module.exports = { platformConfig, vibeModifiers, imageActionPrompts };
