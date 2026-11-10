'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/app/lib/api';

interface BannerItem {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url?: string | null;
  button_text: string | null;
  button_url: string | null;
}

const FALLBACK_BANNERS: BannerItem[] = [
  {
    id: 'fallback-archives',
    title: 'Mémoires de Saint-Bernard',
    subtitle: 'Archives, témoignages et mémoire collective',
    image_url: '',
    button_text: 'Découvrir les archives',
    button_url: '/galerie',
  },
  {
    id: 'fallback-goutte-dor',
    title: 'La Goutte d’Or',
    subtitle: 'Une histoire populaire faite de luttes et de solidarités',
    image_url: '',
    button_text: 'Découvrir le quartier',
    button_url: '/goutte-dor',
  },
];

export default function BannerDisplay() {
  const [banners, setBanners] = useState<BannerItem[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadBanners() {
      try {
        const result = await apiRequest<{ data: BannerItem[] }>('/api/banners', { cache: 'no-store' });
        if (!cancelled) {
          setBanners(result.data);
          setLoadError('');
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Impossible de charger les bannières.');
          setBanners([]);
        }
      }
    }

    loadBanners();
    const refreshTimer = window.setInterval(loadBanners, 30000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadBanners();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const displayedBanners = banners?.length ? banners : FALLBACK_BANNERS;
  const activeIndex = currentIndex % displayedBanners.length;

  useEffect(() => {
    if (displayedBanners.length < 2) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % displayedBanners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [displayedBanners.length]);

  const currentBanner = displayedBanners[activeIndex];
  const href = currentBanner.button_url || currentBanner.link_url || '';
  const safeHref = href.startsWith('/') && !href.startsWith('//')
    ? href
    : /^https?:\/\//i.test(href)
      ? href
      : '';
  const actionLabel = currentBanner.button_text || currentBanner.title;
  const isExternal = safeHref.startsWith('http');

  return (
    <section className="mx-auto max-w-5xl px-4 py-2 sm:px-6" aria-label="Bannières">
      {loadError && (
        <p role="status" className="mx-auto mb-2 max-w-3xl text-center text-xs text-amber-200">
          Les bannières enregistrées sont momentanément indisponibles. Une bannière de présentation est affichée.
        </p>
      )}
      <div className="relative mx-auto aspect-[3/1] w-full max-w-4xl overflow-hidden rounded-[1.4rem] border border-slate-700/70 bg-slate-900 shadow-xl sm:aspect-[7/1]">
        {currentBanner.image_url ? (
          <Image
            src={currentBanner.image_url}
            alt={currentBanner.title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 896px"
            className="object-cover"
          />
        ) : (
          <div
            className={`absolute inset-0 ${
              currentBanner.id === 'fallback-archives'
                ? 'bg-[radial-gradient(ellipse_at_75%_35%,rgba(245,158,11,0.65),transparent_35%),linear-gradient(120deg,#0f172a_5%,#164e63_52%,#7c2d12)]'
                : 'bg-[radial-gradient(ellipse_at_20%_90%,rgba(245,158,11,0.5),transparent_35%),linear-gradient(115deg,#1e1b4b,#0f172a_55%,#7f1d1d)]'
            }`}
            role="img"
            aria-label={currentBanner.title}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/20 to-transparent" />
            <div className="absolute right-[10%] top-1/2 h-16 w-16 -translate-y-1/2 rounded-2xl border border-white/30 bg-white/10 shadow-2xl backdrop-blur-sm sm:h-24 sm:w-24">
              <div className="absolute inset-3 rounded-xl border border-amber-300/50" />
              <span className="absolute inset-0 flex items-center justify-center text-2xl text-amber-200 sm:text-4xl" aria-hidden="true">
                ✦
              </span>
            </div>
            <div className="absolute left-[6%] top-1/2 max-w-[70%] -translate-y-1/2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-200 sm:text-xs">
                Association · Paris 18ᵉ
              </p>
              <h2 className="mt-1 font-serif text-base font-bold text-white drop-shadow sm:text-2xl">
                {currentBanner.title}
              </h2>
              {currentBanner.subtitle && (
                <p className="mt-1 line-clamp-2 text-[10px] text-slate-100 sm:text-sm">
                  {currentBanner.subtitle}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
        {safeHref ? (
          <a
            href={safeHref}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noreferrer' : undefined}
            aria-label={`${actionLabel} — ${currentBanner.title}`}
            className="absolute bottom-3 left-3 max-w-[75%] truncate rounded-full border border-white/20 bg-slate-950/85 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur sm:bottom-4 sm:left-4 sm:px-4 sm:text-xs"
          >
            <span aria-hidden="true">📢 </span>{actionLabel}
          </a>
        ) : (
          <span className="absolute bottom-3 left-3 max-w-[75%] truncate rounded-full border border-white/20 bg-slate-950/85 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur sm:bottom-4 sm:left-4 sm:px-4 sm:text-xs">
            {actionLabel}
          </span>
        )}

        {displayedBanners.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 sm:bottom-4 sm:right-4">
            {displayedBanners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Afficher la bannière ${index + 1} sur ${displayedBanners.length}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
