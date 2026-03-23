import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export default function Analytics() {
    const [report, setReport] = useState(null);
    const [syllabus, setSyllabus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [repRes, sylRes] = await Promise.all([
                fetch(`${API_BASE}/analytics/report`, { headers }),
                fetch(`${API_BASE}/analytics/syllabus`, { headers })
            ]);
            
            if (repRes.ok) setReport(await repRes.json());
            if (sylRes.ok) setSyllabus(await sylRes.json());
        } catch(err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 font-bold text-secondary">Analyzing matrices...</div>;

    return (
        <div className="flex flex-col h-full gap-6">
            <h2 className="font-headline text-3xl font-bold text-primary mb-2">Deep Analytics</h2>
            
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card rounded-2xl p-6 border-t-4 border-t-primary">
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Overall Accuracy</p>
                    <h3 className="text-4xl font-headline font-bold text-primary">{report?.overall_accuracy ?? 0}%</h3>
                </div>
                <div className="glass-card rounded-2xl p-6 border-t-4 border-t-green-600">
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Predicted Percentile</p>
                    <h3 className="text-4xl font-headline font-bold text-primary">{report?.predicted_percentile || "N/A"}</h3>
                </div>
                <div className="glass-card rounded-2xl p-6 border-t-4 border-t-secondary">
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Target Milestones</p>
                    <div className="flex items-end gap-2 text-primary">
                        <h3 className="text-4xl font-headline font-bold">{syllabus?.summary?.completed ?? 0}</h3>
                        <span className="text-sm mb-1 font-semibold opacity-60">mastered topics</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {/* Insights / Tips */}
                <div className="glass-card rounded-[2rem] p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="material-symbols-outlined text-3xl text-primary">lightbulb</span>
                        <h3 className="font-bold text-xl text-primary">Curator's Insights</h3>
                    </div>
                    {report?.weak_areas?.length > 0 ? (
                        <div className="bg-surface-container-lowest border border-white p-6 rounded-2xl shadow-sm text-sm text-on-surface leading-relaxed flex-1">
                            {report?.study_tips ? (
                                <p className="whitespace-pre-wrap">{report.study_tips}</p>
                            ) : (
                                <p>Focus more on: <span className="font-bold">{report.weak_areas.join(', ')}</span></p>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-outline text-sm">Not enough data for insights yet. Take some quizzes!</div>
                    )}
                </div>

                {/* Syllabus Coverage */}
                <div className="glass-card rounded-[2rem] p-8">
                    <h3 className="font-bold text-xl text-primary mb-6">Syllabus Matrix</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {syllabus?.coverage?.map((item, idx) => (
                            <div key={idx} className="bg-surface-container-high/40 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-sm text-primary">{item.topic}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mt-1">{item.status.replace('_', ' ')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-primary">{item.mastery_score}%</p>
                                    <p className="text-xs text-secondary mt-0.5">{item.times_attempted} attempts</p>
                                </div>
                            </div>
                        ))}
                        {(!syllabus?.coverage || syllabus.coverage.length === 0) && (
                            <p className="text-sm text-outline text-center py-10">No syllabus coverage generated yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
