import { Hono } from 'hono';
import { cors } from 'hono/cors'; // 导入 CORS 中间件

// 定义环境变量类型，确保与 wrangler.toml 中的绑定一致
// 这有助于 TypeScript 类型检查
type Env = {
  DB: D1Database;
  BUCKET: R2Bucket; // R2 Bucket 实例绑定
  KV: KVNamespace;
  // 新增: R2 预签名 URL 所需的 Secrets
  R2_BUCKET_NAME: string;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  // JWT_SECRET 是 authMiddleware 所需的，也应在此定义
  JWT_SECRET: string;
  // 如果有其他绑定或环境变量，也在此处添加
};

// 使用泛型绑定环境变量类型
const app = new Hono<{ Bindings: Env }>();

// 1. 应用 CORS 中间件 (确保它是第一个应用的主中间件，除了可能的日志或非常底层的中间件)
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'https://jiazhuangai.com',        // 新增：主站的根域名
      'https://www.jiazhuangai.com',    // 主站的 www 子域名
      'https://jiazhuangai2vs.pages.dev', // Pages 默认域名
      'http://localhost:3000'         // 本地前端开发 URL
    ];

    console.log(`CORS: Request origin: ${origin}`); // 调试日志

    if (!origin) {
      // 对于没有 origin 的请求 (例如直接的 curl 或服务器间请求)，如果允许，可以返回 '*' 或特定源
      // 但对于浏览器发起的 CORS 请求，origin 总是存在的
      // 如果你想允许某些工具或测试脚本，可以返回 '*'，但要小心安全影响
      // 对于浏览器，没有 origin 通常意味着不是一个典型的 CORS 场景
      console.log('CORS: No origin, potentially allowing.');
      return '*'; // 或者根据你的安全策略返回 undefined
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Origin ${origin} is allowed.`);
      return origin;
    }

    // 对于Cloudflare Pages的预览链接，通常格式为 *.pages.dev
    // 这个逻辑可能需要更精确，例如检查特定的项目名
    if (origin.endsWith('.pages.dev')) {
      console.log(`CORS: Origin ${origin} ends with .pages.dev, allowing.`);
      return origin;
    }

    console.log(`CORS: Origin ${origin} is NOT allowed.`);
    return undefined; // 明确拒绝其他源
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Custom-Header'], // 可以根据需要添加更多头部
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
  maxAge: 86400,
  credentials: true,
}));

// 2. 添加网络诊断中间件 (可以放在 CORS 之后，因为它也记录请求信息)
app.use('*', async (c, next) => {
  const start = Date.now();
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const country = c.req.header('CF-IPCountry') || 'unknown';
  const colo = c.req.header('CF-RAY')?.split('-')[1] || 'unknown';
  
  // 记录请求方法和URL，以及来源信息
  console.log(`Request: ${c.req.method} ${c.req.url} | Origin: ${c.req.header('Origin')} | IP: ${clientIP} | Country: ${country} | Colo: ${colo}`);
  
  await next();
  
  // 记录响应时间和状态
  const responseTime = Date.now() - start;
  console.log(`Response: ${c.req.method} ${c.req.url} | Status: ${c.res.status} | Time: ${responseTime}ms`);
});

// 根路由，用于基本测试
app.get('/', (c) => {
  console.log('Accessing root route');
  const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
  const country = c.req.header('CF-IPCountry') || 'unknown';
  return c.text(`Hello from Jiazhuangai AI Backend! Your IP: ${clientIP}, Your Country: ${country}. API is live at api.jiazhuangai.com`);
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

// 导入并挂载 R2 路由
import r2Routes from './routes/r2Routes';
app.route('/api/r2', r2Routes); // 所有 /api/r2/* 的请求都由 r2Routes 处理

// 全局错误处理 (示例)
app.onError((err, c) => {
  console.error('Unhandled Error:', err);
  // 避免在错误响应中直接暴露 err.message 的细节，除非确定是安全的
  return c.json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' }, 500);
});

console.log('Hono app initialized with updated CORS and logging.');

export default app;
// Minor change to trigger redeploy