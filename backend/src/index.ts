import { Hono } from 'hono';
import { cors } from 'hono/cors'; // 导入 CORS 中间件

// 定义环境变量类型，确保与 wrangler.toml 中的绑定一致
// 这有助于 TypeScript 类型检查
type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;
  // 如果有其他绑定或环境变量，也在此处添加
};

// 使用泛型绑定环境变量类型
const app = new Hono<{ Bindings: Env }>();

// 应用 CORS 中间件
// 这应该放在所有路由定义之前，或者至少是需要 CORS 的路由之前
app.use('*', cors({
  origin: (origin) => {
    // 允许来自您的前端应用的请求
    // TODO: 在生产环境中，您可能希望更严格地控制允许的源
    // 例如，从环境变量读取允许的源列表
    const allowedOrigins = [
      'https://jiazhuangai2vs.pages.dev', // 您的生产前端 URL
      'http://localhost:3000' // 本地前端开发 URL (如果端口不同请修改)
    ];
    if (allowedOrigins.includes(origin)) {
      return origin;
    }
    // 对于其他源，可以不返回，或者返回一个默认的安全源（如果适用）
    // 如果不希望允许其他源，可以返回 undefined 或者一个固定的不允许的源
    return 'https://jiazhuangai2vs.pages.dev'; // 默认允许生产前端
  },
  allowHeaders: ['Content-Type', 'Authorization'], // 确保 Content-Type 被允许, Authorization 为 JWT 准备
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'], // 确保 OPTIONS 和 POST 被允许
  maxAge: 600, // 预检请求的缓存时间
  credentials: true, // 如果您需要发送 cookies 或认证头部
}));

// 根路由，用于基本测试
app.get('/', (c) => {
  console.log('Accessing root route'); // 添加日志方便调试
  return c.text('Hello from Jiazhuangai AI Backend!');
});

// 导入并挂载认证路由
import authRoutes from './routes/auth';
app.route('/api/auth', authRoutes); // 所有 /api/auth/* 的请求都由 authRoutes 处理

// 导入并挂载分类路由
import categoryRoutes from './routes/categories';
app.route('/api/categories', categoryRoutes); // 所有 /api/categories/* 的请求都由 categoryRoutes 处理

// 导入并挂载文章路由
import articleRoutes from './routes/articles';
app.route('/api/articles', articleRoutes); // 所有 /api/articles/* 的请求都由 articleRoutes 处理

// 全局错误处理 (示例)
app.onError((err, c) => {
  console.error('Unhandled Error:', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

console.log('Hono app initialized'); // 确认应用初始化

export default app;