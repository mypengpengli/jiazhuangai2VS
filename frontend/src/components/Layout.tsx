import React, { Suspense } from 'react';
import BackToTop from './BackToTop';
import Footer from './Footer';
import Header from './Header';
import type { Locale } from '@/lib/locale';

interface LayoutProps {
  children: React.ReactNode;
  locale: Locale;
}

const Layout: React.FC<LayoutProps> = ({ children, locale }) => (
  <div className="flex min-h-screen flex-col">
    <Suspense fallback={null}>
      <Header locale={locale} />
    </Suspense>
    <main className="min-w-0 flex-1">{children}</main>
    <Footer locale={locale} />
    <BackToTop locale={locale} />
  </div>
);

export default Layout;
