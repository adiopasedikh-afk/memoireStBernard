'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                {/* LOGO */}
                <Link href="/" className="flex items-center gap-3 group">
                    <span className="text-3xl transition-transform group-hover:scale-110">🏛️</span>
                    <div>
                        <h1 className="text-base font-serif font-bold text-amber-500 tracking-wide">
                            Mémoires de Saint-Bernard
                        </h1>
                        <p className="text-[10px] text-slate-400 tracking-wider uppercase">
                            1996 • La Goutte d'Or
                        </p>
                    </div>
                </Link>

                {/* NAVIGATION DESKTOP */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="text-slate-300 hover:text-amber-400 transition-colors">
                        Accueil
                    </Link>
                    <Link href="/galerie" className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1">
                        <span>✨</span> Galerie des Glaces
                    </Link>
                    <Link href="/destins" className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1">
                        <span>👥</span> Destins
                    </Link>
                    <Link href="/videos" className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1">
                        <span>🎬</span> Vidéos
                    </Link>
                    <Link href="/a-propos" className="text-slate-300 hover:text-amber-400 transition-colors">
                        À Propos
                    </Link>
                    <Link href="/contact" className="text-slate-300 hover:text-amber-400 transition-colors">
                        Contact
                    </Link>
                    <Link
                        href="/faire-un-don"
                        className="ml-2 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md"
                    >
                        faire un don
                    </Link>
                    <Link
                        href="/login"
                        className="ml-2 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-md"
                    >
                        🔒 Espace Association
                    </Link>
                </nav>

                {/* BOUTON MENU MOBILE */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden text-slate-300 p-2 text-2xl focus:outline-none"
                >
                    {mobileMenuOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* MENU MOBILE DROPDOWN */}
            {mobileMenuOpen && (
                <nav className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-3">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-amber-400 py-1">
                        Accueil
                    </Link>
                    <Link href="/galerie" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-amber-400 py-1">
                        ✨ Galerie des Glaces
                    </Link>
                    <Link href="/destins" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-amber-400 py-1">
                        👥 Destins
                    </Link>
                    <Link href="/videos" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-amber-400 py-1">
                        🎬 Vidéos & Archives
                    </Link>
                    <Link href="/a-propos" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-amber-400 py-1">
                        À Propos
                    </Link>
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-amber-400 py-1">
                        Contact
                    </Link>
                    <Link href="/faire-un-don" onClick={() => setMobileMenuOpen(false)} className="block text-amber-400 font-semibold py-1">
                        faire un don
                    </Link>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-amber-400 font-semibold py-1">
                        🔒 Espace Association
                    </Link>
                </nav>
            )}
        </header>
    );
}