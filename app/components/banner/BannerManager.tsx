'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { apiRequest } from '@/app/lib/api';

export interface BannerItem {
    id: string;
    title: string;
    subtitle?: string;
    image_url: string;
    button_text?: string;
    button_url?: string;
    is_active?: boolean | number;
    duration_type?: 'week' | 'month' | 'year' | 'lifetime';
    starts_at?: string;
    ends_at?: string | null;
    price_amount?: string | number;
    payment_status?: 'paid' | 'unpaid';
}

interface BannerManagerProps {
    initialBanners?: BannerItem[];
    onBannersChange?: (banners: BannerItem[]) => void;
}

export default function BannerManager({ initialBanners = [], onBannersChange }: BannerManagerProps) {
    const [banners, setBanners] = useState<BannerItem[]>(initialBanners);
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState(0);
    const [buttonText, setButtonText] = useState('');
    const [buttonUrl, setButtonUrl] = useState('');
    const [durationType, setDurationType] = useState<'week' | 'month' | 'year' | 'lifetime'>('month');
    const [priceAmount, setPriceAmount] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
    const [loading, setLoading] = useState(false);
    const [converting, setConverting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [editDraft, setEditDraft] = useState<BannerItem | null>(null);
    const [editSaving, setEditSaving] = useState(false);

    useEffect(() => {
        onBannersChange?.(banners);
    }, [banners, onBannersChange]);

    const handleFileSelection = async (selectedFile: File | undefined) => {
        if (!selectedFile) {
            setFile(null);
            return;
        }
        setErrorMessage('');
        setConverting(selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf'));
        if (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')) {
            if (selectedFile.size > 8 * 1024 * 1024) {
                setErrorMessage('Le PDF dépasse la limite de téléversement de 8 Mo.');
                setFile(null);
                setConverting(false);
                return;
            }
            try {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = `${window.location.origin}/ocr/pdf.worker.min.mjs`;
                const pdf = await pdfjs.getDocument({ data: await selectedFile.arrayBuffer(), useWorkerFetch: false }).promise;
                const page = await pdf.getPage(1);
                const baseViewport = page.getViewport({ scale: 1 });
                const scale = Math.min(2, 1600 / Math.max(baseViewport.width, baseViewport.height));
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const context = canvas.getContext('2d');
                if (!context) throw new Error('Impossible de préparer la conversion du PDF.');
                await page.render({ canvasContext: context, viewport, canvas }).promise;
                const blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Impossible de convertir le PDF.')), 'image/png', 0.92);
                });
                setFile(new File([blob], `${selectedFile.name.replace(/\.pdf$/i, '')}.png`, { type: 'image/png' }));
            } catch {
                setErrorMessage('Le PDF n’a pas pu être converti en image de bannière.');
                setFile(null);
            } finally {
                setConverting(false);
            }
            return;
        }
        if (!selectedFile.type.startsWith('image/')) {
            setErrorMessage('Choisissez une image JPG, PNG, WebP, GIF ou un PDF.');
            setFile(null);
            return;
        }
        setFile(selectedFile);
    };

    // Ajout d'une nouvelle bannière dans la table `banners` et téléversement Storage
    const handleAddBanner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !file) return;

        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('subtitle', subtitle);
            formData.append('button_text', buttonText);
            formData.append('button_url', buttonUrl);
            formData.append('duration_type', durationType);
            formData.append('price_amount', priceAmount || '0');
            formData.append('payment_status', paymentStatus);
            formData.append('file', file);
            const result = await apiRequest<BannerItem>('/api/admin/banners', {
                method: 'POST',
                body: formData,
            });
            setBanners((prev) => [result, ...prev]);
            setSelectedBannerId(null);
            setEditDraft(null);
            setIsAdding(false);
            setSuccessMessage('La bannière a été ajoutée.');
            setTitle('');
            setSubtitle('');
            setFile(null);
            setButtonText('');
            setButtonUrl('');
            setDurationType('month');
            setPriceAmount('');
            setPaymentStatus('unpaid');
            setFileKey((key) => key + 1);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Impossible d’ajouter la bannière.');
        } finally {
            setLoading(false);
        }
    };

    const updateBanner = async (id: string, payload: Record<string, unknown>) => {
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const result = await apiRequest<BannerItem>(`/api/admin/banners/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
            setBanners((prev) => prev.map((banner) => banner.id === id ? { ...banner, ...result } : banner));
            setEditDraft((draft) => draft?.id === id ? { ...draft, ...result } : draft);
            return result;
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Modification impossible.');
            return null;
        }
    };

    const saveBanner = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!editDraft) return;
        setEditSaving(true);
        const result = await updateBanner(editDraft.id, {
            title: editDraft.title,
            subtitle: editDraft.subtitle || '',
            button_text: editDraft.button_text || '',
            button_url: editDraft.button_url || '',
            duration_type: editDraft.duration_type || 'month',
            price_amount: editDraft.price_amount || 0,
            payment_status: editDraft.payment_status || 'unpaid',
        });
        if (result) {
            setSelectedBannerId(null);
            setEditDraft(null);
            setSuccessMessage('Les modifications ont été enregistrées.');
        }
        setEditSaving(false);
    };

    const toggleBannerActive = async (banner: BannerItem) => {
        const result = await updateBanner(banner.id, {
            is_active: !Boolean(banner.is_active),
            payment_status: !Boolean(banner.is_active) ? 'paid' : banner.payment_status,
        });
        if (result) {
            setSelectedBannerId(null);
            setEditDraft(null);
            setSuccessMessage(banner.is_active ? 'La bannière a été suspendue.' : 'La bannière a été réactivée.');
        }
    };

    const deleteBanner = async (banner: BannerItem) => {
        if (!window.confirm(`Supprimer définitivement la bannière « ${banner.title} » ?`)) return;
        try {
            await apiRequest(`/api/admin/banners/${banner.id}`, { method: 'DELETE' });
            setBanners((prev) => prev.filter((item) => item.id !== banner.id));
            setSelectedBannerId(null);
            setEditDraft(null);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Suppression impossible.');
        }
    };

    const totalRevenue = banners.reduce((sum, banner) => banner.payment_status === 'paid' ? sum + Number(banner.price_amount || 0) : sum, 0);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold">Gestion des bannières</h3>
                <div className="rounded-lg bg-emerald-950 px-3 py-2 text-sm"><span className="text-slate-300">Recettes comptabilisées :</span> <strong className="text-emerald-300">{totalRevenue.toFixed(2)} €</strong></div>
            </div>
            <div className="rounded-lg border border-sky-800 bg-sky-950/40 p-4">
                <p className="mb-3 text-sm font-bold text-sky-100">Visuels You&amp;Me prêts à télécharger</p>
                <div className="flex flex-wrap gap-2 text-xs">
                    <a href="/downloads/bannieres-youandme.zip" download className="rounded-lg bg-sky-400 px-3 py-2 font-bold text-slate-950 hover:bg-sky-300">Télécharger les deux visuels</a>
                    <a href="/downloads/banniere-youandme-confidentialite-1600x500.png" download className="rounded-lg border border-sky-700 px-3 py-2 font-semibold text-sky-100 hover:bg-sky-900">Visuel confidentialité — PNG</a>
                    <a href="/downloads/banniere-youandme-proches-1600x500.png" download className="rounded-lg border border-sky-700 px-3 py-2 font-semibold text-sky-100 hover:bg-sky-900">Visuel proches — PNG</a>
                </div>
            </div>
            {banners.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    {banners.map((banner) => {
                        const active = Boolean(banner.is_active);
                        return (
                            <button
                                key={banner.id}
                                type="button"
                                onClick={() => {
                                    setSelectedBannerId(banner.id);
                                    setEditDraft({ ...banner });
                                    setIsAdding(false);
                                    setErrorMessage('');
                                }}
                                aria-pressed={selectedBannerId === banner.id}
                                className={`overflow-hidden rounded-lg border text-left transition ${
                                    selectedBannerId === banner.id ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-800 hover:border-slate-600'
                                }`}
                            >
                                <div className="relative h-28 w-full bg-slate-950">
                                    <Image src={banner.image_url} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
                                </div>
                                <div className="p-3">
                                    <strong className="text-white">{banner.title}</strong>
                                    <p className="mt-1 text-xs text-slate-300">{active ? 'Active' : 'Suspendue'} · {banner.duration_type || 'month'} · {Number(banner.price_amount || 0).toFixed(2)} € · {banner.payment_status === 'paid' ? 'Payée' : 'Non payée'}</p>
                                    {banner.ends_at && <p className="mt-1 text-xs text-slate-500">Expire le {new Date(banner.ends_at).toLocaleDateString('fr-FR')}</p>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
            {errorMessage && <p role="alert" className="text-sm text-rose-300">{errorMessage}</p>}
            {successMessage && <p role="status" className="text-sm text-emerald-300">{successMessage}</p>}

            {editDraft && selectedBannerId === editDraft.id ? (
                <form onSubmit={saveBanner} className="space-y-4 rounded-xl border border-amber-500/30 bg-slate-950 p-4">
                    <h4 className="font-bold">Modifier « {editDraft.title} »</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-xs font-semibold text-slate-300">Titre
                            <input required value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                        </label>
                        <label className="text-xs font-semibold text-slate-300">Description / slogan
                            <input value={editDraft.subtitle || ''} onChange={(event) => setEditDraft({ ...editDraft, subtitle: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                        </label>
                        <label className="text-xs font-semibold text-slate-300">Texte du bouton
                            <input value={editDraft.button_text || ''} onChange={(event) => setEditDraft({ ...editDraft, button_text: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                        </label>
                        <label className="text-xs font-semibold text-slate-300">Lien du bouton
                            <input type="url" value={editDraft.button_url || ''} onChange={(event) => setEditDraft({ ...editDraft, button_url: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                        </label>
                        <label className="text-xs font-semibold text-slate-300">Durée
                            <select value={editDraft.duration_type || 'month'} onChange={(event) => setEditDraft({ ...editDraft, duration_type: event.target.value as BannerItem['duration_type'] })} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white">
                                <option value="week">1 semaine</option><option value="month">1 mois</option><option value="year">1 année</option><option value="lifetime">À vie</option>
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-slate-300">Montant (€)
                            <input type="number" min="0" step="0.01" value={editDraft.price_amount ?? 0} onChange={(event) => setEditDraft({ ...editDraft, price_amount: event.target.value })} className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2.5 text-sm text-white" />
                        </label>
                    </div>
                    <div className="flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3">
                        <button type="button" onClick={() => void deleteBanner(editDraft)} className="rounded border border-rose-700 px-3 py-2 text-xs text-rose-300">Supprimer</button>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => { setSelectedBannerId(null); setEditDraft(null); }} className="rounded border border-slate-700 px-3 py-2 text-xs">Fermer</button>
                            <button type="button" onClick={() => void toggleBannerActive(editDraft)} className="rounded border border-slate-700 px-3 py-2 text-xs">{editDraft.is_active ? 'Suspendre' : 'Réactiver'}</button>
                            <button type="submit" disabled={editSaving} className="rounded bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">{editSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
                        </div>
                    </div>
                </form>
            ) : isAdding ? (
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
                        Image ou PDF de la bannière *
                    </label>
                    <input
                        key={fileKey}
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        onChange={(e) => void handleFileSelection(e.target.files?.[0])}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
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

                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Durée minimale</label>
                    <select value={durationType} onChange={(e) => setDurationType(e.target.value as typeof durationType)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white">
                        <option value="week">1 semaine</option><option value="month">1 mois</option><option value="year">1 année</option><option value="lifetime">À vie</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Montant (€)</label>
                    <input type="number" min="0" step="0.01" value={priceAmount} onChange={(e) => setPriceAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white" />
                </div>
                <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-300">Statut du paiement</label>
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white">
                        <option value="unpaid">Non payée — suspendue</option><option value="paid">Payée — publiée</option>
                    </select>
                </div>

                <div className="md:col-span-2 pt-2">
                    <button
                        type="submit"
                        disabled={loading || converting}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {converting ? 'Conversion du PDF...' : loading ? 'Téléversement...' : 'Ajouter la bannière'}
                    </button>
                </div>
                <div className="flex justify-end gap-2 md:col-span-2">
                    <button type="button" onClick={() => setIsAdding(false)} className="rounded border border-slate-700 px-3 py-2 text-xs">Annuler</button>
                </div>
            </form>
            ) : (
                <div className="flex justify-end">
                    <button type="button" onClick={() => { setSelectedBannerId(null); setEditDraft(null); setIsAdding(true); }} className="rounded bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950">Ajouter une bannière</button>
                </div>
            )}
        </div>
    );
}