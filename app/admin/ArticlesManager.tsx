'use client';

import { useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

interface Article {
    id: string;
    title: string;
    author_email: string;
    created_at: string;
    status: 'pending' | 'approved' | 'rejected';
    content?: string;
}

export function ArticlesManager({ initialArticles }: { initialArticles: Article[] }) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Champs de formulaire pour Création / Édition
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formAuthor, setFormAuthor] = useState('');
    const [formStatus, setFormStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');

    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    // --- 1. CRÉATION D'UN RÉCIT ---
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const newArticle = {
            title: formTitle,
            content: formContent,
            author_email: formAuthor || 'adiopasedikh@gmail.com',
            status: formStatus,
        };

        const { data, error } = await supabase.from('articles').insert([newArticle]).select();

        if (!error && data) {
            setArticles((prev) => [data[0], ...prev]);
            setIsCreating(false);
            resetForm();
        } else {
            alert("Erreur lors de la création du récit : " + (error?.message || 'Inconnue'));
        }
        setLoading(false);
    };

    // --- 2. ÉDITION D'UN RÉCIT ---
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingArticle) return;
        setLoading(true);

        const updatedData = {
            title: formTitle,
            content: formContent,
            author_email: formAuthor,
            status: formStatus,
        };

        const { error } = await supabase
            .from('articles')
            .update(updatedData)
            .eq('id', editingArticle.id);

        if (!error) {
            setArticles((prev) =>
                prev.map((art) => (art.id === editingArticle.id ? { ...art, ...updatedData } : art))
            );
            setEditingArticle(null);
            resetForm();
        } else {
            alert("Erreur lors de la modification : " + (error?.message || 'Inconnue'));
        }
        setLoading(false);
    };

    // --- 3. SUPPRESSION D'UN RÉCIT ---
    const handleDelete = async (articleId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement ce récit ?")) return;

        const { error } = await supabase.from('articles').delete().eq('id', articleId);

        if (!error) {
            setArticles((prev) => prev.filter((art) => art.id !== articleId));
            if (selectedArticle?.id === articleId) setSelectedArticle(null);
        } else {
            alert("Erreur lors de la suppression : " + (error?.message || 'Inconnue'));
        }
    };

    // --- 4. CHANGEMENT DE STATUT RAPIDE (Valider / Refuser) ---
    const handleQuickStatus = async (articleId: string, newStatus: 'approved' | 'rejected') => {
        const { error } = await supabase
            .from('articles')
            .update({ status: newStatus })
            .eq('id', articleId);

        if (!error) {
            setArticles((prev) =>
                prev.map((art) => (art.id === articleId ? { ...art, status: newStatus } : art))
            );
        }
    };

    // --- 5. INJECTION DE DONNÉES DE TEST ---
    const handleSeedDemoData = async () => {
        setLoading(true);
        const demoArticles = [
            {
                title: "La Fête du Village en 1958",
                author_email: "jean.dupont@gmail.com",
                content: "C'était un dimanche ensoleillé de juillet. Tout le village de Saint-Bernard s'était réuni sur la place centrale...",
                status: "pending"
            },
            {
                title: "Histoire du Vieux Moulin de Saint-Bernard",
                author_email: "marie.laurent@gmail.com",
                content: "Construit au début du XIXe siècle, le moulin à eau approvisionnait toute la commune en farine...",
                status: "approved"
            }
        ];

        const { data, error } = await supabase.from('articles').insert(demoArticles).select();

        if (!error && data) {
            setArticles((prev) => [...data, ...prev]);
        } else {
            // Si la table n'a pas toutes les colonnes ou échoue, injection locale
            setArticles([
                {
                    id: 'demo-1',
                    title: "La Fête du Village en 1958",
                    author_email: "jean.dupont@gmail.com",
                    created_at: new Date().toISOString(),
                    content: "C'était un dimanche ensoleillé de juillet. Tout le village de Saint-Bernard s'était réuni sur la place centrale...",
                    status: "pending"
                },
                {
                    id: 'demo-2',
                    title: "Histoire du Vieux Moulin",
                    author_email: "marie.laurent@gmail.com",
                    created_at: new Date().toISOString(),
                    content: "Construit au début du XIXe siècle, le moulin à eau approvisionnait toute la commune en farine...",
                    status: "approved"
                }
            ]);
        }
        setLoading(false);
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreating(true);
    };

    const openEditModal = (article: Article) => {
        setEditingArticle(article);
        setFormTitle(article.title || '');
        setFormContent(article.content || '');
        setFormAuthor(article.author_email || '');
        setFormStatus(article.status || 'approved');
    };

    const resetForm = () => {
        setFormTitle('');
        setFormContent('');
        setFormAuthor('adiopasedikh@gmail.com');
        setFormStatus('approved');
    };

    const filteredArticles = articles.filter((art) => {
        if (filterStatus === 'all') return true;
        return art.status === filterStatus;
    });

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* HEADER DE LA TABLE */}
            <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span>📝</span> Gestion & Modération des Récits
                    </h2>
                    <p className="text-xs text-slate-500">
                        Créez, éditez, validez ou supprimez les histoires soumises.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* FILTRES */}
                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-3 py-1.5 rounded-lg transition ${filterStatus === 'all'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Tous ({articles.length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`px-3 py-1.5 rounded-lg transition ${filterStatus === 'pending'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            À valider ({articles.filter((a) => a.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setFilterStatus('approved')}
                            className={`px-3 py-1.5 rounded-lg transition ${filterStatus === 'approved'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Publiés ({articles.filter((a) => a.status === 'approved').length})
                        </button>
                    </div>

                    {/* BOUTON CRÉER UN RÉCIT */}
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
                    >
                        ➕ Créer un Récit
                    </button>
                </div>
            </div>

            {/* CONTENU DE LA TABLE OU ÉTAT VIDE */}
            {filteredArticles.length === 0 ? (
                <div className="p-10 text-center space-y-4">
                    <p className="text-slate-500 text-sm italic">
                        Aucun récit ne correspond à ce filtre pour le moment.
                    </p>
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
                        >
                            ➕ Ajouter un premier récit
                        </button>
                        <button
                            onClick={handleSeedDemoData}
                            disabled={loading}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition"
                        >
                            ⚡ Générer 2 exemples de test
                        </button>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="py-3 px-5 font-bold">Titre du Récit</th>
                                <th className="py-3 px-5 font-bold">Auteur</th>
                                <th className="py-3 px-5 font-bold">Date</th>
                                <th className="py-3 px-5 font-bold">Statut</th>
                                <th className="py-3 px-5 font-bold text-right">Actions CRUD</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {filteredArticles.map((article) => (
                                <tr key={article.id} className="hover:bg-slate-50 transition">
                                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                                        {article.title || 'Sans titre'}
                                    </td>
                                    <td className="py-3.5 px-5 text-xs text-slate-600">
                                        {article.author_email || 'Anonyme'}
                                    </td>
                                    <td className="py-3.5 px-5 text-xs text-slate-500 font-mono">
                                        {article.created_at ? new Date(article.created_at).toLocaleDateString('fr-FR') : 'Récemment'}
                                    </td>
                                    <td className="py-3.5 px-5">
                                        {article.status === 'pending' && (
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                                ⏳ En attente
                                            </span>
                                        )}
                                        {article.status === 'approved' && (
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                ✅ Publié
                                            </span>
                                        )}
                                        {article.status === 'rejected' && (
                                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                                ❌ Refusé
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-5 text-right space-x-1.5">
                                        <button
                                            onClick={() => setSelectedArticle(article)}
                                            title="Lire"
                                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition"
                                        >
                                            👁️
                                        </button>

                                        <button
                                            onClick={() => openEditModal(article)}
                                            title="Éditer"
                                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition"
                                        >
                                            ✏️
                                        </button>

                                        {article.status !== 'approved' && (
                                            <button
                                                onClick={() => handleQuickStatus(article.id, 'approved')}
                                                title="Valider"
                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                                            >
                                                ✓
                                            </button>
                                        )}

                                        {article.status !== 'rejected' && (
                                            <button
                                                onClick={() => handleQuickStatus(article.id, 'rejected')}
                                                title="Refuser"
                                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                                            >
                                                ✕
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(article.id)}
                                            title="Supprimer"
                                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200 transition"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODALE CRÉATION / ÉDITION (CRUD) */}
            {(isCreating || editingArticle) && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-lg font-bold text-slate-900">
                                {isCreating ? '➕ Nouveau Récit' : '✏️ Éditer le Récit'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsCreating(false);
                                    setEditingArticle(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={isCreating ? handleCreate : handleUpdate} className="space-y-4 text-xs font-medium">
                            <div>
                                <label className="block text-slate-700 font-bold mb-1">Titre du Récit</label>
                                <input
                                    type="text"
                                    required
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="Ex: La fête du village en 1958"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm text-slate-800"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Auteur (E-mail)</label>
                                    <input
                                        type="email"
                                        required
                                        value={formAuthor}
                                        onChange={(e) => setFormAuthor(e.target.value)}
                                        placeholder="auteur@email.com"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 font-bold mb-1">Statut</label>
                                    <select
                                        value={formStatus}
                                        onChange={(e: any) => setFormStatus(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-slate-800"
                                    >
                                        <option value="approved">✅ Publié</option>
                                        <option value="pending">⏳ En attente</option>
                                        <option value="rejected">❌ Refusé</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">Contenu de l'histoire</label>
                                <textarea
                                    rows={6}
                                    required
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    placeholder="Rédigez ou collez l'histoire ici..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm leading-relaxed text-slate-800"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false);
                                        setEditingArticle(null);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-bold"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-sm"
                                >
                                    {loading ? 'Enregistrement...' : isCreating ? 'Créer & Publier' : 'Mettre à jour'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODALE DE LECTURE SEULE */}
            {selectedArticle && !editingArticle && !isCreating && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-slate-900">
                                    {selectedArticle.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Proposé par {selectedArticle.author_email}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
                            {selectedArticle.content || 'Aucun contenu fourni.'}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button
                                onClick={() => {
                                    const art = selectedArticle;
                                    setSelectedArticle(null);
                                    openEditModal(art);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-100 text-xs transition"
                            >
                                ✏️ Éditer ce récit
                            </button>

                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}