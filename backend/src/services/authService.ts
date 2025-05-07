// import bcrypt from 'bcryptjs'; // 后续实现密码哈希时需要
import { sign } from 'hono/jwt'; // Hono 内置的 JWT 功能
import { User } from '../models'; // 导入用户模型

// 定义环境变量类型 (如果需要访问 DB 等)
type Env = {
  DB: D1Database;
  JWT_SECRET?: string; // 用于 JWT 签名的密钥，应存储在环境变量中
  // ... 其他绑定
};

/**
 * 验证用户凭证并生成 Token
 * @param db D1Database 实例
 * @param username 用户名
 * @param password 密码
 * @param jwtSecret JWT 密钥
 * @returns 包含 Token 的对象或抛出错误
 */
export const loginUser = async (db: D1Database, username: string, password: string, jwtSecret: string | undefined) => {
  console.log(`AuthService: Attempting login for ${username}`);

  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured!');
    throw new Error('Authentication configuration error.');
  }

  // 1. 根据 username 从 users 表查询用户
  const userQuery = 'SELECT id, username, password_hash, role FROM users WHERE username = ?';
  const userStmt = db.prepare(userQuery);
  // 明确 password_hash 的类型，因为我们知道它暂时是明文
  const userResult = await userStmt.bind(username).first<{ id: number; username: string; password_hash: string; role: string } | null>();

  // 2. 如果找不到用户，抛出错误
  if (!userResult) {
    console.log(`AuthService: User ${username} not found`);
    throw new Error('Invalid username or password');
  }

  // 3. 临时密码验证 (直接比较明文)
  // 重要：这只是临时措施，后续必须用 bcrypt.compare 替换
  const isPasswordValid = (password === userResult.password_hash); 
  if (!isPasswordValid) {
    console.log(`AuthService: Invalid password for user ${username}`);
    throw new Error('Invalid username or password');
  }

  // 3.1 检查用户角色是否为 admin
  if (userResult.role !== 'admin') {
    console.log(`AuthService: User ${username} is not an admin.`);
    throw new Error('Access denied: User is not an administrator.');
  }

  console.log(`AuthService: User ${username} (role: ${userResult.role}) authenticated successfully`);

  // 4. 生成 JWT Token
  const payload = {
    sub: userResult.id.toString(), // 主题，通常是用户 ID
    username: userResult.username,
    role: userResult.role, // 在 payload 中加入角色信息
    iat: Math.floor(Date.now() / 1000), // 签发时间
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 过期时间 (例如 24 小时)
  };

  try {
    const token = await sign(payload, jwtSecret); // 使用 hono/jwt 的 sign 方法
    console.log(`AuthService: JWT generated for user ${username}`);
    return { token };
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Failed to generate authentication token.');
  }
};

// TODO: 添加其他认证相关服务函数，如验证 Token、登出等