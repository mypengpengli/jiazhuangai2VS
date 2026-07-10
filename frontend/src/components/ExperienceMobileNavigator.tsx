'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { BookOpen, X } from 'lucide-react';
import ExperienceDocTree from './ExperienceDocTree';
import { ExperienceDocNode } from '@/lib/experienceDocs';

type Props = { nodes: ExperienceDocNode[]; activeId?: number; activePathIds: number[] };

export default function ExperienceMobileNavigator({ nodes, activeId, activePathIds }: Props) {
  return <Dialog.Root><Dialog.Trigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-control border border-sky-200 bg-white px-3 text-sm font-medium text-brand-strong shadow-sm lg:hidden"><BookOpen className="size-4" />文档目录</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-sm" /><Dialog.Content className="fixed inset-x-3 top-3 z-50 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-panel border border-white/80 bg-white p-4 shadow-raised"><div className="mb-4 flex items-center justify-between"><Dialog.Title className="font-semibold text-slate-900">本站经验分享</Dialog.Title><Dialog.Close asChild><button type="button" className="inline-flex size-10 items-center justify-center rounded-control hover:bg-slate-100" aria-label="关闭文档目录"><X className="size-5" /></button></Dialog.Close></div><ExperienceDocTree nodes={nodes} activeId={activeId} activePathIds={activePathIds} compact /></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
