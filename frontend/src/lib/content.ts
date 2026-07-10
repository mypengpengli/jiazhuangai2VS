import GithubSlugger from 'github-slugger';
import rehypeParse from 'rehype-parse';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

export type DocumentHeading = {
  id: string;
  text: string;
  level: number;
};

type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const allowedSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), 'target', 'rel'],
    code: [...(defaultSchema.attributes?.code || []), 'className'],
    img: [...(defaultSchema.attributes?.img || []), 'width', 'height', 'loading'],
  },
};

const textFromNode = (node: HastNode): string => {
  if (node.type === 'text') {
    return node.value || '';
  }

  return (node.children || []).map(textFromNode).join('');
};

const normalizeTitle = (value: string) => value.replace(/\s+/g, ' ').trim();
const removeUnsafeBlocks = (value: string) => value.replace(/<\s*(script|style|noscript)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '');

export const extractPlainText = (value?: string | null) => removeUnsafeBlocks(value || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[#*`>\-\[\]()!|]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const createProcessor = () => unified().use(rehypeParse, { fragment: true }).use(rehypeSanitize, allowedSchema);

const stringify = (tree: HastNode) => String(unified().use(rehypeStringify).stringify(tree as never));

export const prepareArticleHtml = async (
  html: string | null | undefined,
  articleTitle?: string
): Promise<{ html: string; headings: DocumentHeading[] }> => {
  if (!html) {
    return { html: '', headings: [] };
  }

  const processor = createProcessor();
  // Legacy editor content can contain complete style/script blocks. Sanitization
  // removes their tags, but not always the text nodes inside them.
  const safeSource = removeUnsafeBlocks(html);
  const parsedTree = processor.parse(safeSource);
  const tree = await processor.run(parsedTree) as HastNode;
  const title = articleTitle ? normalizeTitle(articleTitle) : '';
  const slugger = new GithubSlugger();
  const headings: DocumentHeading[] = [];
  let duplicateTitleRemoved = false;

  visit(tree as never, 'element', (node: HastNode, index, parent: HastNode | undefined) => {
    if (!node.tagName) {
      return;
    }

    const text = normalizeTitle(textFromNode(node));
    if (!duplicateTitleRemoved && node.tagName === 'h1' && title && text === title && parent?.children && index !== undefined) {
      parent.children.splice(index, 1);
      duplicateTitleRemoved = true;
      return;
    }

    if (node.tagName === 'h2' || node.tagName === 'h3') {
      const id = slugger.slug(text || 'section');
      node.properties = { ...(node.properties || {}), id };
      headings.push({ id, text, level: Number(node.tagName.slice(1)) });
    }
  });

  return { html: stringify(tree), headings };
};

export const normalizeMarkdownContent = (content: string | null | undefined, title?: string) => {
  if (!content || !title) {
    return content || '';
  }

  const lines = content.split('\n');
  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0);
  if (firstContentIndex < 0) {
    return content;
  }

  const match = lines[firstContentIndex].match(/^#\s+(.+)$/);
  if (match && normalizeTitle(match[1]) === normalizeTitle(title)) {
    lines.splice(firstContentIndex, 1);
    if (lines[firstContentIndex] === '') {
      lines.splice(firstContentIndex, 1);
    }
  }

  return lines.join('\n');
};
