export default function EgliseSaintBernardPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
            <div>
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest block mb-2">
                    Patrimoine & Histoire
                </span>
                <h1 className="text-4xl font-serif font-bold text-stone-100">
                    L'Église Saint-Bernard de la Goutte d'Or
                </h1>
            </div>

            {/* PHOTO DE L'ÉGLISE */}
            <div className="relative h-80 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <img
                    src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1200&auto=format&fit=crop"
                    alt="Église Saint-Bernard de la Goutte d'Or"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* HISTORIQUE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4 text-slate-300 text-sm leading-relaxed">
                <h2 className="text-xl font-serif font-bold text-amber-400">Historique de l'édifice</h2>
                <p>
                    Construite au XIXᵉ siècle dans un style néo-gothique au cœur du quartier de la Goutte d'Or (Paris 18ᵉ), l'Église Saint-Bernard a toujours été un point d'ancrage spirituel et social majeur du quartier.
                </p>
                <p>
                    En août 1996, elle devient un symbole international du droit d'asile et de la dignité humaine lors de l'occupation par les 300 personnes sans-papiers, soutenues par le Père Henri Coindé et de nombreuses personnalités.
                </p>
            </div>
        </main>
    );
}