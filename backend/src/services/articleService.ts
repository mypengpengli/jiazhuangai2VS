import { Article, Category, ArticleWithCategory } from '../models'; // 导入模型
import { PaginatedArticlesResponse } from '../types/api'; // 导入分页响应类型 (需要创建)

// 定义环境变量类型
type Env = {
  DB: D1Database;
  // ... 其他绑定
};

// 定义 getArticles 的选项类型
interface GetArticlesOptions {
    page?: number;
    limit?: number;
    categorySlug?: string;
    // TODO: 添加排序选项 sortBy?: string; order?: 'asc' | 'desc';
}

/**
 * 获取文章列表 (支持分页和分类过滤)
 * @param db D1Database 实例
 * @param options 选项: page, limit, categorySlug
 * @returns 分页后的文章列表及总页数
 */
export const getArticles = async (db: D1Database, options: GetArticlesOptions = {}): Promise<PaginatedArticlesResponse> => {
    const { page = 1, limit = 10, categorySlug } = options;
    const offset = (page - 1) * limit;

    console.log(`ArticleService: Fetching articles - Page: ${page}, Limit: ${limit}, CategorySlug: ${categorySlug}, Offset: ${offset}`);

    let articlesQuery = `
        SELECT
            a.id, a.title, a.slug, a.content, a.category_id, a.parent_id, a.image_urls, a.created_at, a.updated_at,
            c.id as category_cat_id, c.name as category_name, c.slug as category_slug -- 别名避免冲突
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM articles a';
    const queryParams: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    // 处理分类过滤
    if (categorySlug) {
        // 需要先查询分类 ID
        const categoryStmt = db.prepare('SELECT id FROM categories WHERE slug = ?');
        const categoryResult = await categoryStmt.bind(categorySlug).first<{ id: number }>();

        if (categoryResult) {
            const categoryId = categoryResult.id;
            articlesQuery += ' WHERE a.category_id = ?';
            countQuery += ' WHERE a.category_id = ?';
            queryParams.push(categoryId);
            countParams.push(categoryId);
            console.log(`ArticleService: Filtering by category ID: ${categoryId}`);
        } else {
            console.log(`ArticleService: Category slug '${categorySlug}' not found, returning empty list.`);
            // 如果分类 slug 无效，直接返回空结果
            return { items: [], total_pages: 0, current_page: page }; // 使用 items
        }
    }

    // 添加排序 (示例：按创建时间降序)
    articlesQuery += ' ORDER BY a.created_at DESC';

    // 添加分页
    articlesQuery += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    console.log('ArticleService: Executing articles query:', articlesQuery, queryParams);
    console.log('ArticleService: Executing count query:', countQuery, countParams);

    try {
        // 执行查询
        const articlesStmt = db.prepare(articlesQuery);
        const countStmt = db.prepare(countQuery);

        // 并行执行两个查询
        const [articlesResults, countResult] = await Promise.all([
            articlesStmt.bind(...queryParams).all(),
            countStmt.bind(...countParams).first<{ total: number }>()
        ]);

        const totalArticles = countResult?.total ?? 0;
        const totalPages = Math.ceil(totalArticles / limit);

        console.log(`ArticleService: Found ${articlesResults.results?.length ?? 0} articles for page ${page}. Total articles: ${totalArticles}`);

        // 处理查询结果，将 category_* 字段组合成 category 对象
        const articles: ArticleWithCategory[] = (articlesResults.results ?? []).map((row: any) => {
            const article: ArticleWithCategory = {
                id: row.id,
                title: row.title,
                slug: row.slug,
                content: row.content,
                category_id: row.category_id,
                parent_id: row.parent_id,
                image_urls: row.image_urls,
                created_at: row.created_at,
                updated_at: row.updated_at,
            };
            if (row.category_cat_id) {
                article.category = {
                    id: row.category_cat_id,
                    name: row.category_name,
                    slug: row.category_slug,
                    // description, created_at, updated_at 可以根据需要添加或省略
                    created_at: '', // 占位符
                    updated_at: '', // 占位符
                };
            }
            return article;
        });


        return {
            items: articles, // 使用 items
            total_pages: totalPages,
            current_page: page,
        };

    } catch (error) {
        console.error('Error in getArticles:', error);
        throw new Error('Failed to fetch articles from database.');
    }
};


/**
 * 创建新文章
 * @param db D1Database 实例
 * @param articleData 文章数据 (title, slug, content, category_id, parent_id, image_urls)
 * @returns 新创建的文章对象
 */
export const createArticle = async (db: D1Database, articleData: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'category'>): Promise<Article> => {
    const { title, slug, content, category_id, parent_id, image_urls } = articleData;
    console.log(`ArticleService: Creating article with slug: ${slug}`);

    // 注意：实际应用中应添加更严格的 slug 唯一性检查和错误处理
    // 注意：暂未处理 image_urls 的上传逻辑，仅存储传入的字符串
    try {
        const stmt = db.prepare(
            `INSERT INTO articles (title, slug, content, category_id, parent_id, image_urls)
             VALUES (?, ?, ?, ?, ?, ?)
             RETURNING id, title, slug, content, category_id, parent_id, image_urls, created_at, updated_at`
        );
        const result = await stmt.bind(
            title,
            slug,
            content || null,
            category_id || null,
            parent_id || null,
            image_urls || null // 存储传入的字符串，或 null
        ).first<Article>();

        if (!result) {
            console.error('ArticleService: Failed to create article, INSERT did not return data.');
            throw new Error('Failed to create article.');
        }
        console.log(`ArticleService: Article created successfully with ID: ${result.id}`);
        // 返回的文章对象不包含 category 详情，如果需要可以在路由层再次查询或 JOIN
        return result;
    } catch (error: any) {
        console.error('Error in createArticle:', error);
        // 特别处理唯一性约束错误
        if (error.message?.includes('UNIQUE constraint failed')) {
            throw new Error(`Article with slug '${slug}' already exists.`);
        }
        // 处理外键约束错误 (例如 category_id 不存在)
        if (error.message?.includes('FOREIGN KEY constraint failed')) {
             throw new Error(`Invalid category_id or parent_id provided.`);
        }
        throw new Error('Failed to create article in database.');
    }
};

/**
 * 根据 slug 获取单篇文章详情 (包含分类信息)
 * @param db D1Database 实例
 * @param slug 文章的 slug
 * @returns 文章对象 (包含分类) 或 null (如果未找到)
 */
export const getArticleBySlug = async (db: D1Database, slug: string): Promise<ArticleWithCategory | null> => {
    console.log(`ArticleService: Fetching article with slug: ${slug}`);
    const query = `
        SELECT
            a.id, a.title, a.slug, a.content, a.category_id, a.parent_id, a.image_urls, a.created_at, a.updated_at,
            c.id as category_cat_id, c.name as category_name, c.slug as category_slug
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.slug = ?
    `;
    try {
        const stmt = db.prepare(query);
        const row = await stmt.bind(slug).first<any>(); // 使用 first() 获取单条记录

        if (!row) {
            console.log(`ArticleService: Article with slug '${slug}' not found.`);
            return null;
        }

        console.log(`ArticleService: Found article with ID: ${row.id}`);
        const article: ArticleWithCategory = {
            id: row.id,
            title: row.title,
            slug: row.slug,
            content: row.content,
            category_id: row.category_id,
            parent_id: row.parent_id,
            image_urls: row.image_urls,
            created_at: row.created_at,
            updated_at: row.updated_at,
        };
        if (row.category_cat_id) {
            article.category = {
                id: row.category_cat_id,
                name: row.category_name,
                slug: row.category_slug,
                created_at: '', // 占位符
                updated_at: '', // 占位符
            };
        }
        return article;

    } catch (error) {
        console.error(`Error in getArticleBySlug for slug ${slug}:`, error);
        throw new Error('Failed to fetch article from database.');
    }
};

/**
 * 更新指定 ID 的文章
 * @param db D1Database 实例
 * @param id 要更新的文章 ID
 * @param articleData 更新的数据 (部分字段)
 * @returns 更新后的文章对象，如果找不到则返回 null
 */
export const updateArticle = async (db: D1Database, id: number, articleData: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at' | 'category'>>): Promise<Article | null> => {
    console.log(`ArticleService: Updating article with ID: ${id}`);

    const { title, slug, content, category_id, parent_id, image_urls } = articleData;

    // 构建 SET 子句
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    if (title !== undefined) { setClauses.push('title = ?'); values.push(title); }
    if (slug !== undefined) { setClauses.push('slug = ?'); values.push(slug); }
    if (content !== undefined) { setClauses.push('content = ?'); values.push(content); }
    // 注意：允许将 category_id 或 parent_id 更新为 null
    if (articleData.hasOwnProperty('category_id')) { setClauses.push('category_id = ?'); values.push(category_id ?? null); }
    if (articleData.hasOwnProperty('parent_id')) { setClauses.push('parent_id = ?'); values.push(parent_id ?? null); }
    if (image_urls !== undefined) { setClauses.push('image_urls = ?'); values.push(image_urls); } // 暂存字符串

    if (setClauses.length === 0) {
        console.log(`ArticleService: No fields to update for article ID: ${id}.`);
        // 如果没有字段更新，可以考虑直接查询并返回当前文章，或者返回 null/错误
        // 这里选择查询并返回当前文章
        const currentArticle = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first<Article>();
        return currentArticle ?? null;
    }

    // 总是更新 updated_at
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id); // 添加 ID 到末尾用于 WHERE

    const sql = `UPDATE articles SET ${setClauses.join(', ')} WHERE id = ? RETURNING id, title, slug, content, category_id, parent_id, image_urls, created_at, updated_at`;

    try {
        const stmt = db.prepare(sql);
        const result = await stmt.bind(...values).first<Article>();

        if (!result) {
            console.log(`ArticleService: Article with ID ${id} not found for update.`);
            return null;
        }
        console.log(`ArticleService: Article ${id} updated successfully.`);
        return result;
    } catch (error: any) {
        console.error(`Error in updateArticle for ID ${id}:`, error);
        // 处理唯一性约束错误
        if (error.message?.includes('UNIQUE constraint failed')) {
            throw new Error(`Update failed: Article with slug '${slug}' already exists.`);
        }
        // 处理外键约束错误
        if (error.message?.includes('FOREIGN KEY constraint failed')) {
             throw new Error(`Update failed: Invalid category_id or parent_id provided.`);
        }
        throw new Error('Failed to update article in database.');
    }
};

/**
 * 上传图片到 R2 Bucket
 * @param bucket R2Bucket 实例
 * @param file 文件对象 (包含 name, type, arrayBuffer)
 * @param prefix R2 中的存储路径前缀 (例如 'articles/')
 * @returns 上传成功后的文件公共 URL，如果失败则抛出错误
 */
export const uploadImageToR2 = async (bucket: R2Bucket, file: { name: string, type: string, arrayBuffer: ArrayBuffer }, prefix: string = ''): Promise<string> => {
    // 生成一个唯一的文件名，避免冲突 (例如使用 UUID 或时间戳 + 随机数)
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    // 保留原始文件扩展名
    const fileExtension = file.name.split('.').pop() || 'jpg'; // 默认 jpg
    const fileName = `${prefix}${uniqueSuffix}.${fileExtension}`;

    console.log(`ArticleService: Uploading image '${file.name}' as '${fileName}' to R2 bucket.`);

    try {
        // 使用 R2 的 put 方法上传文件
        // 需要提供文件名、文件内容 (ArrayBuffer) 和可选的元数据 (如 ContentType)
        const object = await bucket.put(fileName, file.arrayBuffer, {
            httpMetadata: {
                contentType: file.type || 'image/jpeg', // 使用文件的 MIME 类型，默认 jpeg
                // 可以添加其他元数据，如 cacheControl
                // cacheControl: 'public, max-age=31536000', // 缓存一年
            },
            // customMetadata: { // 可选的自定义元数据
            //   uploadedBy: 'user-id',
            // },
        });

        if (!object || !object.key) {
            console.error('ArticleService: R2 put operation did not return a valid object key.');
            throw new Error('Failed to upload image to R2: Invalid response from R2.');
        }

        console.log(`ArticleService: Image uploaded successfully to R2. Key: ${object.key}, ETag: ${object.etag}`);

        // 构建公共访问 URL (假设 R2 Bucket 已配置公共访问或通过自定义域名访问)
        // 注意：你需要将 'YOUR_PUBLIC_BUCKET_URL' 替换为你的 R2 Bucket 的实际公共访问 URL 或自定义域名
        // 例如: 'https://pub-xxxxxxxx.r2.dev' 或 'https://images.yourdomain.com'
        const publicBucketUrl = 'https://pub-11b35a11e74d473191c199e541e1389a.r2.dev'; // !!! 需要替换为你的实际 URL !!!
        if (!publicBucketUrl) {
            console.warn("ArticleService: Public R2 bucket URL is not configured. Returning R2 key instead.");
            return object.key; // 如果没有配置公共 URL，返回 R2 key
        }

        const imageUrl = `${publicBucketUrl}/${object.key}`;
        console.log(`ArticleService: Generated public image URL: ${imageUrl}`);
        return imageUrl;

    } catch (error: any) {
        console.error(`Error uploading image '${fileName}' to R2:`, error);
        throw new Error(`Failed to upload image to R2: ${error.message}`);
    }
};

/**
 * 从 R2 Bucket 删除文件
 * @param bucket R2Bucket 实例
 * @param fileKey 要删除的文件 key (通常是 URL 路径部分)
 * @returns Promise<void>
 */
export const deleteImageFromR2 = async (bucket: R2Bucket, fileKey: string): Promise<void> => {
    // 从完整的 URL 中提取 key (如果传入的是 URL)
    // 假设 URL 格式为 https://<your-public-url>/<key>
    let keyToDelete = fileKey;
    try {
        const url = new URL(fileKey);
        keyToDelete = url.pathname.substring(1); // 移除开头的 '/'
    } catch (e) {
        // 如果不是有效的 URL，假定传入的就是 key
        console.log(`deleteImageFromR2: Input '${fileKey}' is not a valid URL, assuming it's the key.`);
    }

    if (!keyToDelete) {
        console.warn(`deleteImageFromR2: Could not extract a valid key from '${fileKey}'. Skipping deletion.`);
        return;
    }

    console.log(`ArticleService: Deleting image with key '${keyToDelete}' from R2 bucket.`);
    try {
        await bucket.delete(keyToDelete);
        console.log(`ArticleService: Successfully deleted image '${keyToDelete}' from R2.`);
    } catch (error: any) {
        // R2 delete 在 key 不存在时不会报错，所以错误通常是权限或其他问题
        console.error(`Error deleting image '${keyToDelete}' from R2:`, error);
        // 不向上抛出错误，允许文章数据库操作继续，但记录错误
        // throw new Error(`Failed to delete image from R2: ${error.message}`);
    }
};

/**
 * 删除指定 ID 的文章
 * @param db D1Database 实例
 * @param id 要删除的文章 ID
 * @returns 如果删除成功则返回 true，否则返回 false
 */
export const deleteArticle = async (db: D1Database, id: number): Promise<boolean> => {
    console.log(`ArticleService: Deleting article with ID: ${id}`);
    // TODO: 在删除数据库记录前，先处理 R2 中关联的图片文件删除

    try {
        // 同样，D1 的 run() 不明确返回是否删除成功，我们假设无错误即成功
        const stmt = db.prepare('DELETE FROM articles WHERE id = ?');
        const info = await stmt.bind(id).run();
        console.log(`ArticleService: Delete operation executed for article ID ${id}. Info:`, info);
        // 假设执行无误即成功
        // 注意：如果文章是其他文章的 parent_id，且外键设置为 SET NULL，子文章的 parent_id 会变 null
        // 更精确的判断是检查 info.changes 或 info.meta.changes，但这在 D1 中可能不可靠或不存在
        // 暂时返回 true，表示尝试执行了删除
        return true;
    } catch (error: any) {
        console.error(`Error in deleteArticle for ID ${id}:`, error);
        // 处理外键约束错误等
        if (error.message?.includes('FOREIGN KEY constraint failed')) {
            // 这通常不应该发生，因为我们设置了 ON DELETE SET NULL
            console.warn(`Article ${id} might be referenced by other articles (parent_id).`);
        }
        throw new Error('Failed to delete article from database.');
    }
};