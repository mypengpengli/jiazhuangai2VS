import { Hono } from 'hono';

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