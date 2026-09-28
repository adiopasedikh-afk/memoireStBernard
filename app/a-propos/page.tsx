'use client';

export default function AProposPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest block mb-2">
                    Mémoire, Transmission & Solidarité
                </span>
                <h1 className="text-4xl font-serif font-bold text-stone-100 mb-4">
                    À Propos du Projet
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Un espace numérique dédié à la conservation et au partage de l'histoire des luttes des Sans-Papiers de Saint-Bernard et du quartier de la Goutte d'Or (Paris 18ᵉ).
                </p>
            </div>

            <div className="space-y-8 text-slate-300 text-sm leading-relaxed bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
                <div>
                    <h2 className="text-xl font-serif font-bold text-amber-400 mb-3">Notre Démarche Mémorielle</h2>
                    <p>
                        Créé à l'occasion des 30 ans des événements du 23 août 1996, ce site vise à préserver la mémoire collective de l'évacuation de l'église Saint-Bernard de la Chapelle. Il rassemble des archives publiques, des chronologies historiques et des témoignages des acteurs de l'époque.
                    </p>
                </div>

                <div className="border-t border-slate-800 pt-6">
                    <h2 className="text-xl font-serif font-bold text-amber-400 mb-3">L'Ancrage Territorial</h2>
                    <p>
                        Ancré dans le 18ᵉ arrondissement de Paris, le projet met en lumière l'élan de fraternité populaire des habitants, des commerçants et des paroissiens de la Goutte d'Or face à la précarité juridique des travailleurs sans-papiers.
                    </p>
                </div>

                <div className="border-t border-slate-800 pt-6">
                    <h2 className="text-xl font-serif font-bold text-amber-400 mb-3">Accès Ouvert & Éducatif</h2>
                    <p>
                        L'ensemble des documents présentés dans la Galerie des Glaces et la section Destins est mis à disposition dans un cadre pédagogique, d'information citoyenne et de recherche historique.
                    </p>
                </div>
            </div>
        </main>
    );
}