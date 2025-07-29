import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';

// Import individual route handlers
import authRoutes from './routes/auth';
import articleRoutes from './routes/articles';
import categoryRoutes from './routes/categories';
import r2Routes from './routes/r2Routes';

// Define the environment variables binding
export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  R2_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

// Apply CORS middleware to all routes
app.use('*', cors());

// Register existing API routes
app.route('/api/auth', authRoutes);
app.route('/api/articles', articleRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/r2', r2Routes);

// Debug route to check bindings
app.get('/api/debug', async (c) => {
  const env = c.env;
  const bindings = {
    hasDB: !!env.DB,
    hasKV: !!(env as any).KV,
    hasBucket: !!(env as any).R2_BUCKET || !!(env as any).BUCKET,
    hasJWT: !!env.JWT_SECRET,
    envKeys: Object.keys(env),
  };
  
  // Try to query categories if DB exists
  let categoriesError = null;
  let categoriesCount = 0;
  
  if (env.DB) {
    try {
      const result = await env.DB.prepare('SELECT COUNT(*) as count FROM categories').first<{count: number}>();
      categoriesCount = result?.count || 0;
    } catch (e: any) {
      categoriesError = e.message || String(e);
    }
  }
  
  return c.json({
    bindings,
    database: {
      bound: !!env.DB,
      categoriesCount,
      error: categoriesError,
    },
    request: {
      url: c.req.url,
      headers: Object.fromEntries(c.req.raw.headers.entries()),
    },
  });
});

// Global error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;