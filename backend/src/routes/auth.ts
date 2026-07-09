import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator'; // 用于验证请求体
import { z } from 'zod';
import { AuthUser, authMiddleware } from '../middleware/authMiddleware';
import { getUserProfile, loginUser, registerUser, updateUserProfile } from '../services/authService'; // 正确导入

// 定义环境变量类型 (与 index.ts 保持一致或导入)
type Env = {
  DB: D1Database;
  BUCKET: R2Bucket; // 保持与其他绑定一致
  KV: KVNamespace;   // 保持与其他绑定一致
  JWT_SECRET?: string; // 添加 JWT 密钥类型
};

type Variables = {
  user?: AuthUser;
};

const authRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();

// 定义登录请求体的 Zod schema
const loginSchema = z.object({
  username: z.string().trim().min(1, "用户名不能为空").max(40, "用户名不能超过40个字符"),
  password: z.string().min(1, "密码不能为空"),
});

const registerSchema = z.object({
  username: z.string().trim().min(2, "用户名至少需要2个字符").max(40, "用户名不能超过40个字符"),
  password: z.string().min(6, "密码至少需要6个字符").max(100, "密码不能超过100个字符"),
});

const profileSchema = z.object({
  display_name: z.string().trim().max(40, "昵称不能超过40个字符").optional(),
  bio: z.string().trim().max(200, "简介不能超过200个字符").optional(),
});

// 登录路由
authRoutes.post(
  '/login',
  zValidator('json', loginSchema), // 使用 Zod 验证请求体
  async (c) => {
    const { username, password } = c.req.valid('json');
    console.log(`Login attempt for user: ${username}`); // 日志记录

    try {
      // 注意：需要从环境变量获取 JWT_SECRET
      const result = await loginUser(c.env.DB, username, password, c.env.JWT_SECRET); // 调用服务层逻辑
      return c.json(result);
      // --- 移除临时占位符 ---
    } catch (error: any) {
      console.error('Login error:', error);
      // 根据错误类型返回不同状态码，例如认证失败返回 401
      if (error.message.includes('Invalid username or password')) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }
      return c.json({ error: 'Login failed', message: error.message }, 500);
    }
  }
);

authRoutes.post(
  '/register',
  zValidator('json', registerSchema),
  async (c) => {
    const { username, password } = c.req.valid('json');
    console.log(`Registration attempt for user: ${username}`);

    try {
      const result = await registerUser(c.env.DB, username, password, c.env.JWT_SECRET);
      return c.json(result, 201);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message?.includes('already exists')) {
        return c.json({ error: '用户名已存在' }, 409);
      }
      return c.json({ error: 'Registration failed', message: error.message }, 500);
    }
  }
);

authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const profile = await getUserProfile(c.env.DB, Number(user.sub));
    if (!profile) {
      return c.json({ error: 'Not Found', message: 'User not found.' }, 404);
    }

    return c.json(profile);
  } catch (error: any) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to fetch profile', message: error.message }, 500);
  }
});

authRoutes.patch(
  '/me',
  authMiddleware,
  zValidator('json', profileSchema),
  async (c) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const profile = await updateUserProfile(c.env.DB, Number(user.sub), c.req.valid('json'));
      if (!profile) {
        return c.json({ error: 'Not Found', message: 'User not found.' }, 404);
      }

      return c.json(profile);
    } catch (error: any) {
      console.error('Update profile error:', error);
      return c.json({ error: 'Failed to update profile', message: error.message }, 500);
    }
  }
);

export default authRoutes;
