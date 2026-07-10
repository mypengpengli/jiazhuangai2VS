'use client';

import Link from 'next/link';
import { ChevronDown, ChevronRight, FileText, FolderTree, Minus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { formatShortDate } from '@/lib/formatters';
import { ExperienceDocNode } from '@/lib/experienceDocs';

type ExperienceDocTreeProps = { nodes: ExperienceDocNode[]; activeId?: number; activePathIds?: number[]; compact?: boolean };

const idsWithChildren = (nodes: ExperienceDocNode[]): number[] => nodes.flatMap((node) => [node.id, ...idsWithChildren(node.children || [])]);

export default function ExperienceDocTree({ nodes, activeId, activePathIds = [], compact = false }: ExperienceDocTreeProps) {
  const expandableIds = useMemo(() => idsWithChildren(nodes.filter((node) => node.children.length > 0)), [nodes]);
  const [expandedIds, setExpandedIds] = useState(() => new Set(activePathIds));
  const hasExpandable = expandableIds.length > 0;
  const expandAll = () => setExpandedIds(new Set(expandableIds));
  const collapseAll = () => setExpandedIds(new Set(activePathIds.slice(0, -1)));

  const renderNode = (node: ExperienceDocNode, depth: number): ReactNode => {
    const hasChildren = node.children.length > 0;
    const expanded = expandedIds.has(node.id);
    const active = node.id === activeId;
    return <li key={node.id}>
      <div className="flex min-w-0 items-center gap-1" style={{ paddingLeft: `${depth * 0.75}rem` }}>
        {hasChildren ? <button type="button" onClick={() => setExpandedIds((current) => { const next = new Set(current); if (next.has(node.id)) next.delete(node.id); else next.add(node.id); return next; })} className="flex size-7 shrink-0 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100" aria-label={`${expanded ? '收起' : '展开'} ${node.title}`} aria-expanded={expanded}>{expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</button> : <span className="flex size-7 shrink-0 items-center justify-center text-slate-300"><Minus className="size-3" /></span>}
        <Link href={`/experience?slug=${node.slug}`} className={`min-w-0 flex-1 rounded-control px-2 py-2 text-sm transition ${active ? 'bg-sky-50 font-medium text-brand-strong ring-1 ring-sky-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
          <span className="flex items-start gap-2"><FileText className="mt-0.5 size-3.5 shrink-0" /><span className="min-w-0"><span className="block truncate">{node.title}</span>{!compact && <span className="mt-0.5 block text-xs text-slate-400">{formatShortDate(node.display_date || node.created_at)}</span>}</span></span>
        </Link>
      </div>
      {hasChildren && expanded && <ul className="mt-0.5">{node.children.map((child) => renderNode(child, depth + 1))}</ul>}
    </li>;
  };

  return <div>
    {hasExpandable && <div className="mb-2 flex items-center justify-between text-xs"><span className="inline-flex items-center gap-1 text-slate-500"><FolderTree className="size-3.5" />文档目录</span><span className="flex gap-2"><button type="button" onClick={expandAll} disabled={expandableIds.every((id) => expandedIds.has(id))} className="text-brand hover:underline disabled:text-slate-300">展开全部</button><button type="button" onClick={collapseAll} className="text-slate-500 hover:text-slate-800">收起全部</button></span></div>}
    <ul className="space-y-0.5">{nodes.map((node) => renderNode(node, 0))}</ul>
  </div>;
}
