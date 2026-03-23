import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardHome() {
    const navigate = useNavigate();

    return (
        <div className="rounded-[2rem] p-6 md:p-10 min-h-full animate-slide-up flex flex-col pt-12 md:pt-20">
            <div className="max-w-4xl mb-16 animate-slide-up delay-100">
                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-on-surface mb-6 leading-tight tracking-tight">
                    Welcome to your <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-surface-tint">Academic Hub</span>
                </h1>
                <p className="text-on-surface-variant text-base md:text-lg lg:text-xl font-medium leading-relaxed max-w-2xl">
                    Your curated space for deep academic discovery, intelligent planning, and comprehensive evaluation. Hand-crafted by EduMind.
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
                <FeatureCard 
                    title="AI Tutor" icon="school" delay="delay-100" path="/dashboard/tutor" navigate={navigate}
                    desc="Chat with syllabus strictly. Instantly process documents using cutting-edge RAG AI models." />
                <FeatureCard 
                    title="Adaptive Quizzes" icon="psychology" delay="delay-200" path="/dashboard/quiz" navigate={navigate}
                    desc="Intelligently generated testing matrices focusing entirely on your weak areas." />
                <FeatureCard 
                    title="Dynamic Planner" icon="event_note" delay="delay-300" path="/dashboard/planner" navigate={navigate}
                    desc="AI-driven study schedule timeline generation balancing complexity metrics." />
                <FeatureCard 
                    title="Deep Analytics" icon="data_exploration" delay="delay-400" path="/dashboard/analytics" navigate={navigate}
                    desc="Data-driven tracking of syllabus progress, hit-rates, and predictive percentiles." />
                <FeatureCard 
                    title="Spaced Repetition" icon="autorenew" delay="delay-400" path="/dashboard/review" navigate={navigate}
                    desc="SM-2 algorithmic revision scheduling guaranteeing long-term academic retention." />
                <FeatureCard 
                    title="YouTube Analyzer" icon="smart_toy" delay="delay-400" path="/dashboard/youtube" navigate={navigate}
                    desc="Extract structured notes and translated insights from any educational video instantly." />
            </div>
        </div>
    );
}

function FeatureCard({ title, icon, desc, delay, path, navigate }) {
    return (
        <div onClick={() => navigate(path)} className={`glass-card p-8 rounded-[2rem] hover-lift group cursor-pointer animate-slide-up ${delay} relative overflow-hidden bg-white/70 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}>
            {/* Subtle interactive background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <div className="w-16 h-16 rounded-2xl bg-white border border-outline/20 flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary group-hover:border-transparent transition-all duration-500 ease-out group-hover:scale-110">
                <span className="material-symbols-outlined text-4xl text-on-surface group-hover:text-white transition-colors duration-500">{icon}</span>
            </div>
            
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-3 tracking-tight group-hover:translate-x-1 transition-transform duration-300">{title}</h3>
            <p className="text-sm font-medium text-secondary leading-relaxed group-hover:text-on-surface-variant transition-colors duration-300">{desc}</p>
            
            {/* Arrow interaction indicator */}
            <div className="mt-6 flex items-center text-primary text-sm font-bold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <span>Launch App</span>
                <span className="material-symbols-outlined ml-1 text-lg">arrow_right_alt</span>
            </div>
        </div>
    )
}
