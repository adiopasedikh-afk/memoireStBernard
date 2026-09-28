'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { createClient } from '@/app/lib/supabase/client';

// Export de l'interface pour qu'elle puisse être réutilisée dans BannerManager
export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  button_text?: string;
  button_url?: string;
}

// Bannières par défaut / fallback au cas où la base de données est vide ou bloque (RLS)
const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: 'default-1',
    title: 'Espace Partenaire & Publicité',
    image_url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop',
    link_url: '#',
  },
];

export default function BannerDisplay() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true);

        if (error || !data || data.length === 0) {
          setBanners(DEFAULT_BANNERS);
        } else {
          setBanners(data);
        }
      } catch (err) {
        setBanners(DEFAULT_BANNERS);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-24 bg-slate-900 animate-pulse rounded-xl border border-slate-800 flex items-center justify-center text-xs text-slate-500">
        Chargement de la bannière...
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900 shadow-lg my-2">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.link_url || '#'}
          className="relative block w-full h-24 md:h-28 group"
        >
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent flex items-center p-4">
            <span className="text-sm md:text-base font-bold text-amber-400 bg-slate-950/60 px-3 py-1 rounded-md border border-amber-500/20">
              📢 {banner.title}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}