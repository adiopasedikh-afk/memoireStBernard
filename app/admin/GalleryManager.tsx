'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { apiRequest } from '@/app/lib/api';

export interface GalleryItem {
  id: string;
  title: string;
  type: 'photo' | 'video' | 'document' | string;
  category: string;
  url: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean | number;
  created_at?: string;
}

interface GalleryManagerProps {
  initialItems?: GalleryItem[];
  onItemsChange?: (items: GalleryItem[]) => void;
}

const CATEGORIES = ['Histoire', 'Solidarité', 'Témoignage', 'Archives', 'Autre'];
const TYPES: { value: 'photo' | 'video' | 'document'; label: string }[] = [
  { value: 'photo', label: '📷 Photographie' },
  { value: 'video', label: '▶ Vidéo / Émission' },
  { value: 'document', label: '📄 Document / Tract' },
];

export default function GalleryManager({ initialItems = [], onItemsChange }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'photo' | 'video' | 'document'>('photo');
  const [category, setCategory] = useState('Histoire');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editDraft, setEditDraft] = useState<GalleryItem | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const loadItems = useCallback(async () => {
    setFetching(true);
    try {
      const res = await apiRequest<{ data: GalleryItem[] }>('/api/admin/gallery');
      setItems(res.data);
      onItemsChange?.(res.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger la galerie.');
    } finally {
      setFetching(false);
    }
  }, [onItemsChange]);

  useEffect(() => {
    if (initialItems.length === 0) void loadItems();
  }, [initialItems.length, loadItems]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Veuillez renseigner un titre.');
      return;
    }
    if (!file && !externalUrl.trim()) {
      setErrorMessage('Veuillez sélectionner un fichier image ou indiquer une URL externe.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', type);
      const effectiveCategory = category === 'Autre' && customCategory.trim() ? customCategory.trim() : category;
      formData.append('category', effectiveCategory);
      formData.append('description', description.trim());
      formData.append('display_order', String(displayOrder));

      if (file) {
        formData.append('file', file);
      } else {
        formData.append('url', externalUrl.trim());
      }

      const result = await apiRequest<GalleryItem>('/api/admin/gallery', {
        method: 'POST',
        body: formData,
      });

      const updated = [result, ...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      setItems(updated);
      onItemsChange?.(updated);

      // Reset form
      setTitle('');
      setType('photo');
      setCategory('Histoire');
      setCustomCategory('');
      setDescription('');
      setDisplayOrder(0);
      setExternalUrl('');
      setFile(null);
      setFileKey((k) => k + 1);
      setSuccessMessage('Élément ajouté avec succès à la Galerie des Sans-Papiers !');
      setSelectedItemId(null);
      setEditDraft(null);
      setIsAdding(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de l'ajout à la galerie.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item: GalleryItem) => {
    const newActive = !Boolean(item.is_active);
    try {
      const updated = await apiRequest<GalleryItem>(`/api/admin/gallery/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newActive }),
      });
      const newItems = items.map((i) => (i.id === item.id ? { ...i, is_active: updated.is_active } : i));
      setItems(newItems);
      onItemsChange?.(newItems);
      if (selectedItemId === item.id) {
        setSelectedItemId(null);
        setEditDraft(null);
      }
      setSuccessMessage(newActive ? 'L’élément a été suspendu.' : 'L’élément a été réactivé.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément de la galerie ?')) return;
    try {
      await apiRequest(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      const newItems = items.filter((i) => i.id !== id);
      setItems(newItems);
      onItemsChange?.(newItems);
      setSelectedItemId(null);
      setEditDraft(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    }
  };

  const handleSaveItem = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const updatedItem = await apiRequest<GalleryItem>(`/api/admin/gallery/${editDraft.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editDraft.title,
          type: editDraft.type,
          category: editDraft.category,
          url: editDraft.url,
          description: editDraft.description || '',
          display_order: Number(editDraft.display_order ?? 0),
        }),
      });
      const updatedItems = items
        .map((item) => item.id === updatedItem.id ? updatedItem : item)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      setItems(updatedItems);
      onItemsChange?.(updatedItems);
      setSelectedItemId(null);
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
          <h3 className="text-xl font-bold text-slate-900">Galerie des Sans-Papiers & Archives</h3>
          <p className="mt-1 text-xs text-slate-500">
            Alimentez les photographies, vidéos et documents d&apos;archives consultables sur la page publique.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
          {items.length} document{items.length > 1 ? 's' : ''} répertorié{items.length > 1 ? 's' : ''}
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

      {isAdding && <form onSubmit={handleAddItem} className="rounded-2xl border border-amber-300 bg-slate-50 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-800">Ajouter un document ou une photo</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de l&apos;archive *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Rassemblement sur le parvis"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Type de document</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'photo' | 'video' | 'document')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie / Thème</label>
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {category === 'Autre' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Catégorie..."
                  className="w-1/2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              )}
            </div>
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Contexte historique</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ex: 23 août 1996 : Événements survenus lors de l'évacuation..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Fichier ou URL */}
        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Téléverser une image / fichier (Max 8 Mo)
            </label>
            <input
              key={fileKey}
              type="file"
              accept="image/*,.pdf"
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
              Ou coller un lien URL externe (image / vidéo)
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
              placeholder="https://..."
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
            {loading ? 'Enregistrement...' : 'Ajouter à la Galerie'}
          </button>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => setIsAdding(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">
            Annuler
          </button>
        </div>
      </form>}

      {/* Liste des éléments existants */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-800">
          Documents et photos actuellement en ligne{fetching ? ' — actualisation…' : ''}
        </h4>

        {items.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
            Aucun élément dans la galerie pour le moment.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const active = Boolean(item.is_active);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedItemId(item.id);
                    setEditDraft({ ...item });
                    setIsAdding(false);
                    setErrorMessage('');
                  }}
                  aria-pressed={selectedItemId === item.id}
                  className={`overflow-hidden rounded-xl border text-left transition shadow-sm ${
                    selectedItemId === item.id ? 'border-amber-500 ring-2 ring-amber-200' :
                    active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="relative h-36 w-full bg-slate-900">
                    <Image
                      src={item.url}
                      alt={item.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute top-2 left-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur">
                      {item.category}
                    </span>
                    <span className="absolute top-2 right-2 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-slate-200 backdrop-blur">
                      {item.type}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <h5 className="font-bold text-slate-900 text-xs line-clamp-1">{item.title}</h5>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}

                  </div>
                </button>
              );
            })}
          </div>

        )}
      </div>

      {editDraft && selectedItemId === editDraft.id ? (
            <form onSubmit={handleSaveItem} className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
              <h4 className="text-sm font-bold text-slate-800">Modifier « {editDraft.title} »</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Titre
                  <input required value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Type
                  <select value={editDraft.type} onChange={(event) => setEditDraft({ ...editDraft, type: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
                    {TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Catégorie
                  <input value={editDraft.category} onChange={(event) => setEditDraft({ ...editDraft, category: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Ordre d’affichage
                  <input type="number" step="1" value={editDraft.display_order ?? 0} onChange={(event) => setEditDraft({ ...editDraft, display_order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  URL du média
                  <input type="url" required value={editDraft.url} onChange={(event) => setEditDraft({ ...editDraft, url: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
                  Description
                  <textarea rows={3} value={editDraft.description || ''} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
                </label>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3">
                <button type="button" onClick={() => void handleDeleteItem(editDraft.id)} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700">Supprimer</button>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void handleToggleActive(editDraft)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                    {editDraft.is_active ? 'Suspendre' : 'Réactiver'}
                  </button>
                  <button type="button" onClick={() => { setSelectedItemId(null); setEditDraft(null); }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Fermer</button>
                  <button type="submit" disabled={editSaving} className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {editSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </div>
            </form>
          ) : !isAdding && (
            <div className="flex justify-end">
              <button type="button" onClick={() => { setSelectedItemId(null); setEditDraft(null); setIsAdding(true); }} className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white">
                Ajouter un document ou une photo
              </button>
            </div>
      )}
    </div>
  );
}
