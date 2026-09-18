import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { configured } from '@/lib/supabase/server';
import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { default: 'Workbridge — Find your next chapter', template: '%s | Workbridge' },
  description:
    'Discover thoughtful teams, apply for meaningful work, and manage your next move with Workbridge.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Header />
        {!configured() && (
          <div className="preview-banner">
            Sample preview <span>·</span> Explore the interface. Account actions become available
            after Supabase setup.
          </div>
        )}
        <main id="main" className="main-wrap">
          {children}
        </main>
        <footer className="footer">
          <span className="footer-brand">workbridge.</span>
          <span>A better next chapter starts here.</span>
          <span>Portfolio demo · 2026</span>
        </footer>
      </body>
    </html>
  );
}
