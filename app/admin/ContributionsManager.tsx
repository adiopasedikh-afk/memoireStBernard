'use client';

import { useCallback, useEffect, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { apiRequest } from '@/app/lib/api';
import ContributionContent from '@/app/components/ContributionContent';
import { createContributionPdf } from '@/app/lib/contributionPdf';
import ContributionRichTextEditor from '@/app/admin/ContributionRichTextEditor';
import {
  appendPlainTextToContributionDocument,
  encodeContributionDocument,
  getContributionEditorDocument,
  getContributionPlainText,
} from '@/app/lib/contributionRichText';
import { extractContributionPdfText } from '@/app/lib/extractContributionPdf';

type ContributionStatus = 'pending' | 'published' | 'rejected' | 'suspended';

interface Contribution {
  id: string;
  title: string;
  content: string;
  author_email: string | null;
  file_url: string | null;
  status: ContributionStatus;
  is_archive: boolean | number;
  archived_at: string | null;
  created_at: string;
}

interface AssociationUser {
  id: number;
  email: string;
  role: 'admin' | 'member';
  is_active: boolean | number;
}

interface ContributionsManagerProps {
  currentAdminEmail: string;
  onContributionMetricsChange?: (pending: number, total: number) => void;
}

const statusLabels: Record<ContributionStatus, string> = {
  pending: 'En attente',
  published: 'Publiée',
  rejected: 'Refusée',
  suspended: 'Suspendue',
};

const EMPTY_CONTRIBUTION_DOCUMENT: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export default function ContributionsManager({ currentAdminEmail, onContributionMetricsChange }: ContributionsManagerProps) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [users, setUsers] = useState<AssociationUser[]>([]);
  const [authorEmail, setAuthorEmail] = useState(currentAdminEmail);
  const [title, setTitle] = useState('');
  const [contentDocument, setContentDocument] = useState<JSONContent>(EMPTY_CONTRIBUTION_DOCUMENT);
  const [contentEditorKey, setContentEditorKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileSelectionKey, setFileSelectionKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDocument, setEditingDocument] = useState<JSONContent>(EMPTY_CONTRIBUTION_DOCUMENT);
  const [savedEditingSnapshot, setSavedEditingSnapshot] = useState('');
  const [editingHasBeenSaved, setEditingHasBeenSaved] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [selectedContributionId, setSelectedContributionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'archives' | 'not_archives'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [contributionResult, userResult] = await Promise.all([
      apiRequest<{ data: Contribution[] }>('/api/admin/contributions'),
      apiRequest<{ data: AssociationUser[] }>('/api/admin/users'),
    ]);
    setContributions(contributionResult.data);
    setUsers(userResult.data);
    const contributions = contributionResult.data;
    onContributionMetricsChange?.(
      contributions.filter((contribution) => contribution.status === 'pending').length,
      contributions.length,
    );
  }, [onContributionMetricsChange]);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      try {
        await loadData();
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les contributions.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const refreshContributions = () => {
      void loadData().catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger les contributions.');
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshContributions();
    };

    intervalId = setInterval(refreshContributions, 15_000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshContributions);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshContributions);
    };
  }, [loadData]);
  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const contributionText = getContributionPlainText(contentDocument);
    if (!file && contributionText === '') {
      setErrorMessage('Saisissez un texte ou joignez un fichier.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    setProcessingMessage('');
    try {
      let documentToSave = contentDocument;
      if (file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf')) {
        const extractedText = await extractContributionPdfText(file, setProcessingMessage);
        documentToSave = appendPlainTextToContributionDocument(documentToSave, extractedText);
      }

      const plainText = getContributionPlainText(documentToSave);
      const formData = new FormData();
      formData.append('author_email', authorEmail);
      formData.append('title', title);
      formData.append('content', encodeContributionDocument(documentToSave));
      if (file) {
        formData.append('file', file);
      } else if (plainText !== '') {
        formData.append('file', createContributionPdf(title, plainText));
      }
      await apiRequest('/api/admin/contributions', { method: 'POST', body: formData });
      setAuthorEmail(currentAdminEmail);
      setTitle('');
      setContentDocument(EMPTY_CONTRIBUTION_DOCUMENT);
      setContentEditorKey((key) => key + 1);
      setFile(null);
      setFileSelectionKey((key) => key + 1);
      setSuccessMessage('La contribution a été créée en attente de validation.');
      setIsCreating(false);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de créer la contribution.');
    } finally {
      setProcessingMessage('');
      setSaving(false);
    }
  };

  const updateStatus = async (contribution: Contribution, status: ContributionStatus) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiRequest(`/api/admin/contributions/${contribution.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (editingContributionId === contribution.id) cancelEditing();
      setSelectedContributionId(null);
      setSuccessMessage(`La contribution est maintenant : ${statusLabels[status].toLowerCase()}.`);
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de modérer la contribution.');
    }
  };

  const toggleArchive = async (contribution: Contribution) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const nextValue = !(Number(contribution.is_archive) === 1);
      await apiRequest(`/api/admin/contributions/${contribution.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_archive: nextValue }),
      });
      if (editingContributionId === contribution.id) cancelEditing();
      setSelectedContributionId(null);
      setSuccessMessage(nextValue ? 'La contribution est maintenant disponible dans les archives membres.' : 'La contribution a été retirée des archives membres.');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de modifier les archives.');
    }
  };

  const startEditing = (contribution: Contribution) => {
    const document = getContributionEditorDocument(contribution.content);
    setSelectedContributionId(contribution.id);
    setEditingContributionId(contribution.id);
    setEditingTitle(contribution.title);
    setEditingDocument(document);
    setSavedEditingSnapshot(JSON.stringify({ title: contribution.title, document }));
    setEditingHasBeenSaved(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const cancelEditing = () => {
    setEditingContributionId(null);
    setEditingTitle('');
    setEditingDocument(EMPTY_CONTRIBUTION_DOCUMENT);
    setSavedEditingSnapshot('');
    setEditingHasBeenSaved(false);
  };

  const updateEditingTitle = (value: string) => {
    setEditingTitle(value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const updateEditingDocument = (document: JSONContent) => {
    setEditingDocument(document);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const saveEdits = async (event: React.FormEvent<HTMLFormElement>, contribution: Contribution) => {
    event.preventDefault();
    if (!editingTitle.trim() || !getContributionPlainText(editingDocument)) {
      setErrorMessage('Le titre et le texte de la contribution sont obligatoires.');
      return;
    }

    setEditSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiRequest(`/api/admin/contributions/${contribution.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editingTitle,
          content: encodeContributionDocument(editingDocument),
        }),
      });
      cancelEditing();
      setSelectedContributionId(null);
      setSuccessMessage('C’est enregistré. La contribution reste suspendue jusqu’à sa réactivation.');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible d’enregistrer les modifications.');
    } finally {
      setEditSaving(false);
    }
  };

  const deleteContribution = async (contribution: Contribution) => {
    if (!window.confirm(`Supprimer définitivement la contribution « ${contribution.title} » et son fichier joint ?`)) {
      return;
    }
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await apiRequest(`/api/admin/contributions/${contribution.id}`, { method: 'DELETE' });
      if (editingContributionId === contribution.id) {
        cancelEditing();
      }
      if (selectedContributionId === contribution.id) setSelectedContributionId(null);
      setSuccessMessage('La contribution a été supprimée.');
      await loadData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de supprimer la contribution.');
    }
  };

  const refreshManually = async () => {
    setRefreshing(true);
    setErrorMessage('');
    try {
      await loadData();
      setSuccessMessage('Liste des contributions actualisée.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Impossible d’actualiser les contributions.');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredContributions = contributions.filter((contribution) => {
    if (archiveFilter === 'archives') return Number(contribution.is_archive) === 1;
    if (archiveFilter === 'not_archives') return Number(contribution.is_archive) !== 1;
    return true;
  });
  const selectedContribution = filteredContributions.find((contribution) => contribution.id === selectedContributionId) ?? null;
  const hasUnsavedChanges = JSON.stringify({
    title: editingTitle,
    document: editingDocument,
  }) !== savedEditingSnapshot;

  return (
    <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Gestion des contributions / archives</h2>
          <p className="mt-1 text-xs text-slate-400">
            Créez une contribution au nom d’un membre ou de votre propre compte, modérez-la ou supprimez-la.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshManually}
          disabled={refreshing}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-amber-500 disabled:opacity-50"
        >
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {isCreating && <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-amber-500/30 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-slate-300">
            Auteur
            <select
              required
              value={authorEmail}
              onChange={(event) => setAuthorEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.email}{user.email.toLowerCase() === currentAdminEmail.toLowerCase() ? ' (vous)' : ''}
                  {user.is_active === true || user.is_active === 1 ? '' : ' — compte désactivé'}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold text-slate-300">
            Titre
            <input
              required
              maxLength={255}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>
        <div className="space-y-1 text-xs font-semibold text-slate-300">
          <label>Texte de la contribution {!file && '(obligatoire sans fichier joint)'}</label>
          <ContributionRichTextEditor
            key={contentEditorKey}
            content={contentDocument}
            onChange={setContentDocument}
            disabled={saving}
          />
          <span className="block font-normal text-slate-400">
            {file
              ? 'Le PDF est transcrit localement avant envoi; votre texte mis en forme sera ajouté comme description. Le document original restera joint.'
              : 'Le texte mis en forme sera visible sur le site après validation. Un PDF de la contribution sera aussi créé automatiquement.'}
          </span>
        </div>
        <label className="block space-y-1 text-xs font-semibold text-slate-300">
          Fichier PDF ou photo (facultatif, 8 Mo maximum)
          <input
            key={fileSelectionKey}
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={saving}
            className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:font-semibold file:text-slate-950"
          />
        </label>
        <button
          type="submit"
          disabled={saving || users.length === 0}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
        >
          {saving ? 'Création...' : 'Créer en attente de validation'}
        </button>
        <button type="button" onClick={() => setIsCreating(false)} disabled={saving} className="ml-2 rounded-lg border border-slate-700 px-4 py-2 text-sm">Annuler</button>
      </form>}

      {processingMessage && (
        <p role="status" className="text-sm text-amber-200">
          {processingMessage} Le document est traité dans ce navigateur et n’est pas envoyé à un service OCR.
        </p>
      )}

      {(errorMessage || successMessage) && (
        <p role={errorMessage ? 'alert' : 'status'} className={`text-sm ${errorMessage ? 'text-rose-300' : 'text-emerald-300'}`}>
          {errorMessage || successMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setArchiveFilter('all')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${archiveFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'border border-slate-700 text-slate-300'}`}>Toutes les contributions</button>
        <button type="button" onClick={() => setArchiveFilter('archives')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${archiveFilter === 'archives' ? 'bg-amber-500 text-slate-950' : 'border border-slate-700 text-slate-300'}`}>Archives membres</button>
        <button type="button" onClick={() => setArchiveFilter('not_archives')} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${archiveFilter === 'not_archives' ? 'bg-amber-500 text-slate-950' : 'border border-slate-700 text-slate-300'}`}>Sans archive</button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Chargement des contributions...</p>
      ) : filteredContributions.length === 0 ? (
        <p className="text-sm text-slate-400">Aucune contribution pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {filteredContributions.map((contribution) => (
            <li key={contribution.id}>
              <button
                type="button"
                onClick={() => {
                  cancelEditing();
                  setSelectedContributionId(contribution.id);
                  setIsCreating(false);
                }}
                aria-pressed={selectedContributionId === contribution.id}
                className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-left ${
                  selectedContributionId === contribution.id ? 'border-amber-500 bg-slate-800' : 'border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <span>
                  <strong className="block text-sm">{contribution.title}</strong>
                  <span className="mt-1 block text-xs text-slate-400">{contribution.author_email || 'Auteur non précisé'}</span>
                </span>
                <span className="text-xs text-slate-300">{statusLabels[contribution.status]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedContribution && (
        <div className="space-y-4 rounded-xl border border-amber-500/30 bg-slate-950 p-4">
          {editingContributionId === selectedContribution.id ? (
            <form onSubmit={(event) => saveEdits(event, selectedContribution)} className="space-y-3" aria-label={`Modifier ${selectedContribution.title}`}>
              <p className="text-xs text-amber-200">Le fichier joint est conservé. Après l’enregistrement, la contribution reste suspendue.</p>
              <label className="block space-y-1 text-xs font-semibold text-slate-300">
                Titre
                <input required maxLength={255} value={editingTitle} onChange={(event) => updateEditingTitle(event.target.value)} disabled={editSaving} className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
              </label>
              <div className="space-y-1 text-xs font-semibold text-slate-300">
                Texte de la contribution
                <ContributionRichTextEditor content={editingDocument} onChange={updateEditingDocument} disabled={editSaving} />
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={cancelEditing} disabled={editSaving} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200">Annuler</button>
                <button type="submit" disabled={editSaving || !hasUnsavedChanges || !editingTitle.trim() || !getContributionPlainText(editingDocument)} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                  {editSaving ? 'Enregistrement...' : hasUnsavedChanges ? 'Enregistrer les modifications' : editingHasBeenSaved ? 'C’est enregistré' : 'Aucune modification'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <h3 className="font-semibold">{selectedContribution.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{selectedContribution.author_email || 'Auteur non précisé'} · {statusLabels[selectedContribution.status]}</p>
                <ContributionContent content={selectedContribution.content} className="mt-3 text-sm text-slate-300" />
                {selectedContribution.file_url && <a href={selectedContribution.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-amber-300 underline">Télécharger le fichier joint</a>}
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-800 pt-3">
                <button type="button" onClick={() => { setSelectedContributionId(null); cancelEditing(); }} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs">Fermer</button>
                {selectedContribution.status === 'suspended' && <button type="button" onClick={() => startEditing(selectedContribution)} className="rounded-lg border border-amber-700 px-3 py-1.5 text-xs text-amber-300">Modifier le contenu</button>}
                <button type="button" disabled={selectedContribution.status !== 'published' && !(Number(selectedContribution.is_archive) === 1)} onClick={() => void toggleArchive(selectedContribution)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${Number(selectedContribution.is_archive) === 1 ? 'border-emerald-700 text-emerald-300 hover:bg-emerald-950' : 'border-amber-700 text-amber-300 hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-40'}`}>
                  {Number(selectedContribution.is_archive) === 1 ? 'Retirer des archives' : 'Ajouter aux archives'}
                </button>
                <select aria-label={`Statut de ${selectedContribution.title}`} value={selectedContribution.status} onChange={(event) => void updateStatus(selectedContribution, event.target.value as ContributionStatus)} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white">
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="button" onClick={() => void deleteContribution(selectedContribution)} className="rounded-lg border border-rose-800 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950">Supprimer</button>
              </div>
            </>
          )}
        </div>
      )}

      {!selectedContribution && !isCreating && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setIsCreating(true)} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950">Ajouter une contribution</button>
        </div>
      )}
    </section>
  );
}
