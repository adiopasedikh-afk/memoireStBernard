export default function ChronologieLoisPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-white p-8 max-w-5xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-amber-500 border-b border-slate-800 pb-4">
                Chronologie des lois Pasqua-Debré
            </h1>
            <p className="text-slate-300 leading-relaxed">
                Repères chronologiques et textes législatifs relatifs aux lois sur le séjour des étrangers en France (1993 - 1997).
            </p>

            <div className="space-y-4 pt-4">
                <div className="border-l-2 border-amber-500 pl-4 py-2">
                    <span className="text-amber-500 font-bold text-sm">1993</span>
                    <h3 className="font-semibold">Lois Pasqua</h3>
                    <p className="text-xs text-slate-400">Réforme du droit d'asile et du séjour des étrangers.</p>
                </div>
                <div className="border-l-2 border-amber-500 pl-4 py-2">
                    <span className="text-amber-500 font-bold text-sm">1997</span>
                    <h3 className="font-semibold">Loi Debré</h3>
                    <p className="text-xs text-slate-400">Durcissement des conditions d'entrée et de séjour.</p>
                </div>
            </div>
        </main>
    );
}