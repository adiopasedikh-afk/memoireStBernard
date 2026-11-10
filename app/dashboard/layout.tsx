'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { apiRequest, clearApiSession } from '@/app/lib/api';

const MENU_ITEMS = [
    { label: 'Contributions / Archives', href: '/dashboard/archives', icon: '📁' },
    { label: 'Uploader Archives', href: '/dashboard/upload', icon: '📤' },
    { label: 'Faire un Don (Stripe)', href: '/dashboard/don', icon: '💳' },
    { label: 'Envoyer un Message', href: '/dashboard/contact', icon: '✉️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let cancelled = false;
        apiRequest<{ user: { email: string; role: string } }>('/api/auth/me')
            .then(({ user }) => {
                if (cancelled) return;
                if (user.role === 'admin') {
                    router.replace('/admin');
                    return;
                }
                setUserEmail(user.email);
            })
            .catch(() => {
                if (!cancelled) router.replace('/login');
            });
        return () => {
            cancelled = true;
        };
    }, [router]);

    const handleLogout = async () => {
        setErrorMessage('');
        try {
            await apiRequest('/api/auth/logout', { method: 'POST' });
            clearApiSession();
            router.replace('/login');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'La déconnexion a échoué.');
        }
    };

    if (!userEmail) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
                <p className="animate-pulse text-sm">Chargement de votre espace privé...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold font-serif text-indigo-400">Espace Privé</h2>
                        <p className="text-xs text-slate-400 truncate" title={userEmail}>
                            👤 {userEmail}
                        </p>
                    </div>

                    <nav className="space-y-2">
                        {MENU_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition ${isActive
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bouton de Déconnexion */}
                <div className="pt-6 border-t border-slate-800 mt-6">
                    {errorMessage && <p role="alert" className="mb-3 text-xs text-rose-300">{errorMessage}</p>}
                    <button
                        onClick={handleLogout}
                        type="button"
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-rose-900/50 bg-rose-950/50 text-rose-300 hover:bg-rose-900 transition text-xs font-semibold cursor-pointer"
                    >
                        <span>🚪</span>
                        <span>Se déconnecter</span>
                    </button>
                </div>
            </aside>

            {/* Contenu principal */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}