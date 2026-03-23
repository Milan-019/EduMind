import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export default function Planner() {
    const [plan, setPlan] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPlan();
    }, []);

    const fetchPlan = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/planner/latest`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.plan) {
                setPlan(data.plan);
            }
        } catch(err) {
            console.error(err);
        }
    };

    const generatePlan = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/planner/generate`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ exam_date: "2026-05-01" }) // Optional
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail);
            setPlan(data.plan);
        } catch(err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="glass-card rounded-[2rem] p-8 flex justify-between items-center">
                <div>
                    <h2 className="font-headline text-3xl font-bold text-primary mb-2">Dynamic Study Planner</h2>
                    <p className="text-secondary text-sm font-medium">Your personalized roadmap to academic success.</p>
                </div>
                <button onClick={generatePlan} disabled={loading} className="scholar-tray-gradient text-on-primary px-6 py-3 rounded-xl font-bold tracking-wide hover:shadow-lg disabled:opacity-50 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined">auto_awesome</span>
                    {loading ? 'Thinking...' : 'Regenerate Plan'}
                </button>
            </div>

            <div className="glass-card rounded-[2rem] p-8 flex-1">
                {(!plan || (Array.isArray(plan) ? plan : plan.schedule || []).length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-6xl mb-4">event_note</span>
                        <p>No active study plan. Generate one to begin.</p>
                    </div>
                ) : (
                    <div className="space-y-6 relative border-l-2 border-surface-container-high ml-4 pl-8 py-4">
                        {(Array.isArray(plan) ? plan : plan.schedule).map((day, idx) => (
                            <div key={idx} className="relative">
                                {/* Timeline strict dot */}
                                <div className="absolute -left-[41px] top-1 w-5 h-5 bg-white border-4 border-primary rounded-full"></div>
                                
                                <span className="inline-block px-3 py-1 bg-surface-container text-xs font-bold uppercase tracking-widest text-primary rounded-full mb-3">Day {day.day}</span>
                                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-white/50 shadow-sm mb-2">
                                    <h4 className="font-bold text-lg text-primary mb-3">Topics to Master</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {day.topics.map((t, i) => (
                                            <div key={i} className="bg-surface-container-low p-4 rounded-xl w-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-lg mr-2">{t.subject}</span>
                                                        <span className="font-bold text-on-surface text-sm">{t.topic}</span>
                                                    </div>
                                                    <span className="px-2 py-1 bg-surface-container text-secondary text-xs font-semibold rounded-md">{t.hours}h</span>
                                                </div>
                                                <p className="text-xs text-secondary"><span className="font-semibold text-error/80 uppercase tracking-widest">{t.priority}:</span> {t.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
