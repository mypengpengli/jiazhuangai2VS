import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';

// Import individual route handlers
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import categoryRoutes from './routes/categories';
import r2Routes from './routes/r2Routes';
import { ensureVipContent } from './utils/bootstrap'; // 导入初始化函数

// Define the environment variables binding
export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  R2_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

// 初始化检查
app.use('*', async (c, next) => {
  if (c.env.DB) {
    try {
      await ensureVipContent(c.env.DB);
      console.log("Bootstrap check completed successfully.");
    } catch (e) {
      console.error("Bootstrap check failed:", e);
      // 在生产环境中，您可能不希望因为这个错误而中断服务
    }
  }
  await next();
});

// Apply CORS middleware to all routes
app.use('*', cors());

// Temporary route for database fix
app.get('/api/database-fix', async (c) => {
    const db = c.env.DB;
    try {
        const statements = [
            db.prepare(`INSERT OR IGNORE INTO categories (name, slug, description) VALUES ('本站推荐', 'ben-zhan-tui-jian', '本站推荐的精选文章');`),
            db.prepare(`INSERT OR IGNORE INTO categories (name, slug, description) VALUES ('AI科普', 'ai-ke-pu', '关于人工智能的基础知识和科普。');`),
            db.prepare(`INSERT OR IGNORE INTO categories (name, slug, description) VALUES ('大语言模型', 'da-yu-yan-mo-xing', '关于大语言模型的深入探讨。');`),
            db.prepare(`INSERT OR IGNORE INTO categories (name, slug, description) VALUES ('生物模型', 'sheng-wu-mo-xing', '生物学与AI的交叉领域。');`),
            db.prepare(`INSERT OR IGNORE INTO categories (name, slug, description) VALUES ('视频模型', 'shi-pin-mo-xing', 'AI在视频生成和处理中的应用。');`),
            db.prepare(`INSERT OR IGNORE INTO categories (name, slug, description) VALUES ('AI编舞', 'ai-bian-wu', '探索AI在舞蹈和艺术创作中的应用。');`),
            db.prepare(`INSERT OR IGNORE INTO categories (name, slug, description) VALUES ('AI工具', 'ai-gong-ju', '实用AI工具的介绍和教程。');`)
        ];
        
        await db.batch(statements);
        
        return c.json({ success: true, message: 'Database categories have been successfully restored.' });

    } catch (error: any) {
        console.error('Database fix error:', error);
        return c.json({ success: false, message: 'Failed to fix database.', error: error.message }, 500);
    }
});


// Register existing API routes
app.route('/api/auth', authRoutes);
app.route('/api/articles', articleRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/r2', r2Routes);

// Global error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;