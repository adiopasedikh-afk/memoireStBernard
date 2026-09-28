'use client';

import React, { useState } from 'react';
import { BannerItem } from './BannerDisplay';
import { createClient } from '@/app/lib/supabase/client'; // Ajuste le chemin vers ton client Supabase si besoin

interface BannerManagerProps {
    initialBanners?: BannerItem[];
}

export default function BannerManager({ initialBanners = [] }: BannerManagerProps) {
    const [banners, setBanners] = useState<BannerItem[]>(initialBanners);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [buttonText, setButtonText] = useState('');
    const [buttonUrl, setButtonUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    // Ajout d'une nouvelle bannière dans la table `banners`
    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !imageUrl) return;

        setLoading(true);
        /* 
        // Connexion Supabase :
        // const { data, error } = await supabase.from('banners').insert([...]).select();
        */
        setLoading(false);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-6">
            <h3 className="text-lg font-bold border-b border-slate-800 pb-3">
                Gestion des Bannières (Table `banners`)
            </h3>

            {/* Formulaire de création */}
            <form onSubmit={handleAddBanner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">
                        Titre / Partenaire *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Soutenez notre partenaire"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">
                        Sous-titre / Slogan
                    </label>
                    <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Ex: Offre spéciale pour l'association"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">
                        URL de l'image *
                    </label>
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-300">
                            Texte du bouton
                        </label>
                        <input
                            type="text"
                            value={buttonText}
                            onChange={(e) => setButtonText(e.target.value)}
                            placeholder="En savoir plus"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-300">
                            Lien du bouton
                        </label>
                        <input
                            type="url"
                            value={buttonUrl}
                            onChange={(e) => setButtonUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                        />
                    </div>
                </div>

                <div className="md:col-span-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                    >
                        {loading ? 'Enregistrement...' : 'Ajouter la bannière'}
                    </button>
                </div>
            </form>
        </div>
    );
}