import React, { useState } from 'react';

const API_BASE = 'http://localhost:8000';

export default function Youtube() {
    const [url, setUrl] = useState('');
    const [translateHindi, setTranslateHindi] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notesData, setNotesData] = useState(null);

    const generateNotes = async (e) => {
        e.preventDefault();
        setLoading(true);
        setNotesData(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/multimodal/youtube`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url, translate_hindi: translateHindi })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to process video");
            setNotesData(data);
        } catch(err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 px-2 animate-slide-up">
            <div className="glass-card rounded-[2rem] p-8 md:p-10 relative overflow-hidden flex-shrink-0">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                
                <h2 className="font-headline text-4xl font-bold text-on-surface mb-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-[#ff0000]">play_circle</span>
                    YouTube Note Processor
                </h2>
                <p className="text-secondary mb-8 text-base font-medium max-w-xl">
                    Paste any educational YouTube URL. Our AI will extract the transcript, decode the lecture, and generate structured study notes.
                </p>
                
                <form onSubmit={generateNotes} className="flex flex-col md:flex-row gap-4 items-center relative z-10 w-full">
                    <input 
                        required 
                        type="url"
                        value={url} 
                        onChange={e => setUrl(e.target.value)} 
                        placeholder="https://youtube.com/watch?v=..." 
                        className="flex-1 input-focus-animate px-6 py-4 bg-surface-container-highest border border-outline/20 rounded-2xl focus:ring-2 focus:ring-primary/40 text-sm font-medium w-full shadow-inner text-on-surface" 
                    />
                    
                    <label className="flex items-center gap-2 px-4 py-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer border border-outline/10 text-sm font-bold text-secondary uppercase tracking-wider">
                        <input 
                            type="checkbox" 
                            checked={translateHindi} 
                            onChange={e => setTranslateHindi(e.target.checked)}
                            className="w-5 h-5 text-primary rounded border-outline/30 focus:ring-primary"
                        />
                        Hindi Recap
                    </label>

                    <button 
                        type="submit" 
                        disabled={loading || !url} 
                        className={`scholar-tray-gradient text-white px-10 py-4 rounded-2xl font-bold tracking-widest uppercase hover-lift disabled:opacity-50 text-sm w-full md:w-auto flex items-center justify-center gap-2 shadow-lg ${loading ? 'animate-pulse-glow' : ''}`}
                    >
                        {loading ? <span className="material-symbols-outlined animate-spin text-xl">autorenew</span> : <span className="material-symbols-outlined text-xl">smart_toy</span>}
                        {loading ? 'Processing...' : 'Analyze Video'}
                    </button>
                </form>
            </div>

            {notesData && (
                <div className="glass-card rounded-[2rem] p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar animate-slide-up delay-100 mb-6">
                    <div className="max-w-4xl mx-auto space-y-10">
                        {/* Header Section */}
                        <div className="border-b border-surface-container-highlight pb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">{notesData.notes.subject || "General"}</span>
                                <span className="text-xs font-bold text-secondary uppercase tracking-widest">• {notesData.transcript_length} chars analyzed</span>
                            </div>
                            <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-surface">{notesData.notes.title || "Video Lecture Notes"}</h1>
                        </div>

                        {/* Summary Block */}
                        <div className="bg-surface-container-lowest p-6 rounded-2xl border-l-4 border-l-primary shadow-sm hover-lift">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">subject</span> Executive Summary
                            </h3>
                            <p className="text-on-surface-variant leading-relaxed text-sm md:text-base">{notesData.notes.summary}</p>
                            
                            {notesData.hindi_summary && (
                                <div className="mt-4 pt-4 border-t border-surface-container">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#d97706] mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">translate</span> Hindi Translation
                                    </h3>
                                    <p className="text-on-surface-variant leading-relaxed text-sm">{notesData.hindi_summary}</p>
                                </div>
                            )}
                        </div>

                        {/* Quick Revision */}
                        {notesData.notes.quick_revision && (
                            <div className="bg-[#bcebe3]/20 p-6 rounded-2xl shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-[#004d43] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">bolt</span> 30-Second Revision
                                </h3>
                                <p className="text-[#05201c] font-medium leading-relaxed italic text-sm">{notesData.notes.quick_revision}</p>
                            </div>
                        )}

                        {/* Key Concepts */}
                        {notesData.notes.key_concepts && notesData.notes.key_concepts.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">lightbulb</span> Key Concepts
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {notesData.notes.key_concepts.map((concept, idx) => (
                                        <div key={idx} className="bg-surface-container-low p-5 rounded-2xl border border-outline/10 hover-lift">
                                            <h4 className="font-bold text-lg text-primary mb-2">{concept.concept}</h4>
                                            <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{concept.explanation}</p>
                                            {concept.example && (
                                                <div className="bg-surface-container-highest p-3 rounded-lg text-xs font-medium text-secondary">
                                                    <span className="font-bold text-on-surface">Eg:</span> {concept.example}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Formulas */}
                        {notesData.notes.important_formulas && notesData.notes.important_formulas.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">calculate</span> Important Formulas
                                </h3>
                                <div className="space-y-3">
                                    {notesData.notes.important_formulas.map((form, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline/5 border-l-4 border-l-[#d97706]">
                                            <div className="sm:w-1/3">
                                                <h4 className="font-bold text-on-surface">{form.name}</h4>
                                                <p className="text-xs text-secondary">{form.usage}</p>
                                            </div>
                                            <div className="sm:w-2/3 bg-surface-container-high px-4 py-3 rounded-lg font-mono text-sm text-[#0f172a] font-bold overflow-x-auto text-center shadow-inner">
                                                {form.formula}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Points */}
                        {notesData.notes.key_points && notesData.notes.key_points.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <h3 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">format_list_bulleted</span> Crucial Takeaways
                                </h3>
                                <ul className="space-y-3">
                                    {notesData.notes.key_points.map((point, idx) => (
                                        <li key={idx} className="flex gap-3 items-start bg-transparent p-2">
                                            <span className="material-symbols-outlined text-primary text-xl mt-0.5">check_circle</span>
                                            <span className="text-on-surface font-medium leading-relaxed">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {/* Exam Relevance */}
                        {notesData.notes.exam_relevance && (
                            <div className="bg-surface-container-highest p-6 rounded-2xl text-center shadow-sm">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Exam Relevance (JEE/NEET)</h3>
                                <p className="text-on-surface font-bold text-sm">{notesData.notes.exam_relevance}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
