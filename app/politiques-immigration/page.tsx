'use client';

import { useState } from 'react';

type Era = 'all' | 'post-guerre' | 'tournant-70' | 'annees-80-90' | 'contemporain';

type TimelineEvent = {
    year: string;
    title: string;
    subtitle: string;
    era: Era;
    description: string;
    keyPoints: string[];
    impact: string;
};

const TIMELINE_EVENTS: TimelineEvent[] = [
    {
        year: '1945',
        title: 'Ordonnance du 2 novembre 1945',
        subtitle: 'Fondation du droit du séjour d’après-guerre',
        era: 'post-guerre',
        description:
            'Adoptée à la Libération sous le gouvernement provisoire du Général de Gaulle, cette ordonnance encadre l’entrée et le séjour des étrangers en France. Elle distingue le titre de travail du titre de séjour et crée les cartes de 1 an, 5 ans et 10 ans.',
        keyPoints: [
            'Création de l’Office National d’Immigration (ONI)',
            'Séparation entre l’autorisation de travail et le droit au séjour',
            'Encouragement à une immigration de reconstruction',
        ],
        impact: 'Période des « Trente Glorieuses » : fort appel à la main-d’œuvre étrangère pour la reconstruction de la France.',
    },
    {
        year: '1974',
        title: 'Suspension de l’immigration de travail',
        subtitle: 'Le tournant de la crise pétrolière',
        era: 'tournant-70',
        description:
            'Sous la présidence de Valéry Giscard d’Estaing et le gouvernement Chirac, la France décide l’arrêt officiel de l’immigration économique salariée. Le décret vise également à stopper le regroupement familial, décision suspendue ensuite par le Conseil d’État.',
        keyPoints: [
            'Arrêt du recrutement de travailleurs étrangers hors CEE',
            'Arrêt temporaire du regroupement familial (annulé en 1978 par le Conseil d’État)',
            'Mise en place de prime à la réinstallation (aide au retour)',
        ],
        impact: 'Stabilisation de la population étrangère sur place et basculement d’une immigration de travail vers une immigration d’installation familiale.',
    },
    {
        year: '1981',
        title: 'Grande Régularisation & Répression du travail clandestin',
        subtitle: 'L’arrivée de la gauche au pouvoir',
        era: 'annees-80-90',
        description:
            'Après l’élection de François Mitterrand, le gouvernement procède à une vaste opération exceptionnelle de régularisation et abolit la possibilité d’expulser les étrangers nés en France ou y résidant depuis longtemps.',
        keyPoints: [
            'Régularisation de près de 130 000 personnes sans-papiers',
            'Suppression des seuils de tolérance et arrêt des expulsions de jeunes',
            'Liaison étroite entre lutte contre le travail illégal et protection des droits',
        ],
        impact: 'Reconnaissance collective des travailleurs installés de longue date sans titre de séjour.',
    },
    {
        year: '1986 - 1993',
        title: 'Lois Pasqua (I et II)',
        subtitle: 'Durcissement des conditions d’entrée et du droit du sol',
        era: 'annees-80-90',
        description:
            'Portées par Charles Pasqua lors des deux premières cohabitations, ces lois réduisent les possibilités de délivrance de cartes de résident, restreignent le droit du sol (exigence d’une manifestation de volonté pour les jeunes nés en France) et facilitent les reconduites à la frontière.',
        keyPoints: [
            'Restricton de la délivrance automatique des cartes de 10 ans',
            'Contrôles d’identité renforcés',
            'Conditions plus strictes pour le regroupement familial et le mariage',
        ],
        impact: 'Précarisation accrue d’une partie des résidents étrangers et émergence de catégories de personnes « non régularisables et non expulsables ».',
    },
    {
        year: '1996',
        title: 'Événements de Saint-Bernard & Prise de conscience',
        subtitle: 'L’émergence du mouvement des Sans-Papiers',
        era: 'annees-80-90',
        description:
            'L’occupation puis l’évacuation par la force de l’église Saint-Bernard de la Chapelle à Paris (18ᵉ) mettent en lumière la situation tragique de familles devenues clandestines à la suite de la réforme des lois Pasqua. Le terme « Sans-Papiers » s’impose dans le débat public.',
        keyPoints: [
            'Mobilisation citoyenne, d’artistes et d’intellectuels à la Goutte d’Or',
            'Mise en évidence des blocages juridiques créés par les réformes successives',
            'Consolidations des réseaux de soutien et de fraternité populaire',
        ],
        impact: 'Épisode fondateur de la mémoire des luttes de l’immigration dans le 18ᵉ arrondissement de Paris.',
    },
    {
        year: '1998',
        title: 'Loi Chevènement',
        subtitle: 'Création du titre « Vie privée et familiale »',
        era: 'annees-80-90',
        description:
            'Portée par le gouvernement Jospin, la loi tente de sortir de l’impasse des lois Pasqua. Elle crée le titre de séjour « vie privée et familiale » (protégé par la Convention européenne des droits de l’homme) et procède à une nouvelle régularisation d’environ 80 000 personnes.',
        keyPoints: [
            'Création du titre « Vie privée et familiale » (art. 12-bis)',
            'Rétablissement du droit du sol automatique à la majorité',
            'Réencadrement de l’asile territorial',
        ],
        impact: 'Stabilisation juridique pour les étrangers ayant des liens personnels et familiaux fort en France.',
    },
    {
        year: '2006',
        title: 'Loi Sarkozy sur l’Immigration Choisie',
        subtitle: 'Sélectivité et fin de la régularisation automatique des 10 ans',
        era: 'contemporain',
        description:
            'Introduction du concept d’« immigration choisie » contre l’« immigration subie ». La loi supprime la régularisation automatique des étrangers présents depuis plus de 10 ans en France et met l’accent sur l’attraction des talents et étudiants.',
        keyPoints: [
            'Suppression de la régularisation de plein droit après 10 ans de présence',
            'Création de la carte « Compétences et talents »',
            'Mise en place du Contrat d’Accueil et d’Intégration (CAI)',
        ],
        impact: 'Renforcement du contrôle sur l’immigration familiale et orientation vers l’immigration qualifiée.',
    },
    {
        year: '2012',
        title: 'Circulaire Valls',
        subtitle: 'Critères d’admission exceptionnelle au séjour par le travail',
        era: 'contemporain',
        description:
            'Cette circulaire préfectorale fixe des critères indicatifs harmonisés pour la régularisation des personnes sans-papiers sur la base de la durée de présence en France, de l’exercice d’une activité professionnelle ou de la scolarisation des enfants.',
        keyPoints: [
            'Critères d’ancienneté de séjour (3 à 5 ans selon les cas)',
            'Critères liés aux bulletins de paie et promesses d’embauche',
            'Prise en compte de la scolarisation des enfants (au moins 3 ans)',
        ],
        impact: 'Text de référence quotidien pour les préfectures pour les régularisations au cas par cas.',
    },
    {
        year: '2024 - Aujourd’hui',
        title: 'Réformes Récentes & Perspectives Européennes',
        subtitle: 'Intégration, métiers en tension et contrôle aux frontières',
        era: 'contemporain',
        description:
            'Les réformes contemporaines articulent le besoin de main-d’œuvre dans les secteurs en tension (bâtiment, restauration, aide à la personne) avec le renforcement des exigences linguistiques et des contrôles aux frontières extérieures de l’UE.',
        keyPoints: [
            'Titre de séjour spécifique « métiers en tension »',
            'Exigence renforcée de maîtrise du français pour les cartes pluriannuelles',
            'Harmonisation avec le Pacte Européen sur l’Asile et la Migration',
        ],
        impact: 'Débat permanent entre impératifs économiques, exigences d’intégration et politiques de contrôle.',
    },
];

export default function PolitiquesImmigrationPage() {
    const [selectedEra, setSelectedEra] = useState<Era>('all');

    const filteredEvents =
        selectedEra === 'all'
            ? TIMELINE_EVENTS
            : TIMELINE_EVENTS.filter((e) => e.era === selectedEra);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
            {/* En-tête */}
            <div className="text-center space-y-4">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest block">
                    Archives & Histoire Législative
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100">
                    Histoire des Politiques d’Immigration en France
                </h1>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                    De l’Ordonnance de 1945 aux réformes contemporaines : repères chronologiques des grandes lois, tournants politiques et mobilisations sociales.
                </p>
            </div>

            {/* Filtres par période */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                    onClick={() => setSelectedEra('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedEra === 'all'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                >
                    Toutes les périodes ({TIMELINE_EVENTS.length})
                </button>
                <button
                    onClick={() => setSelectedEra('post-guerre')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedEra === 'post-guerre'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                >
                    1945 - 1973 (Post-Guerre)
                </button>
                <button
                    onClick={() => setSelectedEra('tournant-70')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedEra === 'tournant-70'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                >
                    1974 - 1980 (Tournant)
                </button>
                <button
                    onClick={() => setSelectedEra('annees-80-90')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedEra === 'annees-80-90'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                >
                    1981 - 1998 (Lois & Mobilisations)
                </button>
                <button
                    onClick={() => setSelectedEra('contemporain')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${selectedEra === 'contemporain'
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                >
                    2000 - Aujourd’hui
                </button>
            </div>

            {/* Chronologie (Timeline) */}
            <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-32 space-y-10 my-8">
                {filteredEvents.map((item, index) => (
                    <div key={index} className="relative pl-6 sm:pl-8 group">
                        {/* Badge de l'année (Sur desktop à gauche du fil) */}
                        <div className="sm:absolute sm:-left-32 sm:top-0 sm:w-24 sm:text-right mb-2 sm:mb-0">
                            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold text-amber-400 bg-amber-950/60 border border-amber-800/80">
                                {item.year}
                            </span>
                        </div>

                        {/* Puce sur la ligne verticale */}
                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-amber-500 group-hover:scale-125 transition-all" />

                        {/* Carte de l'événement */}
                        <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl space-y-4 transition-all">
                            <div>
                                <h3 className="text-lg font-serif font-bold text-stone-100 flex items-center gap-2">
                                    <span>📜</span> {item.title}
                                </h3>
                                <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                                    {item.subtitle}
                                </p>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                {item.description}
                            </p>

                            {/* Mesures clés */}
                            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                    Éléments clés de la loi / mesure :
                                </span>
                                <ul className="space-y-1 text-xs text-slate-300">
                                    {item.keyPoints.map((point, ptIdx) => (
                                        <li key={ptIdx} className="flex items-start gap-2">
                                            <span className="text-amber-500 font-bold">•</span>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Impact sociétal / historique */}
                            <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 italic">
                                <strong className="text-amber-500/90 not-italic font-semibold">Impact : </strong>
                                {item.impact}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}