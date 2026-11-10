'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/app/lib/api';

export default function DonPage() {
    const [selectedAmount, setSelectedAmount] = useState<number>(10);
    const [customAmount, setCustomAmount] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const value = params.get('payment') ?? '';
        const sessionId = params.get('session_id') ?? '';
        if (value === 'success' || value.startsWith('success?')) {
            setPaymentStatus('success');
            if (sessionId) {
                setVerificationStatus('verifying');
                apiRequest<{ verified: boolean }>('/api/stripe/verify-session', {
                    method: 'POST',
                    body: JSON.stringify({ session_id: sessionId }),
                }).then((result) => setVerificationStatus(result.verified ? 'verified' : 'failed'))
                    .catch(() => setVerificationStatus('failed'));
            } else {
                setVerificationStatus('failed');
            }
        }
        if (value === 'cancelled' || value.startsWith('cancelled?')) setPaymentStatus('cancelled');
    }, []);

    const amount = customAmount !== '' ? Number(customAmount) : selectedAmount;

    const donate = async () => {
        setErrorMessage('');
        if (!Number.isFinite(amount) || amount < 1 || amount > 999999.99) {
            setErrorMessage('Choisissez un montant entre 1 et 999 999,99 €.');
            return;
        }
        setLoading(true);
        try {
            const result = await apiRequest<{ url: string }>('/api/stripe/checkout', { method: 'POST', body: JSON.stringify({ amount }) });
            window.location.assign(result.url);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Impossible d’ouvrir le paiement Stripe.');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold font-serif text-slate-100">💳 Faire un don</h1><p className="text-sm text-slate-400">Soutenez les actions de l’association par un paiement bancaire sécurisé Stripe.</p></div>
            {paymentStatus === 'success' && <p role="status" className="rounded-xl border border-emerald-700 bg-emerald-950 p-4 text-sm text-emerald-200">Merci pour votre don. Votre paiement a été confirmé par Stripe.</p>}
            {verificationStatus === 'verifying' && <p role="status" className="rounded-xl border border-sky-700 bg-sky-950 p-4 text-sm text-sky-200">Vérification du paiement et comptabilisation en cours…</p>}
            {verificationStatus === 'verified' && <p role="status" className="rounded-xl border border-emerald-700 bg-emerald-950 p-4 text-sm text-emerald-200">Le don est enregistré dans l’administration.</p>}
            {verificationStatus === 'failed' && <p role="alert" className="rounded-xl border border-rose-700 bg-rose-950 p-4 text-sm text-rose-200">La comptabilisation automatique a échoué. Le don reste visible uniquement une fois Stripe et le serveur synchronisés.</p>}
            {paymentStatus === 'cancelled' && <p role="status" className="rounded-xl border border-amber-700 bg-amber-950 p-4 text-sm text-amber-200">Le paiement a été annulé. Aucun don n’a été enregistré.</p>}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center"><div className="mx-auto max-w-md space-y-4"><p className="text-sm text-slate-300">Votre soutien aide à préserver et transmettre les archives de Saint-Bernard.</p><button type="button" onClick={() => { setOpen(true); setPaymentStatus(null); setErrorMessage(''); }} className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-400">Choisir un montant et faire un don</button></div></div>
            {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="don-modal-title"><div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="don-modal-title" className="text-xl font-bold text-white">Votre don</h2><p className="mt-1 text-xs text-slate-400">Paiement sécurisé hébergé par Stripe.</p></div><button type="button" aria-label="Fermer" onClick={() => !loading && setOpen(false)} className="text-xl text-slate-400 hover:text-white">×</button></div>
            <div className="mt-5 grid grid-cols-3 gap-2">{[10,20,50].map((value)=><button key={value} type="button" disabled={loading} onClick={()=>{setSelectedAmount(value);setCustomAmount('');setErrorMessage('')}} className={`rounded-lg border px-3 py-3 text-sm font-bold ${customAmount === '' && selectedAmount === value ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-700 bg-slate-950 text-slate-200'}`}>{value} €</button>)}</div>
            <label className="mt-4 block text-sm text-slate-300">Autre montant (€)<input type="number" min="1" max="999999.99" step="0.01" value={customAmount} disabled={loading} onChange={(event)=>setCustomAmount(event.target.value)} placeholder="Ex. 35" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
            {errorMessage && <p role="alert" className="mt-4 rounded-lg border border-rose-800 bg-rose-950 p-3 text-sm text-rose-200">{errorMessage}</p>}<button type="button" onClick={donate} disabled={loading} className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? 'Ouverture de Stripe...' : `Payer ${Number.isFinite(amount) ? amount.toLocaleString('fr-FR', { style:'currency', currency:'EUR'}) : ''}`}</button></div></div>}
        </div>
    );
}