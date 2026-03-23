import React, { useState } from 'react';

const API_BASE = 'http://localhost:8000';

export default function Tutor() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    const [query, setQuery] = useState('');
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/ai/upload-pdf`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail);
            alert('Document uploaded successfully!');
        } catch(err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleQuery = async (e) => {
        e.preventDefault();
        if(!query) return;

        const newChat = [...chat, { role: 'user', text: query }];
        setChat(newChat);
        setQuery('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/ai/tutor`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: query })
            });
            const data = await res.json();
            if(!res.ok) throw new Error(data.detail);
            setChat([...newChat, { role: 'ai', text: data.answer }]);
        } catch(err) {
            setChat([...newChat, { role: 'ai', text: 'Error: ' + err.message }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="glass-card rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="font-headline text-2xl font-bold text-primary">AI Academic Tutor</h2>
                    <p className="text-secondary text-sm font-medium mt-1">Upload syllabus material or documents to ground the AI context.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <input type="file" onChange={e => setFile(e.target.files[0])} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white" accept="application/pdf" />
                    <button onClick={handleUpload} disabled={uploading} className="bg-surface-tint text-white px-6 py-2 rounded-full font-bold text-sm tracking-wide hover:shadow-lg disabled:opacity-50">
                        {uploading ? 'Uploading...' : 'Upload PDF'}
                    </button>
                </div>
            </div>

            <div className="glass-card flex-1 rounded-[2rem] p-8 flex flex-col min-h-[400px]">
                <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4 pr-2">
                    {chat.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-white ml-12 rounded-tr-none' : 'bg-surface-container text-on-surface mr-12 rounded-tl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {loading && <div className="text-secondary text-sm flex items-center gap-2"><span className="material-symbols-outlined animate-spin hidden">sync</span> Tutor is thinking...</div>}
                </div>

                <form onSubmit={handleQuery} className="relative mt-auto">
                    <input 
                        className="w-full px-6 py-4 bg-surface-container-high border-transparent rounded-full focus:ring-2 focus:ring-primary/20 pr-16 text-sm" 
                        placeholder="Ask your tutor a question about the material..."
                        value={query} onChange={e => setQuery(e.target.value)}
                    />
                    <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50">
                        <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
