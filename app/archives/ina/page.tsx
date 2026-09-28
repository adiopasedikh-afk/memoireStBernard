export default function ArchivesInaPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-white p-8 max-w-5xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-amber-500 border-b border-slate-800 pb-4">
                Archives photographiques INA & Libres
            </h1>
            <p className="text-slate-300 leading-relaxed">
                Consultez l'ensemble de notre fonds photographique, incluant les images de l'INA et les ressources libres de droits relatives aux événements de Saint-Bernard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <h2 className="font-semibold text-lg mb-2">Fonds INA</h2>
                    <p className="text-xs text-slate-400">Archives télévisuelles et photographies sous licence de diffusion.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <h2 className="font-semibold text-lg mb-2">Archives sous licence libre</h2>
                    <p className="text-xs text-slate-400">Photographies utilisables pour les projets d'études et la presse.</p>
                </div>
            </div>
        </main>
    );
}