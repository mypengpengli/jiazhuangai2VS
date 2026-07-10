import React, { Suspense } from 'react';
import BackToTop from './BackToTop';
import Footer from './Footer';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className="flex min-h-screen flex-col">
    <Suspense fallback={null}>
      <Header />
    </Suspense>
    <main className="min-w-0 flex-1">{children}</main>
    <Footer />
    <BackToTop />
  </div>
);

export default Layout;
