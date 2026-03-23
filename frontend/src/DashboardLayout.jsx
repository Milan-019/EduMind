import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function DashboardLayout() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const navs = [
        { name: 'Dashboard Home', path: '.', icon: 'home' },
        { name: 'AI Tutor', path: 'tutor', icon: 'school' },
        { name: 'Quiz Generator', path: 'quiz', icon: 'quiz' },
        { name: 'Study Planner', path: 'planner', icon: 'calendar_month' },
        { name: 'Analytics', path: 'analytics', icon: 'analytics' },
        { name: 'Spaced Repetition', path: 'review', icon: 'layers' },
        { name: 'YouTube Analyzer', path: 'youtube', icon: 'smart_toy' },
    ];

    return (
        <div className="premium-bg-gradient min-h-screen flex text-on-surface relative overflow-x-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 watermark-pattern pointer-events-none opacity-50"></div>
            
            {/* Sidebar */}
            <aside className="w-72 glass-card m-4 rounded-[2rem] flex flex-col p-6 shadow-[0_8px_32px_rgba(3,25,46,0.06)] relative z-10 border border-white/40">
                <div className="flex items-center gap-3 mb-10 text-primary px-2">
                    <span className="material-symbols-outlined text-3xl">menu_book</span>
                    <span className="font-headline text-xl font-bold tracking-tight">Edumind</span>
                </div>

                <nav className="flex-1 space-y-2">
                    {navs.map(nav => (
                        <NavLink 
                            key={nav.path}
                            to={nav.path}
                            end={nav.path === '.'}
                            className={({ isActive }) => 
                                `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-primary text-on-primary shadow-md shadow-primary/20' 
                                    : 'text-secondary hover:bg-surface-container hover:text-primary'
                                }`
                            }
                        >
                            <span className="material-symbols-outlined">{nav.icon}</span>
                            {nav.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-8">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-error/80 hover:bg-error-container hover:text-error transition-all duration-300 w-full"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 h-screen overflow-y-auto relative z-10">
                <div className="max-w-6xl mx-auto h-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
