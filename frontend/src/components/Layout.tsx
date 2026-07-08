import React, { Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import BackToTop from './BackToTop';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main className="flex-grow container mx-auto px-4 py-4">
        {children}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Layout;
