import { useState, useEffect } from "react";

// Stage config — label and icon for each pipeline phase
const STAGE_CONFIG = {
    analysing: { icon: "🔍", label: "Analysing your content" },
    crafting: { icon: "✍️", label: "Crafting smart prompts" },
    generating: { icon: "🎨", label: "Generating content" },
};

export default function GenerateButton({ onClick, loading, disabled, stage }) {
    const [dots, setDots] = useState(".");

    // Animated "..." cycling effect while loading
    useEffect(() => {
        if (!loading) { setDots("."); return; }
        const interval = setInterval(() => {
            setDots((d) => (d.length >= 3 ? "." : d + "."));
        }, 450);
        return () => clearInterval(interval);
    }, [loading]);

    const stageInfo = stage ? STAGE_CONFIG[stage] : null;

    return (
        <div className="flex flex-col items-center gap-4 mt-8">
            <button
                onClick={onClick}
                disabled={disabled || loading}
                className={`group relative w-full sm:w-auto p-[2px] rounded-xl overflow-hidden transition-all duration-300
                    ${disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:-translate-y-1 active:translate-y-0 cursor-pointer shadow-[0_0_20px_rgba(0,212,255,0.1)] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
                    }`}
            >
                {/* Spinning glowing border */}
                {!disabled && (
                    <span
                        className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                            background: "conic-gradient(from 90deg at 50% 50%, transparent 0%, transparent 75%, #00d4ff 100%)"
                        }}
                    />
                )}

                {/* Inner surface */}
                <div className={`relative flex items-center justify-center gap-3 px-10 py-4 w-full h-full rounded-[10px] z-10 font-bold text-lg tracking-wide transition-colors duration-300
                    ${disabled ? "bg-surface-lighter text-text-muted" : "bg-bg text-white group-hover:bg-surface/90"}`}
                >
                    {loading ? (
                        <>
                            <svg
                                className="w-5 h-5 animate-spin shrink-0"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {stageInfo ? `${stageInfo.icon} ${stageInfo.label}${dots}` : `Generating${dots}`}
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate Posts
                        </>
                    )}
                </div>
            </button>

            {/* Pipeline stage progress indicators */}
            {loading && (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                    {Object.entries(STAGE_CONFIG).map(([key, config], i, arr) => {
                        const stages = Object.keys(STAGE_CONFIG);
                        const stageIndex = stages.indexOf(stage);
                        const thisIndex = stages.indexOf(key);
                        const isDone = thisIndex < stageIndex;
                        const isActive = thisIndex === stageIndex;
                        return (
                            <span key={key} className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-300
                                    ${isActive ? "bg-primary/20 text-primary border border-primary/40" :
                                        isDone ? "bg-green-500/10 text-green-400 border border-green-500/30" :
                                            "bg-white/5 text-text-muted/40 border border-white/5"}`}
                                >
                                    {isDone ? "✓" : config.icon} {config.label}
                                </span>
                                {i < arr.length - 1 && (
                                    <span className={`transition-colors duration-300 ${isDone ? "text-green-400/50" : "text-white/10"}`}>→</span>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
