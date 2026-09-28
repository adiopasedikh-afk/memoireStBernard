'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Adresse de l'administrateur
const ADMIN_EMAIL = 'adiopasedikh@gmail.com';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            // 1. Interrogation de la route de validation
            const res = await fetch('/api/validate-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok || !data.isValid) {
                setErrorMsg(data.error || 'E-mail invalide ou inexistant.');
                setLoading(false);
                return;
            }

            const userEmailClean = data.email.toLowerCase().trim();

            // 2. Stockage LocalStorage
            localStorage.setItem('user_email', userEmailClean);
            localStorage.setItem('user_login_time', new Date().toISOString());

            // 3. Vérification du rôle et redirection
            if (userEmailClean === ADMIN_EMAIL.toLowerCase()) {
                // Définition des cookies nécessaires pour déverrouiller app/admin/page.tsx
                document.cookie = `yam_user_email=${encodeURIComponent(userEmailClean)}; path=/; max-age=86400`;
                document.cookie = `yam_admin_2fa=verified; path=/; max-age=86400`;

                // Redirection vers l'Admin
                router.push('/admin');
            } else {
                // Redirection vers le Dashboard Utilisateur
                router.push('/dashboard');
            }

        } catch (err) {
            setErrorMsg('Erreur réseau lors de la vérification de l\'adresse e-mail.');
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
                        Saisissez votre e-mail pour accéder à votre espace.
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

                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full py-3.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 transition shadow-lg text-sm cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Vérification en cours...' : 'Accéder à mon espace →'}
                    </button>
                </form>
            </div>
        </main>
    );
}