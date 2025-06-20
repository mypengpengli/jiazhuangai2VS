import { D1Database } from '@cloudflare/workers-types';
import { Article, Category } from '../models'; // 修正路径 ../models

/**
 * 确保 "本站推荐" (VIP) 分类和特定文章存在于数据库中。
 * @param db D1Database 实例
 */
export const ensureVipContent = async (db: D1Database): Promise<void> => {
    const vipCategorySlug = 'vip';
    const vipCategoryName = '本站推荐';
    const vipArticleTitle = '关于如何领取咸鱼这家的免费试吃教程';
    const vipArticleSlug = 'free-trial-tutorial-for-xianyu'; // 为VIP文章定义一个固定的slug

    try {
        // 1. 检查并创建 "本站推荐" 分类
        let category = await db.prepare('SELECT id, slug FROM categories WHERE slug = ?').bind(vipCategorySlug).first<Category>();

        if (!category) {
            console.log(`Category '${vipCategoryName}' not found, creating it...`);
            const catInsertResult = await db.prepare('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) RETURNING id, slug')
                .bind(vipCategoryName, vipCategorySlug, '本站分析后推荐内容')
                .first<Category>();
            if (!catInsertResult) {
                throw new Error('Failed to create VIP category.');
            }
            category = catInsertResult;
            console.log(`Category '${vipCategoryName}' created successfully with ID: ${category.id}`);
        } else {
            // console.log(`Category '${vipCategoryName}' already exists with ID: ${category.id}`);
        }

        const categoryId = category.id;

        // 2. 检查并创建特定的VIP文章
        const article = await db.prepare('SELECT id FROM articles WHERE slug = ?').bind(vipArticleSlug).first<Article>();

        if (!article) {
            console.log(`VIP article '${vipArticleTitle}' not found, creating it...`);
            const articleInsertResult = await db.prepare(
                `INSERT INTO articles (title, slug, content_type, content, category_id, display_date)
                 VALUES (?, ?, ?, ?, ?, ?)`
            ).bind(
                vipArticleTitle,
                vipArticleSlug,
                'html', // 'html' or 'markdown'
                '<p>这是关于如何领取咸鱼App商家免费试吃活动的详细教程。</p><p>步骤一：打开咸鱼App...</p>', // 示例内容
                categoryId,
                new Date().toISOString()
            ).run();

            if (articleInsertResult.meta.changes === 0) {
                 throw new Error('Failed to create VIP article.');
            }
            console.log(`VIP article '${vipArticleTitle}' created successfully.`);
        } else {
            //  console.log(`VIP article '${vipArticleTitle}' (slug: ${vipArticleSlug}) already exists.`);
        }
    } catch (error: any) {
        console.error('Error in ensureVipContent:', error);
        throw new Error(`Failed to ensure VIP content exists: ${error.message}`);
    }
}; 