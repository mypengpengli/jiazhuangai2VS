import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { adminMiddleware, authMiddleware, AuthUser } from '../middleware/authMiddleware';

type Env = { DB: D1Database; RESEND_API_KEY?: string; JWT_SECRET?: string };
type Variables = { user?: AuthUser };
const subscribeRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const unsubscribeToken = (email: string, secret?: string) => secret
  ? sign({ email, purpose: 'unsubscribe', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180 }, secret)
  : Promise.resolve('');

const sendWelcomeEmail = async (email: string, apiKey: string, token: string) => {
  const unsubscribeUrl = token ? `https://jiazhuangai.com/unsubscribe?token=${encodeURIComponent(token)}` : 'https://jiazhuangai.com';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: '加装AI助手 <noreply@jiazhuangai.com>',
      to: email,
      subject: '欢迎订阅加装AI助手',
      html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px"><h1>欢迎订阅加装AI助手</h1><p>我们会发送值得关注的 AI 模型、工具和应用资讯。</p><p style="margin-top:32px;font-size:12px;color:#64748b"><a href="${unsubscribeUrl}">取消订阅</a></p></div>`,
    }),
  });
  return response.ok;
};

subscribeRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!emailPattern.test(email)) return c.json({ error: '请输入有效的邮箱地址' }, 400);

  try {
    const existing = await c.env.DB.prepare('SELECT id, is_active FROM subscribers WHERE email = ?').bind(email).first<{ id: number; is_active: number } | null>();
    if (existing) {
      if (!existing.is_active) await c.env.DB.prepare('UPDATE subscribers SET is_active = 1 WHERE id = ?').bind(existing.id).run();
    } else {
      await c.env.DB.prepare('INSERT INTO subscribers (email, is_active) VALUES (?, 1)').bind(email).run();
    }
    if (c.env.RESEND_API_KEY) await sendWelcomeEmail(email, c.env.RESEND_API_KEY, await unsubscribeToken(email, c.env.JWT_SECRET));
    return c.json({ success: true, message: '订阅已确认，请留意后续邮件。' }, 201);
  } catch (error) {
    console.error('Subscribe failed:', error);
    return c.json({ error: '订阅暂时无法完成，请稍后再试。' }, 500);
  }
});

subscribeRoutes.post('/unsubscribe', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token || !c.env.JWT_SECRET) return c.json({ error: '退订链接无效或已失效。' }, 400);
  try {
    const payload = await verify(token, c.env.JWT_SECRET) as { email?: string; purpose?: string };
    if (payload.purpose !== 'unsubscribe' || !payload.email) return c.json({ error: '退订链接无效或已失效。' }, 400);
    await c.env.DB.prepare('UPDATE subscribers SET is_active = 0 WHERE email = ?').bind(payload.email).run();
    return c.json({ success: true, message: '你已成功取消订阅。' });
  } catch {
    return c.json({ error: '退订链接无效或已失效。' }, 400);
  }
});

const adminSubscribeRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
adminSubscribeRoutes.use('*', authMiddleware);
adminSubscribeRoutes.use('*', adminMiddleware);
adminSubscribeRoutes.get('/list', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT id, email, subscribed_at, is_active FROM subscribers ORDER BY subscribed_at DESC LIMIT 500').all();
    return c.json({ subscribers: result.results || [], total: result.results?.length || 0 });
  } catch (error) {
    console.error('List subscribers failed:', error);
    return c.json({ error: '订阅者列表加载失败。' }, 500);
  }
});
subscribeRoutes.route('/', adminSubscribeRoutes);

export default subscribeRoutes;
