'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer className="relative z-10 bg-slate-950 border-t border-slate-900 text-slate-400 text-sm py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">

                {/* COLONNE 1 */}
                <div className="space-y-3">
                    <h3 className="font-serif font-bold text-amber-500 text-base">
                        Mémoires de Saint-Bernard
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Espace de transmission historique, culturelle et citoyenne dédié aux luttes pour la dignité des personnes sans-papiers de 1996 à nos jours.
                    </p>
                </div>

                {/* COLONNE 2 - NAVIGATION */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Navigation</h4>
                    <ul className="space-y-1.5 text-xs">
                        <li><Link href="/" className="hover:text-amber-400 transition inline-block py-0.5">Accueil</Link></li>
                        <li><Link href="/galerie" className="hover:text-amber-400 transition inline-block py-0.5">Galerie des Glaces</Link></li>
                        <li><Link href="/destins" className="hover:text-amber-400 transition inline-block py-0.5">Portraits & Destins</Link></li>
                        <li><Link href="/videos" className="hover:text-amber-400 transition inline-block py-0.5">Vidéos & Archives</Link></li>
                        <li><Link href="/a-propos" className="hover:text-amber-400 transition inline-block py-0.5">À Propos</Link></li>
                        <li><Link href="/contact" className="hover:text-amber-400 transition inline-block py-0.5">Contact & Presse</Link></li>
                    </ul>
                </div>

                {/* COLONNE 3 - ARCHIVES & RESSOURCES */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Ressources Libre Accès</h4>
                    <ul className="space-y-1.5 text-xs">
                        <li><Link href="/archives/ina" className="hover:text-amber-400 transition inline-block py-0.5">Archives photographiques INA / Libres</Link></li>
                        <li><Link href="/videos" className="hover:text-amber-400 transition inline-block py-0.5">Témoignages audio & vidéo</Link></li>
                        <li><Link href="/chronologie-lois" className="hover:text-amber-400 transition inline-block py-0.5">Chronologie des lois Pasqua-Debré</Link></li>
                        <li><Link href="/espace-chercheurs" className="hover:text-amber-400 transition inline-block py-0.5">Espace chercheurs & étudiants</Link></li>
                    </ul>
                </div>

                {/* COLONNE 4 - RÉSEAUX SOCIAUX & CONTACT */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">Rejoindre & Suivre</h4>
                    <div className="flex gap-3">
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-amber-500/50 hover:text-amber-400 transition">
                            𝕏
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-amber-500/50 hover:text-amber-400 transition">
                            f
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-amber-500/50 hover:text-amber-400 transition">
                            📷
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-amber-500/50 hover:text-amber-400 transition">
                            ▶
                        </a>
                    </div>
                    <p className="text-[11px] text-slate-500">
                        Association Mémoires de Saint-Bernard • Paris 18ᵉ
                    </p>
                </div>

            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                <p>© 1996 - 2026 Association Mémoires des Sans-Papiers de Saint-Bernard.</p>
                <div className="flex gap-4">
                    <Link href="/mentions-legales" className="hover:text-slate-400 transition">Mentions Légales</Link>
                    <Link href="/confidentialite" className="hover:text-slate-400 transition">Politique de confidentialité</Link>
                </div>
            </div>
        </footer>
    );
}