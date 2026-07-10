'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const onScroll = () => setVisible(window.scrollY > 360); onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
  return <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="返回顶部" className={`fixed bottom-5 right-5 z-40 inline-flex size-10 items-center justify-center rounded-control border border-slate-200 bg-white text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.12)] transition ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}><ArrowUp className="size-4" /></button>;
}
