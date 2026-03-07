/**
 * routes/generateRoute.js
 *
 * POST /api/generate
 *
 * Key improvements:
 *  - Sequential per platform: image generated first, caption after (can reference image)
 *  - Partial success: Promise.allSettled means one platform failing won't kill others
 *  - Per-platform sizing hint passed to imageService
 */

const express = require('express');
const router = express.Router();

const { generateCaption } = require('../services/captionService');
const { generateImage } = require('../services/imageService');

const SUPPORTED_PLATFORMS = ['instagram', 'linkedin', 'twitter'];

router.post('/', async (req, res) => {
    try {
        const {
            content = '',
            platforms = [],
            captionVibe = '',
            accountType = 'personal',
            manualCaption = '',
            imageAction = 'generate_new',
            primaryImage = null,   // base64 string from frontend
            platformContexts = {},
        } = req.body;

        // ── 1. Validate ──────────────────────────────────────────────────────
        const hasContent = content.trim().length > 0;
        const hasManualCaption = manualCaption.trim().length > 0;

        if (!hasContent && !hasManualCaption) {
            return res.status(400).json({
                error: 'Validation Error',
                message: '"content" is required (or provide a "manualCaption").',
            });
        }

        if (!Array.isArray(platforms) || platforms.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: '"platforms" must be a non-empty array.',
            });
        }

        const invalidPlatforms = platforms.filter(
            (p) => !SUPPORTED_PLATFORMS.includes(p.toLowerCase())
        );
        if (invalidPlatforms.length > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: `Unsupported platforms: ${invalidPlatforms.join(', ')}.`,
            });
        }

        const normalisedPlatforms = platforms.map((p) => p.toLowerCase());

        console.log(
            `[generate] platforms=${normalisedPlatforms.join(',')} | action=${imageAction} | vibe=${captionVibe} | manual=${hasManualCaption}`
        );

        // ── 2. Generate per platform — SEQUENTIAL within each platform ────────
        // Image → Caption (caption can reference the image concept)
        // Platforms run concurrently with each other via Promise.allSettled
        // so one platform failing never kills the others (partial success).
        const platformSettled = await Promise.allSettled(
            normalisedPlatforms.map(async (platform) => {
                // Step A: Generate image first
                const image = await generateImage(
                    platform,
                    content,
                    imageAction,
                    primaryImage || null
                );

                // Step B: Generate caption AFTER image (can conceptually reference result)
                const captionOptions = {
                    vibe: captionVibe,
                    accountType: accountType,
                    context: platformContexts[platform] || {},
                };
                const caption = await generateCaption(
                    platform,
                    content,
                    captionOptions,
                    manualCaption || null
                );

                return { platform, caption, image };
            })
        );

        // ── 3. Separate successes from failures ───────────────────────────────
        const response = {};
        const failures = [];

        platformSettled.forEach((result, i) => {
            const platform = normalisedPlatforms[i];
            if (result.status === 'fulfilled') {
                const { caption, image } = result.value;
                response[platform] = { caption, image };
            } else {
                console.error(`[generate] Failed for ${platform}:`, result.reason?.message);
                failures.push({ platform, error: result.reason?.message || 'Unknown error' });
            }
        });

        // If everything failed return 500
        if (Object.keys(response).length === 0) {
            return res.status(500).json({
                error: 'Generation Failed',
                message: 'All platform generations failed.',
                failures,
            });
        }

        // Partial success: return what worked + note what failed
        return res.status(200).json({
            ...response,
            ...(failures.length > 0 ? { _warnings: failures } : {}),
        });

    } catch (error) {
        console.error('[generate] Unexpected error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Something went wrong. Please try again.',
        });
    }
});

module.exports = router;
