'use client';

import { useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

export default function GoutteDorPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [authorEmail, setAuthorEmail] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const supabase = createClient();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `contributions/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('contributions') // ou un bucket 'contributions'
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('contributions')
                .getPublicUrl(filePath);

            setFileUrl(publicUrlData.publicUrl);
        } catch (err: any) {
            alert(`Erreur d'upload : ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmitContribution = async (e: React.FormEvent) => {
        e.preventDefault();

        const { error } = await supabase.from('contributions_goutte_dor').insert([
            {
                title,
                content,
                author_email: authorEmail,
                file_url: fileUrl,
                status: 'pending', // Visible uniquement par l'admin jusqu'à validation
            },
        ]);

        if (error) {
            alert(`Erreur : ${error.message}`);
        } else {
            setSubmitted(true);
            setTitle('');
            setContent('');
            setAuthorEmail('');
            setFileUrl('');
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
            {/* En-tête */}
            <div className="text-center space-y-4">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest block">
                    Histoire Populaire & Solidarités
                </span>
                <h1 className="text-4xl font-serif font-bold text-stone-100">
                    La Goutte d'Or : Quartier de Luttes & de Mémoires
                </h1>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                    Un panorama des mobilisations populaires, de l'accueil des personnes immigrées et de la solidarité ouvrière qui ont façonné le 18ᵉ arrondissement.
                </p>
            </div>

            {/* Récit historique / Chronologie */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                <h2 className="text-xl font-serif font-bold text-amber-400">Repères Historiques</h2>
                <div className="space-y-6 text-sm text-slate-300">
                    <div className="border-l-2 border-amber-500/50 pl-4 space-y-1">
                        <span className="text-xs font-bold text-amber-400">Années 1950 - 1970</span>
                        <h3 className="font-bold text-slate-100">L'ancrage des foyers de travailleurs migrants</h3>
                        <p className="text-slate-400">
                            Installation des premiers foyers de travailleurs africains et nord-africains. Premières grèves des loyers SONACOTRA et structuration des solidarités de quartier.
                        </p>
                    </div>

                    <div className="border-l-2 border-amber-500/50 pl-4 space-y-1">
                        <span className="text-xs font-bold text-amber-400">23 Août 1996</span>
                        <h3 className="font-bold text-slate-100">L'évacuation de l'église Saint-Bernard</h3>
                        <p className="text-slate-400">
                            Épisode fondateur de la lutte des Sans-Papiers. L'intervention policière à la hache suscite une vague d'émotion nationale et un soutien massif des habitants du 18ᵉ.
                        </p>
                    </div>
                </div>
            </div>

            {/* Formulaire de contribution pour les soutiens */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
                <div>
                    <h2 className="text-xl font-serif font-bold text-stone-100 mb-1">
                        🤝 Contribuer aux archives de la Goutte d'Or
                    </h2>
                    <p className="text-xs text-slate-400">
                        Vous possédez un document d'époque, une photo, un tract ou un témoignage ? Transmettez-le à l'association. Votre envoi sera transmis confidentiellement à l'administrateur.
                    </p>
                </div>

                {submitted ? (
                    <div className="bg-emerald-950/40 border border-emerald-800 p-6 rounded-2xl text-center space-y-2">
                        <span className="text-2xl">✅</span>
                        <h3 className="font-bold text-emerald-300">Contribution transmise !</h3>
                        <p className="text-xs text-slate-400">
                            Merci pour votre aide. L'administrateur examinera votre document dans le dossier d'archivage.
                        </p>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="text-xs text-amber-400 underline mt-2"
                        >
                            Envoyer une autre contribution
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmitContribution} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Titre ou sujet du document</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="ex: Tract du comité de soutien 1996"
                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Votre e-mail (facultatif)</label>
                                <input
                                    type="email"
                                    value={authorEmail}
                                    onChange={(e) => setAuthorEmail(e.target.value)}
                                    placeholder="pour vous recontacter si besoin"
                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Témoignage</label>
                            <textarea
                                rows={3}
                                required
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Racontez l'histoire liée à ce document..."
                                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Fichier / Photo d'archive</label>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                            />
                            {uploading && <p className="text-xs text-amber-400 mt-1">Envoi du fichier...</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full py-3 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition shadow-lg text-xs cursor-pointer disabled:opacity-50"
                        >
                            💾 Transmettre la contribution à l'administrateur
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}