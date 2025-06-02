import { Article, Category, ArticleWithCategoryAndAttachments, CreateArticleInput, ArticleAttachment } from '../models'; // 导入模型
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
    categorySlug?: string; // 保持向后兼容
    categorySlugs?: string[]; // 新增：支持多个分类
    sortBy?: 'created_at' | 'updated_at' | 'title' | 'display_date'; // 添加 display_date
    orderDirection?: 'asc' | 'desc';
}

/**
 * 获取文章列表 (支持分页和分类过滤)
 * @param db D1Database 实例
 * @param options 选项: page, limit, categorySlug
 * @returns 分页后的文章列表及总页数
 */
export const getArticles = async (db: D1Database, options: GetArticlesOptions = {}): Promise<PaginatedArticlesResponse> => {
    const { page = 1, limit = 10, categorySlug, categorySlugs, sortBy = 'display_date', orderDirection = 'desc' } = options; // 默认按 display_date 降序
    const offset = (page - 1) * limit;

    console.log(`ArticleService: Fetching articles - Page: ${page}, Limit: ${limit}, CategorySlug: ${categorySlug}, CategorySlugs: ${categorySlugs}, SortBy: ${sortBy}, Order: ${orderDirection}, Offset: ${offset}`);

    let articlesQuery = `
        SELECT
            a.id, a.title, a.slug, a.content_type, a.content, a.category_id, a.parent_id, a.display_date, a.created_at, a.updated_at,
            c.id as category_cat_id, c.name as category_name, c.slug as category_slug -- 别名避免冲突
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM articles a';
    const queryParams: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    // 处理分类过滤：支持单个或多个分类
    const effectiveCategorySlugs = categorySlugs || (categorySlug ? [categorySlug] : []);
    
    if (effectiveCategorySlugs.length > 0) {
        // 查询所有相关分类的ID
        const placeholders = effectiveCategorySlugs.map(() => '?').join(',');
        const categoryStmt = db.prepare(`SELECT id FROM categories WHERE slug IN (${placeholders})`);
        const categoryResults = await categoryStmt.bind(...effectiveCategorySlugs).all<{ id: number }>();

        if (categoryResults.results && categoryResults.results.length > 0) {
            const categoryIds = categoryResults.results.map(row => row.id);
            const idPlaceholders = categoryIds.map(() => '?').join(',');
            
            articlesQuery += ` WHERE a.category_id IN (${idPlaceholders})`;
            countQuery += ` WHERE a.category_id IN (${idPlaceholders})`;
            queryParams.push(...categoryIds);
            countParams.push(...categoryIds);
            
            console.log(`ArticleService: Filtering by category IDs: ${categoryIds.join(', ')}`);
        } else {
            console.log(`ArticleService: Category slugs '${effectiveCategorySlugs.join(', ')}' not found, returning empty list.`);
            // 如果分类 slug 无效，直接返回空结果
            return { items: [], total_pages: 0, current_page: page }; // 使用 items
        }
    }

    // 添加排序
    let orderByClause = 'ORDER BY ';
    switch (sortBy) {
        case 'title':
            orderByClause += 'a.title';
            break;
        case 'updated_at':
            orderByClause += 'a.updated_at';
            break;
        case 'display_date':
            // 使用 COALESCE 处理 NULL display_date，使其按 created_at 排序
            orderByClause += `COALESCE(a.display_date, a.created_at)`;
            break;
        case 'created_at':
        default:
            orderByClause += 'a.created_at';
            break;
    }
    orderByClause += orderDirection === 'asc' ? ' ASC' : ' DESC';
    // 添加次级排序
    // 如果主排序是 display_date (现在是 COALESCE)，则次级排序仍然可以是 created_at (如果需要更细致的控制)
    // 或者，如果 COALESCE 已经足够，可以简化这里的次级排序逻辑
    // 为保持明确，如果主排序键已经是基于日期的，我们仍然可以按 created_at 做最终稳定排序
    if (sortBy === 'display_date') {
        // 主排序已经是 COALESCE(a.display_date, a.created_at)
        // 如果希望在 COALESCE 结果相同的情况下，再按原始 created_at 排序（虽然 COALESCE 已经用了它）
        // 可以保留 a.created_at DESC，或者如果认为 COALESCE 后的主排序已足够，可以移除此特定次级排序
        orderByClause += ', a.created_at DESC';
    } else if (sortBy !== 'created_at') {
        // 对于非日期主排序，仍然使用 display_date (COALESCE) 和 created_at 作为次级
        orderByClause += `, COALESCE(a.display_date, a.created_at) DESC, a.created_at DESC`;
    }


    articlesQuery += ` ${orderByClause}`;

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
        const articles: ArticleWithCategoryAndAttachments[] = (articlesResults.results ?? []).map((row: any) => {
            const article: ArticleWithCategoryAndAttachments = {
                id: row.id,
                title: row.title,
                slug: row.slug,
                content_type: row.content_type,
                content: row.content,
                category_id: row.category_id,
                parent_id: row.parent_id,
                display_date: row.display_date, // 添加 display_date
                created_at: row.created_at,
                updated_at: row.updated_at,
                // attachments: [] // 暂时不填充附件
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
 * @param articleData 文章数据 (包含 content_type 和可选的 attachments)
 * @returns 新创建的文章对象
 */
export const createArticle = async (db: D1Database, articleData: CreateArticleInput): Promise<Article> => {
    // display_date 现在是可选的，在 CreateArticleInput 中定义
    const { title, slug, content_type, content, category_id, parent_id, attachments, display_date } = articleData;
    // 如果 display_date 未提供或为 null，则使用当前时间作为默认值
    const finalDisplayDate = display_date || new Date().toISOString();
    console.log(`ArticleService: Creating article with slug: ${slug}, content_type: ${content_type}, display_date: ${finalDisplayDate}`);

    try {
        // 1. 插入文章
        const createdArticleResult = await db.prepare(
            `INSERT INTO articles (title, slug, content_type, content, category_id, parent_id, display_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             RETURNING id, title, slug, content_type, content, category_id, parent_id, display_date, created_at, updated_at`
        ).bind(
            title,
            slug,
            content_type,
            content || null,
            category_id || null,
            parent_id || null,
            finalDisplayDate // 绑定处理后的 display_date
        ).first<Article>();

        if (!createdArticleResult || !createdArticleResult.id) {
            console.error('ArticleService: Failed to create article, INSERT did not return data or ID.');
            throw new Error('Failed to create article.');
        }
        const articleId = createdArticleResult.id;
        console.log(`ArticleService: Article base created successfully with ID: ${articleId}`);

        // 2. 如果有附件，插入附件
        if (attachments && attachments.length > 0) {
            const attachmentStatements = attachments.map(att =>
                db.prepare(
                    `INSERT INTO article_attachments (article_id, file_type, file_url, filename, description)
                     VALUES (?, ?, ?, ?, ?)`
                ).bind(articleId, att.file_type, att.file_url, att.filename || null, att.description || null)
            );
            
            console.log(`ArticleService: Preparing to insert ${attachmentStatements.length} attachments for article ID ${articleId}`);
            await db.batch(attachmentStatements);
            console.log(`ArticleService: Attachments inserted successfully for article ID ${articleId}`);
        }
        
        return createdArticleResult;

    } catch (error: any) {
        console.error('Error in createArticle:', error);
        if (error.message?.includes('UNIQUE constraint failed')) {
            throw new Error(`Article with slug '${slug}' already exists.`);
        }
        if (error.message?.includes('FOREIGN KEY constraint failed')) {
             throw new Error(`Invalid category_id or parent_id provided.`);
        }
        throw new Error('Failed to create article in database.');
    }
};

/**
 * 根据 slug 获取单篇文章详情 (包含分类信息和附件)
 * @param db D1Database 实例
 * @param slug 文章的 slug
 * @returns 文章对象 (包含分类和附件) 或 null (如果未找到)
 */
export const getArticleBySlug = async (db: D1Database, slug: string): Promise<ArticleWithCategoryAndAttachments | null> => {
    console.log(`ArticleService: Fetching article with slug: ${slug}`);
    const articleQuery = `
        SELECT
            a.id, a.title, a.slug, a.content_type, a.content, a.category_id, a.parent_id, a.display_date, a.created_at, a.updated_at,
            c.id as category_cat_id, c.name as category_name, c.slug as category_slug
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.slug = ?
    `;
    
    try {
        const articleStmt = db.prepare(articleQuery);
        const articleRow = await articleStmt.bind(slug).first<any>();

        if (!articleRow) {
            console.log(`ArticleService: Article with slug '${slug}' not found.`);
            return null;
        }

        console.log(`ArticleService: Found article with ID: ${articleRow.id}`);
        
        // 获取附件信息
        const attachmentsQuery = `
            SELECT id, article_id, file_type, file_url, filename, description, created_at
            FROM article_attachments
            WHERE article_id = ?
        `;
        const attachmentsStmt = db.prepare(attachmentsQuery);
        const attachmentsResult = await attachmentsStmt.bind(articleRow.id).all<ArticleAttachment>();
        
        const article: ArticleWithCategoryAndAttachments = {
            id: articleRow.id,
            title: articleRow.title,
            slug: articleRow.slug,
            content_type: articleRow.content_type,
            content: articleRow.content,
            category_id: articleRow.category_id,
            parent_id: articleRow.parent_id,
            display_date: articleRow.display_date, // 添加 display_date
            created_at: articleRow.created_at,
            updated_at: articleRow.updated_at,
            attachments: attachmentsResult.results || [],
        };

        if (articleRow.category_cat_id) {
            article.category = {
                id: articleRow.category_cat_id,
                name: articleRow.category_name,
                slug: articleRow.category_slug,
                created_at: '', // 占位符, D1 不直接返回这些，除非在 JOIN 中明确选择
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
export const updateArticle = async (db: D1Database, id: number, articleData: Partial<Omit<Article, 'id' | 'created_at' | 'updated_at'>> & { attachments?: Partial<ArticleAttachment>[] }): Promise<Article | null> => {
console.log(`ArticleService: Attempting to update article with ID: ${id}. Received raw articleData:`, JSON.stringify(articleData, null, 2));
    console.log(`ArticleService: Updating article with ID: ${id}`);

    // 解构时排除 attachments，单独处理
    const { attachments, display_date, ...articleBaseFields } = articleData;
    const { title, slug, content_type, content, category_id, parent_id } = articleBaseFields;


    // 构建 SET 子句
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    if (title !== undefined) { setClauses.push('title = ?'); values.push(title); }
    if (slug !== undefined) { setClauses.push('slug = ?'); values.push(slug); }
    if (content_type !== undefined) { setClauses.push('content_type = ?'); values.push(content_type); }
    if (content !== undefined) { setClauses.push('content = ?'); values.push(content); }
    if (articleData.hasOwnProperty('category_id')) { setClauses.push('category_id = ?'); values.push(category_id ?? null); }
    if (articleData.hasOwnProperty('parent_id')) { setClauses.push('parent_id = ?'); values.push(parent_id ?? null); }
    if (articleData.hasOwnProperty('display_date')) {
        setClauses.push('display_date = ?');
        values.push(display_date === undefined ? null : display_date); // 修复类型错误，undefined 转为 null
    }

    if (setClauses.length === 0 && (!attachments || attachments.length === 0)) {
        console.log(`ArticleService: No fields or attachments to update for article ID: ${id}.`);
        const currentArticle = await db.prepare('SELECT id, title, slug, content_type, content, category_id, parent_id, display_date, created_at, updated_at FROM articles WHERE id = ?').bind(id).first<Article>();
        return currentArticle ?? null;
    }
    
    if (setClauses.length > 0 && !setClauses.some(clause => clause.startsWith('updated_at ='))) { // 确保不重复添加 updated_at
        setClauses.push('updated_at = CURRENT_TIMESTAMP');
    }
console.log(`ArticleService: SQL Update - Constructed SET Clauses: ${setClauses.join(', ')}`);
    console.log(`ArticleService: SQL Update - Constructed Values for bind: ${JSON.stringify(values)}`);
    
    // TODO: 实现附件的更新逻辑 (删除旧的，添加新的)
    // 这部分比较复杂，暂时跳过，仅更新文章主表字段
    // if (attachments) {
    //     // 1. 删除与此文章关联的所有旧附件 (简单策略，或者可以做更细致的比较)
    //     const deleteAttachmentsStmt = db.prepare('DELETE FROM article_attachments WHERE article_id = ?').bind(id);
    //     updateStatements.push(deleteAttachmentsStmt);
    //     // 2. 插入新的附件
    //     attachments.forEach(att => {
    //         if (att.file_type && att.file_url) { // 确保基本字段存在
    //             const insertAttachmentStmt = db.prepare(
    //                 `INSERT INTO article_attachments (article_id, file_type, file_url, filename, description)
    //                  VALUES (?, ?, ?, ?, ?)`
    //             ).bind(id, att.file_type, att.file_url, att.filename || null, att.description || null);
    //             updateStatements.push(insertAttachmentStmt);
    //         }
    //     });
    // }


    try {
        let updatedArticle: Article | null = null;
        if (setClauses.length > 0) {
            const articleUpdateSql = `UPDATE articles SET ${setClauses.join(', ')} WHERE id = ? RETURNING id, title, slug, content_type, content, category_id, parent_id, display_date, created_at, updated_at`;
            updatedArticle = await db.prepare(articleUpdateSql).bind(...values, id).first<Article>();
console.log('ArticleService: SQL Update - RETURNING updatedArticle from DB:', JSON.stringify(updatedArticle, null, 2));
        } else if (attachments && attachments.length > 0) {
            // 如果只更新附件 (当前附件更新逻辑未完成)，需要先获取当前文章信息
            updatedArticle = await db.prepare('SELECT id, title, slug, content_type, content, category_id, parent_id, display_date, created_at, updated_at FROM articles WHERE id = ?').bind(id).first<Article>();
        }


        if (!updatedArticle) {
            console.log(`ArticleService: Article with ID ${id} not found for update.`);
            return null;
        }
        
        // TODO: 在事务中处理附件更新
        // if (attachments) { ... }


        console.log(`ArticleService: Article ${id} updated successfully.`);
        return updatedArticle;
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

        if (info.meta.changes > 0) {
            console.log(`ArticleService: Article with ID ${id} successfully deleted.`);
            return true; // 成功删除
        } else {
            console.log(`ArticleService: Article with ID ${id} not found for deletion.`);
            return false; // 未找到要删除的文章
        }
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