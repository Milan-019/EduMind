import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000';

export default function Quiz() {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/quiz/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const groups = {};
                (data.history || []).forEach(h => {
                     // The backend stores history per-question. We group by Topic and rough Date prefix for the UI.
                     const dateKey = h.created_at.split('.')[0]; 
                     const dateOnly = dateKey.split(' ')[0];
                     const key = h.topic + '_' + dateOnly;
                     
                     if(!groups[key]) groups[key] = { topic: h.topic, total: 0, correct: 0, date: dateOnly };
                     groups[key].total += 1;
                     if(h.correct) groups[key].correct += 1;
                });
                setHistory(Object.values(groups));
            }
        } catch(err) {
            console.error(err);
        }
    };

    const generateQuiz = async (e) => {
        e.preventDefault();
        setLoading(true);
        setQuiz(null);
        setResult(null);
        setAnswers({});

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/ai/quiz/generate`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic, difficulty, num_questions: 3 })
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail);
            setQuiz(data.questions);
        } catch(err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const submitQuiz = async () => {
        setLoading(true);
        const payload = quiz.map((q, idx) => ({
            question: q.question,
            selected_option: answers[idx] !== undefined ? q.options[answers[idx]] : "",
            correct_option: q.answer
        }));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/quiz/submit`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ topic, subject: "General", answers: payload })
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail);
            setResult(data);
            fetchHistory();
        } catch(err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 px-2 animate-slide-up">
            <div className="glass-card rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                
                <h2 className="font-headline text-4xl font-bold text-primary mb-3">Adaptive Quizzes</h2>
                <p className="text-secondary mb-8 text-base font-medium max-w-xl">Generate a targeted assessment on any topic intelligently adapted to your syllabus.</p>
                
                <form onSubmit={generateQuiz} className="flex flex-col md:flex-row gap-4 items-center relative z-10">
                    <input required value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (e.g., Quantum Mechanics)" className="flex-1 input-focus-animate px-6 py-4 bg-surface-container-highest border border-white/40 rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm font-medium w-full shadow-inner" />
                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="px-6 py-4 input-focus-animate bg-surface-container-highest border border-white/40 rounded-2xl focus:ring-2 focus:ring-primary/20 text-sm font-bold uppercase tracking-wider text-secondary w-full md:w-auto shadow-inner cursor-pointer">
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <button type="submit" disabled={loading} className={`scholar-tray-gradient text-white px-10 py-4 rounded-2xl font-bold tracking-widest uppercase hover-lift disabled:opacity-50 text-sm w-full md:w-auto flex items-center justify-center gap-2 ${loading ? 'animate-pulse-glow' : ''}`}>
                        {loading ? <span className="material-symbols-outlined animate-spin text-xl">autorenew</span> : <span className="material-symbols-outlined text-xl">psychology</span>}
                        {loading ? 'Generating...' : 'Start Quiz'}
                    </button>
                </form>
            </div>

            {quiz && !result && (
                <div className="glass-card rounded-[3rem] p-8 md:p-12 space-y-10 flex-1 animate-slide-up delay-100 shadow-xl border border-white">
                    {quiz.map((q, idx) => (
                        <div key={idx} className="space-y-6 pb-8 border-b border-surface-container-high last:border-0 hover:bg-surface-container-lowest/40 p-6 -mx-6 rounded-2xl transition-colors duration-300">
                            <h3 className="font-bold text-xl text-on-surface leading-snug"><span className="text-primary mr-3 text-2xl">•</span>{q.question}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {q.options.map((opt, oIdx) => (
                                    <button 
                                        key={oIdx} 
                                        onClick={() => setAnswers({...answers, [idx]: oIdx})}
                                        className={`p-5 text-left rounded-2xl border-2 transition-all duration-300 ease-in-out text-sm font-bold ${
                                            answers[idx] === oIdx 
                                            ? 'bg-primary text-white border-primary shadow-[0_8px_16px_rgba(3,25,46,0.2)] transform scale-[1.02]' 
                                            : 'bg-white/50 border-surface-container hover:border-primary/50 text-secondary hover:shadow-md hover:-translate-y-1'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={submitQuiz} disabled={loading || Object.keys(answers).length < quiz.length} className="w-full scholar-tray-gradient text-white py-5 rounded-[2rem] font-bold uppercase tracking-widest text-base hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2xl flex justify-center items-center gap-2">
                        <span>Submit Final Answers</span>
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            )}

            {result && (
                <div className="glass-card rounded-[2rem] p-8 text-center flex-1 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 border-4 border-primary">
                        <span className="font-headline text-4xl font-bold text-primary">{result.score}/{result.total_questions}</span>
                    </div>
                    <h3 className="font-headline text-3xl font-bold mb-4">Quiz Completed!</h3>
                    <div className="text-secondary max-w-2xl mb-8 space-y-3 text-left w-full mx-auto">
                        {Array.isArray(result.feedback) ? result.feedback.map((f, i) => (
                            <div key={i} className={`p-4 rounded-xl border ${f.status === 'correct' ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-error/10 border-error/20 text-error'}`}>
                                <p className="font-semibold text-sm mb-1">{f.question}</p>
                                {f.message && <p className="text-xs">{f.message}</p>}
                            </div>
                        )) : <p>{result.feedback}</p>}
                    </div>
                    <button onClick={() => {setQuiz(null); setResult(null);}} className="text-primary font-bold underline underline-offset-4">Take another quiz</button>
                </div>
            )}

            <div className="glass-card rounded-[2rem] p-8 mt-4">
                <h3 className="font-bold text-xl mb-4 text-primary">Recent Assessments</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase bg-surface-container-low text-secondary">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-xl">Topic</th>
                                <th className="px-4 py-3">Score</th>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3 rounded-tr-xl">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-6 text-outline">No quizzes taken yet.</td></tr>
                            ) : (
                                history.map((h, i) => (
                                    <tr key={i} className="border-b border-surface-container last:border-0 hover:bg-surface-container-lowest transition-colors">
                                        <td className="px-4 py-3 font-semibold text-primary">{h.topic}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-1 bg-surface-container-high rounded-full font-bold">{h.correct}/{h.total} correct</span></td>
                                        <td className="px-4 py-3 text-secondary">—</td>
                                        <td className="px-4 py-3 text-xs text-outline">{h.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
