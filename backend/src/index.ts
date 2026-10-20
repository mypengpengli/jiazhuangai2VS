import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Import individual route handlers
import authRoutes from './routes/auth';
import articleListOptimizedRoutes from './routes/articleListOptimized';
import articleRoutes from './routes/articles';
import categoryRoutes from './routes/categories';
import r2Routes from './routes/r2Routes';
import subscribeRoutes from './routes/subscribe';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';

// Define the environment variables binding
export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  R2_BUCKET: R2Bucket;
  RESEND_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

const allowedOrigins = new Set([
  'https://jiazhuangai.com',
  'https://www.jiazhuangai.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

app.use('/api/*', cors({
  origin: (origin) => (allowedOrigins.has(origin) ? origin : ''),
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
}));

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

// Register the optimized public list route before the legacy article router.
// The optimized route handles GET /api/articles and avoids the legacy full-table COUNT scan.
app.route('/api/articles', articleListOptimizedRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/articles', articleRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/r2', r2Routes);
app.route('/api/subscribe', subscribeRoutes);
app.route('/api/comments', commentRoutes);
app.route('/api/users', userRoutes);

// Global error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error', message: '服务暂时不可用，请稍后再试。' }, 500);
});

export default app;
