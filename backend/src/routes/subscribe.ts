import { Hono } from 'hono';
import type { Env } from '../index';

const subscribeRoutes = new Hono<{ Bindings: Env }>();

// 订阅邮件
subscribeRoutes.post('/', async (c) => {
  try {
    const { email } = await c.req.json();
    
    // 验证邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: '请输入有效的邮箱地址' }, 400);
    }
    
    // 检查是否已订阅
    const existing = await c.env.DB.prepare(
      'SELECT id FROM subscribers WHERE email = ?'
    ).bind(email).first();
    
    if (existing) {
      return c.json({ message: '该邮箱已订阅', alreadySubscribed: true }, 200);
    }
    
    // 插入新订阅
    await c.env.DB.prepare(
      'INSERT INTO subscribers (email) VALUES (?)'
    ).bind(email).run();
    
    return c.json({ message: '订阅成功！感谢您的关注', success: true }, 201);
  } catch (error: any) {
    console.error('Subscribe error:', error);
    return c.json({ error: '订阅失败，请稍后重试' }, 500);
  }
});

// 取消订阅
subscribeRoutes.delete('/', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: '请提供邮箱地址' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      'DELETE FROM subscribers WHERE email = ?'
    ).bind(email).run();
    
    if (result.meta.changes === 0) {
      return c.json({ error: '该邮箱未订阅' }, 404);
    }
    
    return c.json({ message: '已取消订阅', success: true }, 200);
  } catch (error: any) {
    console.error('Unsubscribe error:', error);
    return c.json({ error: '取消订阅失败' }, 500);
  }
});

// 获取订阅者列表（需要管理员权限，后续可加 auth middleware）
subscribeRoutes.get('/list', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT id, email, subscribed_at FROM subscribers ORDER BY subscribed_at DESC'
    ).all();
    
    return c.json({ subscribers: result.results, total: result.results.length });
  } catch (error: any) {
    console.error('List subscribers error:', error);
    return c.json({ error: '获取订阅列表失败' }, 500);
  }
});

export default subscribeRoutes;
