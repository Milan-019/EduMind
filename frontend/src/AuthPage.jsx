import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8000';

export default function AuthPage() {
    const [isRegister, setIsRegister] = useState(false);
    const navigate = useNavigate();

    if (isRegister) {
        return <RegisterView toggle={() => setIsRegister(false)} onSuccess={() => navigate('/dashboard')} />;
    }
    return <LoginView toggle={() => setIsRegister(true)} onSuccess={() => navigate('/dashboard')} />;
}

function LoginView({ toggle, onSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Login failed');

            localStorage.setItem('token', data.token);
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex-grow flex items-center justify-center px-6 py-16 w-full h-full min-h-screen">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(3,25,46,0.06)]">

                {/* Branding/Visual Side */}
                <div className="hidden md:flex scholar-tray-gradient p-12 flex-col justify-between text-on-primary">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl">menu_book</span>
                            <span className="font-headline text-2xl font-bold tracking-tight">Edumind</span>
                        </div>
                        <div className="pt-20">
                            <h1 className="font-headline text-5xl font-bold leading-tight">Elevating the art of academic discovery.</h1>
                            <p className="text-on-primary-container text-lg mt-6 max-w-sm font-light">Join a sanctuary of focused learning where information is curated for clarity and depth.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 py-4 px-6 bg-white/5 backdrop-blur-md rounded-full border border-white/10 w-fit">
                        <div className="flex -space-x-2">
                            <img alt="Student avatar" className="w-8 h-8 rounded-full border-2 border-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7uqN3g5VKW-Q2cZbeYN67Tn7kzecCQyuulKdtco4nbQ3S88CzTVEnnnFke8ZM2JWjeBV2dtKvxWDd5FJH7GHtvUdsBUxkwbfVm6ZUSwCZZzTlSjq5etmeNqd_0No7pZ6Lmi3WJst9iAjXt3gfq6ILQfVPL4wf7-lhX_BMsrQQ0lQ6RrqoNEoT2xhdSwNCC4-CKlLmAJAbYlTgDw4Hz_vlYm-v58GJrJRx08JJFT4H_KZq4Y5lbqpMVYDNkYTYq2qWgB5SLT6_vgv5" />
                            <img alt="Scholar avatar" className="w-8 h-8 rounded-full border-2 border-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAUCrbt_6KwuXW75vGdD7Hfc7kzzVO4RiPd-hnvAI6pHGp7bSsMrxvTbBjcwlKe56h-HbZz34cBydCnk73suOiU741L3AK-xr7UslnovFxPN1dtuL1NGPiQ9e5uH8tol4FkduAUvSrIfr1bAUVFXYQsGFm_VTDghBMZafw7C_w3RlOAspL2uoK1S5oVLemi5DVCJobG-uTUewOg4H22cQpb5nki2vx0t12OmrgGeGfzjMPbX3u66VRWgOvHczFGcJptC9W6wEQeOwj" />
                            <img alt="Researcher avatar" className="w-8 h-8 rounded-full border-2 border-primary" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkSzyonMzMD8DKZO2oba6qDFLphrz1ESyYWDm56eHmHkSuEt5tZ56fNweTvTJv1BHhriTRp3APBWlIezuYZM3hJZh3aIcoPD7a8aFH93fyHCk0Il8w6Igf6oPp4UjzdS8HJmHoo-AvdbRsCTbll-2vYHYkyziVKGWNo085YlbDMTgCVDjTPIUitXvpS_IfrQJTBkO03tIPMPVlXf-Jhnet9EbOs93WuibdefzbzCz7KKPxxE3Cj2Pkb1ifExoRaF2SmIBgb1mmdvDC" />
                        </div>
                        <p className="text-sm font-medium tracking-wide">Joined by 12k+ Curators</p>
                    </div>
                </div>

                {/* Interaction Side */}
                <div className="p-8 md:p-16 flex flex-col justify-center">
                    <div className="mb-10">
                        <h2 className="font-headline text-3xl font-bold text-primary mb-2">Welcome back</h2>
                        <p className="text-secondary font-medium">Continue your journey into the world of knowledge.</p>
                    </div>

                    {/* Toggle */}
                    <div className="flex p-1 bg-surface-container rounded-full mb-8">
                        <button className="flex-1 py-2 text-sm font-semibold rounded-full bg-surface-container-lowest text-primary shadow-sm transition-all duration-300">Login</button>
                        <button onClick={toggle} className="flex-1 py-2 text-sm font-semibold rounded-full text-secondary hover:text-primary transition-all duration-300">Register</button>
                    </div>

                    {error && <p className="text-error text-sm mb-4">{error}</p>}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-secondary px-1">Institutional Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-surface-container-high border-none rounded-xl focus:ring-0 focus:bg-surface-container-lowest transition-all duration-300 placeholder:text-outline/50 text-on-surface"
                                    placeholder="curator@academy.edu"
                                />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-500 hover:w-[90%] focus-within:w-[90%]"></div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-secondary">Passphrase</label>
                                <a href="#" className="text-xs font-medium text-primary hover:underline underline-offset-4">Forgotten?</a>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3.5 bg-surface-container-high border-none rounded-xl focus:ring-0 focus:bg-surface-container-lowest transition-all duration-300 placeholder:text-outline/50 text-on-surface"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <input id="remember" type="checkbox" className="w-5 h-5 rounded-md border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer" />
                            <label htmlFor="remember" className="text-sm text-secondary font-medium cursor-pointer">Remember this session</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 scholar-tray-gradient text-on-primary font-semibold rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-primary/10 tracking-wide disabled:opacity-50"
                        >
                            {loading ? 'Authenticating...' : 'Continue to Library'}
                        </button>
                    </form>

                    {/* Social Auth... */}
                    <div className="mt-10">
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="absolute w-full border-t border-outline-variant/15"></div>
                            <span className="relative bg-surface-container-lowest px-4 text-xs font-bold uppercase tracking-[0.2em] text-outline">or authenticate via</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-3 py-3 border border-outline-variant/20 rounded-xl hover:bg-surface-container transition-all duration-300 group">
                                <img alt="Google logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKJPOTp8Sa8rSZv_VALrTZARAurqFQKZNkgZabdhb6XsKrDXXftkzcMmZCVFckNGkm6ual12Eq7gS6eZGgqOCsLY2qzVf_NJucdG4DOprhDL-vyia3XFVtIJGdBiAonNgwWH9tCwdbK8oPxNpX6_qECDJn5SOXhDWq4r6ejlvSh3lCES7T9V65_UUyrQpO5r_rgo5aD3N829ypth6G0OUxZ7P3-CpR8F2a9ZuRHOUZl9Ct5dlR7gKCdWDReE3Gfvz0aJXLATJhy0xr" />
                                <span className="text-sm font-semibold text-secondary group-hover:text-primary">Google</span>
                            </button>
                            <button className="flex items-center justify-center gap-3 py-3 border border-outline-variant/20 rounded-xl hover:bg-surface-container transition-all duration-300 group">
                                <span className="material-symbols-outlined text-xl text-primary">account_balance</span>
                                <span className="text-sm font-semibold text-secondary group-hover:text-primary">EduID</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

function RegisterView({ toggle, onSuccess }) {
    const [form, setForm] = useState({
        name: '', email: '', password: '',
        exam_target: 'JEE', exam_date: '', daily_hours: 6
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Registration failed');

            localStorage.setItem('token', data.token);
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 watermark-pattern pointer-events-none"></div>
            <div className="fixed top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

            <main className="flex-grow flex items-center justify-center px-6 py-12 relative z-10 w-full h-full min-h-screen">
                <div className="w-full max-w-[500px] glass-card rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(3,25,46,0.08)] flex flex-col p-8 md:p-12">

                    <div className="text-center mb-8">
                        <h1 className="font-headline text-4xl font-bold text-primary tracking-tight mb-3">Create your Account</h1>
                        <p className="text-secondary/70 text-sm font-medium">Join the curated circle of global scholars.</p>
                    </div>

                    <div className="flex p-1 bg-surface-container/50 rounded-full mb-8 border border-outline-variant/10">
                        <button onClick={toggle} className="flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-full text-secondary text-center transition-all duration-300">Login</button>
                        <button className="flex-1 py-2 text-xs font-bold tracking-widest uppercase rounded-full bg-white shadow-sm text-primary transition-all duration-300">Register</button>
                    </div>

                    {error && <p className="text-error text-sm mb-4 text-center">{error}</p>}

                    <form className="space-y-6" onSubmit={handleRegister}>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/70 px-1">Full Name</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-5 py-3.5 bg-surface-container/40 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary/20 input-focus-animate text-on-surface placeholder:text-outline/40 text-sm"
                                placeholder="Alexandria Vance"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/70 px-1">Institutional Email</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full px-5 py-3.5 bg-surface-container/40 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary/20 input-focus-animate text-on-surface placeholder:text-outline/40 text-sm"
                                placeholder="curator@academy.edu"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/70 px-1">Exam Target</label>
                                <select
                                    value={form.exam_target}
                                    onChange={e => setForm({ ...form, exam_target: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-surface-container/40 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary/20 input-focus-animate text-on-surface text-sm"
                                >
                                    <option value="JEE">JEE Mains/Adv</option>
                                    <option value="NEET">NEET UG</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/70 px-1">Exam Date (Optional)</label>
                                <input
                                    type="date"
                                    value={form.exam_date}
                                    onChange={e => setForm({ ...form, exam_date: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-surface-container/40 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary/20 input-focus-animate text-on-surface text-sm text-secondary"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/70 px-1">Daily Study Target</label>
                            <div className="flex gap-2">
                                {[2, 4, 6, 8, 10].map(h => (
                                    <div
                                        key={h}
                                        onClick={() => setForm({ ...form, daily_hours: h })}
                                        className={`tag-pill flex-1 py-2 text-center rounded-xl text-[12px] font-semibold cursor-pointer border ${form.daily_hours === h ? 'bg-primary text-white border-primary' : 'bg-surface-container/60 text-secondary border-transparent hover:border-primary/20'}`}
                                    >
                                        {h}h
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5 group relative">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/70 px-1 flex justify-between items-center">
                                Passphrase
                                <span className="material-symbols-outlined text-xs text-primary/40 cursor-help">info</span>
                            </label>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className="w-full px-5 py-3.5 bg-surface-container/40 border-transparent rounded-2xl focus:ring-2 focus:ring-primary/10 focus:bg-white focus:border-primary/20 input-focus-animate text-on-surface placeholder:text-outline/40 text-sm"
                                placeholder="••••••••"
                            />

                            <div className="absolute bottom-full left-0 mb-3 w-full p-4 bg-primary text-white text-[11px] rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none z-20 shadow-2xl border border-white/10 hidden md:block">
                                <div className="font-bold mb-2 uppercase tracking-widest border-b border-white/20 pb-1.5">Security Policy</div>
                                <ul className="space-y-1.5 opacity-90">
                                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[12px] text-green-400">check_circle</span> 8+ characters required</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-tertiary/60 py-1">
                            <span className="material-symbols-outlined text-sm">verified_user</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">ENCRYPTED AT REST</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 scholar-tray-gradient text-on-primary font-bold uppercase tracking-[0.15em] text-xs rounded-full hover:shadow-[0_20px_40px_-12px_rgba(3,25,46,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 shadow-xl shadow-primary/10 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Begin My Journey'}
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[10px] text-outline/60 leading-relaxed max-w-[280px] mx-auto tracking-wide">
                        By registering, you agree to our <a href="#" className="font-bold text-primary/70 hover:text-primary transition-colors underline underline-offset-4 decoration-primary/20">Academic Charter</a> and <a href="#" className="font-bold text-primary/70 hover:text-primary transition-colors underline underline-offset-4 decoration-primary/20">Privacy Covenant</a>.
                    </p>
                </div>
            </main>
        </>
    )
}
