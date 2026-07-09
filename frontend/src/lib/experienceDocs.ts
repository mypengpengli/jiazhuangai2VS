import { Article } from '@/types/models';

export type ExperienceDocNode = Article & {
  children: ExperienceDocNode[];
};

export type FlattenedExperienceDoc = {
  article: ExperienceDocNode;
  depth: number;
  path: ExperienceDocNode[];
};

const getArticleTime = (article: Article) =>
  new Date(article.display_date || article.created_at).getTime();

const sortByDisplayDateDesc = (articles: Article[]) =>
  [...articles].sort((a, b) => getArticleTime(b) - getArticleTime(a));

const createsCycle = (
  articleId: number,
  parentId: number,
  nodeMap: Map<number, ExperienceDocNode>
) => {
  let cursor: number | null | undefined = parentId;
  const seen = new Set<number>();

  while (cursor) {
    if (cursor === articleId) {
      return true;
    }

    if (seen.has(cursor)) {
      return false;
    }

    seen.add(cursor);
    cursor = nodeMap.get(cursor)?.parent_id;
  }

  return false;
};

export const buildExperienceDocTree = (articles: Article[]): ExperienceDocNode[] => {
  const sortedArticles = sortByDisplayDateDesc(articles);
  const nodeMap = new Map<number, ExperienceDocNode>();
  const roots: ExperienceDocNode[] = [];

  sortedArticles.forEach((article) => {
    nodeMap.set(article.id, { ...article, children: [] });
  });

  sortedArticles.forEach((article) => {
    const node = nodeMap.get(article.id);
    if (!node) {
      return;
    }

    const parent = article.parent_id ? nodeMap.get(article.parent_id) : null;
    if (parent && parent.id !== node.id && !createsCycle(node.id, parent.id, nodeMap)) {
      parent.children.push(node);
      return;
    }

    roots.push(node);
  });

  return roots;
};

export const flattenExperienceDocTree = (
  nodes: ExperienceDocNode[],
  depth = 0,
  parents: ExperienceDocNode[] = []
): FlattenedExperienceDoc[] =>
  nodes.flatMap((node) => {
    const path = [...parents, node];
    return [
      { article: node, depth, path },
      ...flattenExperienceDocTree(node.children, depth + 1, path),
    ];
  });

export const collectDescendantIds = (
  nodes: ExperienceDocNode[],
  articleId: number
): Set<number> => {
  const descendants = new Set<number>();

  const findAndCollect = (currentNodes: ExperienceDocNode[]): boolean => {
    for (const node of currentNodes) {
      if (node.id === articleId) {
        collectChildren(node);
        return true;
      }

      if (findAndCollect(node.children)) {
        return true;
      }
    }

    return false;
  };

  const collectChildren = (node: ExperienceDocNode) => {
    node.children.forEach((child) => {
      descendants.add(child.id);
      collectChildren(child);
    });
  };

  findAndCollect(nodes);
  return descendants;
};

export const formatDocOptionLabel = (depth: number, title: string) =>
  `${'　'.repeat(depth)}${depth > 0 ? '└ ' : ''}${title}`;
