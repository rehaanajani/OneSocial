import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import ContentInput from "../components/ContentInput";
import PlatformSelector from "../components/PlatformSelector";
import GenerateButton from "../components/GenerateButton";
import ResultsPage from "./ResultsPage";

// Use the environment variable if present (like for local dev), 
// otherwise use an empty string so fetch paths are relative to the current domain (e.g., Vercel)
const API_BASE = import.meta.env.VITE_API_URL || "";

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function Generator() {
    // ── Content State ───────────────────────────────────────────────────────
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
    const [captionVibe, setCaptionVibe] = useState("");
    const [accountType, setAccountType] = useState("personal");
    const [manualCaption, setManualCaption] = useState("");
    const [imageAction, setImageAction] = useState("generate_new");
    const [writeOwn, setWriteOwn] = useState(false);

    // ── New AI Pipeline Preferences ─────────────────────────────────────────
    const [contentNiche, setContentNiche] = useState("");
    const [imageStyle, setImageStyle] = useState("auto");
    const [colorPalette, setColorPalette] = useState("auto");

    // ── Platform State ──────────────────────────────────────────────────────
    const [selectedPlatforms, setSelectedPlatforms] = useState(["instagram"]);
    const [platformContexts, setPlatformContexts] = useState({});

    // ── Generation State ────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [generationStage, setGenerationStage] = useState(null); // null | "analysing" | "crafting" | "generating"
    const [results, setResults] = useState(null);
    const [warnings, setWarnings] = useState([]);
    const [error, setError] = useState("");

    // ── Validation ──────────────────────────────────────────────────────────
    const hasContent = content.trim().length > 0 || manualCaption.trim().length > 0;
    const hasPlatforms = selectedPlatforms.length > 0;
    const canGenerate = hasContent && hasPlatforms && !loading;

    // ── Handle Generate ─────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!canGenerate) return;

        setLoading(true);
        setError("");
        setResults(null);
        setWarnings([]);

        try {
            // Stage indicator — Analysing
            setGenerationStage("analysing");

            let primaryImageBase64 = null;
            if (primaryImageIndex !== null && images[primaryImageIndex]) {
                primaryImageBase64 = await fileToBase64(images[primaryImageIndex].file);
            }

            // Small UI pause so user sees the "Analysing" stage label
            await new Promise((r) => setTimeout(r, 500));
            setGenerationStage("crafting");

            const payload = {
                content: content.trim(),
                platforms: selectedPlatforms,
                captionVibe,
                accountType,
                manualCaption: writeOwn ? manualCaption.trim() : "",
                imageAction,
                primaryImage: primaryImageBase64,
                platformContexts,
                // New pipeline fields
                contentNiche,
                imageStyle,
                colorPalette,
            };

            // Short pause so user sees the "Crafting" label before the real request fires
            await new Promise((r) => setTimeout(r, 400));
            setGenerationStage("generating");

            const res = await fetch(`${API_BASE}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Something went wrong. Please try again.");
                return;
            }

            const { _warnings = [], ...platformResults } = data;
            setWarnings(_warnings);
            setResults(platformResults);
        } catch (err) {
            console.error("[Generator] fetch error:", err);
            setError("Could not reach the server. Is the backend running?");
        } finally {
            setLoading(false);
            setGenerationStage(null);
        }
    };

    const primaryImagePreview =
        primaryImageIndex !== null && images[primaryImageIndex]
            ? images[primaryImageIndex].preview
            : null;

    // ── Results view ──────────────────────────────────────────────────────
    if (results) {
        return (
            <motion.div
                className="absolute top-0 left-0 w-full min-h-screen bg-bg"
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            >
                <Navbar />
                <ResultsPage
                    results={results}
                    originalImage={primaryImagePreview}
                    imageAction={imageAction}
                    warnings={warnings}
                    onBack={() => setResults(null)}
                />
            </motion.div>
        );
    }

    // ── Input Form view ────────────────────────────────────────────────────
    return (
        <motion.div
            className="absolute top-0 left-0 w-full min-h-screen bg-bg"
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
                {/* Page heading */}
                <div className="text-center">
                    <h2
                        className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight mb-2"
                        style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                        Create Your Posts
                    </h2>
                    <p className="text-sm text-text-muted">
                        One idea → platform-optimised captions & visuals, instantly.
                    </p>
                </div>

                {/* Content input card */}
                <ContentInput
                    content={content}
                    setContent={setContent}
                    images={images}
                    setImages={setImages}
                    primaryImageIndex={primaryImageIndex}
                    setPrimaryImageIndex={setPrimaryImageIndex}
                    captionVibe={captionVibe}
                    setCaptionVibe={setCaptionVibe}
                    accountType={accountType}
                    setAccountType={setAccountType}
                    manualCaption={manualCaption}
                    setManualCaption={setManualCaption}
                    imageAction={imageAction}
                    setImageAction={setImageAction}
                    writeOwn={writeOwn}
                    setWriteOwn={setWriteOwn}
                    contentNiche={contentNiche}
                    setContentNiche={setContentNiche}
                    imageStyle={imageStyle}
                    setImageStyle={setImageStyle}
                    colorPalette={colorPalette}
                    setColorPalette={setColorPalette}
                />

                {/* Platform selector */}
                <PlatformSelector
                    selectedPlatforms={selectedPlatforms}
                    setSelectedPlatforms={setSelectedPlatforms}
                    platformContexts={platformContexts}
                    setPlatformContexts={setPlatformContexts}
                />

                {/* Error message */}
                {error && (
                    <div className="flex items-start gap-3 bg-error/10 border border-error/20 text-red-400 rounded-xl px-4 py-3 text-sm">
                        <span className="text-base shrink-0">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Disabled hint */}
                {!hasContent && !loading && (
                    <p className="text-center text-xs text-text-muted">
                        Enter an idea or topic above to get started.
                    </p>
                )}

                {/* Generate button */}
                <GenerateButton
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={!canGenerate}
                    stage={generationStage}
                />
            </main>
        </motion.div>
    );
}
