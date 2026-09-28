'use client';

export default function ContactAdminPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-serif text-slate-100">✉️ Envoyer un Message à l'Admin</h1>
                <p className="text-sm text-slate-400">Transmettez votre message directement à l'administrateur du site.</p>
            </div>

            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-slate-300 text-sm">
                    [Lien 4 OK] Formulaire d'envoi de message à l'administrateur.
                </p>
            </div>
        </div>
    );
}