'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Diapositives du Carrousel Grand Format (Hero)
const HERO_SLIDES = [
  {
    id: 1,
    title: "23 Août 1996 : La Porte Arrière de Saint-Bernard",
    subtitle: "L'assaut hache en main des forces de l'ordre face à la résistance pacifique des 300 sans-papiers.",
    badge: "Événement Historique",
    image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "La Solidarité Populaire de la Goutte d'Or",
    subtitle: "Quand les habitants, commerçants et paroissiens ont formé un bouclier fraternel.",
    badge: "Vie de Quartier",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Porte-Paroles & Émergence du Mouvement",
    subtitle: "Madjiguène Cissé, Ababacar Diop : Prendre la parole pour conquérir la dignité.",
    badge: "Visages de la Lutte",
    image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=1600&auto=format&fit=crop",
  }
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">

      {/* 1. BANNIÈRE PARTENAIRES / ANNONCES */}
      <section className="p-4 max-w-7xl mx-auto">

      </section>

      {/* 2. CARROUSEL PRINCIPAL COMPACT (Hauteur réduite : h-[40vh] min-h-[320px]) */}
      <section className="relative w-full h-[40vh] min-h-[320px] max-h-[450px] overflow-hidden bg-slate-900 border-y border-slate-800">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO_SLIDES[currentSlide].image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />

            <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8">
              <motion.span
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-block w-fit px-2.5 py-0.5 text-[11px] font-semibold bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 mb-2"
              >
                {HERO_SLIDES[currentSlide].badge}
              </motion.span>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-serif font-bold text-white max-w-2xl leading-tight mb-2"
              >
                {HERO_SLIDES[currentSlide].title}
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-300 text-xs md:text-sm max-w-xl leading-relaxed mb-4 line-clamp-2"
              >
                {HERO_SLIDES[currentSlide].subtitle}
              </motion.p>

              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4"
              >
                <Link
                  href="/galerie"
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shadow-lg flex items-center gap-2"
                >
                  <span>✨</span> Explorer la Galerie des Glaces
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 right-6 flex gap-2 z-20">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'w-6 bg-amber-500' : 'w-2 bg-slate-600/80 hover:bg-slate-400'
                }`}
            />
          ))}
        </div>
      </section>

      {/* 3. SECTION CARROUSEL COMPOSANT (SI BESOIN) */}
      <section className="p-4 max-w-7xl mx-auto">

      </section>

      {/* 4. SECTION DEUX BLOCS : ANCRAGE TERRITORIAL & LE REFUGE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">

          {/* BLOC GAUCHE */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between hover:border-slate-700 transition">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-widest mb-3">
                <span>🏘️</span> Contexte Social & Historique
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-100 mb-3">
                Ancrage Territorial à la Goutte d'Or
              </h3>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-3">
                L’occupation de Saint-Bernard ne surgit pas du néant : elle s'inscrit au cœur d'un quartier populaire forgé par des décennies d'accueil, d’immigration et de mobilisations citoyennes.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed mb-5">
                En réaction aux <strong>Lois Pasqua-Debré</strong> et aux discours politiques précarisant des milliers de travailleurs, la Goutte d'Or a offert le terreau d'une solidarité concrète entre habitants, associations et personnes sans-papiers.
              </p>
            </div>

            <Link
              href="/goutte-dor"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              En savoir plus sur la Goutte d'Or →
            </Link>
          </div>

          {/* BLOC DROITE */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border border-amber-900/30 shadow-2xl flex flex-col justify-between hover:border-amber-500/40 transition">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-widest mb-3">
                <span>⛪</span> Conscience & Droit d'Asile
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-stone-100 mb-3">
                Le Refuge : Le Choix du Père Coindé
              </h3>
              <blockquote className="text-slate-300 text-xs md:text-sm italic leading-relaxed mb-3 border-l-2 border-amber-500/50 pl-4">
                « Le Père Henri Coindé, curé de la paroisse Saint-Bernard, refusera obstinément d'appeler la force publique pour faire évacuer l'église, plaçant l'asile spirituel et la fraternité humaine au-dessus des pressions étatiques. »
              </blockquote>
              <p className="text-slate-400 text-xs leading-relaxed mb-5">
                Son choix a soutenu l'engagement massif des paroissiens qui ont nourri, abrité et protégé les familles jusqu'au franchissement de la porte arrière le 23 août 1996.
              </p>
            </div>

            <Link
              href="/eglise-saint-bernard"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              Découvrir l'Église Saint-Bernard, son histoire & sa photo →
            </Link>
          </div>

        </div>
      </section>

      {/* 5. ACCÈS RAPIDES GALERIE ET DESTINS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/galerie"
            className="group rounded-2xl p-6 md:p-8 border border-slate-800 bg-slate-900 hover:border-amber-500/50 transition shadow-xl flex items-center justify-between"
          >
            <div>
              <span className="text-2xl mb-2 block">✨</span>
              <h4 className="text-base md:text-lg font-serif font-bold text-stone-100 group-hover:text-amber-400 transition">
                La Galerie des Glaces
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Archives visuelles, vidéos et documents numérisés en accès libre.
              </p>
            </div>
            <span className="text-xl text-slate-600 group-hover:text-amber-400 group-hover:translate-x-2 transition-all">➔</span>
          </Link>

          <Link
            href="/destins"
            className="group rounded-2xl p-6 md:p-8 border border-slate-800 bg-slate-900 hover:border-amber-500/50 transition shadow-xl flex items-center justify-between"
          >
            <div>
              <span className="text-2xl mb-2 block">👥</span>
              <h4 className="text-base md:text-lg font-serif font-bold text-stone-100 group-hover:text-amber-400 transition">
                Portraits & Destins
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Portraits des sans-papiers, porte-paroles et soutiens du mouvement.
              </p>
            </div>
            <span className="text-xl text-slate-600 group-hover:text-amber-400 group-hover:translate-x-2 transition-all">➔</span>
          </Link>
        </div>
      </section>

    </main>
  );
}