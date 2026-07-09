// import bcrypt from 'bcryptjs'; // 后续实现密码哈希时需要
import { sign } from 'hono/jwt'; // Hono 内置的 JWT 功能

type AuthDbUser = {
  id: number;
  username: string;
  password_value: string;
  role: string;
};

const getPasswordColumn = async (db: D1Database): Promise<'password_hash' | 'password'> => {
  const tableInfo = await db.prepare('PRAGMA table_info(users)').all<{ name: string }>();
  const columnNames = (tableInfo.results || []).map((column) => column.name);

  if (columnNames.includes('password_hash')) {
    return 'password_hash';
  }
  if (columnNames.includes('password')) {
    return 'password';
  }

  throw new Error('Users table is missing a password column.');
};

const hashPassword = async (password: string): Promise<string> => {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return `sha256:${hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
};

const isPasswordValid = async (password: string, storedPassword: string): Promise<boolean> => {
  if (storedPassword === password) {
    return true;
  }
  return storedPassword === await hashPassword(password);
};

const signUserToken = async (user: { id: number; username: string; role: string }, jwtSecret: string) => {
  const payload = {
    sub: user.id.toString(),
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
  };

  return sign(payload, jwtSecret);
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

  const passwordColumn = await getPasswordColumn(db);
  const normalizedUsername = username.trim();

  // 1. 根据 username 从 users 表查询用户
  const userQuery = `SELECT id, username, ${passwordColumn} as password_value, role FROM users WHERE username = ?`;
  const userStmt = db.prepare(userQuery);
  const userResult = await userStmt.bind(normalizedUsername).first<AuthDbUser | null>();

  // 2. 如果找不到用户，抛出错误
  if (!userResult) {
    console.log(`AuthService: User ${normalizedUsername} not found`);
    throw new Error('Invalid username or password');
  }

  if (!await isPasswordValid(password, userResult.password_value)) {
    console.log(`AuthService: Invalid password for user ${normalizedUsername}`);
    throw new Error('Invalid username or password');
  }

  console.log(`AuthService: User ${username} (role: ${userResult.role}) authenticated successfully`);

  try {
    const token = await signUserToken(userResult, jwtSecret);
    console.log(`AuthService: JWT generated for user ${username}`);
    return { token };
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Failed to generate authentication token.');
  }
};

export const registerUser = async (db: D1Database, username: string, password: string, jwtSecret: string | undefined) => {
  const normalizedUsername = username.trim();

  if (!jwtSecret) {
    console.error('JWT_SECRET is not configured!');
    throw new Error('Authentication configuration error.');
  }

  const passwordColumn = await getPasswordColumn(db);
  const existingUser = await db
    .prepare('SELECT id FROM users WHERE username = ?')
    .bind(normalizedUsername)
    .first<{ id: number } | null>();

  if (existingUser) {
    throw new Error('Username already exists');
  }

  const passwordHash = await hashPassword(password);
  const newUser = await db
    .prepare(`INSERT INTO users (username, ${passwordColumn}, role) VALUES (?, ?, 'user') RETURNING id, username, role, created_at`)
    .bind(normalizedUsername, passwordHash)
    .first<{ id: number; username: string; role: string; created_at: string } | null>();

  if (!newUser) {
    throw new Error('Failed to create user.');
  }

  const token = await signUserToken(newUser, jwtSecret);
  return { token, user: newUser };
};
