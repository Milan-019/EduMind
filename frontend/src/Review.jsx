import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export default function Review() {
    const [dueCards, setDueCards] = useState([]);
    const [currentCard, setCurrentCard] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Add Card State
    const [addTopic, setAddTopic] = useState('');
    const [addSubject, setAddSubject] = useState('');

    useEffect(() => {
        fetchDue();
    }, []);

    const fetchDue = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/review/due`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setDueCards(data.cards);
                if (data.cards.length > 0) setCurrentCard(data.cards[0]);
            }
        } catch(err) {
            console.error(err);
        }
    };

    const submitQuality = async (quality) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/review/review`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic: currentCard.topic, subject: currentCard.subject, quality })
            });
            if (!res.ok) throw new Error("Failed to submit review");
            
            // Move to next card
            const remaining = dueCards.slice(1);
            setDueCards(remaining);
            setCurrentCard(remaining.length > 0 ? remaining[0] : null);
            setShowAnswer(false);
        } catch(err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/review/add-card`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic: addTopic, subject: addSubject || 'General', quality: 0 })
            });
            if (!res.ok) throw new Error("Failed to add card");
            
            alert('Concept successfully added to Spaced Repetition loop!');
            setAddTopic('');
            setAddSubject('');
            fetchDue(); // Refresh just in case it's due today (first rep)
        } catch(err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-6">
            <h2 className="font-headline text-3xl font-bold text-primary mb-2">Spaced Repetition Review</h2>
            <p className="text-secondary mb-12 text-sm font-medium tracking-wide">
                Deepen retaining memory. You have <span className="font-bold text-primary">{dueCards.length}</span> items due today.
            </p>

            {currentCard ? (
                <div className="w-full max-w-2xl glass-card rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-inverse-primary"></div>
                    
                    <span className="px-4 py-1.5 bg-surface-container rounded-full text-xs font-bold tracking-widest uppercase text-secondary mb-8 inline-block">
                        {currentCard.subject}
                    </span>
                    
                    <h3 className="font-headline text-4xl font-bold text-on-surface mb-12">{currentCard.topic}</h3>

                    {!showAnswer ? (
                        <button onClick={() => setShowAnswer(true)} className="px-8 py-3.5 bg-primary text-white font-bold rounded-2xl shadow-lg hover:-translate-y-1 transition-all">
                            Reveal Knowledge
                        </button>
                    ) : (
                        <div className="space-y-6 pt-6 border-t border-surface-container">
                            <p className="text-sm font-bold uppercase tracking-widest text-outline">How well did you recall this?</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                {[
                                    { q: 5, label: "Perfect (5)", color: "bg-green-600" },
                                    { q: 4, label: "Good (4)", color: "bg-primary" },
                                    { q: 3, label: "Hard (3)", color: "bg-surface-tint" },
                                    { q: 2, label: "Familiar (2)", color: "bg-secondary" },
                                    { q: 1, label: "Forgot (1)", color: "bg-error/80" },
                                    { q: 0, label: "Blackout (0)", color: "bg-error" }
                                ].map(btn => (
                                    <button 
                                        key={btn.q}
                                        disabled={loading}
                                        onClick={() => submitQuality(btn.q)}
                                        className={`${btn.color} text-white px-6 py-3 rounded-full font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4 opacity-50">task_alt</span>
                    <h3 className="font-headline text-2xl font-bold text-primary">All caught up!</h3>
                    <p className="text-secondary mt-2 mb-4">You've reached inbox zero for your reviews. Excellent work, Curator.</p>
                </div>
            )}

            {/* Quick Add Section */}
            <div className="w-full max-w-2xl mt-12 glass-card rounded-3xl p-8 border-t-4 border-t-primary">
                <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl">add_box</span>
                    <h3 className="font-headline text-xl font-bold text-on-surface">Enqueue New Concept</h3>
                </div>
                <form onSubmit={handleAddCard} className="flex flex-col md:flex-row gap-4 w-full">
                    <input required value={addTopic} onChange={e => setAddTopic(e.target.value)} placeholder="Topic (e.g. Mitochondria)" className="flex-1 px-5 py-3.5 bg-surface-container-high border-transparent rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm" />
                    <input value={addSubject} onChange={e => setAddSubject(e.target.value)} placeholder="Subject (Optional)" className="flex-1 px-5 py-3.5 bg-surface-container-high border-transparent rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm" />
                    <button type="submit" disabled={loading || !addTopic} className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold tracking-wide hover:shadow-lg disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-xl">library_add</span>
                        Add
                    </button>
                </form>
                <p className="text-xs text-secondary mt-3">Concepts added here enter the SM-2 mathematical repetition cycle to guarantee maximum retention.</p>
            </div>
        </div>
    );
}
