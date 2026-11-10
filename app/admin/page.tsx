'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BannerManager, { type BannerItem } from '../components/banner/BannerManager';
import CarrouselManager, { type CarouselSlide } from '../components/carrousel/CarrouselManager';
import { ApiError, apiRequest, clearApiSession } from '@/app/lib/api';
import ContributionsManager from './ContributionsManager';
import UsersManager from './UsersManager';
import MemberPrivateInbox from './MemberPrivateInbox';
import GalleryManager, { type GalleryItem } from './GalleryManager';
import DestinsManager, { type DestinsPortrait } from './DestinsManager';
import VideosManager, { type VideoArchive } from './VideosManager';

interface AdminDashboard {
  metrics: {
    pendingArticles: number;
    totalArticles: number;
    uniqueUsers: number;
    totalDonations: number;
    totalBannerRevenue: number;
  };
  carouselSlides: CarouselSlide[];
  carouselPaused: boolean;
  banners: BannerItem[];
  galleryItems?: GalleryItem[];
  destinsPortraits?: DestinsPortrait[];
  videosArchives?: VideoArchive[];
}

type AdminTab = 'contributions' | 'banners' | 'carousel' | 'gallery' | 'destins' | 'videos' | 'inbox' | 'users' | 'all';

interface AdminUser {
  email: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('contributions');

  const handleContributionMetricsChange = useCallback((pending: number, total: number) => {
    setDashboard((current) => current ? {
      ...current,
      metrics: {
        ...current.metrics,
        pendingArticles: pending,
        totalArticles: total,
      },
    } : current);
  }, []);

  const handleBannersChange = useCallback((banners: BannerItem[]) => {
    setDashboard((current) => current ? {
      ...current,
      banners,
      metrics: {
        ...current.metrics,
        totalBannerRevenue: banners.reduce((sum, banner) => banner.payment_status === 'paid' ? sum + Number(banner.price_amount || 0) : sum, 0),
      },
    } : current);
  }, []);

  const handleGalleryItemsChange = useCallback((items: GalleryItem[]) => {
    setDashboard((current) => current ? {
      ...current,
      galleryItems: items,
    } : current);
  }, []);

  const handleDestinsPortraitsChange = useCallback((portraits: DestinsPortrait[]) => {
    setDashboard((current) => current ? {
      ...current,
      destinsPortraits: portraits,
    } : current);
  }, []);

  const handleVideosArchivesChange = useCallback((videos: VideoArchive[]) => {
    setDashboard((current) => current ? {
      ...current,
      videosArchives: videos,
    } : current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadAdminPage() {
      try {
        const session = await apiRequest<{ user: AdminUser }>('/api/auth/me');
        if (session.user.role !== 'admin') {
          router.replace('/dashboard');
          return;
        }
        if (!cancelled) setUser(session.user);

        const result = await apiRequest<AdminDashboard>('/api/admin/dashboard');
        if (!cancelled) setDashboard(result);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          router.replace('/login');
        } else {
          setErrorMessage(error instanceof Error ? error.message : 'Impossible de charger le tableau de bord.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAdminPage();
    const refreshInterval = window.setInterval(async () => {
      if (cancelled) return;
      try {
        const result = await apiRequest<AdminDashboard>('/api/admin/dashboard');
        if (!cancelled) setDashboard(result);
      } catch {
        // Conserve the last successfully loaded dashboard if a refresh fails.
      }
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
    };
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    setErrorMessage('');
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      clearApiSession();
      router.replace('/login');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'La déconnexion a échoué.');
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="animate-pulse text-sm">Chargement de l’espace administrateur...</p>
      </div>
    );
  }

  if (!user || !dashboard) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-slate-100">
        <p role="alert" className="mx-auto max-w-3xl rounded-xl border border-rose-800 bg-rose-950/60 p-4 text-sm text-rose-200">
          {errorMessage || 'Le tableau de bord administrateur est indisponible.'}
        </p>
      </main>
    );
  }

  const metrics = [
    { label: 'Contributions à valider', value: dashboard.metrics.pendingArticles, color: 'text-amber-600', tab: 'contributions' as AdminTab },
    { label: 'Total Contributions', value: dashboard.metrics.totalArticles, color: 'text-emerald-600', tab: 'contributions' as AdminTab },
    { label: 'Membres actifs', value: dashboard.metrics.uniqueUsers, color: 'text-indigo-600', tab: 'users' as AdminTab },
    { label: 'Dons collectés', value: `${Number(dashboard.metrics.totalDonations || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`, color: 'text-purple-600' },
    { label: 'Recettes publicitaires', value: `${dashboard.metrics.totalBannerRevenue.toFixed(2)} €`, color: 'text-emerald-700', tab: 'banners' as AdminTab },
  ];

  const tabs: { id: AdminTab; label: string; count?: number; highlight?: boolean; icon: React.ReactNode }[] = [
    {
      id: 'contributions',
      label: 'Contributions',
      count: dashboard.metrics.pendingArticles > 0 ? dashboard.metrics.pendingArticles : dashboard.metrics.totalArticles,
      highlight: dashboard.metrics.pendingArticles > 0,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'banners',
      label: 'Bannières & Partenaires',
      count: dashboard.banners.length,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      id: 'carousel',
      label: 'Diaporama (Carrousel)',
      count: dashboard.carouselSlides.length,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'gallery',
      label: 'Galerie des Sans-Papiers',
      count: dashboard.galleryItems?.length ?? 0,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'destins',
      label: 'Destins & Parcours',
      count: dashboard.destinsPortraits?.length ?? 0,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'videos',
      label: 'Vidéos & Témoignages',
      count: dashboard.videosArchives?.length ?? 0,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'inbox',
      label: 'Messagerie Membres',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'users',
      label: 'Utilisateurs & Accès',
      count: dashboard.metrics.uniqueUsers,
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: 'all',
      label: 'Vue Complète',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 bg-white p-4 font-sans text-slate-900 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-amber-600 sm:text-3xl">Mémoires de Saint-Bernard</h1>
            <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
              Espace Administrateur
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Session active : <strong className="font-bold text-slate-900">{user.email}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-200">
            Voir l’espace public
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-50"
          >
            {loggingOut ? 'Déconnexion...' : 'Déconnexion'}
          </button>
        </div>
      </header>

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}

      {/* Cartes statistiques (cliquables pour basculer directement sur le pavé correspondant) */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Statistiques">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            onClick={() => metric.tab && setActiveTab(metric.tab)}
            className={`space-y-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${
              metric.tab ? 'cursor-pointer hover:border-amber-400 hover:shadow-md' : ''
            }`}
            title={metric.tab ? `Cliquer pour afficher la section ${metric.label}` : undefined}
          >
            <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
            <p className={`text-2xl font-extrabold ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </section>

      {/* Barre d'onglets pour naviguer entre les différents pavés */}
      <nav aria-label="Sections du panneau d'administration" className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-sm sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shadow-sm ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-amber-200 scale-[1.02]'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                      isActive
                        ? 'bg-amber-800/80 text-white'
                        : tab.highlight
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Pavés de gestion organisés par onglets */}
      <div className="space-y-6">
        <section
          aria-labelledby="tab-contributions"
          className={activeTab === 'contributions' || activeTab === 'all' ? 'space-y-6' : 'hidden'}
        >
          <ContributionsManager
            currentAdminEmail={user.email}
            onContributionMetricsChange={handleContributionMetricsChange}
          />
        </section>

        <section
          aria-labelledby="tab-banners"
          className={activeTab === 'banners' || activeTab === 'all' ? 'space-y-6' : 'hidden'}
        >
          <BannerManager initialBanners={dashboard.banners} onBannersChange={handleBannersChange} />
        </section>

        <section
          aria-labelledby="tab-carousel"
          className={activeTab === 'carousel' || activeTab === 'all' ? 'space-y-6' : 'hidden'}
        >
          <CarrouselManager initialSlides={dashboard.carouselSlides} initialPaused={dashboard.carouselPaused} />
        </section>

        <section
          aria-labelledby="tab-gallery"
          className={activeTab === 'gallery' || activeTab === 'all' ? 'space-y-6' : 'hidden'}
        >
          <GalleryManager
            initialItems={dashboard.galleryItems}
            onItemsChange={handleGalleryItemsChange}
          />
        </section>

        <section
          aria-labelledby="tab-destins"
          className={activeTab === 'destins' || activeTab === 'all' ? 'space-y-6' : 'hidden'}
        >
          <DestinsManager
            initialPortraits={dashboard.destinsPortraits}
            onPortraitsChange={handleDestinsPortraitsChange}
          />
        </section>

        <section
          aria-labelledby="tab-videos"
          className={activeTab === 'videos' || activeTab === 'all' ? 'space-y-6' : 'hidden'}
        >
          <VideosManager
            initialVideos={dashboard.videosArchives}
            onVideosChange={handleVideosArchivesChange}
          />
        </section>

        <section
          aria-labelledby="tab-inbox"
          className={activeTab === 'inbox' || activeTab === 'all' ? 'space-y-6' : 'hidden'}
        >
          <MemberPrivateInbox />
        </section>

        <section
          aria-labelledby="tab-users"
          className={activeTab === 'users' || activeTab === 'all' ? 'space-y-6' : 'hidden'}
        >
          <UsersManager />
        </section>
      </div>
    </main>
  );
}
