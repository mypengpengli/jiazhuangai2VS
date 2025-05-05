import { Context, Next } from 'hono';
// import { verify } from 'hono/jwt'; // 用于实际 JWT 验证

// 定义环境变量类型
type Env = {
  JWT_SECRET?: string;
  // ... 其他绑定
};

// 定义上下文中可以传递的变量类型
type Variables = {
    user?: { id: string; username: string }; // 或者更详细的用户信息类型
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

  // --- TODO: 实现实际的 JWT 验证 ---
  // if (!c.env.JWT_SECRET) {
  //   console.error('AuthMiddleware: JWT_SECRET is not configured!');
  //   return c.json({ error: 'Internal Server Error', message: 'Authentication configuration error.' }, 500);
  // }
  // try {
  //   const decodedPayload = await verify(token, c.env.JWT_SECRET);
  //   // 将解码后的用户信息附加到上下文，供后续处理程序使用
  //   c.set('user', decodedPayload);
  //   console.log('AuthMiddleware: Token verified successfully for user:', decodedPayload.sub);
  // } catch (error) {
  //   console.error('AuthMiddleware: Invalid token:', error);
  //   return c.json({ error: 'Unauthorized', message: 'Invalid or expired token.' }, 401);
  // }
  // --- 结束 TODO ---

  // --- 临时验证逻辑 ---
  if (token !== 'fake-jwt-token-for-dev') {
      console.log('AuthMiddleware: Invalid fake token received:', token);
      return c.json({ error: 'Unauthorized', message: 'Invalid token (temporary check).' }, 401);
  }
  // 假设验证通过，设置一个假的用户信息
  c.set('user', { id: '1', username: 'admin' }); // 临时设置用户信息
  console.log('AuthMiddleware: Fake token validated successfully');
  // --- 结束临时验证逻辑 ---


  // Token 有效，继续处理请求
  await next();
};