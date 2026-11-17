'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, getApiBaseUrl } from '@/app/lib/api';

interface MemberMessage { id: string; email: string; subject: string; message: string; status: 'unread' | 'read'; created_at: string }
interface MemberUpload { id: string; email: string; title: string; original_filename: string; mime_type: string; file_size: number; status: 'new' | 'reviewed'; created_at: string }

export default function MemberPrivateInbox() {
  const [messages, setMessages] = useState<MemberMessage[]>([]);
  const [uploads, setUploads] = useState<MemberUpload[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const [messageResult, uploadResult] = await Promise.all([
        apiRequest<{ data: MemberMessage[] }>('/api/admin/member/messages'),
        apiRequest<{ data: MemberUpload[] }>('/api/admin/member/uploads'),
      ]);
      setMessages(messageResult.data);
      setUploads(uploadResult.data);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Impossible de charger les échanges membres.'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    await apiRequest(`/api/admin/member/messages/${id}`, { method: 'PATCH' });
    await load();
  };
  const markReviewed = async (id: string) => {
    await apiRequest(`/api/admin/member/uploads/${id}`, { method: 'PATCH' });
    await load();
  };
  const download = async (id: string, name: string) => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/member/uploads/${id}/download`, { credentials: 'include' });
    if (!response.ok) throw new Error('Le téléchargement a échoué.');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = name;
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Messages et fichiers privés des membres</h2><button type="button" onClick={load} className="rounded-lg border px-3 py-2 text-xs font-bold">Actualiser</button></div>
    {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <div><h3 className="text-sm font-bold">Messages ({messages.length})</h3><div className="mt-2 space-y-2">
        {messages.map((item) => <article key={item.id} className="rounded-xl border p-3 text-sm"><div className="flex justify-between gap-2"><strong>{item.subject}</strong><span className="text-xs text-slate-500">{item.status}</span></div><p className="mt-1 text-xs text-slate-600">{item.email} — {new Date(item.created_at).toLocaleString('fr-FR')}</p><p className="mt-2 whitespace-pre-wrap">{item.message}</p>{item.status === 'unread' && <button onClick={() => markRead(item.id)} className="mt-3 rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Marquer lu</button>}</article>)}
        {!messages.length && <p className="text-sm text-slate-500">Aucun message reçu.</p>}
      </div></div>
      <div><h3 className="text-sm font-bold">Fichiers ({uploads.length})</h3><div className="mt-2 space-y-2">
        {uploads.map((item) => <article key={item.id} className="rounded-xl border p-3 text-sm"><div className="flex justify-between gap-2"><strong>{item.title}</strong><span className="text-xs text-slate-500">{item.status}</span></div><p className="mt-1 text-xs text-slate-600">{item.email} — {item.original_filename} — {Math.ceil(item.file_size / 1024)} Ko</p><div className="mt-3 flex gap-2"><button onClick={() => download(item.id, item.original_filename)} className="rounded bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-800">Télécharger</button>{item.status === 'new' && <button onClick={() => markReviewed(item.id)} className="rounded bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Marquer revu</button>}</div></article>)}
        {!uploads.length && <p className="text-sm text-slate-500">Aucun fichier reçu.</p>}
      </div></div>
    </div>
  </section>;
}
