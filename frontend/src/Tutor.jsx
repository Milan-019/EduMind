import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const API_BASE = 'http://localhost:8000';
const MD = { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] };

export default function Tutor() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [messages, setMessages] = useState([{
    role: "model",
    text: "Hi! I'm EduMind 👋 Ask me any JEE/NEET doubt — type or use the mic!"
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Voice feature states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [language, setLanguage] = useState("en"); // "en" or "hi"

  const bottom = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── File Upload ───────────────────────────────────────────────────────────
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

  // ── Speech Recognition (Mic → Text) ──────────────────────────────────────
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ── Speech Synthesis (Text → Voice) ──────────────────────────────────────
  const speak = (text) => {
    if (!voiceEnabled) return;

    // Strip markdown and LaTeX for cleaner speech reading
    const clean = text
      .replace(/\$\$[\s\S]*?\$\$/g, "formula")
      .replace(/\$.*?\$/g, "formula")
      .replace(/[#*`_~]/g, "")
      .replace(/\n+/g, ". ")
      .slice(0, 500); // cap at 500 chars

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = synthRef.current.getVoices();
    const langCode = language === "hi" ? "hi" : "en";
    const bestVoice = voices.find(v => v.lang.startsWith(langCode));
    if (bestVoice) utterance.voice = bestVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  };

  // ── Send Message ──────────────────────────────────────────────────────────
  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input;
    setMessages(p => [...p, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    stopSpeaking();

    const history = messages.map(m => ({
      role: m.role, parts: [{ text: m.text }]
    }));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/ai/tutor`, {
          method: 'POST',
          headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question: q, history })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.detail || "Request failed");
      
      const answer = data.answer || data.message;
      setMessages(p => [...p, { role: "model", text: answer }]);
      speak(answer); // auto-read response out loud
    } catch {
      setMessages(p => [...p, { role: "model", text: "Something went wrong. Please try again!" }]);
    }
    setLoading(false);
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-6 px-2 animate-slide-up">
        {/* Upload Header */}
        <div className="glass-card rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
                <h2 className="font-headline text-3xl font-bold text-on-surface">Interactive AI Tutor</h2>
                <p className="text-secondary text-sm font-medium mt-1">Upload syllabus material to ground context. Ask naturally via Voice or Text!</p>
            </div>
            <div className="flex gap-4 items-center relative z-10 w-full md:w-auto">
                <input type="file" onChange={e => setFile(e.target.files[0])} className="text-sm file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-surface-container file:text-primary file:hover:bg-surface-container-high w-full md:w-auto" accept="application/pdf" />
                <button onClick={handleUpload} disabled={uploading || !file} className="scholar-tray-gradient text-white px-8 py-3 rounded-xl font-bold tracking-widest text-sm uppercase hover-lift disabled:opacity-50">
                    {uploading ? 'Parsing...' : 'Upload'}
                </button>
            </div>
        </div>

        {/* Chat Interface */}
        <div className="glass-card flex-1 rounded-[2rem] flex flex-col overflow-hidden relative shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-white/40">
            
            {/* Top Voice Controls Toolbar */}
            <div className="bg-surface-container-lowest/50 border-b border-outline/10 px-6 py-4 flex items-center justify-between gap-4 w-full">
                {/* Language Toggle */}
                <div className="flex items-center gap-1 bg-surface-container-highest rounded-xl p-1">
                    <button onClick={() => setLanguage("en")} className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${language === "en" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-on-surface-variant hover:text-on-surface"}`}>English</button>
                    <button onClick={() => setLanguage("hi")} className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${language === "hi" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-on-surface-variant hover:text-on-surface"}`}>हिंदी</button>
                </div>

                {/* Voice Output Toggle */}
                <div className="flex items-center gap-3">
                    <button onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking() }} className={`flex items-center gap-2 text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-xl border transition-all hover-lift ${voiceEnabled ? "border-primary/30 bg-primary/5 text-primary" : "border-outline/20 text-on-surface-variant hover:bg-surface-container"}`}>
                        <span className="material-symbols-outlined text-[16px]">{voiceEnabled ? 'volume_up' : 'volume_off'}</span>
                        {voiceEnabled ? 'Voice On' : 'Voice Off'}
                    </button>
                </div>
            </div>

            {/* Speaking indicator overlay */}
            {isSpeaking && (
                <div className="absolute top-[80px] right-6 z-10 bg-white/95 backdrop-blur-md border border-outline/10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl py-3 px-4 flex items-center gap-4 animate-slide-up">
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                        <span className="material-symbols-outlined animate-pulse text-[#059669]">graphic_eq</span>
                        Speaking...
                    </div>
                    <button onClick={stopSpeaking} className="text-xs font-bold bg-[#fee2e2] text-[#b91c1c] px-3 py-1.5 rounded-lg hover:bg-[#fecaca] uppercase tracking-wider transition-colors">Stop</button>
                </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 space-y-6">
                {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed relative group shadow-sm ${m.role === "user" ? "bg-primary text-white ml-12 rounded-tr-sm" : "bg-surface-container-lowest text-on-surface border border-outline/5 mr-12 rounded-tl-sm"}`}>
                        
                        <div className={`prose prose-sm max-w-none ${m.role === "user" ? "text-white prose-invert" : "text-on-surface prose-headings:text-on-surface"}`}>
                            <ReactMarkdown {...MD}>{m.text}</ReactMarkdown>
                        </div>

                        {/* Replay voice button on AI messages */}
                        {m.role === "model" && (
                            <button onClick={() => speak(m.text)} className="absolute -bottom-3 -right-3 bg-white border border-outline/20 rounded-full w-8 h-8 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-surface-container hover:scale-110">
                                <span className="material-symbols-outlined text-[16px]">replay</span>
                            </button>
                        )}
                    </div>
                </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-surface-container-lowest border border-outline/5 shadow-sm px-6 py-4 rounded-[1.5rem] rounded-tl-sm flex items-center gap-3 text-secondary text-sm font-medium">
                            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                            EduMind is thinking...
                        </div>
                    </div>
                )}
                <div ref={bottom}/>
            </div>

            {/* Listening Status Component */}
            {isListening && (
                <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 bg-[#ef4444] text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-3 shadow-xl animate-pulse z-20">
                    <span className="material-symbols-outlined">mic</span>
                    Listening... tap mic to stop
                </div>
            )}

            {/* Input Bar */}
            <div className="p-4 bg-surface-container-highest border-t border-outline/10">
                <div className="max-w-4xl mx-auto flex gap-3 items-center">
                    
                    {/* Mic Button */}
                    <button 
                        onClick={isListening ? stopListening : startListening} 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-sm
                        ${isListening ? "bg-[#ef4444] text-white animate-pulse shadow-lg shadow-[#ef4444]/30" : "bg-white text-secondary hover:text-primary hover:border-primary/30 border border-outline/10"}`}>
                        <span className="material-symbols-outlined text-2xl">{isListening ? 'mic_off' : 'mic'}</span>
                    </button>

                    {/* Text Input */}
                    <input
                        className="flex-1 input-focus-animate px-6 py-4 bg-white border border-outline/10 rounded-2xl focus:ring-2 focus:ring-primary/40 text-[15px] font-medium text-on-surface shadow-sm"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && send()}
                        placeholder={
                            isListening ? "🎤 Listening... speak your doubt" : 
                            language === "hi" ? "अपना सवाल यहाँ लिखें…" : 
                            "Type your doubt or use the mic…"
                        }
                    />

                    {/* Send Button */}
                    <button 
                        onClick={send} 
                        disabled={loading || !input.trim()} 
                        className="w-14 h-14 rounded-2xl scholar-tray-gradient text-white flex items-center justify-center hover-lift disabled:opacity-50 flex-shrink-0 shadow-md">
                        <span className="material-symbols-outlined text-2xl translate-x-0.5">send</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}
