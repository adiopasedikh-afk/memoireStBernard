'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { apiRequest } from '@/app/lib/api';

export interface VideoArchive {
  id: string;
  title: string;
  youtube_id: string;
  description?: string | null;
  badge_date: string;
  display_order?: number;
  is_active?: boolean | number;
  created_at?: string;
}

interface VideosManagerProps {
  initialVideos?: VideoArchive[];
  onVideosChange?: (videos: VideoArchive[]) => void;
}

const BADGES = ['Archive 1996', 'Archive INA', 'Témoignage', 'Documentaire', 'Débat & Conférence', 'Autre'];

export default function VideosManager({ initialVideos = [], onVideosChange }: VideosManagerProps) {
  const [videos, setVideos] = useState<VideoArchive[]>(initialVideos);
  const [title, setTitle] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [badgeDate, setBadgeDate] = useState('Archive 1996');
  const [customBadge, setCustomBadge] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editDraft, setEditDraft] = useState<VideoArchive | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const loadVideos = useCallback(async () => {
    try {
      const res = await apiRequest<{ data: VideoArchive[] }>('/api/admin/videos');
      setVideos(res.data);
      onVideosChange?.(res.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les vidéos.');
    }
  }, [onVideosChange]);

  useEffect(() => {
    if (initialVideos.length === 0) void loadVideos();
  }, [initialVideos.length, loadVideos]);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !youtubeInput.trim()) {
      setErrorMessage('Le titre et le lien ou identifiant YouTube sont requis.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('youtube_id', youtubeInput.trim());
      const effectiveBadge = badgeDate === 'Autre' && customBadge.trim() ? customBadge.trim() : badgeDate;
      formData.append('badge_date', effectiveBadge);
      formData.append('description', description.trim());
      formData.append('display_order', String(displayOrder));

      const result = await apiRequest<VideoArchive>('/api/admin/videos', {
        method: 'POST',
        body: formData,
      });

      const updated = [result, ...videos].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      setVideos(updated);
      onVideosChange?.(updated);

      setTitle('');
      setYoutubeInput('');
      setDescription('');
      setDisplayOrder(0);
      setBadgeDate('Archive 1996');
      setCustomBadge('');
      setSuccessMessage('Vidéo ajoutée avec succès aux archives !');
      setSelectedVideoId(null);
      setEditDraft(null);
      setIsAdding(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de l'ajout de la vidéo.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (video: VideoArchive) => {
    const newActive = !Boolean(video.is_active);
    try {
      const updated = await apiRequest<VideoArchive>(`/api/admin/videos/${video.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: newActive }),
      });
      const newVideos = videos.map((v) => (v.id === video.id ? { ...v, is_active: updated.is_active } : v));
      setVideos(newVideos);
      onVideosChange?.(newVideos);
      if (selectedVideoId === video.id) {
        setSelectedVideoId(null);
        setEditDraft(null);
      }
      setSuccessMessage(newActive ? 'La vidéo a été suspendue.' : 'La vidéo a été réactivée.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut.');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;
    try {
      await apiRequest(`/api/admin/videos/${id}`, { method: 'DELETE' });
      const newVideos = videos.filter((v) => v.id !== id);
      setVideos(newVideos);
      onVideosChange?.(newVideos);
      setSelectedVideoId(null);
      setEditDraft(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    }
  };

  const handleSaveVideo = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const updatedVideo = await apiRequest<VideoArchive>(`/api/admin/videos/${editDraft.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editDraft.title,
          youtube_id: editDraft.youtube_id,
          description: editDraft.description || '',
          badge_date: editDraft.badge_date,
          display_order: Number(editDraft.display_order ?? 0),
        }),
      });
      const updatedVideos = videos
        .map((video) => video.id === updatedVideo.id ? updatedVideo : video)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      setVideos(updatedVideos);
      onVideosChange?.(updatedVideos);
      setSelectedVideoId(null);
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
          <h3 className="text-xl font-bold text-slate-900">Archives Audiovisuelles & Vidéos</h3>
          <p className="mt-1 text-xs text-slate-500">
            Gérez les reportages, documentaires et entretiens vidéo YouTube consultables sur la page publique Vidéos.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
          {videos.length} vidéo{videos.length > 1 ? 's' : ''}
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

      {isAdding && <form onSubmit={handleAddVideo} className="rounded-2xl border border-amber-300 bg-slate-50 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-800">Ajouter une nouvelle vidéo d&apos;archive</h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de la vidéo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: La Ballade des sans-papiers"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lien ou identifiant YouTube * (ex: https://youtube.com/watch?v=... ou kNjVJoYhc84)
            </label>
            <input
              type="text"
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ou ID"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Étiquette / Contexte</label>
            <div className="flex gap-2">
              <select
                value={badgeDate}
                onChange={(e) => setBadgeDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
              >
                {BADGES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {badgeDate === 'Autre' && (
                <input
                  type="text"
                  value={customBadge}
                  onChange={(e) => setCustomBadge(e.target.value)}
                  placeholder="Étiquette..."
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Résumé</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ex: Documentaire retraçant le mouvement des sans-papiers..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Ajouter la vidéo'}
          </button>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => setIsAdding(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Annuler</button>
        </div>
      </form>}

      {/* Liste des vidéos */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-800">Vidéos publiées</h4>

        {videos.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
            Aucune vidéo enregistrée pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((v) => {
              const active = Boolean(v.is_active);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVideoId(v.id);
                    setEditDraft({ ...v });
                    setIsAdding(false);
                    setErrorMessage('');
                  }}
                  aria-pressed={selectedVideoId === v.id}
                  className={`overflow-hidden rounded-xl border text-left transition shadow-sm ${
                    selectedVideoId === v.id ? 'border-amber-500 ring-2 ring-amber-200' :
                    active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="relative aspect-video w-full bg-black">
                    <Image
                      src={`https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                        {v.badge_date}
                      </span>
                      <span className="text-[10px] text-slate-400">Ordre : {v.display_order ?? 0}</span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-sm line-clamp-1">{v.title}</h5>
                    {v.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{v.description}</p>
                    )}

                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {editDraft && selectedVideoId === editDraft.id ? (
        <form onSubmit={handleSaveVideo} className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <h4 className="text-sm font-bold text-slate-800">Modifier « {editDraft.title} »</h4>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${editDraft.youtube_id}`}
              title={editDraft.title}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Titre
              <input required value={editDraft.title} onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Lien ou identifiant YouTube
              <input required value={editDraft.youtube_id} onChange={(event) => setEditDraft({ ...editDraft, youtube_id: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Étiquette / Contexte
              <input value={editDraft.badge_date} onChange={(event) => setEditDraft({ ...editDraft, badge_date: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700">
              Ordre d’affichage
              <input type="number" step="1" value={editDraft.display_order ?? 0} onChange={(event) => setEditDraft({ ...editDraft, display_order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:col-span-2">
              Description
              <textarea rows={3} value={editDraft.description || ''} onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 pt-3">
            <button type="button" onClick={() => void handleDeleteVideo(editDraft.id)} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700">Supprimer</button>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleToggleActive(editDraft)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">{editDraft.is_active ? 'Suspendre' : 'Réactiver'}</button>
              <button type="button" onClick={() => { setSelectedVideoId(null); setEditDraft(null); }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Fermer</button>
              <button type="submit" disabled={editSaving} className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{editSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
            </div>
          </div>
        </form>
      ) : !isAdding && (
        <div className="flex justify-end">
          <button type="button" onClick={() => { setSelectedVideoId(null); setEditDraft(null); setIsAdding(true); }} className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white">Ajouter une vidéo</button>
        </div>
      )}
    </div>
  );
}
