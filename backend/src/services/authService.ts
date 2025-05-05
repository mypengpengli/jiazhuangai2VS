// import bcrypt from 'bcryptjs'; // 需要安装 bcryptjs 或 bcrypt
// import { sign } from 'hono/jwt'; // Hono 内置的 JWT 功能
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

  // --- TODO: 实现数据库查询和密码验证 ---
  // 1. 根据 username 从 users 表查询用户
  // const userStmt = db.prepare('SELECT id, username, password FROM users WHERE username = ?');
  // const userResult = await userStmt.bind(username).first<User & { password?: string }>();

  // 2. 如果找不到用户，抛出错误
  // if (!userResult || !userResult.password) {
  //   console.log(`AuthService: User ${username} not found`);
  //   throw new Error('Invalid username or password');
  // }

  // 3. 验证密码哈希 (需要安装 bcryptjs)
  // const isPasswordValid = await bcrypt.compare(password, userResult.password);
  // if (!isPasswordValid) {
  //   console.log(`AuthService: Invalid password for user ${username}`);
  //   throw new Error('Invalid username or password');
  // }

  // --- 临时逻辑替代 ---
  if (username !== 'admin' || password !== 'password') {
      console.log(`AuthService: Temporary login failed for ${username}`);
      throw new Error('Invalid username or password (temporary check)');
  }
  const userResult = { id: 1, username: 'admin' }; // 假设用户存在
  // --- 结束临时逻辑 ---


  console.log(`AuthService: User ${username} authenticated successfully`);

  // 4. 生成 JWT Token
  const payload = {
    sub: userResult.id.toString(), // 主题，通常是用户 ID
    username: userResult.username,
    iat: Math.floor(Date.now() / 1000), // 签发时间
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 过期时间 (例如 24 小时)
  };

  try {
    // const token = await sign(payload, jwtSecret);
    // console.log(`AuthService: JWT generated for user ${username}`);
    // return { token };
    // --- 临时 Token ---
    console.log(`AuthService: Returning fake JWT for user ${username}`);
    return { token: 'fake-jwt-token-for-dev' };
    // --- 结束临时 Token ---
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Failed to generate authentication token.');
  }
};

// TODO: 添加其他认证相关服务函数，如验证 Token、登出等