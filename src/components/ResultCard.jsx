import { useState, useRef } from "react";

const aspectRatios = {
    instagram: "aspect-square",
    linkedin: "aspect-[1200/627]",
    twitter: "aspect-video",
};

const platformLabels = {
    instagram: "Instagram",
    linkedin: "LinkedIn",
    twitter: "Twitter / X",
};

// ── Before/After Drag Slider ──────────────────────────────────────────────
function BeforeAfterSlider({ before, after }) {
    const [sliderPos, setSliderPos] = useState(50); // percentage
    const containerRef = useRef(null);
    const dragging = useRef(false);

    const updateSlider = (clientX) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
        setSliderPos(pct);
    };

    const onMouseMove = (e) => { if (dragging.current) updateSlider(e.clientX); };
    const onTouchMove = (e) => { if (dragging.current) updateSlider(e.touches[0].clientX); };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full select-none cursor-col-resize overflow-hidden"
            onMouseMove={onMouseMove}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { dragging.current = false; }}
        >
            {/* After (full width, underneath) */}
            <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />

            {/* Before (clipped to left of slider) */}
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: containerRef.current?.offsetWidth || 500 }} />
            </div>

            {/* Labels */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">BEFORE</div>
            <div className="absolute top-2 right-2 bg-primary/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">AFTER</div>

            {/* Divider line + handle */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
            >
                <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center cursor-col-resize"
                    onMouseDown={() => { dragging.current = true; }}
                    onTouchStart={() => { dragging.current = true; }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3M16 9l3 3-3 3" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

// ── Main ResultCard ───────────────────────────────────────────────────────
export default function ResultCard({ platform, caption, image, originalImage, imageAction }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedCaption, setEditedCaption] = useState(caption);
    const [showSlider, setShowSlider] = useState(false);

    const ratio = aspectRatios[platform] || "aspect-video";
    const label = platformLabels[platform] || platform;
    const displayCaption = editedCaption || caption;
    const isLong = displayCaption.length > 250;

    // Show slider only when: user uploaded an image AND action isn't generate_new/keep_original
    const canShowSlider = originalImage && image &&
        !["generate_new", "keep_original"].includes(imageAction);

    const copyCaption = async () => {
        try {
            await navigator.clipboard.writeText(displayCaption);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = displayCaption;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadImage = async () => {
        try {
            const res = await fetch(image);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `onesocial-${platform}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            window.open(image, "_blank");
        }
    };

    return (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xl shadow-black/30 hover:shadow-2xl transition-all duration-300 group">
            {/* Platform badge */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                    <span className="text-sm font-bold text-primary">{label}</span>
                </div>
                {/* Before/After toggle */}
                {canShowSlider && (
                    <button
                        onClick={() => setShowSlider((p) => !p)}
                        className={`text-xs px-3 py-1 rounded-lg font-semibold border transition-all cursor-pointer
                            ${showSlider
                                ? "bg-primary/15 border-primary/60 text-primary"
                                : "bg-surface-lighter border-border text-text-muted hover:text-text hover:border-primary/30"
                            }`}
                    >
                        {showSlider ? "← Single View" : "⇄ Before / After"}
                    </button>
                )}
            </div>

            {/* Image */}
            <div className="px-5">
                <div className={`${ratio} w-full rounded-xl overflow-hidden bg-bg border border-border`}>
                    {showSlider && canShowSlider ? (
                        <BeforeAfterSlider before={originalImage} after={image} />
                    ) : (
                        <img
                            src={image}
                            alt={`${label} post`}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                    )}
                </div>
            </div>

            {/* Caption */}
            <div className="px-5 py-4">
                {editing ? (
                    <textarea
                        value={editedCaption}
                        onChange={(e) => setEditedCaption(e.target.value)}
                        rows={6}
                        autoFocus
                        className="w-full bg-bg border border-primary/50 rounded-xl p-3 text-sm text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                ) : (
                    <div>
                        <p className={`text-sm text-text-muted leading-relaxed whitespace-pre-line transition-all ${!expanded && isLong ? "line-clamp-4" : ""}`}>
                            {displayCaption}
                        </p>
                        {isLong && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="mt-1 text-xs text-primary font-semibold hover:underline cursor-pointer"
                            >
                                {expanded ? "Show less ↑" : "Show more ↓"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-2">
                {/* Copy */}
                <button
                    onClick={copyCaption}
                    title={copied ? "Copied!" : "Copy caption"}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shrink-0 border
                        ${copied
                            ? "bg-success text-white border-success shadow-[0_4px_14px_rgba(34,197,94,0.35)]"
                            : "bg-surface-lighter text-text-muted border-border hover:text-text hover:border-text-muted/30"
                        }`}
                >
                    {copied
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                </button>

                {/* Edit/Save */}
                <button
                    onClick={() => setEditing(!editing)}
                    title={editing ? "Save" : "Edit caption"}
                    className="w-11 h-11 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer shrink-0 border bg-surface-lighter text-text-muted border-border hover:text-primary hover:border-primary/40"
                >
                    {editing
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    }
                </button>

                {/* Download */}
                <button
                    onClick={downloadImage}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 bg-primary text-white shadow-[0_6px_20px_rgba(249,115,22,0.3)]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download
                </button>
            </div>
        </div>
    );
}
