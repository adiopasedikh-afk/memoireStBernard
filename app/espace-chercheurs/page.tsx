export default function EspaceChercheursPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-white p-8 max-w-5xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-amber-500 border-b border-slate-800 pb-4">
                Espace chercheurs & étudiants
            </h1>
            <p className="text-slate-300 leading-relaxed">
                Accès aux documents d'archives numérisés, dossiers académiques et ressources bibliographiques pour les travaux universitaires.
            </p>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
                <h2 className="text-lg font-semibold">Demande d'accès aux fonds documentaires</h2>
                <p className="text-xs text-slate-400">
                    Pour toute consultation spécifique ou travail de recherche, vous pouvez adresser une demande à notre équipe d'archivistes.
                </p>
            </div>
        </main>
    );
}