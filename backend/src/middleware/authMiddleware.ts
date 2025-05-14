import { Context, Next } from 'hono';
import { verify } from 'hono/jwt'; // 用于实际 JWT 验证

// 定义环境变量类型
type Env = {
  JWT_SECRET?: string;
  // ... 其他绑定
};

// 定义上下文中可以传递的变量类型
type Variables = {
    user?: { sub: string; username: string; role: string; iat: number; exp: number; }; // 匹配 JWT payload 结构
};

/**
 * Hono 认证中间件
 * 验证请求头中的 Authorization Bearer Token
 */
// 在 Context 类型中同时指定 Bindings 和 Variables
export const authMiddleware = async (c: Context<{ Bindings: Env, Variables: Variables }>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  console.log('AuthMiddleware: Checking Authorization header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('AuthMiddleware: Authorization header missing or invalid format');
    return c.json({ error: 'Unauthorized', message: 'Authorization header is missing or invalid.' }, 401);
  }

  const token = authHeader.substring(7); // 提取 Token 部分 ("Bearer ".length === 7)

  if (!c.env.JWT_SECRET) {
    console.error('AuthMiddleware: JWT_SECRET is not configured!');
    return c.json({ error: 'Internal Server Error', message: 'Authentication configuration error.' }, 500);
  }

  try {
    // 明确指定 decodedPayload 的类型以匹配 User 类型或 JWT 结构
    const decodedPayload = await verify(token, c.env.JWT_SECRET) as { sub: string; username: string; role: string; iat: number; exp: number; };
    // 将解码后的用户信息附加到上下文，供后续处理程序使用
    c.set('user', decodedPayload);
    console.log('AuthMiddleware: Token verified successfully for user:', decodedPayload.sub);
  } catch (error: any) { // 修改为 any 以便访问 error 的属性
    // --- 新增的调试日志 ---
    console.error('AuthMiddleware: JWT Verification Failed!');
    // 为了安全，不要直接打印 c.env.JWT_SECRET 的值，但可以打印其类型或长度确认是否正确加载
    console.error('AuthMiddleware: JWT_SECRET from env (type):', typeof c.env.JWT_SECRET);
    console.error('AuthMiddleware: JWT_SECRET from env (length):', c.env.JWT_SECRET ? c.env.JWT_SECRET.length : 'NOT SET');
    // 尝试更安全地打印错误信息，避免直接暴露敏感信息
    const err = error as Error & { code?: string; name?: string; }; // 常见 JWT 错误属性
    console.error('AuthMiddleware: Verification error name:', err.name);
    console.error('AuthMiddleware: Verification error message:', err.message);
    if (err.code) console.error('AuthMiddleware: Verification error code:', err.code);
    // --- 调试日志结束 ---
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token.', details: err.message || 'Verification failed' }, 401);
  }


  // Token 有效，继续处理请求
  await next();
};