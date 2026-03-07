import { useState } from "react";
import ResultCard from "../components/ResultCard";

const platformLabels = {
    instagram: "Instagram",
    linkedin: "LinkedIn",
    twitter: "Twitter / X",
};

export default function ResultsPage({ results, originalImage, imageAction, warnings = [], onBack }) {
    const platforms = Object.keys(results);
    const [activePlatform, setActivePlatform] = useState(platforms[0] || "instagram");

    return (
        <div className="min-h-screen" style={{ animation: "slideInUp 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
            {/* Sticky header */}
            <div className="sticky top-0 z-20 bg-bg/90 backdrop-blur-md border-b border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-text-muted border border-border hover:text-text hover:border-primary/40 transition-all duration-200 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Edit
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        <span className="text-sm font-bold text-text">Your Posts Are Ready!</span>
                    </div>

                    {/* Platform tabs */}
                    {platforms.length > 1 && (
                        <div className="ml-auto flex gap-1 bg-surface rounded-xl p-1 border border-border">
                            {platforms.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setActivePlatform(p)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer
                                        ${activePlatform === p
                                            ? "bg-primary text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                                            : "text-text-muted hover:text-text"
                                        }`}
                                >
                                    {platformLabels[p] || p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Partial failure warnings */}
            {warnings.length > 0 && (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
                    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-4 py-3 text-sm">
                        <span className="text-base shrink-0">⚠️</span>
                        <span>
                            Some platforms didn't complete: {warnings.map((w) => `${platformLabels[w.platform] || w.platform} (${w.error})`).join(" · ")}
                        </span>
                    </div>
                </div>
            )}

            {/* Card content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
                {/* Active platform card — always shown */}
                <div className="max-w-xl mx-auto" key={activePlatform} style={{ animation: "fadeIn 0.2s ease" }}>
                    <ResultCard
                        platform={activePlatform}
                        caption={results[activePlatform]?.caption || ""}
                        image={results[activePlatform]?.image || ""}
                        originalImage={originalImage}
                        imageAction={imageAction}
                    />
                </div>

                {/* All platforms grid — large screens only */}
                {platforms.length > 1 && (
                    <div className="hidden lg:block mt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">All Platforms</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                            {platforms.map((p) => (
                                <ResultCard
                                    key={p}
                                    platform={p}
                                    caption={results[p].caption}
                                    image={results[p].image}
                                    originalImage={originalImage}
                                    imageAction={imageAction}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
