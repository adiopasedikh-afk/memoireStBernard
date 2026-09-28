'use client';

import { useState, useTransition } from 'react';
import { approveArticle, rejectArticle } from './actions';

interface Article {
    id: string;
    title: string;
    content: string;
    author_name?: string;
    created_at: string;
    status: string;
    image_url?: string;
}

export default function PendingArticlesTable({ articles }: { articles: Article[] }) {
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleApprove = (id: string) => {
        startTransition(async () => {
            await approveArticle(id);
            setSelectedArticle(null);
        });
    };

    const handleReject = (id: string) => {
        startTransition(async () => {
            await rejectArticle(id);
            setSelectedArticle(null);
        });
    };

    const pendingList = articles.filter((a) => a.status === 'pending' || a.status === 'draft');

    if (pendingList.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                ✨ Aucun récit en attente de modération pour le moment.
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-serif font-bold text-slate-100">
                    Récits en attente de validation ({pendingList.length})
                </h2>
            </div>

            <div className="divide-y divide-slate-800">
                {pendingList.map((article) => (
                    <div key={article.id} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-800/50 transition">
                        <div className="space-y-1 max-w-xl">
                            <h3 className="font-bold text-slate-200 text-base">{article.title}</h3>
                            <p className="text-xs text-slate-400 line-clamp-2">{article.content}</p>
                            <div className="text-[11px] text-slate-500 pt-1">
                                Auteur : <span className="text-slate-300">{article.author_name || 'Anonyme'}</span> • Soumis le {new Date(article.created_at).toLocaleDateString('fr-FR')}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setSelectedArticle(article)}
                                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                            >
                                👁️ Relire
                            </button>
                            <button
                                disabled={isPending}
                                onClick={() => handleApprove(article.id)}
                                className="px-3 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-700/50 text-xs font-semibold transition disabled:opacity-50"
                            >
                                ✅ Valider
                            </button>
                            <button
                                disabled={isPending}
                                onClick={() => handleReject(article.id)}
                                className="px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-700/50 text-xs font-semibold transition disabled:opacity-50"
                            >
                                ❌ Rejeter
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modale de relecture complète */}
            {selectedArticle && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-slate-100">{selectedArticle.title}</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Par {selectedArticle.author_name || 'Anonyme'} • {new Date(selectedArticle.created_at).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="text-slate-400 hover:text-white text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {selectedArticle.image_url && (
                            <img
                                src={selectedArticle.image_url}
                                alt={selectedArticle.title}
                                className="w-full h-64 object-cover rounded-2xl border border-slate-800"
                            />
                        )}

                        <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed border-t border-b border-slate-800/80 py-4">
                            {selectedArticle.content}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
                            >
                                Fermer
                            </button>
                            <button
                                disabled={isPending}
                                onClick={() => handleReject(selectedArticle.id)}
                                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition disabled:opacity-50"
                            >
                                Rejeter le récit
                            </button>
                            <button
                                disabled={isPending}
                                onClick={() => handleApprove(selectedArticle.id)}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition disabled:opacity-50"
                            >
                                Valider & Publier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}