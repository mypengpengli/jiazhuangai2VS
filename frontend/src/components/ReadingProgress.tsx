'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => { const update = () => { const height = document.documentElement.scrollHeight - window.innerHeight; setProgress(height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0); }; update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); }; }, []);
  return <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"><div className="h-full bg-brand transition-[width] duration-100" style={{ width: `${progress}%` }} /></div>;
}
