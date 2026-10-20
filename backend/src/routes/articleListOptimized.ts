import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const EXPERIENCE_CATEGORY_SLUG = 'site-experience';

type Env = {
  DB: D1Database;
};

type ArticleListRow = {
  id: number;
  title: string;
  slug: string;
  content_type: string;
  content?: string | null;
  category_id: number | null;
  parent_id: number | null;
  sort_order?: number;
  display_date: string | null;
  view_count: number | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  category_cat_id: number | null;
  category_name: string | null;
  category_slug: string | null;
};

const querySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1').transform(Number).pipe(z.number().min(1).max(1000)),
  limit: z.string().regex(/^\d+$/).optional().default('10').transform(Number).pipe(z.number().min(1).max(200)),
  category: z.string().optional(),
  categories: z.string().optional(),
  search: z.string().optional(),
  includeContent: z.enum(['true', 'false']).optional().default('false').transform((value) => value === 'true'),
  sortBy: z.enum(['created_at', 'updated_at', 'title', 'display_date', 'view_count']).optional().default('display_date'),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

const listRoutes = new Hono<{ Bindings: Env }>();

const resolveCategoryIds = async (db: D1Database, slugs: string[]): Promise<number[]> => {
  if (!slugs.length) return [];
  const placeholders = slugs.map(() => '?').join(',');
  const { results } = await db
    .prepare(`SELECT id FROM categories WHERE slug IN (${placeholders})`)
    .bind(...slugs)
    .all<{ id: number }>();
  return (results || []).map((row) => row.id);
};

const getFastTotal = async (
  db: D1Database,
  categoryIds: number[],
  excludedCategoryId: number | null,
): Promise<number | undefined> => {
  try {
    if (categoryIds.length) {
      const placeholders = categoryIds.map(() => '?').join(',');
      const row = await db
        .prepare(`SELECT COALESCE(SUM(article_count), 0) AS total FROM article_count_stats WHERE category_id IN (${placeholders})`)
        .bind(...categoryIds)
        .first<{ total: number }>();
      return Number(row?.total || 0);
    }

    if (excludedCategoryId !== null) {
      const row = await db
        .prepare('SELECT COALESCE(SUM(article_count), 0) AS total FROM article_count_stats WHERE category_id != ?')
        .bind(excludedCategoryId)
        .first<{ total: number }>();
      return Number(row?.total || 0);
    }

    const row = await db
      .prepare('SELECT COALESCE(SUM(article_count), 0) AS total FROM article_count_stats')
      .first<{ total: number }>();
    return Number(row?.total || 0);
  } catch {
    // Allows the code to deploy safely before the migration is applied.
    return undefined;
  }
};

listRoutes.get(
  '/',
  zValidator('query', querySchema),
  async (c) => {
    const { page, limit, category, categories, search, includeContent, sortBy, orderDirection } = c.req.valid('query');
    const searchText = search?.trim();
    const requestedSlugs = (categories ? categories.split(',') : category ? [category] : [])
      .map((slug) => slug.trim())
      .filter(Boolean);

    try {
      const categoryIds = await resolveCategoryIds(c.env.DB, requestedSlugs);
      if (requestedSlugs.length && categoryIds.length === 0) {
        return c.json({ items: [], current_page: page, total_pages: 0, total_items: 0, has_more: false });
      }

      let excludedCategoryId: number | null = null;
      if (!requestedSlugs.length) {
        const experienceCategory = await c.env.DB
          .prepare('SELECT id FROM categories WHERE slug = ?')
          .bind(EXPERIENCE_CATEGORY_SLUG)
          .first<{ id: number }>();
        excludedCategoryId = experienceCategory?.id ?? null;
      }

      const fields = `
        a.id, a.title, a.slug, a.content_type${includeContent ? ', a.content' : ''},
        a.category_id, a.parent_id, a.sort_order, a.display_date, a.view_count,
        a.created_at, a.updated_at,
        (SELECT file_url
           FROM article_attachments aa
          WHERE aa.article_id = a.id AND aa.file_type = 'image'
          ORDER BY aa.id ASC
          LIMIT 1) AS cover_image,
        c.id AS category_cat_id, c.name AS category_name, c.slug AS category_slug
      `;

      let sql = `SELECT ${fields} FROM articles a LEFT JOIN categories c ON a.category_id = c.id`;
      const where: string[] = [];
      const params: Array<string | number> = [];

      if (categoryIds.length) {
        const placeholders = categoryIds.map(() => '?').join(',');
        where.push(`a.category_id IN (${placeholders})`);
        params.push(...categoryIds);
      } else if (excludedCategoryId !== null) {
        // "IS NOT" also keeps rows whose category_id is NULL.
        where.push('a.category_id IS NOT ?');
        params.push(excludedCategoryId);
      }

      if (searchText) {
        const term = `%${searchText}%`;
        where.push('(a.title LIKE ? OR a.content LIKE ?)');
        params.push(term, term);
      }

      if (where.length) sql += ` WHERE ${where.join(' AND ')}`;

      const direction = orderDirection === 'asc' ? 'ASC' : 'DESC';
      switch (sortBy) {
        case 'title':
          sql += ` ORDER BY a.title ${direction}, a.id DESC`;
          break;
        case 'updated_at':
          sql += ` ORDER BY a.updated_at ${direction}, a.id DESC`;
          break;
        case 'view_count':
          sql += ` ORDER BY a.view_count ${direction}, a.display_date DESC, a.id DESC`;
          break;
        case 'created_at':
          sql += ` ORDER BY a.created_at ${direction}, a.id DESC`;
          break;
        case 'display_date':
        default:
          // Migration 0005 backfills display_date and adds an index for this exact order.
          sql += ` ORDER BY a.display_date ${direction}, a.created_at ${direction}, a.id DESC`;
          break;
      }

      // Read one extra row instead of running COUNT(*) for every page request.
      const offset = (page - 1) * limit;
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit + 1, offset);

      const { results } = await c.env.DB.prepare(sql).bind(...params).all<ArticleListRow>();
      const rows = results || [];
      const hasMore = rows.length > limit;
      const visibleRows = hasMore ? rows.slice(0, limit) : rows;

      const items = visibleRows.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        content_type: row.content_type,
        ...(includeContent ? { content: row.content } : {}),
        category_id: row.category_id,
        parent_id: row.parent_id,
        sort_order: row.sort_order ?? 0,
        display_date: row.display_date,
        view_count: row.view_count ?? 0,
        cover_image: row.cover_image || null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        ...(row.category_cat_id
          ? {
              category: {
                id: row.category_cat_id,
                name: row.category_name,
                slug: row.category_slug,
                created_at: '',
                updated_at: '',
              },
            }
          : {}),
      }));

      // Exact totals are cheap for normal/category browsing via a tiny counter table.
      // Text search deliberately skips an exact COUNT(*) to avoid full-table scans.
      const totalItems = searchText ? undefined : await getFastTotal(c.env.DB, categoryIds, excludedCategoryId);
      const totalPages = totalItems !== undefined
        ? Math.ceil(totalItems / limit)
        : page + (hasMore ? 1 : 0);

      c.header('Cache-Control', searchText
        ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=120'
        : 'public, max-age=0, s-maxage=300, stale-while-revalidate=900');

      return c.json({
        items,
        current_page: page,
        total_pages: totalPages,
        ...(totalItems !== undefined ? { total_items: totalItems } : {}),
        has_more: hasMore,
      });
    } catch (error) {
      console.error('Optimized article list failed:', error);
      return c.json({ error: '文章列表加载失败，请稍后重试。' }, 500);
    }
  },
);

export default listRoutes;
