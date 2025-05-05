import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getArticles, getArticleBySlug, createArticle, updateArticle, deleteArticle, uploadImageToR2, deleteImageFromR2 } from '../services/articleService'; // 导入 deleteImageFromR2
import { authMiddleware } from '../middleware/authMiddleware';
import { Article } from '../models'; // 导入 Article 类型

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
    slug: z.string().min(1, "Slug 不能为空").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 格式无效"),
    content: z.string().nullish(), // 允许 null 或 undefined
    category_id: z.number().int().positive().nullish(), // 允许 null 或 undefined
    parent_id: z.number().int().positive().nullish(), // 允许 null 或 undefined
    image_urls: z.string().nullish(), // 允许 null 或 undefined
});


// 创建文章 (需要认证) - 处理 multipart/form-data
protectedArticleRoutes.post(
    '/',
    async (c) => {
        const user = c.get('user');
        console.log(`Route: POST /api/articles (multipart) by user: ${user?.username}`);

        let imageUrl: string | undefined = undefined;
        let parsedData: any = {};

        try {
            const formData = await c.req.formData();
            const imageFile = formData.get('image'); // 类型是 FormDataEntryValue | null

            // 提取文本字段
            for (const [key, value] of formData.entries()) {
                if (key !== 'image' && typeof value === 'string') {
                    if (key === 'category_id' || key === 'parent_id') {
                        parsedData[key] = value === '' ? null : parseInt(value, 10);
                        if (isNaN(parsedData[key])) parsedData[key] = null;
                    } else if (key === 'content' || key === 'image_urls') {
                        // 对于可能为空字符串但也应视为 null 的字段
                        parsedData[key] = value === '' ? null : value;
                    }
                     else {
                        parsedData[key] = value;
                    }
                }
            }
             console.log('Parsed form data (text fields):', parsedData);

            // 手动验证文本字段
            const validatedData = createArticleSchema.parse(parsedData);
             console.log('Validated text data:', validatedData);

            // 处理图片上传 (使用更可靠的类型检查，替换 FormDataEntryValue)
            const isFile = (value: string | File | null): value is File => {
                return value !== null && typeof value === 'object' && value instanceof File;
            }

            if (isFile(imageFile) && imageFile.size > 0) {
                 console.log(`Received image file: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`);
                if (!imageFile.type.startsWith('image/')) {
                    return c.json({ error: 'Bad Request', message: 'Uploaded file is not an image.' }, 400);
                }
                const arrayBuffer = await imageFile.arrayBuffer();
                imageUrl = await uploadImageToR2(c.env.BUCKET, {
                    name: imageFile.name,
                    type: imageFile.type,
                    arrayBuffer: arrayBuffer,
                }, 'articles/');
                 console.log('Image uploaded, URL:', imageUrl);
            } else if (imageFile) {
                 console.log('Image field present but not a valid file or empty.');
            }

            // 准备传递给 createArticle 的数据 (将 null 转为 undefined 以匹配 Omit<Article...>)
            const articleToCreate: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'category'> = {
                title: validatedData.title,
                slug: validatedData.slug,
                content: validatedData.content === null ? undefined : validatedData.content,
                category_id: validatedData.category_id === null ? undefined : validatedData.category_id,
                parent_id: validatedData.parent_id === null ? undefined : validatedData.parent_id,
                // 优先使用上传的 imageUrl (string | undefined)，否则使用表单验证过的 image_urls (string | null | undefined)，最后转为 undefined
                image_urls: imageUrl ?? (validatedData.image_urls === null ? undefined : validatedData.image_urls),
            };
             console.log('Data prepared for createArticle:', articleToCreate);

            const newArticle = await createArticle(c.env.DB, articleToCreate);
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
            const currentArticleInfo = await c.env.DB.prepare("SELECT image_urls FROM articles WHERE id = ?").bind(articleId).first<{ image_urls: string | null }>();
            if (!currentArticleInfo) {
                return c.json({ error: 'Not Found', message: `Article with ID ${articleId} not found.` }, 404);
            }
            const oldImageUrl = currentArticleInfo.image_urls;
            console.log(`Current image URL for article ${articleId}: ${oldImageUrl}`);

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
                    } else if (key === 'content' || key === 'image_urls') {
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
                if (oldImageUrl) {
                    console.log(`Attempting to delete old image from R2: ${oldImageUrl}`);
                    await deleteImageFromR2(c.env.BUCKET, oldImageUrl);
                }
                newImageUrl = null; // 标记为需要删除 (null)
            }

            // 5. 处理新图片上传 (仅当没有设置删除标记时)
            const isFile = (value: string | File | null): value is File => value !== null && typeof value === 'object' && value instanceof File;
            if (!shouldDeleteImage && isFile(imageFile) && imageFile.size > 0) {
                console.log(`Received new image file: ${imageFile.name}`);
                if (!imageFile.type.startsWith('image/')) {
                    return c.json({ error: 'Bad Request', message: 'Uploaded file is not an image.' }, 400);
                }
                // 删除旧图片（如果存在）
                if (oldImageUrl) {
                    console.log(`Attempting to delete old image before uploading new one: ${oldImageUrl}`);
                    await deleteImageFromR2(c.env.BUCKET, oldImageUrl);
                }
                // 上传新图片
                const arrayBuffer = await imageFile.arrayBuffer();
                newImageUrl = await uploadImageToR2(c.env.BUCKET, { name: imageFile.name, type: imageFile.type, arrayBuffer }, 'articles/');
                console.log('New image uploaded, URL:', newImageUrl); // newImageUrl 是 string
            } else if (imageFile) {
                 console.log('Image field present but not a valid file or empty.');
            }

            // 6. 准备最终更新数据 (将 null 转为 undefined)
            const dataToUpdate: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at' | 'category'>> = {};
             for (const key in validatedData) {
                if (Object.prototype.hasOwnProperty.call(validatedData, key)) {
                    const typedKey = key as keyof typeof validatedData;
                    const value = validatedData[typedKey];
                    // @ts-ignore - 将 null 转为 undefined
                    dataToUpdate[typedKey] = value === null ? undefined : value;
                }
            }

            // 如果处理了图片（删除或上传），则更新 image_urls
            // newImageUrl 是 string | null | undefined
            if (newImageUrl !== undefined) {
                // 将 null 转为 undefined 以匹配 Partial<Omit<...>>
                dataToUpdate.image_urls = newImageUrl === null ? undefined : newImageUrl;
            }
            // 如果 newImageUrl 是 undefined (即未处理图片)，则 dataToUpdate.image_urls 将保持 validatedData 中的值 (可能为 string | null | undefined)，
            // 并且在上面的循环中已经被转换为 string | undefined

            console.log('Data prepared for updateArticle:', dataToUpdate);

             // 检查是否有任何字段需要更新 (包括 image_urls)
            if (Object.keys(dataToUpdate).length === 0) {
                console.log(`No fields to update for article ${articleId}.`);
                 const currentFullArticle = await getArticleBySlug(c.env.DB, id); // 重新获取完整信息返回
                 return c.json(currentFullArticle ?? currentArticleInfo); // 优先返回带分类的，否则返回基础信息
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
            // 1. 先获取文章信息，以便知道是否有图片需要删除
            const articleToDelete = await getArticleBySlug(c.env.DB, id); // 使用 getArticleBySlug 或直接查询 ID
            // 或者直接查询 ID 获取 image_urls
            // const articleInfo = await c.env.DB.prepare("SELECT image_urls FROM articles WHERE id = ?").bind(articleId).first<{ image_urls: string | null }>();


            if (!articleToDelete) {
                 return c.json({ error: 'Not Found', message: `Article with ID ${articleId} not found.` }, 404);
            }

            // 2. 如果存在图片 URL，尝试从 R2 删除
            if (articleToDelete.image_urls) {
                console.log(`Attempting to delete image from R2: ${articleToDelete.image_urls}`);
                await deleteImageFromR2(c.env.BUCKET, articleToDelete.image_urls);
                // 注意：deleteImageFromR2 内部处理了错误，不会阻止后续操作
            } else {
                console.log(`Article ${articleId} has no image_urls to delete from R2.`);
            }

            // 3. 删除数据库记录
            const deleted = await deleteArticle(c.env.DB, articleId);
            if (!deleted) {
                // 理论上，如果上面找到了文章，这里应该能删除成功，除非并发问题或数据库错误
                console.error(`Failed to delete article ${articleId} from DB after finding it.`);
                return c.json({ error: 'Internal Server Error', message: `Failed to delete article ${articleId} from database.` }, 500);
            }
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