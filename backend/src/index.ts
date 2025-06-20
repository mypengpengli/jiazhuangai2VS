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

// Global error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;