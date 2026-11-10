'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { apiRequest } from '@/app/lib/api';

export interface CarouselSlide {
    id: string;
    image_url: string;
    title?: string;
    description?: string;
    display_order?: number;
    image_position?: string;
    link_url?: string | null;
    is_active?: boolean | number;
}

interface CarrouselManagerProps {
    initialSlides?: CarouselSlide[];
    initialPaused?: boolean;
}

interface SlideDraft {
    title: string;
    description: string;
    display_order: string;
    image_position: string;
    link_url: string;
}

const IMAGE_POSITIONS = [
    { value: '50% 15%', label: 'Haut' },
    { value: '50% 25%', label: 'Haut-centre' },
    { value: '50% 30%', label: 'Visage vers le haut' },
    { value: '50% 50%', label: 'Centre' },
    { value: '25% 35%', label: 'Gauche' },
    { value: '75% 35%', label: 'Droite' },
    { value: '50% 60%', label: 'Plus bas (menton visible)' },
    { value: '50% 70%', label: 'Bas' },
] as const;

function createSlideDraft(slide: CarouselSlide): SlideDraft {
    return {
        title: slide.title || '',
        description: slide.description || '',
        display_order: String(slide.display_order ?? 0),
        image_position: slide.image_position || '50% 25%',
        link_url: slide.link_url || '',
    };
}

function sortSlides(slides: CarouselSlide[]) {
    return [...slides].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

export default function CarrouselManager({ initialSlides = [], initialPaused = false }: CarrouselManagerProps) {
    const [slides, setSlides] = useState<CarouselSlide[]>(() => sortSlides(initialSlides));
    const [drafts, setDrafts] = useState<Record<string, SlideDraft>>(() => Object.fromEntries(
        initialSlides.map((slide) => [slide.id, createSlideDraft(slide)]),
    ));
    const [carouselPaused, setCarouselPaused] = useState(initialPaused);
    const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [savingPause, setSavingPause] = useState(false);
    const [savingPresentation, setSavingPresentation] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [newImagePosition, setNewImagePosition] = useState('50% 30%');
    const [file, setFile] = useState<File | null>(null); // Objet File au lieu de l'URL string
    const [displayOrder, setDisplayOrder] = useState(0);
    const [linkUrl, setLinkUrl] = useState('');
    const [fileKey, setFileKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Ajout d'une diapositive via l’API (table `carousel_slides`)
    const handleAddSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('display_order', String(displayOrder));
            formData.append('image_position', newImagePosition);
            formData.append('link_url', linkUrl);
            formData.append('file', file);
            const result = await apiRequest<CarouselSlide>('/api/admin/carousel-slides', {
                method: 'POST',
                body: formData,
            });
            setSlides((prev) => sortSlides([...prev, result]));
            setSelectedSlideId(null);
            setDrafts((prev) => {
                const next = { ...prev };
                delete next[result.id];
                return next;
            });
            setIsAdding(false);
            setSuccessMessage('La photo a été ajoutée au carrousel.');
            setTitle('');
            setDescription('');
            setNewImagePosition('50% 30%');
            setFile(null);
            setLinkUrl('');
            setDisplayOrder(0);
            setFileKey((key) => key + 1);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Impossible d’ajouter la diapositive.');
        } finally {
            setLoading(false);
        }
    };

    const updateSlide = async (id: string, payload: Record<string, unknown>) => {
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const result = await apiRequest<CarouselSlide>(`/api/admin/carousel-slides/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
            setSlides((prev) => sortSlides(prev.map((slide) => slide.id === id ? { ...slide, ...result } : slide)));
            return true;
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Modification impossible.');
            return false;
        }
    };

    const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) ?? null;
    const selectedDraft = selectedSlide
        ? drafts[selectedSlide.id] ?? createSlideDraft(selectedSlide)
        : null;

    const saveSelectedSlide = async () => {
        if (!selectedSlide || !selectedDraft) return;
        const order = Number(selectedDraft.display_order);
        if (selectedDraft.display_order.trim() === '' || !Number.isInteger(order)
            || !IMAGE_POSITIONS.some(({ value }) => value === selectedDraft.image_position)) {
            setErrorMessage('Vérifiez les ordres (nombres entiers) et le cadrage des photos.');
            return;
        }

        setSavingPresentation(true);
        setErrorMessage('');
        try {
            const updated = await updateSlide(selectedSlide.id, {
                title: selectedDraft.title,
                description: selectedDraft.description,
                display_order: order,
                image_position: selectedDraft.image_position,
                link_url: selectedDraft.link_url,
            });
            if (updated) {
                setSelectedSlideId(null);
                setDrafts((prev) => {
                    const next = { ...prev };
                    delete next[selectedSlide.id];
                    return next;
                });
                setSuccessMessage('Les modifications ont été enregistrées.');
            }
        } finally {
            setSavingPresentation(false);
        }
    };

    const togglePause = async () => {
        setSavingPause(true);
        setErrorMessage('');
        try {
            const result = await apiRequest<{ is_paused: boolean }>('/api/admin/carousel-settings', {
                method: 'PATCH',
                body: JSON.stringify({ is_paused: !carouselPaused }),
            });
            setCarouselPaused(result.is_paused);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Impossible de modifier la pause du carrousel.');
        } finally {
            setSavingPause(false);
        }
    };

    const deleteSlide = async (slide: CarouselSlide) => {
        if (!window.confirm(`Supprimer définitivement la photo « ${slide.title || 'sans titre'} » ?`)) return;
        setErrorMessage('');
        try {
            await apiRequest(`/api/admin/carousel-slides/${slide.id}`, { method: 'DELETE' });
            setSlides((prev) => prev.filter((item) => item.id !== slide.id));
            setSelectedSlideId(null);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Suppression impossible.');
        }
    };

    const toggleSlideActive = async (slide: CarouselSlide) => {
        const updated = await updateSlide(slide.id, { is_active: !Boolean(slide.is_active) });
        if (updated) {
            setSelectedSlideId(null);
            setDrafts((prev) => {
                const next = { ...prev };
                delete next[slide.id];
                return next;
            });
            setSuccessMessage(slide.is_active ? 'La photo a été suspendue.' : 'La photo a été réactivée.');
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-6">
            <h3 className="text-lg font-bold border-b border-slate-800 pb-3">
                Gestion du Carrousel (Table `carousel_slides`)
            </h3>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-300">
                    Lecture automatique {carouselPaused ? 'en pause' : 'active'}.
                </p>
                <button
                    type="button"
                    onClick={() => void togglePause()}
                    disabled={savingPause}
                    className="rounded border border-amber-700 px-3 py-1.5 text-xs font-semibold text-amber-300 disabled:opacity-50"
                >
                    {savingPause ? 'Enregistrement...' : carouselPaused ? 'Reprendre le carrousel' : 'Mettre en pause'}
                </button>
            </div>
            {slides.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {slides.map((slide) => {
                        const active = Boolean(slide.is_active);
                        return (
                            <button
                                key={slide.id}
                                type="button"
                                onClick={() => {
                                    setSelectedSlideId(slide.id);
                                    setIsAdding(false);
                                    setDrafts((prev) => ({ ...prev, [slide.id]: createSlideDraft(slide) }));
                                    setErrorMessage('');
                                }}
                                aria-pressed={selectedSlideId === slide.id}
                                className={`overflow-hidden rounded-lg border text-left transition ${
                                    selectedSlideId === slide.id ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800 hover:border-slate-600'
                                } ${active ? 'bg-slate-950' : 'bg-slate-950/50 opacity-70'}`}
                            >
                                <div className="relative aspect-video w-full overflow-hidden">
                                    <Image
                                        src={slide.image_url}
                                        alt={`Aperçu : ${slide.title || 'photo du carrousel'}`}
                                        fill
                                        unoptimized
                                        sizes="(max-width: 1024px) 100vw, 220px"
                                        className="object-cover"
                                        style={{ objectPosition: slide.image_position || '50% 25%' }}
                                    />
                                </div>
                                <div className="p-3">
                                    <strong className="text-white">{slide.title || 'Photo sans titre'}</strong>
                                    <p className="mt-1 text-xs text-slate-400">{active ? 'Active' : 'Suspendue'} · Ordre {slide.display_order ?? 0}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
            {selectedSlide && selectedDraft ? (
                <form
                    onSubmit={(event) => { event.preventDefault(); void saveSelectedSlide(); }}
                    className="space-y-4 rounded-xl border border-amber-500/30 bg-slate-950 p-4"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-xs font-semibold text-slate-300">
                            Titre
                            <input
                                value={selectedDraft.title}
                                onChange={(event) => setDrafts((prev) => ({
                                    ...prev,
                                    [selectedSlide.id]: { ...selectedDraft, title: event.target.value },
                                }))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                            />
                        </label>
                        <label className="text-xs font-semibold text-slate-300">
                            Description
                            <textarea
                                value={selectedDraft.description}
                                onChange={(event) => setDrafts((prev) => ({
                                    ...prev,
                                    [selectedSlide.id]: { ...selectedDraft, description: event.target.value },
                                }))}
                                maxLength={1000}
                                rows={2}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                            />
                        </label>
                        <label className="text-xs font-semibold text-slate-300">
                            Lien
                            <input
                                type="url"
                                value={selectedDraft.link_url}
                                onChange={(event) => setDrafts((prev) => ({
                                    ...prev,
                                    [selectedSlide.id]: { ...selectedDraft, link_url: event.target.value },
                                }))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                            />
                        </label>
                        <label className="text-xs font-semibold text-slate-300">
                            Ordre
                            <input
                                type="number"
                                step="1"
                                value={selectedDraft.display_order}
                                onChange={(event) => setDrafts((prev) => ({
                                    ...prev,
                                    [selectedSlide.id]: { ...selectedDraft, display_order: event.target.value },
                                }))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                            />
                        </label>
                        <label className="text-xs font-semibold text-slate-300 md:col-span-2">
                            Cadrage de la photo
                            <select
                                value={selectedDraft.image_position}
                                onChange={(event) => setDrafts((prev) => ({
                                    ...prev,
                                    [selectedSlide.id]: { ...selectedDraft, image_position: event.target.value },
                                }))}
                                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                            >
                                {IMAGE_POSITIONS.map((position) => (
                                    <option key={position.value} value={position.value}>{position.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3">
                        <button
                            type="button"
                            onClick={() => void deleteSlide(selectedSlide)}
                            className="rounded border border-rose-700 px-3 py-2 text-xs font-semibold text-rose-300"
                        >
                            Supprimer
                        </button>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => { setSelectedSlideId(null); setErrorMessage(''); }}
                                className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300"
                            >
                                Fermer
                            </button>
                            <button
                                type="button"
                                onClick={() => void toggleSlideActive(selectedSlide)}
                                className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-200"
                            >
                                {selectedSlide.is_active ? 'Suspendre' : 'Réactiver'}
                            </button>
                            <button
                                type="submit"
                                disabled={savingPresentation}
                                className="rounded bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
                            >
                                {savingPresentation ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </div>
                </form>
            ) : isAdding ? (
                <form onSubmit={handleAddSlide} className="grid grid-cols-1 gap-4 rounded-xl border border-amber-500/30 bg-slate-950 p-4 md:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-300">
                        Titre de l&apos;image
                        <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                    </label>
                    <label className="text-xs font-semibold text-slate-300">
                        Image *
                        <input key={fileKey} type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1 w-full text-xs text-white" required />
                    </label>
                    <label className="text-xs font-semibold text-slate-300">
                        Description
                        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                    </label>
                    <label className="text-xs font-semibold text-slate-300">
                        Lien au clic
                        <input type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                    </label>
                    <label className="text-xs font-semibold text-slate-300">
                        Ordre d&apos;affichage
                        <input type="number" value={displayOrder} onChange={(event) => setDisplayOrder(parseInt(event.target.value, 10) || 0)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                    </label>
                    <label className="text-xs font-semibold text-slate-300">
                        Cadrage initial
                        <select value={newImagePosition} onChange={(event) => setNewImagePosition(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white">
                            {IMAGE_POSITIONS.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}
                        </select>
                    </label>
                    <div className="flex justify-end gap-2 md:col-span-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300">Annuler</button>
                        <button type="submit" disabled={loading} className="rounded bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">
                            {loading ? 'Téléversement...' : 'Ajouter au carrousel'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => { setSelectedSlideId(null); setIsAdding(true); setErrorMessage(''); }}
                        className="rounded bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950"
                    >
                        Ajouter une photo
                    </button>
                </div>
            )}
            {errorMessage && <p role="alert" className="text-sm text-rose-300">{errorMessage}</p>}
            {successMessage && <p role="status" className="text-sm text-emerald-300">{successMessage}</p>}
        </div>
    );
}