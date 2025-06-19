import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, uploadImageToR2, deleteImageFromR2, getVipArticle } from '../services/articleService'; // 重新加入 uploadImageToR2
import { authMiddleware } from '../middleware/authMiddleware';
import { Article, CreateArticleInput, ArticleAttachment } from '../models'; // 更新导入

// 定义环境变量和变量类型
type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
};
type Variables = {
    user?: { id: string; username: string };
};

// 实例化 Hono
const articleRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();

// 定义获取文章列表的查询参数 Schema
const getArticlesSchema = z.object({
    page: z.string().regex(/^\d+$/).optional().default('1').transform(Number),
    limit: z.string().regex(/^\d+$/).optional().default('10').transform(Number),
    category: z.string().optional(),
    categories: z.string().optional(), // 新增：支持多个分类，逗号分隔
    sortBy: z.enum(['created_at', 'updated_at', 'title', 'display_date']).optional().default('display_date'),
    orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

// 获取文章列表 (公开访问)
articleRoutes.get(
    '/',
    zValidator('query', getArticlesSchema),
    async (c) => {
        const { page, limit, category, categories, sortBy, orderDirection } = c.req.valid('query');
        console.log(`Route: GET /api/articles - Page: ${page}, Limit: ${limit}, Category: ${category}, Categories: ${categories}, SortBy: ${sortBy}, Order: ${orderDirection}`);
        try {
            // 处理单个或多个分类
            let categorySlugs: string[] = [];
            if (categories) {
                categorySlugs = categories.split(',').map(s => s.trim()).filter(s => s.length > 0);
            } else if (category) {
                categorySlugs = [category];
            }
            
            const result = await getArticles(c.env.DB, { page, limit, categorySlugs, sortBy, orderDirection });
            return c.json(result);
        } catch (error: any) {
            console.error('Error fetching articles:', error);
            return c.json({ error: 'Failed to fetch articles', message: error.message }, 500);
        }
    }
);

// 获取 VIP 文章
articleRoutes.get('/vip', async (c) => {
    console.log(`Route: GET /api/articles/vip`);
    try {
        const article = await getVipArticle(c.env.DB);
        if (!article) {
            return c.json({ error: 'Not Found', message: 'VIP article not found.' }, 404);
        }
        return c.json(article);
    } catch (error: any) {
        console.error('Error fetching VIP article:', error);
        return c.json({ error: 'Failed to fetch VIP article', message: error.message }, 500);
    }
});

// 获取单篇文章详情 (按 slug) (公开访问)
articleRoutes.get(
    '/:slug',
    zValidator('param', z.object({ slug: z.string().min(1, "Slug 不能为空") })),
    async (c) => {
        const { slug } = c.req.valid('param');
        console.log(`Route: GET /api/articles/${slug}`);
        try {
            const article = await getArticleBySlug(c.env.DB, slug);
            if (!article) {
                return c.json({ error: 'Not Found', message: `Article with slug '${slug}' not found.` }, 404);
            }
            return c.json(article);
        } catch (error: any) {
            console.error(`Error fetching article with slug ${slug}:`, error);
            return c.json({ error: 'Failed to fetch article', message: error.message }, 500);
        }
    }
);


// --- 需要认证的路由 ---
const protectedArticleRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();
protectedArticleRoutes.use('*', authMiddleware);

// 定义创建文章的请求体 Schema (使用 nullish 使 zod 输出 type | null | undefined)
const createArticleSchema = z.object({
    title: z.string().min(1, "标题不能为空"),
    // Slug 现在是可选的，如果前端不提供，后端会根据标题生成
    slug: z.string().min(1, "Slug 不能为空").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 格式无效").optional(),
    content_type: z.string().min(1, "内容类型不能为空").default("markdown"), // 新增 content_type
    content: z.string().nullish(),
    category_id: z.number().int().positive().nullish(),
    parent_id: z.number().int().positive().nullish(),
    display_date: z.string().datetime({ message: "display_date 必须是有效的 ISO 8601 日期时间字符串" }).nullish(),
    attachments: z.array(z.object({ // 新增 attachments
        file_type: z.string().min(1),
        file_url: z.string().min(1, "文件路径/key不能为空"),
        filename: z.string().optional(),
        description: z.string().optional(),
        publicUrl: z.string().optional() // 暂时移除 .url() 验证，以便调试
    })).optional().nullable(),
});

// 简单的 slugify 函数 (可以根据需要替换为更健壮的库)
const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-');        // Replace multiple - with single -
};

// 创建文章 (需要认证) - 现在处理 application/json
protectedArticleRoutes.post(
    '/',
    zValidator('json', createArticleSchema), // 使用 zValidator 验证 JSON 请求体
    async (c) => {
        const user = c.get('user');
        const rawJsonData = c.req.valid('json'); // 获取通过 Zod 验证的数据
        console.log(`Route: POST /api/articles (json) by user: ${user?.username}`, rawJsonData);

        try {
            // 如果 slug 未提供，则根据 title 生成
            const slugToUse = rawJsonData.slug || slugify(rawJsonData.title);

            const articleDataForService: CreateArticleInput = {
                title: rawJsonData.title,
                slug: slugToUse,
                content_type: rawJsonData.content_type,
                content: rawJsonData.content === null ? undefined : rawJsonData.content,
                category_id: rawJsonData.category_id === null ? undefined : rawJsonData.category_id,
                parent_id: rawJsonData.parent_id === null ? undefined : rawJsonData.parent_id,
                display_date: rawJsonData.display_date === null ? undefined : rawJsonData.display_date, // 添加 display_date
                attachments: rawJsonData.attachments || undefined,
            };
            
            console.log('Data prepared for createArticle service:', articleDataForService);

            const newArticle = await createArticle(c.env.DB, articleDataForService);
            // newArticle 此时不包含附件的详细信息，如果需要，可以再次查询
            return c.json(newArticle, 201);

        } catch (error: any) {
            console.error('Error processing article creation:', error);
            if (error instanceof z.ZodError) {
                return c.json({ error: 'Validation Failed', issues: error.errors }, 400);
            }
            if (error.message?.includes('already exists')) {
                return c.json({ error: 'Conflict', message: error.message }, 409);
            }
            if (error.message?.includes('FOREIGN KEY constraint failed')) {
                 return c.json({ error: 'Bad Request', message: 'Invalid category_id or parent_id.' }, 400);
            }
            return c.json({ error: 'Failed to create article', message: error.message }, 500);
        }
    }
);

// 定义更新文章的请求体 Schema
const updateArticleSchema = createArticleSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: "请求体不能为空，至少需要提供一个要更新的字段" }
);

// 更新文章 (需要认证) - 处理 multipart/form-data (用于图片更新/删除)
protectedArticleRoutes.put(
    '/:id',
    zValidator('param', z.object({ id: z.string().regex(/^\d+$/, "ID 必须是数字") })),
    zValidator('json', updateArticleSchema), // 恢复使用 zValidator 验证 JSON 请求体
    async (c) => {
        const { id } = c.req.valid('param');
        const rawRequestBody = await c.req.json().catch(e => { console.error("Error parsing raw request body:", e); return {}; });
        console.log(`Route: PUT /api/articles/${id} - Raw Request Body:`, JSON.stringify(rawRequestBody, null, 2));
        
        const articleDataFromRequest = c.req.valid('json'); // 获取通过 Zod 验证的 JSON 数据
        const user = c.get('user');
        const articleId = parseInt(id, 10);
        console.log(`Route: PUT /api/articles/${articleId} (json) by user: ${user?.username}`, articleDataFromRequest);

        try {
            // 准备传递给服务层的数据
            // updateArticleSchema 已经是 partial，所以字段都是可选的
            // attachments 字段会直接传递给 updateArticle 服务 (即使其内部当前未处理)
            const dataToUpdate: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at' | 'category'>> & { attachments?: Partial<ArticleAttachment>[] } = {
                ...articleDataFromRequest,
                // 将 null 值转换成 undefined，因为服务层可能期望 undefined 表示不更新
                category_id: articleDataFromRequest.category_id === null ? undefined : articleDataFromRequest.category_id,
                parent_id: articleDataFromRequest.parent_id === null ? undefined : articleDataFromRequest.parent_id,
                content: articleDataFromRequest.content === null ? undefined : articleDataFromRequest.content,
                display_date: articleDataFromRequest.display_date === null ? undefined : articleDataFromRequest.display_date, // 添加 display_date
                attachments: articleDataFromRequest.attachments === null ? undefined : articleDataFromRequest.attachments,
            };

            // 如果 slug 为空字符串或 null，也设为 undefined，避免更新为空 slug
            if (articleDataFromRequest.slug === '' || articleDataFromRequest.slug === null) {
                dataToUpdate.slug = undefined;
            }

            console.log('Data prepared for updateArticle service:', dataToUpdate);

            const updatedArticle = await updateArticle(c.env.DB, articleId, dataToUpdate);
            if (!updatedArticle) {
                 // 这个情况理论上不应该发生
                return c.json({ error: 'Not Found', message: `Article with ID ${articleId} could not be updated.` }, 404);
            }
            return c.json(updatedArticle);
        } catch (error: any) {
            console.error(`Error updating article ${articleId}:`, error);
            if (error.message?.includes('already exists')) {
                return c.json({ error: 'Conflict', message: error.message }, 409);
            }
            if (error.message?.includes('FOREIGN KEY constraint failed')) {
                 return c.json({ error: 'Bad Request', message: 'Invalid category_id or parent_id.' }, 400);
            }
            return c.json({ error: 'Failed to update article', message: error.message }, 500);
        }
    }
);

// 删除文章 (需要认证)
protectedArticleRoutes.delete(
    '/:id',
    zValidator('param', z.object({ id: z.string().regex(/^\d+$/, "ID 必须是数字") })),
    async (c) => {
        const { id } = c.req.valid('param');
        const user = c.get('user');
        const articleId = parseInt(id, 10);
        console.log(`Route: DELETE /api/articles/${articleId} by user: ${user?.username}`);

        try {
            // TODO: 服务层的 deleteArticle 应该负责处理关联附件的删除 (如果需要)
            const deleted = await deleteArticle(c.env.DB, articleId);

            if (!deleted) {
                // deleteArticle 服务现在会在找不到文章时返回 false
                return c.json({ error: 'Not Found', message: `Article with ID ${articleId} not found or could not be deleted.` }, 404);
            }
            
            // 成功删除
            return c.body(null, 204);
        } catch (error: any) {
            console.error(`Error deleting article ${articleId}:`, error);
            return c.json({ error: 'Failed to delete article', message: error.message }, 500);
        }
    }
);

// 挂载受保护路由
articleRoutes.route('/', protectedArticleRoutes);


export default articleRoutes;