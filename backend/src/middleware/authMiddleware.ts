import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';

type Env = { JWT_SECRET?: string; DB?: D1Database };
type Variables = { user?: { sub: string; username: string; role: string; iat: number; exp: number } };

export type AuthUser = NonNullable<Variables['user']>;

export const authMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
  const authorization = c.req.header('Authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

  if (!token) {
    return c.json({ error: 'Unauthorized', message: '请先登录后再继续。' }, 401);
  }

  if (!c.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured.');
    return c.json({ error: 'Internal Server Error', message: '认证服务配置异常。' }, 500);
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET) as AuthUser;
    if (c.env.DB) {
      const account = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(Number(payload.sub)).first<{ role: string } | null>();
      if (!account) {
        return c.json({ error: 'Unauthorized', message: '账户不存在或已失效。' }, 401);
      }
      payload.role = account.role;
      try {
        const state = await c.env.DB.prepare('SELECT is_active FROM users WHERE id = ?').bind(Number(payload.sub)).first<{ is_active: number } | null>();
        if (state && state.is_active === 0) {
          return c.json({ error: 'Unauthorized', message: '该账户已被停用。' }, 401);
        }
      } catch {
        // Existing deployments may not have the additive is_active column until a user logs in.
      }
    }
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized', message: '登录已失效，请重新登录。' }, 401);
  }
};

export const adminMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
  if (c.get('user')?.role !== 'admin') {
    return c.json({ error: 'Forbidden', message: '需要管理员权限。' }, 403);
  }
  await next();
};
