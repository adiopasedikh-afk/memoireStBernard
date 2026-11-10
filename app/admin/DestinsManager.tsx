'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { apiRequest } from '@/app/lib/api';

export interface DestinsPortrait {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  image_url: string;
  display_order?: number;
  is_active?: boolean | number;
  created_at?: string;
}

interface DestinsManagerProps {
  initialPortraits?: DestinsPortrait[];
  onPortraitsChange?: (portraits: DestinsPortrait[]) => void;
}

export default function DestinsManager({ initialPortraits = [], onPortraitsChange }: DestinsManagerProps) {
  const [portraits, setPortraits] = useState<DestinsPortrait[]>(initialPortraits);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPortraitId, setSelectedPortraitId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editDraft, setEditDraft] = useState<DestinsPortrait | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const loadPortraits = useCallback(async () => {
    try {
      const res = await apiRequest<{ data: DestinsPortrait[] }>('/api/admin/destins');
      setPortraits(res.data);
      onPortraitsChange?.(res.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les portraits.');
    }
  }, [onPortraitsChange]);

  useEffect(() => {
    if (initialPortraits.length === 0) void loadPortraits();
  }, [initialPortraits.length, loadPortraits]);

  const handleAddPortrait = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      setErrorMessage('Le nom et le rôle sont obligatoires.');
      return;
    }
    if (!file && !externalUrl.trim()) {
      setErrorMessage('Veuillez sélectionner une photo ou indiquer une URL d’image.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('role', role.trim());
      formData.append('bio', bio.trim());
      formData.append('display_order', String(displayOrder));

      if (file) {
        formData.append('file', file);
      } else {
        formData.append('image_url', externalUrl.trim());
      }

      const result = await apiRequest<DestinsPortrait>('/api/admin/destins', {
        method: 'POST',
        body: formData,
      });

      const updated = [result, ...portraits].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      setPortraits(updated);
      onPortraitsChange?.(updated);

      setName('');
      setRole('');
      setBio('');
      setDisplayOrder(0);
      setExternalUrl('');
      setFile(null);
      setFileKey((k) => k + 1);
      setSuccessMessage('Portrait ajouté avec succès aux Destins & Parcours !');
      setSelectedPortraitId(null);
      setEditDraft(null);
      setIsAdding(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de l'ajout du portrait.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (portrait: DestinsPortrait) => {
    const newActive = !Boolean(portrait.is_active);
    try {
      const updated = await apiRequest<DestinsPortrait>(`/api/admin/destins/${portrait.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newActive }),
      });
      const newPortraits = portraits.map((p) => (p.id === portrait.id ? { ...p, is_active: updated.is_active } : p));
      setPortraits(newPortraits);
      onPortraitsChange?.(newPortraits);
      if (selectedPortraitId === portrait.id) {
        setSelectedPortraitId(null);
        setEditDraft(null);
      }
      setSuccessMessage(newActive ? 'Le portrait a été suspendu.' : 'Le portrait a été réactivé.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDeletePortrait = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce portrait ?')) return;
    try {
      await apiRequest(`/api/admin/destins/${id}`, { method: 'DELETE' });
      const newPortraits = portraits.filter((p) => p.id !== id);
      setPortraits(newPortraits);
      onPortraitsChange?.(newPortraits);
      setSelectedPortraitId(null);
      setEditDraft(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    }
  };

  const handleSavePortrait = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editDraft) return;
    if (!Number.isInteger(Number(editDraft.display_order ?? 0))) {
      setErrorMessage('L’ordre d’affichage doit être un nombre entier.');
      return;
    }
    setEditSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const updatedPortrait = await apiRequest<DestinsPortrait>(`/api/admin/destins/${editDraft.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editDraft.name,
          role: editDraft.role,
          bio: editDraft.bio || '',
          image_url: editDraft.image_url,
          display_order: Number(editDraft.display_order ?? 0),
        }),
      });
      const updatedPortraits = portraits
        .map((portrait) => portrait.id === updatedPortrait.id ? updatedPortrait : portrait)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      setPortraits(updatedPortraits);
      onPortraitsChange?.(updatedPortraits);
      setSelectedPortraitId(null);
      setEditDraft(null);
      setSuccessMessage('Les modifications ont été enregistrées.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer les modifications.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Destins & Parcours des Acteurs</h3>
          <p className="mt-1 text-xs text-slate-500">
            Gérez les portraits, rôles et biographies des figures historiques et soutiens présentés sur la page publique Destins.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
          {portraits.length} portrait{portraits.length > 1 ? 's' : ''}
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      {isAdding && <form onSubmit={handleAddPortrait} className="rounded-2xl border border-amber-300 bg-slate-50 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-800">Ajouter un nouveau portrait</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nom & Prénom de la personnalité *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Madjiguène Cissé"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rôle / Titre dans le mouvement *</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex: Porte-parole emblématique des Sans-Papiers"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Biographie / Témoignage</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="Courte biographie ou description de l'engagement..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ordre d&apos;affichage</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value || '0', 10))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Fichier ou URL */}
        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Téléverser une photo (JPG, PNG, WebP — Max 8 Mo)
            </label>
            <input
              key={fileKey}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setFile(f);
                if (f) setExternalUrl('');
              }}
              className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-amber-800 hover:file:bg-amber-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ou coller une URL d&apos;image externe
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => {
                setExternalUrl(e.target.value);
                if (e.target.value) {
                  setFile(null);
                  setFileKey((k) => k + 1);
                }
              }}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Ajouter le portrait'}
          </button>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => setIsAdding(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Annuler</button>
        </div>
      </form>}

      {/* Liste des portraits */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Portraits enregistrés</h4>

        {portraits.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
            Aucun portrait enregistré pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portraits.map((p) => {
              const active = Boolean(p.is_active);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPortraitId(p.id);
                    setEditDraft({ ...p });
                    setIsAdding(false);
                    setErrorMessage('');
                  }}
                  aria-pressed={selectedPortraitId === p.id}
                  className={`overflow-hidden rounded-xl border text-left transition shadow-sm ${
                    selectedPortraitId === p.id ? 'border-amber-500 ring-2 ring-amber-200' :
                    active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="relative h-44 w-full bg-slate-900">
                    <Image
                      src={p.image_url}
                      alt={p.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute top-2 right-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur">
                      Ordre : {p.display_order ?? 0}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h5 className="font-serif font-bold text-slate-900 text-sm">{p.name}</h5>
                    <p className="text-xs font-semibold text-amber-700 line-clamp-1">{p.role}</p>
                    {p.bio && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{p.bio}</p>
                    )}

                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {editDraft && selectedPortraitId === editDraft.id ? (
        <form onSubmit={handleSavePortrait} className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <h4 className="text-sm font-bold text-slate-800">Modifier « {editDraft.name} »</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Nom
              <input required value={editDraft.name} onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Rôle
              <input required value={editDraft.role} onChange={(event) => setEditDraft({ ...editDraft, role: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
              Biographie
              <textarea rows={3} value={editDraft.bio || ''} onChange={(event) => setEditDraft({ ...editDraft, bio: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
              URL de la photo
              <input type="url" required value={editDraft.image_url} onChange={(event) => setEditDraft({ ...editDraft, image_url: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Ordre d’affichage
              <input type="number" step="1" value={editDraft.display_order ?? 0} onChange={(event) => setEditDraft({ ...editDraft, display_order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3">
            <button type="button" onClick={() => void handleDeletePortrait(editDraft.id)} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700">Supprimer</button>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleToggleActive(editDraft)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">{editDraft.is_active ? 'Suspendre' : 'Réactiver'}</button>
              <button type="button" onClick={() => { setSelectedPortraitId(null); setEditDraft(null); }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Fermer</button>
              <button type="submit" disabled={editSaving} className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{editSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
            </div>
          </div>
        </form>
      ) : !isAdding && (
        <div className="flex justify-end">
          <button type="button" onClick={() => { setSelectedPortraitId(null); setEditDraft(null); setIsAdding(true); }} className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white">Ajouter un portrait</button>
        </div>
      )}
    </div>
  );
}
