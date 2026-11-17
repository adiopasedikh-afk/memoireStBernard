'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ContributionContent from '@/app/components/ContributionContent';
import BannerDisplay from '@/app/components/banner/BannerDisplay';
import { apiRequest } from '@/app/lib/api';

interface PublishedContribution {
  id: string;
  title: string;
  content: string;
  file_url: string | null;
  created_at: string;
}

interface CarouselSlide {
  id: string | number;
  title?: string | null;
  description?: string | null;
  subtitle?: string | null;
  image_url?: string;
  image?: string;
  image_position?: string;
  link_url?: string | null;
  badge?: string;
}

// Photos par défaut reflétant exactement la base de données du backend
const FALLBACK_HERO_SLIDES: CarouselSlide[] = [
  {
    id: "98efa417-587b-4c66-a97a-09cbbad207e5",
    title: "EGLISE SAINT-BERNARD DE LA CHAPELLE(GOUTTE D'OR)",
    description: "UN PATRIMOINE A DOUBLE TITRE : REFUGE ET SOLIDARITE",
    image_url: "/images/carousel/9ebca66a14a4f2c175f6abb0d8b0cb18.jpg",
    link_url: "https://p.monumentum.fr/galerie/maxi/00505/505159-francais-eglise-saint-bernard-de-la-chapelle-paris.jpg",
    image_position: "50% 30%",
    badge: "Patrimoine & Mémoire",
  },
  {
    id: "5e2e9af1-9fbf-4626-9120-aa00989c06a2",
    title: "MADJIGUENE CISSE",
    description: "PORTE PAROLE DE SAINT-BERNARD",
    image_url: "/images/carousel/e004853cef6b4856d12ce8dcb0148066.webp",
    link_url: null,
    image_position: "50% 60%",
    badge: "Porte-Parole",
  },
  {
    id: "e88321d1-6dc0-4368-9274-5fd3018f8ab9",
    title: "Ancien site de pajol",
    description: "Dans l'église, en marge du culte",
    image_url: "/images/carousel/de9b1751c51ab93e7849a787d7c70e4c.png",
    link_url: "https://www.bok.net/pajol/",
    image_position: "50% 30%",
    badge: "Archives Pajol",
  },
  {
    id: "396b02f5-f6bd-4dcf-8693-f3f16e21cf73",
    title: "Maimouna NDIAYE DIOP",
    description: "Fille d'un ex-sanspapiers de St-Bernard",
    image_url: "/images/carousel/d7588525086d600201b8c0dedd21db39.jpg",
    link_url: "https://youandme.cloud",
    image_position: "50% 25%",
    badge: "Photo publiée",
  },
  {
    id: "160bd41e-4e34-4b83-b2de-11d22b7f0218",
    title: "Le désastre",
    description: "L'expulsion",
    image_url: "/images/carousel/48e04a670acd971e379742743062c693.jpg",
    link_url: "http://bok.net/pajol",
    image_position: "50% 25%",
    badge: "23 Août 1996",
  },
  {
    id: "69fcd8bc-67a3-4d99-a494-98d54d276ab8",
    title: "Sénégal- terre de la Teranga(solidarité)",
    description: "Sénégal",
    image_url: "/images/carousel/98fb93963ca29ea1e459356cf86bdf4b.jpg",
    link_url: null,
    image_position: "50% 25%",
    badge: "Terre de Teranga",
  },
  {
    id: "44c9e457-3b6b-473a-a45e-a487a66ae7ee",
    title: "DORO TRAORE",
    description: "PORTE-PAROLE DES SANS PAPIERS DE ST-BERNARD",
    image_url: "/images/carousel/db460485f0d43e1ab8670353fbae0ba8.jpg",
    link_url: null,
    image_position: "50% 30%",
    badge: "Porte-Parole",
  },
  {
    id: "6c7846e8-9ab6-413a-8ef2-9cdf975cd189",
    title: "ABABACAR DIOP",
    description: "PORTE-PAROLE DE ST-BERNARD",
    image_url: "/images/carousel/3b166c85c60b9c32f860deb1361adf9c.jpg",
    link_url: null,
    image_position: "50% 25%",
    badge: "Porte-Parole",
  },
  {
    id: "3b666e4e-15ea-47d9-9581-b9a4befcc12b",
    title: "NDEYE KHADY DIOP",
    description: "Fille d'un ex-sans papiers de St-Bernard",
    image_url: "/images/carousel/e1f9567f1d87011631eabe7ea3f86889.jpg",
    link_url: null,
    image_position: "50% 30%",
    badge: "Témoignage",
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState<CarouselSlide[]>(FALLBACK_HERO_SLIDES);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [publishedContributions, setPublishedContributions] = useState<PublishedContribution[]>([]);
  const [contributionsLoading, setContributionsLoading] = useState(true);
  const [contributionsError, setContributionsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadCarousel() {
      try {
        const result = await apiRequest<{ data: CarouselSlide[]; is_paused: boolean }>('/api/carousel-slides');
        if (!cancelled) {
          const slides = result.data.length > 0 ? result.data : FALLBACK_HERO_SLIDES;
          setHeroSlides(slides);
          setCarouselPaused(result.is_paused);
          setCurrentSlide((index) => index % slides.length);
        }
      } catch {
        // Les visuels de secours restent affichés si l'API du carrousel est indisponible.
      }
    }
    void loadCarousel();
    const refresh = window.setInterval(() => void loadCarousel(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    if (heroSlides.length < 2 || carouselPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length, carouselPaused]);

  useEffect(() => {
    let cancelled = false;
    async function loadPublishedContributions() {
      try {
        const result = await apiRequest<{ data: PublishedContribution[] }>('/api/contributions');
        if (!cancelled) setPublishedContributions(result.data);
      } catch (error) {
        if (!cancelled) {
          setContributionsError(
            error instanceof Error ? error.message : 'Impossible de charger les contributions publiées.',
          );
        }
      } finally {
        if (!cancelled) setContributionsLoading(false);
      }
    }

    loadPublishedContributions();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeSlide = heroSlides[currentSlide % heroSlides.length] || FALLBACK_HERO_SLIDES[0];
  const activeSlideImage = activeSlide.image_url || activeSlide.image || '';
  const activeSlideTitle = activeSlide.title || 'Mémoires de Saint-Bernard';
  const activeSlideSubtitle = activeSlide.description || activeSlide.subtitle || '';
  const activeSlideBadge = activeSlide.badge || 'Photo publiée';

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">

      {/* 1. BANNIÈRE PARTENAIRES / ANNONCES */}
      <BannerDisplay />

      {/* 2. CARROUSEL PRINCIPAL */}
      <section className="relative w-full h-[58vh] min-h-[360px] max-h-[620px] overflow-hidden bg-slate-900 border-y border-slate-800 sm:h-[62vh] sm:min-h-[420px] sm:max-h-[720px]">
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
              className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-2xl"
              style={{
                backgroundImage: `url(${activeSlideImage})`,
              }}
            />
            <div
              role="img"
              aria-label={activeSlideTitle}
              className="absolute inset-0 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${activeSlideImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/5" />

            <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-end pb-10 sm:pb-12">
              <motion.span
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-block w-fit px-2.5 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30 mb-1"
              >
                {activeSlideBadge}
              </motion.span>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-fit max-w-[min(100%,42rem)] text-lg sm:text-xl md:text-2xl font-serif font-bold text-white leading-tight mb-1 [text-shadow:0_2px_8px_rgb(0_0_0_/_90%)]"
              >
                {activeSlideTitle}
              </motion.h2>

              {activeSlideSubtitle && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-2 line-clamp-2 w-fit max-w-[min(100%,36rem)] rounded-md border-l-2 border-amber-400 bg-slate-950/55 px-2.5 py-1 text-xs leading-snug text-white shadow-sm sm:text-sm [text-shadow:0_1px_4px_rgb(0_0_0_/_65%)]"
                >
                  {activeSlideSubtitle}
                </motion.p>
              )}

              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4"
              >
                <Link
                  href={activeSlide.link_url || '/galerie'}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition shadow-lg flex items-center gap-2"
                >
                  <span>✨</span> {activeSlide.link_url ? 'Découvrir' : 'Explorer la Galerie des Sans-Papiers'}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 right-6 flex gap-2 z-20">
          {heroSlides.map((_, idx) => (
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

      {/* 5. CONTRIBUTIONS */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
        aria-labelledby="home-contributions-title"
      >
        <div className="mb-5 text-center">
          <h2 id="home-contributions-title" className="text-xl md:text-2xl font-serif font-bold text-amber-400">
            Contributions
          </h2>
        </div>

        {contributionsLoading ? (
          <p className="text-sm text-slate-400">Chargement des contributions...</p>
        ) : contributionsError ? (
          <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-sm text-rose-300">
            {contributionsError}
          </p>
        ) : publishedContributions.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
            Aucune contribution n’a encore été publiée.
          </p>
        ) : (
          <ul className="space-y-4">
            {publishedContributions.map((contribution) => (
              <li key={contribution.id} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-100">{contribution.title}</h3>
                  <time dateTime={contribution.created_at} className="text-xs text-slate-500">
                    {contribution.created_at}
                  </time>
                </div>
                <ContributionContent content={contribution.content} className="text-sm text-slate-300" />
                {contribution.file_url && (
                  <a
                    href={contribution.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs text-amber-400 underline"
                  >
                    Consulter le document associé
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 6. ACCÈS RAPIDES GALERIE ET DESTINS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/galerie"
            className="group rounded-2xl p-6 md:p-8 border border-slate-800 bg-slate-900 hover:border-amber-500/50 transition shadow-xl flex items-center justify-between"
          >
            <div>
              <span className="text-2xl mb-2 block">✨</span>
              <h4 className="text-base md:text-lg font-serif font-bold text-stone-100 group-hover:text-amber-400 transition">
                La Galerie des Sans-Papiers
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