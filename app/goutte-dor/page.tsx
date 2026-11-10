'use client';

import { useState } from 'react';
import { apiRequest } from '@/app/lib/api';
import { createContributionPdf } from '@/app/lib/contributionPdf';
import { extractContributionPdfText } from '@/app/lib/extractContributionPdf';

export default function GoutteDorPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [authorEmail, setAuthorEmail] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [fileSelectionKey, setFileSelectionKey] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const handleSubmitContribution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file && content.trim() === '') {
            setErrorMessage('Saisissez un texte ou joignez un fichier.');
            return;
        }
        setUploading(true);
        setErrorMessage('');
        setProcessingMessage('');
        try {
            let contributionContent = content.trim();
            if (file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf')) {
                const extractedText = await extractContributionPdfText(file, setProcessingMessage);
                contributionContent = [contributionContent, extractedText].filter(Boolean).join('\n\n');
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', contributionContent);
            formData.append('author_email', authorEmail);
            if (file) {
                formData.append('file', file);
            } else if (content.trim() !== '') {
                formData.append('file', createContributionPdf(title, content));
            }
            await apiRequest('/api/contributions', {
                method: 'POST',
                body: formData,
            });
            setSubmitted(true);
            setTitle('');
            setContent('');
            setAuthorEmail('');
            setFile(null);
            setFileSelectionKey((key) => key + 1);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Impossible d’envoyer la contribution.');
        } finally {
            setProcessingMessage('');
            setUploading(false);
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
                    La Goutte d&apos;Or : Quartier de Luttes & de Mémoires
                </h1>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                    Un panorama des mobilisations populaires, de l&apos;accueil des personnes immigrées et de la solidarité ouvrière qui ont façonné le 18ᵉ arrondissement.
                </p>
            </div>

            {/* Récit historique / Chronologie */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                <h2 className="text-xl font-serif font-bold text-amber-400">Repères Historiques</h2>
                <div className="space-y-6 text-sm text-slate-300">
                    <div className="border-l-2 border-amber-500/50 pl-4 space-y-1">
                        <span className="text-xs font-bold text-amber-400">Années 1950 - 1970</span>
                        <h3 className="font-bold text-slate-100">L&apos;ancrage des foyers de travailleurs migrants</h3>
                        <p className="text-slate-400">
                            Installation des premiers foyers de travailleurs africains et nord-africains. Premières grèves des loyers SONACOTRA et structuration des solidarités de quartier.
                        </p>
                        <a
                            href="https://fr.wikipedia.org/wiki/SONACOTRA"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block pt-2 text-xs font-semibold text-amber-400 underline hover:text-amber-300"
                        >
                            En savoir plus sur les foyers SONACOTRA ↗
                        </a>
                    </div>

                    <div className="border-l-2 border-amber-500/50 pl-4 space-y-1">
                        <span className="text-xs font-bold text-amber-400">23 Août 1996</span>
                        <h3 className="font-bold text-slate-100">L&apos;évacuation de l&apos;église Saint-Bernard</h3>
                        <p className="text-slate-400">
                            Épisode fondateur de la lutte des Sans-Papiers. L&apos;intervention policière à la hache suscite une vague d&apos;émotion nationale et un soutien massif des habitants du 18ᵉ.
                        </p>
                        <a
                            href="https://fr.wikipedia.org/wiki/%C3%89glise_Saint-Bernard_de_la_Chapelle"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block pt-2 text-xs font-semibold text-amber-400 underline hover:text-amber-300"
                        >
                            En savoir plus sur Saint-Bernard en 1996 ↗
                        </a>
                    </div>
                </div>
            </div>

            <section
                className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
                aria-labelledby="salle-saint-bruno-title"
            >
                <h2 id="salle-saint-bruno-title" className="text-xl font-serif font-bold text-amber-400">
                    La Salle Saint-Bruno, lieu d’accueil et de vie associative
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    La Salle Saint-Bruno accueille les résidents et le tissu associatif de la Goutte d’Or dans ses locaux.
                </p>
                <a
                    href="https://www.sallesaintbruno.org/"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-amber-400 underline hover:text-amber-300"
                >
                    Découvrir le site de la Salle Saint-Bruno ↗
                </a>
            </section>

            {/* Formulaire de contribution pour les soutiens */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
                <div>
                    <h2 className="text-xl font-serif font-bold text-stone-100 mb-1">
                        🤝 Contribuer aux archives de la Goutte d&apos;Or
                    </h2>
                    <p className="text-xs text-slate-400">
                        Vous possédez un document d&apos;époque, une photo, un tract ou un témoignage ? Transmettez-le à l&apos;association. Votre contribution reste privée pendant son examen. Si elle est publiée, son texte et son fichier seront visibles publiquement sur ce site.
                    </p>
                </div>

                {submitted ? (
                    <div className="bg-emerald-950/40 border border-emerald-800 p-6 rounded-2xl text-center space-y-2">
                        <span className="text-2xl">✅</span>
                        <h3 className="font-bold text-emerald-300">Contribution transmise !</h3>
                        <p className="text-xs text-slate-400">
                            Merci pour votre aide. Votre contribution reste privée jusqu&apos;à sa validation par l&apos;administrateur.
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
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Description / Témoignage {!file && '(obligatoire sans fichier joint)'}
                            </label>
                            <textarea
                                rows={3}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                aria-required={!file}
                                placeholder="Racontez l&apos;histoire liée à ce document..."
                                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                            />
                            <p className="mt-1 text-xs text-slate-400">
                                {file
                                    ? 'Le texte du PDF sera transcrit dans ce navigateur avant envoi. Votre description, si vous en ajoutez une, sera placée avant la transcription.'
                                    : 'Si vous saisissez un texte sans joindre de fichier, un PDF mis en page sera créé automatiquement.'}
                            </p>
                        </div>

                        {processingMessage && (
                            <p role="status" className="text-xs text-amber-200">
                                {processingMessage} Le document est traité dans ce navigateur et n’est pas envoyé à un service OCR.
                            </p>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                                Fichier / Photo d&apos;archive (8 Mo maximum)
                            </label>
                            <input
                                key={fileSelectionKey}
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                disabled={uploading}
                                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                            />
                            {file && <p className="mt-1 text-xs text-slate-400">{file.name}</p>}
                        </div>

                        {errorMessage && (
                            <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300">
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={uploading}
                            className="w-full py-3 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition shadow-lg text-xs cursor-pointer disabled:opacity-50"
                        >
                            💾 Transmettre la contribution à l&apos;administrateur
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}