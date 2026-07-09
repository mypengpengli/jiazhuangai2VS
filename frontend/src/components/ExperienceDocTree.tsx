'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExperienceDocNode } from '@/lib/experienceDocs';

type ExperienceDocTreeProps = {
  nodes: ExperienceDocNode[];
  activeId?: number;
  activePathIds?: number[];
};

const formatDate = (node: ExperienceDocNode) =>
  new Date(node.display_date || node.created_at).toLocaleDateString('zh-CN');

const collectExpandableIds = (nodes: ExperienceDocNode[]): number[] =>
  nodes.flatMap((node) => [
    ...(node.children.length > 0 ? [node.id] : []),
    ...collectExpandableIds(node.children),
  ]);

const TreeNode = ({
  node,
  activeId,
  expandedIds,
  onToggle,
  nested = false,
}: {
  node: ExperienceDocNode;
  activeId?: number;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  nested?: boolean;
}) => {
  const active = activeId === node.id;
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.id);

  return (
    <li>
      <div className="flex items-start gap-1">
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          disabled={!hasChildren}
          title={hasChildren ? (expanded ? '收起' : '展开') : '没有子文档'}
          aria-label={hasChildren ? `${expanded ? '收起' : '展开'} ${node.title}` : `${node.title} 没有子文档`}
          aria-expanded={hasChildren ? expanded : undefined}
          className={`mt-2.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border text-xs transition ${
            hasChildren
              ? 'border-slate-200 bg-white/75 text-slate-500 hover:border-cyan-200 hover:bg-cyan-50 hover:text-sky-700'
              : 'cursor-default border-transparent bg-transparent text-slate-300'
          }`}
        >
          {hasChildren ? (expanded ? '▾' : '▸') : '·'}
        </button>

        <Link href={`/experience?slug=${node.slug}`} aria-current={active ? 'page' : undefined} className="min-w-0 flex-1">
          <span
            className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
              active
                ? 'border-cyan-200 bg-cyan-50/90 text-sky-800 shadow-sm shadow-cyan-500/10'
                : 'border-transparent text-slate-600 hover:border-white/80 hover:bg-white/80 hover:text-sky-700'
            }`}
          >
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-white/70 text-xs">
              {hasChildren ? '▣' : '□'}
            </span>
            <span className="min-w-0">
              <span className="line-clamp-2 font-medium">{node.title}</span>
              <span className="mt-0.5 block text-xs text-slate-400">{formatDate(node)}</span>
            </span>
          </span>
        </Link>
      </div>

      {hasChildren && expanded && (
        <ul className={`mt-1 space-y-1 border-l border-slate-200/80 pl-3 ${nested ? 'ml-4' : 'ml-6'}`}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeId={activeId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              nested
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const ExperienceDocTree: React.FC<ExperienceDocTreeProps> = ({ nodes, activeId, activePathIds = [] }) => {
  const expandableIds = useMemo(() => collectExpandableIds(nodes), [nodes]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(
    () => new Set(activePathIds.filter((id) => expandableIds.includes(id)))
  );
  const allExpanded = expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id));

  const toggleNode = (id: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(expandableIds));
  const collapseAll = () => setExpandedIds(new Set(activePathIds.filter((id) => expandableIds.includes(id))));

  return (
    <div>
      {expandableIds.length > 0 && (
        <div className="mb-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={expandAll}
            disabled={allExpanded}
            className="rounded-lg border border-white/80 bg-white/65 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-cyan-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            展开全部
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-white/80 bg-white/65 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-cyan-50 hover:text-sky-700"
          >
            收起全部
          </button>
        </div>
      )}

      <ul className="space-y-1">
        {nodes.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            activeId={activeId}
            expandedIds={expandedIds}
            onToggle={toggleNode}
          />
        ))}
      </ul>
    </div>
  );
};

export default ExperienceDocTree;
