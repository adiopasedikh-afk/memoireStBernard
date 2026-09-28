import { createClient } from '@/app/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ArticlesManager } from './ArticlesManager';
import { CarouselManager } from './CarouselManager';

const ADMIN_EMAIL = 'adiopasedikh@gmail.com';

export default async function AdminPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();



  // Action serveur de déconnexion
  async function handleLogout() {
    'use server';
    const store = await cookies();
    store.delete('yam_user_email');
    store.delete('yam_admin_2fa');

    const supabase = await createClient();
    await supabase.auth.signOut();

    redirect('/login');
  }

  let authEmail: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authEmail = user?.user_metadata?.email || user?.email || null;
  } catch { }

  const rawCookie = cookieStore.get('yam_user_email')?.value;
  const cookieEmail = rawCookie ? decodeURIComponent(rawCookie).toLowerCase().trim() : null;
  const userEmail = (authEmail || cookieEmail || '').toLowerCase().trim();
  const admin2FA = cookieStore.get('yam_admin_2fa')?.value;

  if (userEmail !== ADMIN_EMAIL.toLowerCase() || admin2FA !== 'verified') {
    redirect('/login');
  }

  // Métriques Supabase
  const { data: logs } = await supabase.from('connection_logs').select('*');
  const { data: articles } = await supabase.from('articles').select('*');
  const { data: donations } = await supabase.from('donations').select('amount');

  const pendingArticles = articles?.filter((a) => a.status === 'pending').length || 0;
  const totalArticles = articles?.length || 0;
  const uniqueUsers = new Set(logs?.map((l) => l.email?.toLowerCase().trim())).size;
  const totalDonations = donations?.reduce((acc, d) => acc + (d.amount || 0), 0) || 0;

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-8 text-slate-900 font-sans">

      {/* EN-TÊTE ADMIN */}
      <div className="border-b border-slate-200 pb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              Mémoires de Saint-Bernard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Espace Administrateur
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Session active : <strong className="text-slate-900 font-bold">{userEmail}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition-all shadow-sm"
          >
            📖 Voir l'Espace Public
          </a>

          <form action={handleLogout}>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              🚪 Déconnexion
            </button>
          </form>
        </div>
      </div>

      {/* GRILLE KPIS (4 CARTES EN THÈME CLAIR) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className={`bg-white border rounded-2xl p-4 space-y-1 shadow-sm ${pendingArticles > 0 ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'}`}>
          <p className="text-xs text-slate-500 font-semibold">Récits à valider</p>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-extrabold text-amber-600">{pendingArticles}</p>
            {pendingArticles > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Action requise
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Total Récits</p>
          <p className="text-2xl font-extrabold text-emerald-600">{totalArticles}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Membres Actifs</p>
          <p className="text-2xl font-extrabold text-indigo-600">{uniqueUsers}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Dons Collectés</p>
          <p className="text-2xl font-extrabold text-purple-600">{totalDonations} €</p>
        </div>

      </div>

      {/* TABLEAU DE MODÉRATION ET GESTION DES RÉCITS */}
      <ArticlesManager initialArticles={articles || []} />

    </div>
  );
}