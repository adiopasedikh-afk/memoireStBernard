'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';

export interface CarouselSlide {
    id: string;
    title: string;
    description?: string;
    image_url: string;
    link_url?: string;
    button_text?: string;
    display_order: number;
    is_active: boolean;
    created_at?: string;
}

// Définissez ou importez vos images statiques par défaut ici
const ANCIENNES_IMAGES_STATIQUES: CarouselSlide[] = [
    // Exemple de fallback si nécessaire :
    // {
    //   id: 'static-1',
    //   title: 'Titre par défaut',
    //   image_url: 'https://via.placeholder.com/800x400',
    //   display_order: 1,
    //   is_active: true,
    // }
];

interface CarouselManagerProps {
    initialSlides?: CarouselSlide[];
}

export function CarouselManager({ initialSlides = [] }: CarouselManagerProps) {
    const supabase = createClient();
    const [slides, setSlides] = useState<CarouselSlide[]>(initialSlides);
    const [loading, setLoading] = useState(false);
    const [activeSlideIndex, setActiveSlideIndex] = useState(0);

    // Formulaire d'ajout / édition
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        button_text: 'En savoir plus',
        display_order: 0,
        is_active: true,
    });

    // Charger les diapos depuis Supabase
    const fetchSlides = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('carousel_slides')
            .select('*')
            .order('display_order', { ascending: true });

        if (!error && data && data.length > 0) {
            setSlides(data);
        } else if (slides.length === 0) {
            // Si Supabase renvoie une liste vide ou une erreur, on charge les images statiques
            setSlides(ANCIENNES_IMAGES_STATIQUES);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (initialSlides.length === 0) {
            fetchSlides();
        }
    }, []);

    // Défilement automatique pour la prévisualisation
    useEffect(() => {
        const activeSlides = slides.filter((s) => s.is_active);
        if (activeSlides.length <= 1) return;

        const interval = setInterval(() => {
            setActiveSlideIndex((prev) => (prev + 1) % activeSlides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [slides]);

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            image_url: '',
            link_url: '',
            button_text: 'En savoir plus',
            display_order: slides.length,
            is_active: true,
        });
        setIsEditing(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.image_url) {
            alert("Le titre et l'URL de l'image sont obligatoires.");
            return;
        }

        setLoading(true);

        if (isEditing) {
            const { error } = await supabase
                .from('carousel_slides')
                .update(formData)
                .eq('id', isEditing);

            if (!error) {
                setSlides(slides.map((s) => (s.id === isEditing ? { ...s, ...formData } : s)));
                resetForm();
            } else {
                alert('Erreur lors de la mise à jour : ' + error.message);
            }
        } else {
            const { data, error } = await supabase
                .from('carousel_slides')
                .insert([formData])
                .select();

            if (!error && data) {
                setSlides([...slides, data[0]]);
                resetForm();
            } else {
                alert('Erreur lors de la création : ' + error.message);
            }
        }
        setLoading(false);
    };

    const handleEdit = (slide: CarouselSlide) => {
        setIsEditing(slide.id);
        setFormData({
            title: slide.title || '',
            description: slide.description || '',
            image_url: slide.image_url || '',
            link_url: slide.link_url || '',
            button_text: slide.button_text || 'En savoir plus',
            display_order: slide.display_order || 0,
            is_active: slide.is_active ?? true,
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette illustration ?')) return;

        setLoading(true);
        const { error } = await supabase.from('carousel_slides').delete().eq('id', id);

        if (!error) {
            setSlides(slides.filter((s) => s.id !== id));
        } else {
            alert('Erreur lors de la suppression : ' + error.message);
        }
        setLoading(false);
    };

    const handleToggleActive = async (slide: CarouselSlide) => {
        const nextStatus = !slide.is_active;
        const { error } = await supabase
            .from('carousel_slides')
            .update({ is_active: nextStatus })
            .eq('id', slide.id);

        if (!error) {
            setSlides(slides.map((s) => (s.id === slide.id ? { ...s, is_active: nextStatus } : s)));
        }
    };

    const activeSlidesList = slides.filter((s) => s.is_active);
    const currentSlide = activeSlidesList[activeSlideIndex] || activeSlidesList[0];

    return (
        <div className="space-y-10">
            {/* HEADER SECTION */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 rounded-2xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    🖼️ Carrousel Visuel de l'Association
                </h2>
                <p className="text-amber-100 text-sm mt-1">
                    Gérez l'illustration moderne 50/50 affichée en haut du site public. Les images se subliment avec un effet Zoom-In fluide.
                </p>
            </div>

            {/* APERÇU EN DIRECT DU RENDU PUBLIC 50/50 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Aperçu en direct (Rendu Public 50 / 50)
                    </h3>
                    {activeSlidesList.length > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                            {activeSlideIndex + 1} / {activeSlidesList.length} diapos actives
                        </span>
                    )}
                </div>

                {currentSlide ? (
                    <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl min-h-[380px] grid grid-cols-1 md:grid-cols-2 items-center">
                        {/* MOITIÉ GAUCHE : TEXTE SYNCHRONISÉ */}
                        <div className="p-8 md:p-10 z-10 space-y-4 flex flex-col justify-center">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 w-fit">
                                Mémoires de Saint-Bernard
                            </span>

                            <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight transition-all duration-500 transform">
                                {currentSlide.title}
                            </h3>

                            {currentSlide.description && (
                                <p className="text-slate-300 text-sm md:text-base leading-relaxed line-clamp-4">
                                    {currentSlide.description}
                                </p>
                            )}

                            {currentSlide.link_url && (
                                <div className="pt-2">
                                    <a
                                        href={currentSlide.link_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-md hover:shadow-amber-500/20"
                                    >
                                        {currentSlide.button_text || 'En savoir plus'} →
                                    </a>
                                </div>
                            )}

                            {/* CONTROLES NAVIGATION DANS L'APERÇU */}
                            {activeSlidesList.length > 1 && (
                                <div className="flex items-center gap-2 pt-4">
                                    {activeSlidesList.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveSlideIndex(idx)}
                                            className={`h-2 rounded-full transition-all cursor-pointer ${idx === activeSlideIndex
                                                    ? 'w-8 bg-amber-500'
                                                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                                                }`}
                                            aria-label={`Aller à la diapo ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* MOITIÉ DROITE : IMAGE AVEC EFFET ZOOM-IN */}
                        <div className="relative h-64 md:h-full w-full overflow-hidden group">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out transform scale-105 group-hover:scale-110"
                                style={{ backgroundImage: `url(${currentSlide.image_url})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent md:bg-gradient-to-r md:from-slate-950 md:via-transparent md:to-transparent" />
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center rounded-3xl bg-slate-100 border border-slate-300 text-slate-500">
                        Aucune illustration active dans le carrousel pour le moment.
                    </div>
                )}
            </div>

            {/* FORMULAIRE DE CRÉATION / ÉDITION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                    {isEditing ? "✏️ Modifier l'illustration" : '➕ Ajouter une nouvelle illustration'}
                </h3>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Titre principal *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Les pionniers de la lutte de 1996"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                URL de l'image *
                            </label>
                            <input
                                type="url"
                                required
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                placeholder="https://images.unsplash.com/photo-..."
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Texte explicatif (Moitié de page)
                        </label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Rédigez un court résumé qui accompagne le visuel..."
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Lien de redirection (Optionnel)
                            </label>
                            <input
                                type="text"
                                value={formData.link_url}
                                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                placeholder="/recits/pionniers-1996"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Texte du bouton
                            </label>
                            <input
                                type="text"
                                value={formData.button_text}
                                onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                                placeholder="Découvrir le récit"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Ordre d'affichage
                            </label>
                            <input
                                type="number"
                                value={formData.display_order}
                                onChange={(e) =>
                                    setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                                }
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                            />
                            <span className="text-sm font-semibold text-slate-700">
                                Actif immédiatement sur le site
                            </span>
                        </label>

                        <div className="flex items-center gap-2">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700"
                                >
                                    Annuler
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md disabled:opacity-50"
                            >
                                {loading
                                    ? 'Enregistrement...'
                                    : isEditing
                                        ? 'Mettre à jour'
                                        : 'Ajouter au carrousel'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* TABLEAU DES SLIDES EXISTANTES */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">
                        Liste des visuels enregistrés ({slides.length})
                    </h3>
                </div>

                {slides.length === 0 ? (
                    <p className="p-6 text-slate-500 text-sm text-center">
                        Aucune image configurée dans la base de données.
                    </p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {slides.map((slide) => (
                            <div
                                key={slide.id}
                                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-16 h-12 rounded-lg bg-cover bg-center border border-slate-200 flex-shrink-0"
                                        style={{ backgroundImage: `url(${slide.image_url})` }}
                                    />
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">{slide.title}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-1">
                                            {slide.description || 'Pas de description'}
                                        </p>
                                        <span className="text-[10px] text-slate-400">
                                            Ordre : {slide.display_order}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleToggleActive(slide)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${slide.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}
                                    >
                                        {slide.is_active ? 'Actif' : 'Masqué'}
                                    </button>

                                    <button
                                        onClick={() => handleEdit(slide)}
                                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                        title="Modifier"
                                    >
                                        ✏️
                                    </button>

                                    <button
                                        onClick={() => handleDelete(slide.id)}
                                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Supprimer"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}