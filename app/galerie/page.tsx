'use client';

import { useState } from 'react';

const ARCHIVES = [
    {
        id: '1',
        title: "L'assaut de la porte arrière de l'église",
        type: 'photo',
        category: 'Histoire',
        url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop",
        description: "23 août 1996 : Forces de l'ordre franchissant les portes de Saint-Bernard."
    },
    {
        id: '2',
        title: "Rassemblement de soutien à la Goutte d'Or",
        type: 'photo',
        category: 'Solidarité',
        url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop",
        description: "Habitants et soutiens réunis sur le parvis."
    },
    {
        id: '3',
        title: "Prise de parole de Madjiguène Cissé",
        type: 'video',
        category: 'Témoignage',
        url: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=800&auto=format&fit=crop",
        description: "Conférence de presse lors de la grève de la faim."
    },
    {
        id: '4',
        title: "Tract original des 300 Sans-Papiers (1996)",
        type: 'document',
        category: 'Archives',
        url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop",
        description: "Manifeste réclamant la régularisation globale et le droit au travail."
    }
];

export default function GaleriePage() {
    const [filter, setFilter] = useState('all');

    const filtered = filter === 'all' ? ARCHIVES : ARCHIVES.filter(a => a.type === filter);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest block mb-2">
                    Espace Mémoriel & Archives Libre Accès
                </span>
                <h1 className="text-4xl font-serif font-bold text-stone-100 mb-4">
                    La Galerie des Glaces
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Parcourez la mémoire visuelle, sonore et documentaire des événements de 1996. Tout le matériel visuel et historique archivé y est rendu accessible.
                </p>

                {/* FILTRES */}
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                    {['all', 'photo', 'video', 'document'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${filter === type
                                    ? 'bg-amber-500 text-slate-950 shadow-md'
                                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                                }`}
                        >
                            {type === 'all' && 'Tous les documents'}
                            {type === 'photo' && '📷 Photographies'}
                            {type === 'video' && '▶ Vidéos & Émissions'}
                            {type === 'document' && '📄 Tracts & Textes'}
                        </button>
                    ))}
                </div>
            </div>

            {/* GRILLE DE LA GALERIE */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className="group rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition shadow-xl"
                    >
                        <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                            <img
                                src={item.url}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur text-amber-400 border border-amber-500/30">
                                {item.category}
                            </span>
                        </div>
                        <div className="p-5">
                            <h3 className="font-serif font-bold text-stone-100 text-base mb-2 group-hover:text-amber-400 transition">
                                {item.title}
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}