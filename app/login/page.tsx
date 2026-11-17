'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/app/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            const result = await apiRequest<{ user: { role: string } }>('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: email.trim(), password: password.trim() }),
            });

            router.push(result.user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : 'Erreur réseau lors de la connexion.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <span className="text-3xl">🔑</span>
                    <h1 className="text-2xl font-serif font-bold text-slate-100">
                        Accès Espace Privé
                    </h1>
                    <p className="text-xs text-slate-400">
                        Connectez-vous avec votre e-mail et votre code PIN / mot de passe.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Adresse E-mail
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errorMsg) setErrorMsg('');
                            }}
                            placeholder="votre.email@exemple.com"
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Code PIN ou Mot de passe
                        </label>
                        <input
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errorMsg) setErrorMsg('');
                            }}
                            placeholder="Ex : 580869"
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                        />
                    </div>

                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 transition shadow-lg text-sm cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Connexion en cours...' : 'Accéder à mon espace →'}
                    </button>
                </form>
            </div>
        </main>
    );
}