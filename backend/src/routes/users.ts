import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { adminMiddleware, authMiddleware, AuthUser } from '../middleware/authMiddleware';
import { getAdminUsers, updateAdminUser } from '../services/authService';

type Env = { DB: D1Database; JWT_SECRET?: string };
type Variables = { user?: AuthUser };
const userRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
userRoutes.use('*', authMiddleware);
userRoutes.use('*', adminMiddleware);

userRoutes.get('/', async (c) => {
  try { return c.json({ items: await getAdminUsers(c.env.DB) }); }
  catch (error) { console.error('List users failed:', error); return c.json({ error: '用户列表加载失败。' }, 500); }
});

userRoutes.patch('/:id', zValidator('param', z.object({ id: z.string().regex(/^\d+$/) })), zValidator('json', z.object({ is_active: z.number().int().min(0).max(1).optional(), role: z.enum(['user', 'admin']).optional() }).refine((value) => value.is_active !== undefined || value.role !== undefined)), async (c) => {
  const currentUser = c.get('user');
  const id = Number(c.req.valid('param').id);
  if (Number(currentUser?.sub) === id) return c.json({ error: '不能修改当前管理员自己的状态或角色。' }, 400);
  try {
    const user = await updateAdminUser(c.env.DB, id, c.req.valid('json'));
    if (!user) return c.json({ error: '用户未找到。' }, 404);
    return c.json(user);
  } catch (error) { console.error('Update user failed:', error); return c.json({ error: '用户更新失败。' }, 500); }
});

export default userRoutes;
