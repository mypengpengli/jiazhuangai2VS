import { Hono } from 'hono';
import type { Env } from '../index';

const subscribeRoutes = new Hono<{ Bindings: Env }>();

// 发送欢迎邮件
async function sendWelcomeEmail(email: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '加装AI助手 <noreply@jiazhuangai.com>',
        to: email,
        subject: '🚀 欢迎订阅加装AI助手！',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7c3aed;">🚀 欢迎订阅加装AI助手！</h1>
            <p>感谢您订阅我们的AI资讯！</p>
            <p>我们将为您带来：</p>
            <ul>
              <li>🤖 大语言模型最新动态</li>
              <li>🎨 AI生图技术前沿</li>
              <li>🎬 视频生成模型更新</li>
              <li>⚡ AI工具推荐与教程</li>
              <li>🔧 AI硬件评测</li>
            </ul>
            <p>敬请期待我们的精彩内容！</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              加装AI助手 - 为你加装最新AI能力<br>
              <a href="https://jiazhuangai.com" style="color: #7c3aed;">jiazhuangai.com</a>
            </p>
          </div>
        `,
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('Send welcome email error:', e);
    return false;
  }
}

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
    
    // 发送欢迎邮件
    if (c.env.RESEND_API_KEY) {
      await sendWelcomeEmail(email, c.env.RESEND_API_KEY);
    }
    
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
