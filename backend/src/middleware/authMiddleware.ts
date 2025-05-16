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
  console.log("AuthMiddleware: Entered middleware.");
  console.log("AuthMiddleware: c.env type:", typeof c.env);
  if (c.env) {
    console.log("AuthMiddleware: c.env.JWT_SECRET type (early check):", typeof c.env.JWT_SECRET);
    console.log("AuthMiddleware: c.env.JWT_SECRET length (early check):", c.env.JWT_SECRET ? String(c.env.JWT_SECRET).length : 'undefined or null');
  } else {
    console.error("AuthMiddleware: c.env is undefined or null. Cannot proceed with auth.");
    return c.json({ error: 'Internal Server Error', message: 'Server environment not configured.' }, 500);
  }

  const authHeader = c.req.header('Authorization');
  console.log('AuthMiddleware: Checking Authorization header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('AuthMiddleware: Authorization header missing or invalid format');
    return c.json({ error: 'Unauthorized', message: 'Authorization header is missing or invalid.' }, 401);
  }

  const token = authHeader.substring(7);

  if (!c.env.JWT_SECRET) {
    console.error('AuthMiddleware: JWT_SECRET is not configured in c.env!');
    return c.json({ error: 'Internal Server Error', message: 'Authentication configuration error: JWT_SECRET missing.' }, 500);
  }

  const secret = c.env.JWT_SECRET; // Assign after the check

  console.log("AuthMiddleware: Attempting to verify token:", token);
  console.log("AuthMiddleware: JWT_SECRET to be used for verification (type):", typeof secret);
  console.log("AuthMiddleware: JWT_SECRET to be used for verification (length):", secret ? String(secret).length : 'undefined or null');

  try {
    // 明确指定 decodedPayload 的类型以匹配 User 类型或 JWT 结构
    // Note: verify function in hono/jwt by default uses HS256 if algorithm is not specified in JWT header or options.
    // The original file did not specify 'HS256' in verify, so keeping it that way.
    const decodedPayload = await verify(token, secret) as { sub: string; username: string; role: string; iat: number; exp: number; };
    console.log('AuthMiddleware: Token verified successfully for user:', decodedPayload.sub, "Payload:", JSON.stringify(decodedPayload));
    // 将解码后的用户信息附加到上下文，供后续处理程序使用
    c.set('user', decodedPayload);
    await next(); // Moved here
  } catch (error: any) {
    console.error('AuthMiddleware: JWT Verification Failed! Token was: ' + token);
    console.error("AuthMiddleware: Error during JWT verification (raw):", error);
    console.error("AuthMiddleware: Error during JWT verification (JSON):", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    console.error('AuthMiddleware: JWT_SECRET from env (type at catch):', typeof c.env.JWT_SECRET);
    console.error('AuthMiddleware: JWT_SECRET from env (length at catch):', c.env.JWT_SECRET ? String(c.env.JWT_SECRET).length : 'NOT SET');
    
    const err = error as Error & { code?: string; name?: string; };
    console.error('AuthMiddleware: Verification error name:', err.name);
    console.error('AuthMiddleware: Verification error message:', err.message);
    if (err.code) console.error('AuthMiddleware: Verification error code:', err.code);
    
    return c.json({ error: 'Unauthorized', message: 'Invalid or expired token.', details: err.message || 'Verification failed' }, 401);
  }
  // Removed await next() from here; it's now in the try block.
};