import { useState } from "react";
import ContentInput from "../components/ContentInput";
import PlatformSelector from "../components/PlatformSelector";
import GenerateButton from "../components/GenerateButton";
import ResultsPage from "./ResultsPage";

// ── Progress steps shown during generation ────────────────────────────────
const PROGRESS_STEPS = [
    { id: "analyzing", label: "Analyzing image…", icon: "🔍" },
    { id: "prompting", label: "Engineering prompts…", icon: "✍️" },
    { id: "generating", label: "Generating visuals…", icon: "🎨" },
    { id: "captioning", label: "Writing captions…", icon: "📝" },
    { id: "done", label: "Almost ready!", icon: "✨" },
];

// Advance through steps automatically during generation to simulate progress
function useProgressStepper(loading) {
    const [stepIndex, setStepIndex] = useState(0);

    return {
        step: PROGRESS_STEPS[Math.min(stepIndex, PROGRESS_STEPS.length - 1)],
        stepIndex,
        startProgress: () => {
            setStepIndex(0);
            let i = 0;
            const delays = [800, 1500, 2500, 4000]; // advance at realistic intervals
            const timers = delays.map((delay) =>
                setTimeout(() => setStepIndex((prev) => Math.min(prev + 1, PROGRESS_STEPS.length - 1)), delay)
            );
            return () => timers.forEach(clearTimeout);
        },
        resetProgress: () => setStepIndex(0),
    };
}

// ── Convert a blob URL to base64 string ──────────────────────────────────
// This is needed because blob:// URLs only exist in the browser
// and the backend cannot access them. Base64 works across the wire.
async function blobUrlToBase64(blobUrl) {
    try {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // "data:image/...;base64,..."
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export default function Home() {
    // ── View state ─────────────────────────────────────────────────────────
    const [view, setView] = useState("editor"); // "editor" | "results"

    // ── Caption state ──────────────────────────────────────────────────────
    const [content, setContent] = useState("");
    const [captionVibe, setCaptionVibe] = useState("");
    const [accountType, setAccountType] = useState("personal");
    const [manualCaption, setManualCaption] = useState("");

    // ── Image state ────────────────────────────────────────────────────────
    const [images, setImages] = useState([]);
    const [primaryImageIndex, setPrimaryImageIndex] = useState(null);
    const [imageAction, setImageAction] = useState("generate_new");

    // ── Platform state ─────────────────────────────────────────────────────
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [platformContexts, setPlatformContexts] = useState({});

    // ── Results & UI state ─────────────────────────────────────────────────
    const [results, setResults] = useState(null);
    const [originalImage, setOriginalImage] = useState(null); // for before/after
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [warnings, setWarnings] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    const canGenerate = (content.trim() || manualCaption.trim()) && selectedPlatforms.length > 0;

    const advanceStep = (() => {
        let timers = [];
        return {
            start() {
                setCurrentStep(0);
                const delays = [700, 1800, 3200, 5000];
                timers = delays.map((delay, i) =>
                    setTimeout(() => setCurrentStep(i + 1), delay)
                );
            },
            stop() {
                timers.forEach(clearTimeout);
                timers = [];
            },
        };
    })();

    const handleGenerate = async () => {
        if (!canGenerate) {
            setError("Please enter some content and select at least one platform.");
            return;
        }
        setError("");
        setWarnings([]);
        setLoading(true);
        setResults(null);
        advanceStep.start();

        // ── Fix: Convert the primary uploaded image blob URL → base64 ────────
        // blob:// URLs only live in the browser — the backend cannot reach them.
        // We convert to base64 data URL so it travels safely over the network.
        let primaryImageBase64 = null;
        if (images.length > 0 && primaryImageIndex !== null) {
            const blobUrl = images[primaryImageIndex]?.preview;
            if (blobUrl) {
                primaryImageBase64 = await blobUrlToBase64(blobUrl);
                setOriginalImage(primaryImageBase64); // save for before/after comparison
            }
        }

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    platforms: selectedPlatforms,
                    captionVibe,
                    accountType,
                    manualCaption,
                    imageAction,
                    primaryImage: primaryImageBase64, // ✅ proper base64, not blob URL
                    platformContexts,
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to generate posts");
            }

            const data = await response.json();

            // Extract any partial-failure warnings
            if (data._warnings) {
                setWarnings(data._warnings);
                delete data._warnings;
            }

            setCurrentStep(PROGRESS_STEPS.length - 1);
            setResults(data);

            // Short pause to let "✨ Almost ready!" flash visibly before flipping
            setTimeout(() => {
                advanceStep.stop();
                setLoading(false);
                setView("results");
            }, 600);

        } catch (err) {
            console.error(err);
            advanceStep.stop();
            setLoading(false);
            setError("Failed to generate posts. Please try again.");
        }
    };

    // ── Results page ───────────────────────────────────────────────────────
    if (view === "results" && results) {
        return (
            <ResultsPage
                results={results}
                originalImage={originalImage}
                imageAction={imageAction}
                warnings={warnings}
                onBack={() => setView("editor")}
            />
        );
    }

    // ── Editor page ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 sm:py-28">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
                </div>
                <div className="relative max-w-3xl mx-auto text-center px-4 sm:px-6">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary-light text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        AI-Powered Content Engine
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Create Social Media{" "}
                        <span className="text-primary">Content Instantly</span>
                    </h2>
                    <p className="text-lg sm:text-xl text-text-muted max-w-xl mx-auto mb-10 leading-relaxed">
                        AI-crafted captions and visuals, perfectly tuned for each platform.
                    </p>
                    <a
                        href="#generator"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold bg-primary hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        style={{ boxShadow: "0 8px 24px rgba(249,115,22,0.35), 0 2px 8px rgba(249,115,22,0.2)" }}
                    >
                        Start Generating
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </a>
                </div>
            </section>

            {/* Generator Section */}
            <section id="generator" className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 space-y-6">
                <ContentInput
                    content={content} setContent={setContent}
                    images={images} setImages={setImages}
                    primaryImageIndex={primaryImageIndex} setPrimaryImageIndex={setPrimaryImageIndex}
                    captionVibe={captionVibe} setCaptionVibe={setCaptionVibe}
                    accountType={accountType} setAccountType={setAccountType}
                    manualCaption={manualCaption} setManualCaption={setManualCaption}
                    imageAction={imageAction} setImageAction={setImageAction}
                />

                <PlatformSelector
                    selectedPlatforms={selectedPlatforms}
                    setSelectedPlatforms={setSelectedPlatforms}
                    platformContexts={platformContexts}
                    setPlatformContexts={setPlatformContexts}
                />

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-3 bg-error/10 border border-error/20 text-error rounded-xl px-5 py-3 text-sm font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {error}
                    </div>
                )}

                <GenerateButton onClick={handleGenerate} loading={loading} disabled={!canGenerate} />

                {/* ── Progress Stepper ────────────────────────────────────── */}
                {loading && (
                    <div className="flex flex-col items-center gap-6 py-10">
                        {/* Animated ring */}
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-surface-lighter" />
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center text-xl">
                                {PROGRESS_STEPS[Math.min(currentStep, PROGRESS_STEPS.length - 1)].icon}
                            </div>
                        </div>

                        {/* Step labels */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                            {PROGRESS_STEPS.map((step, i) => (
                                <div key={step.id} className="flex items-center gap-1 sm:gap-2">
                                    <span
                                        className={`text-xs font-semibold transition-all duration-500
                                            ${i < currentStep ? "text-success line-through opacity-50" : ""}
                                            ${i === currentStep ? "text-primary" : ""}
                                            ${i > currentStep ? "text-text-muted/40" : ""}
                                        `}
                                    >
                                        {step.label}
                                    </span>
                                    {i < PROGRESS_STEPS.length - 1 && (
                                        <span className={`text-xs transition-colors duration-500 ${i < currentStep ? "text-success" : "text-border"}`}>→</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
