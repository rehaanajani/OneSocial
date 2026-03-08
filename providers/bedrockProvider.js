/**
 * providers/bedrockProvider.js
 *
 * AWS Bedrock provider for OneSocial.
 *
 * Models used:
 *   Analysis : anthropic.claude-3-5-sonnet-20241022-v2:0  (vision-capable)
 *   Caption  : anthropic.claude-3-5-haiku-20241022-v1:0   (fast + high quality)
 *   Image    : amazon.nova-canvas-v1:0                     (AWS native image gen)
 */

const {
    BedrockRuntimeClient,
    InvokeModelCommand,
    ConverseCommand,
} = require('@aws-sdk/client-bedrock-runtime');

// ── Bedrock client ────────────────────────────────────────────────────────────
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// ── Model IDs ─────────────────────────────────────────────────────────────────
const ANALYSIS_MODEL = process.env.BEDROCK_ANALYSIS_MODEL || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
const CAPTION_MODEL = process.env.BEDROCK_CAPTION_MODEL || 'anthropic.claude-3-5-haiku-20241022-v1:0';
const IMAGE_MODEL = process.env.BEDROCK_IMAGE_MODEL || 'amazon.nova-canvas-v1:0';

// ── Nova Canvas supported sizes (platform → dimensions) ──────────────────────
const NOVA_CANVAS_SIZES = {
    instagram: { width: 1024, height: 1024 },  // 1:1 square
    linkedin: { width: 1280, height: 720 },  // 16:9 landscape
    x: { width: 1280, height: 720 },  // 16:9 wide banner
};

// ── Helper: invoke any Model using Converse API ──────────────────────────────
async function invokeConverse(modelId, systemPrompt, userContentArray, opts = {}) {
    // Map existing Claude-style array to Converse API format
    const content = userContentArray.map(item => {
        if (item.type === 'image') {
            const format = item.source.media_type.split('/')[1] || 'jpeg';
            return {
                image: {
                    format: format,
                    source: { bytes: Buffer.from(item.source.data, 'base64') }
                }
            };
        }
        return { text: item.text };
    });

    const command = new ConverseCommand({
        modelId,
        system: systemPrompt ? [{ text: systemPrompt }] : undefined,
        messages: [{ role: 'user', content }],
        inferenceConfig: {
            maxTokens: opts.max_tokens || 1024,
            temperature: opts.temperature || 0.7,
        }
    });

    const response = await bedrockClient.send(command);
    return response.output.message.content[0].text;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYSIS — Claude 3.5 Sonnet with optional vision
// ─────────────────────────────────────────────────────────────────────────────
const ANALYST_SYSTEM_PROMPT = `
You are a world-class social media content strategist and visual art director.
Analyse the given content (text and/or image) and return a precise structured JSON object.

Return ONLY valid JSON — no markdown fences, no explanation.

Required keys:
{
  "subject": "One sentence describing the core subject",
  "niche": "One of: technology | food | fitness | travel | fashion | business | gaming | education | art | music | lifestyle | other",
  "mood": "One of: energetic | calm | luxurious | raw | playful | professional | dramatic | inspirational | humorous | nostalgic",
  "aesthetic": "Brief ideal visual aesthetic (e.g. 'dark moody cinematic', 'clean minimal white')",
  "colorRecommendation": "Specific color palette (e.g. 'deep navy and gold accents')",
  "audience": "Who this targets (e.g. 'young tech enthusiasts aged 18-28')",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "instagramImageConcept": "Detailed Instagram image description. Square composition.",
  "linkedinImageConcept": "Detailed LinkedIn image description. Professional, landscape.",
  "xImageConcept": "Detailed X/Twitter image description. Wide banner, bold, thumb-stopping."
}
`.trim();

/**
 * Analyse content using Claude 3.5 Sonnet (vision-capable).
 *
 * @param {string} content              - User's raw idea / text
 * @param {string|null} primaryImageB64 - Base64 image (no data prefix) or null
 * @param {string} userNiche            - Optional niche hint from UI
 * @returns {Promise<object>} Structured analysis object
 */
async function generateAnalysis(content, primaryImageB64 = null, userNiche = '') {
    // Build the user message content array
    const userContent = [];

    // Attach the uploaded image if present (Claude vision format)
    if (primaryImageB64) {
        userContent.push({
            type: 'image',
            source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: primaryImageB64,
            },
        });
    }

    userContent.push({
        type: 'text',
        text: [
            `Content/Idea: "${content}"`,
            userNiche ? `User-selected niche: ${userNiche}` : '',
            'Analyse this and return the JSON object.',
        ].filter(Boolean).join('\n\n'),
    });

    const raw = await invokeConverse(ANALYSIS_MODEL, ANALYST_SYSTEM_PROMPT, userContent, {
        max_tokens: 800,
        temperature: 0.3,
    });

    // Strip accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPTION — Claude 3.5 Haiku
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a social media caption.
 *
 * @param {string} prompt - Fully-formed caption prompt (from promptEngineerService)
 * @returns {Promise<string>} Caption text
 */
async function generateCaption(prompt) {
    const text = await invokeConverse(CAPTION_MODEL, '', [{ type: 'text', text: prompt }], {
        max_tokens: 512,
        temperature: 0.75,
    });
    return text.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE — Amazon Nova Canvas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate or edit an image using Amazon Nova Canvas.
 *
 * @param {string} prompt              - Rich image prompt (from promptEngineerService)
 * @param {string} platform            - "instagram" | "linkedin" | "x"
 * @param {string|null} primaryImageB64 - Base64 reference image for editing tasks
 * @returns {Promise<string>} Data-URL of the generated PNG
 */
async function generateImage(prompt, platform = 'instagram', primaryImageB64 = null) {
    const negativeText = 'blurry, low quality, watermark, text overlay, amateur, pixelated, ugly, deformed, cartoon, sketch';
    const size = NOVA_CANVAS_SIZES[platform] || NOVA_CANVAS_SIZES.instagram;

    let requestBody;

    if (primaryImageB64) {
        // Image-to-image: use the uploaded image as a conditioning reference
        requestBody = {
            taskType: 'IMAGE_VARIATION',
            imageVariationParams: {
                text: prompt,
                negativeText,
                images: [primaryImageB64],
                similarityStrength: 0.7,  // 0 = ignore original, 1 = copy original
            },
            imageGenerationConfig: {
                numberOfImages: 1,
                width: size.width,
                height: size.height,
                cfgScale: 8.0,
            },
        };
    } else {
        // Text-to-image: generate from scratch
        requestBody = {
            taskType: 'TEXT_IMAGE',
            textToImageParams: {
                text: prompt,
                negativeText,
            },
            imageGenerationConfig: {
                numberOfImages: 1,
                width: size.width,
                height: size.height,
                cfgScale: 8.0,
                seed: Math.floor(Math.random() * 858993459),
            },
        };
    }

    const command = new InvokeModelCommand({
        modelId: IMAGE_MODEL,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(Buffer.from(response.body).toString('utf-8'));

    // Nova Canvas returns { images: ["<base64>", ...] }
    const imageBase64 = responseBody?.images?.[0];
    if (!imageBase64) throw new Error('Nova Canvas returned no image.');

    return `data:image/png;base64,${imageBase64}`;
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = { generateAnalysis, generateCaption, generateImage };
