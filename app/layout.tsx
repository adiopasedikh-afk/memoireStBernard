import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Import des composants Header, Footer et PWA
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import { PwaRegister } from '@/app/components/PwaRegister';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Mémoires de Saint-Bernard de la Chapelle — Paris 18',
  description: "Espace mémoriel et d'archives dédié aux luttes des Sans-Papiers de 1996.",
  applicationName: 'St-Bernard 1996',
  appleWebApp: {
    capable: true,
    title: 'St-Bernard 1996',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        {/* Enregistrement du Service Worker PWA */}
        <PwaRegister />

        {/* Le Header s'affiche en haut de chaque page */}
        <Navbar />

        {/* Contenu principal de la page courante */}
        {children}

        {/* Le Footer s'affiche en bas de chaque page */}
        <Footer />
      </body>
    </html>
  );
}