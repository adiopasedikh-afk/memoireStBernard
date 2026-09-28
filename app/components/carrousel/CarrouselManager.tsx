'use client';

import React, { useState } from 'react';
import { CarouselSlide } from './CarouselDisplay';

interface CarrouselManagerProps {
    initialSlides?: CarouselSlide[];
}

export default function CarrouselManager({ initialSlides = [] }: CarrouselManagerProps) {
    const [slides, setSlides] = useState<CarouselSlide[]>(initialSlides);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [loading, setLoading] = useState(false);

    // Ajout d'une slide dans Supabase (table `carousel_slides`)
    const handleAddSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageUrl) return;

        setLoading(true);
        /*
        // Intégration Supabase :
        // const { data, error } = await supabase.from('carousel_slides').insert([...]).select();
        */
        setLoading(false);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-6">
            <h3 className="text-lg font-bold border-b border-slate-800 pb-3">
                Gestion du Carrousel (Table `carousel_slides`)
            </h3>

            {/* Formulaire de création */}
            <form onSubmit={handleAddSlide} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Titre de l'image</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Assemblée générale 2026"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">URL de l'image *</label>
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Description / Sous-titre</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Retrouvez les photos de notre dernier événement"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Ordre d'affichage</label>
                    <input
                        type="number"
                        value={displayOrder}
                        onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                </div>

                <div className="md:col-span-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                    >
                        {loading ? 'Enregistrement...' : 'Ajouter au carrousel'}
                    </button>
                </div>
            </form>
        </div>
    );
}