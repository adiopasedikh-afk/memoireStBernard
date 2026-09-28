'use client';

const PORTRAITS = [
    {
        name: "Madjiguène Cissé",
        role: "Porte-parole emblématique des Sans-Papiers de Saint-Bernard",
        bio: "Pionnière de l'auto-organisation des femmes et des travailleurs sans-papiers, elle a donné une voix internationale au mouvement de 1996.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop"
    },
    {
        name: "Père Henri Coindé",
        role: "Curé de la paroisse Saint-Bernard (1996)",
        bio: "Acteur de paix et de conscience, il a ouvert les portes de l'église et défendu le droit d'asile au péril de ses relations avec l'administration.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop"
    },
    {
        name: "Ababacar Diop",
        role: "Porte-parole du collectif de Saint-Bernard",
        bio: "Auteur et figure de la lutte, il a défendu la régularisation des 300 et documenté les coulisses du mouvement.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop"
    }
];

export default function DestinsPage() {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest block mb-2">
                    Visages, Voix et Engagements
                </span>
                <h1 className="text-4xl font-serif font-bold text-stone-100 mb-4">
                    Destins & Parcours
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Portrait des acteurs, porte-paroles, anonymes et soutiens qui ont façonné l'histoire de Saint-Bernard et des collectifs de sans-papiers à travers la France.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {PORTRAITS.map((p, idx) => (
                    <div
                        key={idx}
                        className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-amber-500/40 transition shadow-xl"
                    >
                        <div>
                            <div className="h-48 w-full rounded-xl overflow-hidden mb-5 bg-slate-950">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-amber-400 mb-1">{p.name}</h3>
                            <p className="text-xs font-semibold text-slate-300 mb-3">{p.role}</p>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">{p.bio}</p>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}