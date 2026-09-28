'use client';

export default function UploadPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-serif text-slate-100">📤 Uploader des Archives</h1>
                <p className="text-sm text-slate-400">Déposez un fichier. Seul l'administrateur aura accès à ce dossier.</p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-slate-300 text-sm">
                    [Lien 2 OK] Module d'upload de fichiers réservé à l'administrateur.
                </p>
            </div>
        </div>
    );
}