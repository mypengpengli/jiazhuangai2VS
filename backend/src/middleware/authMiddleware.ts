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
  } catch (error) {
    console.error('AuthMiddleware: Invalid token:', error);
    // 可以根据 error 类型判断是过期还是无效签名
    // 例如: if (error instanceof Error && error.message.includes('expired')) { ... }
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token.' }, 401);
  }


  // Token 有效，继续处理请求
  await next();
};