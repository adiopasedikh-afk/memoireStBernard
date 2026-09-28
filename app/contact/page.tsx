'use client';

import { useState } from 'react';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
            <div className="text-center mb-10">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest block mb-2">
                    Échange & Archives
                </span>
                <h1 className="text-4xl font-serif font-bold text-stone-100 mb-4">
                    Nous Contacter
                </h1>
                <p className="text-slate-400 text-sm">
                    Pour toute contribution d'archive, témoignage, demande de presse ou renseignement.
                </p>
            </div>

            {submitted ? (
                <div className="bg-emerald-950/40 border border-emerald-800 p-8 rounded-3xl text-center space-y-3">
                    <span className="text-4xl">✉️</span>
                    <h3 className="text-lg font-bold text-emerald-300">Message envoyé avec succès !</h3>
                    <p className="text-xs text-slate-300">
                        Merci pour votre contribution. L'équipe de l'association vous répondra dans les plus brefs délais.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Nom complet</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                            placeholder="Votre nom"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse e-mail</label>
                        <input
                            type="email"
                            required
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                            placeholder="votre.email@exemple.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Sujet</label>
                        <select className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500">
                            <option value="archive">Contribution d'archive / Photo / Vidéo</option>
                            <option value="temoignage">Proposer un témoignage</option>
                            <option value="presse">Demande de presse ou média</option>
                            <option value="autre">Autre demande</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
                        <textarea
                            rows={4}
                            required
                            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                            placeholder="Votre message..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition shadow-lg text-sm cursor-pointer"
                    >
                        Envoyer le message
                    </button>
                </form>
            )}
        </main>
    );
}