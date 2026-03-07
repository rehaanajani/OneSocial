import { useRef, useState } from "react";

// ── Caption Vibes ─────────────────────────────────────────────────────────
const CAPTION_VIBES = [
    { id: "trending", label: "🔥 Trending", desc: "Viral hooks & bold openers" },
    { id: "funny", label: "😂 Funny", desc: "Witty, humorous & playful" },
    { id: "inspirational", label: "✨ Inspirational", desc: "Uplifting & motivational" },
    { id: "promotional", label: "📣 Promotional", desc: "Persuasive with a clear CTA" },
    { id: "storytelling", label: "📖 Storytelling", desc: "Personal & narrative-driven" },
    { id: "informative", label: "📊 Informative", desc: "Factual, tips & educational" },
    { id: "conversational", label: "💬 Conversational", desc: "Casual & friendly tone" },
    { id: "bold", label: "🎭 Bold & Edgy", desc: "Provocative & high contrast" },
];

// ── Image Actions ─────────────────────────────────────────────────────────
const IMAGE_ACTIONS = [
    { id: "generate_new", label: "✨ Generate New", desc: "Create image from scratch" },
    { id: "enhance", label: "🎨 Enhance & Retouch", desc: "Improve quality & colours" },
    { id: "remove_bg", label: "🪄 Remove Background", desc: "Isolate the main subject" },
    { id: "remove_people", label: "👤 Remove People", desc: "Erase background people" },
    { id: "change_bg", label: "🌅 Change Background", desc: "Swap the backdrop" },
    { id: "smart_crop", label: "📐 Smart Crop", desc: "Auto-resize for platform" },
    { id: "color_grade", label: "🎬 Color Grade", desc: "Cinematic colour filter" },
    { id: "upscale", label: "🔍 Upscale Quality", desc: "HD / 4K resolution boost" },
    { id: "keep_original", label: "🚫 Keep Original", desc: "Use image as-is" },
];

export default function ContentInput({
    content, setContent,
    images, setImages, primaryImageIndex, setPrimaryImageIndex,
    captionVibe, setCaptionVibe,
    accountType, setAccountType,
    manualCaption, setManualCaption,
    imageAction, setImageAction,
}) {
    const maxLength = 2000;
    const charCount = content.length;
    const isNearLimit = charCount > maxLength * 0.9;
    const isOverLimit = charCount > maxLength;
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState("caption"); // "caption" | "image"
    const [writeOwn, setWriteOwn] = useState(false);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
        }));
        setImages((prev) => {
            const updated = [...prev, ...newImages].slice(0, 5);
            if (primaryImageIndex === null && updated.length > 0) setPrimaryImageIndex(0);
            return updated;
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        if (!files.length) return;
        const newImages = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
        }));
        setImages((prev) => {
            const updated = [...prev, ...newImages].slice(0, 5);
            if (primaryImageIndex === null && updated.length > 0) setPrimaryImageIndex(0);
            return updated;
        });
    };

    const removeImage = (index) => {
        setImages((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            if (primaryImageIndex >= updated.length) setPrimaryImageIndex(updated.length > 0 ? 0 : null);
            return updated;
        });
    };

    const toggleWriteOwn = () => {
        const next = !writeOwn;
        setWriteOwn(next);
        if (!next) setManualCaption("");
    };

    return (
        <div className="bg-surface rounded-2xl border border-border shadow-xl shadow-black/30 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border">
                {["caption", "image"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 text-sm font-bold tracking-wide uppercase transition-all duration-200 cursor-pointer
                            ${activeTab === tab
                                ? "text-primary border-b-2 border-primary bg-primary/5"
                                : "text-text-muted hover:text-text hover:bg-surface-light"
                            }`}
                    >
                        {tab === "caption" ? "📝 Caption Studio" : "🖼️ Image Studio"}
                    </button>
                ))}
            </div>

            {/* ── CAPTION STUDIO ─────────────────────────────────────────────── */}
            {activeTab === "caption" && (
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-text mb-1">Your Idea or Content</label>
                        <p className="text-xs text-text-muted mb-3">Describe your post topic, paste a blog excerpt, or write a raw idea.</p>
                        <div className="relative">
                            <textarea
                                id="content-input"
                                value={content}
                                onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
                                placeholder="e.g. Launching our new product tomorrow — a productivity app for remote teams..."
                                rows={5}
                                className="w-full bg-bg border border-border rounded-xl p-4 text-sm text-text placeholder:text-text-muted/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                            <div className={`absolute bottom-3 right-3 text-xs font-mono ${isOverLimit ? "text-error" : isNearLimit ? "text-amber-400" : "text-text-muted/50"}`}>
                                {charCount}/{maxLength}
                            </div>
                        </div>
                    </div>

                    {/* Write my own toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border">
                        <div>
                            <p className="text-sm font-semibold text-text">Write my own caption</p>
                            <p className="text-xs text-text-muted">Skip AI — type your caption directly below</p>
                        </div>
                        <button
                            onClick={toggleWriteOwn}
                            className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer ${writeOwn ? "bg-primary" : "bg-surface-lighter"}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${writeOwn ? "left-7" : "left-1"}`} />
                        </button>
                    </div>

                    {writeOwn ? (
                        <div>
                            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-widest">Your Caption</label>
                            <textarea
                                value={manualCaption}
                                onChange={(e) => setManualCaption(e.target.value)}
                                placeholder="Write your caption here — this will be used exactly as typed."
                                rows={4}
                                className="w-full bg-bg border border-border rounded-xl p-4 text-sm text-text placeholder:text-text-muted/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                        </div>
                    ) : (
                        <>
                            {/* Vibe selector */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-3 uppercase tracking-widest">Caption Vibe</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {CAPTION_VIBES.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setCaptionVibe(captionVibe === v.id ? "" : v.id)}
                                            title={v.desc}
                                            className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-200 cursor-pointer border
                                                ${captionVibe === v.id
                                                    ? "bg-primary/15 border-primary/60 text-primary"
                                                    : "bg-bg border-border text-text-muted hover:border-primary/30 hover:text-text"
                                                }`}
                                        >
                                            <div>{v.label}</div>
                                            <div className="text-[10px] opacity-60 mt-0.5 font-normal">{v.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Account type */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-3 uppercase tracking-widest">Account Type</label>
                                <div className="flex gap-3">
                                    {["personal", "business"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setAccountType(type)}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200 cursor-pointer border
                                                ${accountType === type
                                                    ? "bg-primary/15 border-primary/60 text-primary"
                                                    : "bg-bg border-border text-text-muted hover:border-primary/30 hover:text-text"
                                                }`}
                                        >
                                            {type === "personal" ? "👤 Personal" : "🏢 Business"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── IMAGE STUDIO ───────────────────────────────────────────────── */}
            {activeTab === "image" && (
                <div className="p-6 space-y-5">
                    {/* Image Action pills */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-3 uppercase tracking-widest">What to do with the image</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {IMAGE_ACTIONS.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => setImageAction(a.id)}
                                    title={a.desc}
                                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all duration-200 cursor-pointer border
                                        ${imageAction === a.id
                                            ? "bg-primary/15 border-primary/60 text-primary"
                                            : "bg-bg border-border text-text-muted hover:border-primary/30 hover:text-text"
                                        }`}
                                >
                                    <div>{a.label}</div>
                                    <div className="text-[10px] opacity-60 mt-0.5 font-normal">{a.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Upload zone */}
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-3 uppercase tracking-widest">
                            Upload Image {images.length > 0 && <span className="text-primary">({images.length}/5) — tap to set primary</span>}
                        </label>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />

                        {images.length === 0 ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-10 text-center cursor-pointer transition-all duration-200 hover:bg-primary/5 group"
                            >
                                <div className="text-3xl mb-2">🖼️</div>
                                <p className="text-sm font-semibold text-text-muted group-hover:text-text transition-colors">Drag & drop or click to upload</p>
                                <p className="text-xs text-text-muted/60 mt-1">PNG, JPG, WEBP · up to 5 images</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-3">
                                    {images.map((img, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setPrimaryImageIndex(i)}
                                            className={`relative group w-24 h-24 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200
                                                ${i === primaryImageIndex
                                                    ? "border-primary shadow-[0_0_16px_rgba(249,115,22,0.35)]"
                                                    : "border-border hover:border-primary/40"
                                                }`}
                                        >
                                            <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                                            {i === primaryImageIndex && (
                                                <div className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">PRIMARY</div>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    {images.length < 5 && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDrop}
                                            className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center transition-all cursor-pointer text-text-muted hover:text-primary"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <p className="text-xs text-text-muted/70">👆 Tap an image to set it as primary — only the primary image is processed by AI.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
