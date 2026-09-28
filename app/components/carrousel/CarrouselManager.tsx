'use client';

import React, { useState } from 'react';
import { CarouselSlide } from './CarouselDisplay';
import { createClient } from '@/app/lib/supabase/client'; // Ajuste le chemin si nécessaire

interface CarrouselManagerProps {
    initialSlides?: CarouselSlide[];
}

export default function CarrouselManager({ initialSlides = [] }: CarrouselManagerProps) {
    const [slides, setSlides] = useState<CarouselSlide[]>(initialSlides);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null); // Objet File au lieu de l'URL string
    const [displayOrder, setDisplayOrder] = useState(0);
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    // Ajout d'une slide dans Supabase (table `carousel_slides`)
    const handleAddSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);

        try {
            // 1. Génération d'un nom de fichier unique
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `carousel/${fileName}`;

            // 2. Upload dans le bucket "memoires-saint-bernard" -> sous-dossier "carousel"
            const { error: uploadError } = await supabase.storage
                .from('memoires-saint-bernard')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Erreur lors de l'upload:", uploadError.message);
                setLoading(false);
                return;
            }

            // 3. Récupération de l'URL publique
            const { data: publicUrlData } = supabase.storage
                .from('memoires-saint-bernard')
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;

            // 4. Insertion dans la table `carousel_slides`
            const { data, error: insertError } = await supabase
                .from('carousel_slides')
                .insert([
                    {
                        title,
                        description,
                        image_url: publicUrl,
                        display_order: displayOrder,
                    },
                ])
                .select();

            if (insertError) {
                console.error("Erreur BDD:", insertError.message);
            } else if (data) {
                setSlides((prev) => [...prev, ...data]);
                // Réinitialisation du formulaire
                setTitle('');
                setDescription('');
                setFile(null);
                setDisplayOrder(0);
            }
        } catch (err) {
            console.error('Erreur inattendue:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-6">
            <h3 className="text-lg font-bold border-b border-slate-800 pb-3">
                Gestion du Carrousel (Table `carousel_slides`)
            </h3>

            {/* Formulaire de création */}
            <form onSubmit={handleAddSlide} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">
                        Titre de l'image
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Assemblée générale 2026"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">
                        Image *
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                        required
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">
                        Description / Sous-titre
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Retrouvez les photos de notre dernier événement"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">
                        Ordre d'affichage
                    </label>
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
                        {loading ? 'Téléversement...' : 'Ajouter au carrousel'}
                    </button>
                </div>
            </form>
        </div>
    );
}