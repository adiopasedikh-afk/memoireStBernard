import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Import de tes nouveaux composants Header et Footer
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mémoires de Saint-Bernard de la Chapelle — Paris 18',
  description: "Espace mémoriel et d'archives dédié aux luttes des Sans-Papiers de 1996.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
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