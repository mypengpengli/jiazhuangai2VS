import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, uploadImageToR2, deleteImageFromR2 } from '../services/articleService'; // 重新加入 uploadImageToR2
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
});

// 获取文章列表 (公开访问)
articleRoutes.get(
    '/',
    zValidator('query', getArticlesSchema),
    async (c) => {
        const { page, limit, category } = c.req.valid('query');
        console.log(`Route: GET /api/articles - Page: ${page}, Limit: ${limit}, Category: ${category}`);
        try {
            const result = await getArticles(c.env.DB, { page, limit, categorySlug: category });
            return c.json(result);
        } catch (error: any) {
            console.error('Error fetching articles:', error);
            return c.json({ error: 'Failed to fetch articles', message: error.message }, 500);
        }
    }
);

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
    attachments: z.array(z.object({ // 新增 attachments
        file_type: z.string().min(1),
        file_url: z.string().url("文件URL无效"),
        filename: z.string().optional(),
        description: z.string().optional()
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
    // 不再使用 zValidator('json')
    async (c) => {
        const { id } = c.req.valid('param');
        const user = c.get('user');
        const articleId = parseInt(id, 10);
        console.log(`Route: PUT /api/articles/${articleId} (multipart) by user: ${user?.username}`);

        let newImageUrl: string | null | undefined = undefined; // undefined: 未指定, null: 删除, string: 新 URL
        let parsedData: any = {};

        try {
            // 1. 获取当前文章信息 (需要旧 image_urls)
            // 使用 getArticleBySlug 获取更完整的文章信息可能更好，但只查 ID 也可以
            // const currentArticleInfo = await c.env.DB.prepare("SELECT image_urls FROM articles WHERE id = ?").bind(articleId).first<{ image_urls: string | null }>();
            // if (!currentArticleInfo) {
            //     return c.json({ error: 'Not Found', message: `Article with ID ${articleId} not found.` }, 404);
            // }
            // const oldImageUrl = currentArticleInfo.image_urls;
            // console.log(`Current image URL for article ${articleId}: ${oldImageUrl}`);
            // 暂时不处理旧图片URL，因为模型已更改

            // 2. 解析 formData
            const formData = await c.req.formData();
            const imageFile = formData.get('image');
            const deleteImageFlag = formData.get('delete_image'); // 检查删除标记

            // 提取文本字段
            for (const [key, value] of formData.entries()) {
                 if (key !== 'image' && key !== 'delete_image' && typeof value === 'string') {
                     if (key === 'category_id' || key === 'parent_id') {
                        parsedData[key] = value === '' ? null : parseInt(value, 10);
                        if (isNaN(parsedData[key])) parsedData[key] = null;
                    } else if (key === 'content' || key === 'image_urls') { // image_urls will be ignored by schema if not present
                        parsedData[key] = value === '' ? null : value;
                    }
                     else {
                        parsedData[key] = value;
                    }
                }
            }
            console.log('Parsed form data (text fields):', parsedData);

            // 3. 手动验证文本字段 (使用 update schema)
            const validatedData = updateArticleSchema.parse(parsedData);
            console.log('Validated text data:', validatedData);

            // 4. 处理图片删除标记
            const shouldDeleteImage = deleteImageFlag === 'true' || deleteImageFlag === '1';
            if (shouldDeleteImage) {
                console.log(`Delete image flag is set for article ${articleId}.`);
                // if (oldImageUrl) { // oldImageUrl 逻辑已移除
                //     console.log(`Attempting to delete old image from R2: ${oldImageUrl}`);
                //     await deleteImageFromR2(c.env.BUCKET, oldImageUrl);
                // }
                // newImageUrl = null; // 标记为需要删除 (null) - 这部分逻辑需要与新的 attachments 模型结合
            }

            // 5. 处理新图片上传 (仅当没有设置删除标记时)
            const isFile = (value: string | File | null): value is File => value !== null && typeof value === 'object' && value instanceof File;
            if (!shouldDeleteImage && isFile(imageFile) && imageFile.size > 0) {
                console.log(`Received new image file: ${imageFile.name}`);
                if (!imageFile.type.startsWith('image/')) {
                    return c.json({ error: 'Bad Request', message: 'Uploaded file is not an image.' }, 400);
                }
                // 删除旧图片（如果存在）- 逻辑已移除
                // 上传新图片
                const arrayBuffer = await imageFile.arrayBuffer();
                // newImageUrl = await uploadImageToR2(c.env.BUCKET, { name: imageFile.name, type: imageFile.type, arrayBuffer }, 'articles/');
                // console.log('New image uploaded, URL:', newImageUrl);
                // TODO: 上传的图片URL/Key需要通过 attachments 传递给 updateArticle 服务
            } else if (imageFile) {
                 console.log('Image field present but not a valid file or empty.');
            }

            // 6. 准备最终更新数据 (将 null 转为 undefined)
            const dataToUpdate: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at' | 'category'>> = {};
             for (const key in validatedData) {
                if (Object.prototype.hasOwnProperty.call(validatedData, key)) {
                    const typedKey = key as keyof typeof validatedData;
                    // 确保 key 存在于 dataToUpdate 的类型中
                    if (typedKey === 'title' || typedKey === 'slug' || typedKey === 'content' || typedKey === 'category_id' || typedKey === 'parent_id' || typedKey === 'content_type') {
                        const value = validatedData[typedKey];
                         // @ts-ignore
                        dataToUpdate[typedKey] = value === null ? undefined : value;
                    }
                }
            }
            
            // image_urls 相关的逻辑已移除，附件更新将通过新的机制处理
            // if (newImageUrl !== undefined) {
            //     dataToUpdate.image_urls = newImageUrl === null ? undefined : newImageUrl;
            // }

            console.log('Data prepared for updateArticle:', dataToUpdate);

             // 检查是否有任何字段需要更新
            if (Object.keys(dataToUpdate).length === 0) {
                console.log(`No fields to update for article ${articleId}.`);
                 const currentFullArticle = await getArticleBySlug(c.env.DB, id); // 重新获取完整信息返回
                 if (!currentFullArticle) {
                    return c.json({ error: 'Not Found', message: `Article with ID ${articleId} not found.` }, 404);
                 }
                 return c.json(currentFullArticle);
            }

            // 7. 调用服务函数更新数据库
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