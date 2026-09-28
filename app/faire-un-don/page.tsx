'use client';

import { useState } from 'react';

export default function FaireUnDonPage() {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(10);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleDonate = async () => {
        // Déterminer le montant final (soit prédéfini, soit personnalisé)
        const amountToPay = selectedAmount ?? parseFloat(customAmount);

        if (!amountToPay || amountToPay <= 0) {
            alert('Veuillez sélectionner ou saisir un montant valide.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amountToPay }),
            });

            const data = await response.json();

            if (data.url) {
                // Redirection vers la page de paiement sécurisée Stripe Checkout
                window.location.href = data.url;
            } else {
                alert(data.error || 'Une erreur est survenue.');
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert('Impossible de contacter le serveur de paiement.');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-10 p-6 border rounded-lg shadow-md bg-white">
            <h1 className="text-2xl font-bold mb-4 text-center">Faire un don</h1>
            <p className="text-gray-600 mb-6 text-center">
                Soutenez les actions de notre association.
            </p>

            {/* Choix des montants */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[10, 20, 50].map((amount) => (
                    <button
                        key={amount}
                        type="button"
                        onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount('');
                        }}
                        className={`py-2 px-4 rounded border font-semibold ${selectedAmount === amount
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                    >
                        {amount} €
                    </button>
                ))}
            </div>

            {/* Champ pour montant personnalisé */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ou saisissez un autre montant (€) :
                </label>
                <input
                    type="number"
                    min="1"
                    placeholder="Ex: 35"
                    value={customAmount}
                    onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                    }}
                    className="w-full p-2 border rounded border-gray-300"
                />
            </div>

            {/* Bouton de validation */}
            <button
                onClick={handleDonate}
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? 'Redirection vers Stripe...' : 'Faire un don par CB'}
            </button>
        </div>
    );
}