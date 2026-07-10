import { sign } from 'hono/jwt';

type AuthDbUser = {
  id: number;
  username: string;
  password_value: string;
  role: string;
  is_active?: number;
};

type UserProfile = {
  id: number;
  username: string;
  display_name: string | null;
  bio: string | null;
  role: string;
  created_at: string;
};

type UserColumn = { name: string };
type PasswordCheck = { valid: boolean; needsUpgrade: boolean };

// Cloudflare Workers has a bounded request CPU budget. This remains salted
// PBKDF2-HMAC-SHA256 while allowing legacy passwords to upgrade on login.
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_PREFIX = 'pbkdf2-sha256';
const encoder = new TextEncoder();

const getUserColumns = async (db: D1Database): Promise<UserColumn[]> => {
  const tableInfo = await db.prepare('PRAGMA table_info(users)').all<UserColumn>();
  return tableInfo.results || [];
};

const getPasswordColumn = async (db: D1Database): Promise<'password_hash' | 'password'> => {
  const names = (await getUserColumns(db)).map((column) => column.name);
  if (names.includes('password_hash')) return 'password_hash';
  if (names.includes('password')) return 'password';
  throw new Error('Users table is missing a password column.');
};

export const ensureUserProfileColumns = async (db: D1Database): Promise<void> => {
  const names = (await getUserColumns(db)).map((column) => column.name);
  if (!names.includes('display_name')) {
    await db.prepare('ALTER TABLE users ADD COLUMN display_name TEXT').run();
    await db.prepare("UPDATE users SET display_name = username WHERE display_name IS NULL OR display_name = ''").run();
  }
  if (!names.includes('bio')) await db.prepare('ALTER TABLE users ADD COLUMN bio TEXT').run();
  if (!names.includes('is_active')) await db.prepare('ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1').run();
  if (!names.includes('updated_at')) await db.prepare('ALTER TABLE users ADD COLUMN updated_at TIMESTAMP').run();
};

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

const constantTimeEqual = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
};

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const derivePbkdf2 = async (password: string, salt: Uint8Array, iterations: number) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return new Uint8Array(bits);
};

const hashPassword = async (password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const digest = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(digest)}`;
};

const checkPassword = async (password: string, storedPassword: string): Promise<PasswordCheck> => {
  if (storedPassword.startsWith(`${PBKDF2_PREFIX}$`)) {
    const [, iterationsValue, saltValue, digestValue] = storedPassword.split('$');
    const iterations = Number(iterationsValue);
    if (!Number.isSafeInteger(iterations) || iterations < 1 || !saltValue || !digestValue) return { valid: false, needsUpgrade: false };
    try {
      const expected = fromBase64(digestValue);
      const actual = await derivePbkdf2(password, fromBase64(saltValue), iterations);
      return { valid: constantTimeEqual(actual, expected), needsUpgrade: iterations < PBKDF2_ITERATIONS };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  const legacyHash = `sha256:${await sha256(password)}`;
  const valid = storedPassword === password || storedPassword === legacyHash;
  return { valid, needsUpgrade: valid };
};

const createSyntheticEmail = async (username: string): Promise<string> => {
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'user';
  return `${cleanUsername}-${(await sha256(username)).slice(0, 12)}@jiazhuangai.local`;
};

const signUserToken = (user: { id: number; username: string; role: string }, jwtSecret: string) => sign({ sub: String(user.id), username: user.username, role: user.role, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, jwtSecret);

export const loginUser = async (db: D1Database, username: string, password: string, jwtSecret: string | undefined) => {
  if (!jwtSecret) throw new Error('Authentication configuration error.');
  await ensureUserProfileColumns(db);
  const passwordColumn = await getPasswordColumn(db);
  const normalizedUsername = username.trim();
  const user = await db.prepare(`SELECT id, username, ${passwordColumn} as password_value, role, is_active FROM users WHERE username = ?`).bind(normalizedUsername).first<AuthDbUser | null>();
  if (!user || user.is_active === 0) throw new Error('Invalid username or password');

  const check = await checkPassword(password, user.password_value);
  if (!check.valid) throw new Error('Invalid username or password');
  if (check.needsUpgrade) await db.prepare(`UPDATE users SET ${passwordColumn} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(await hashPassword(password), user.id).run();
  return { token: await signUserToken(user, jwtSecret) };
};

export const registerUser = async (db: D1Database, username: string, password: string, jwtSecret: string | undefined) => {
  if (!jwtSecret) throw new Error('Authentication configuration error.');
  await ensureUserProfileColumns(db);
  const passwordColumn = await getPasswordColumn(db);
  const normalizedUsername = username.trim();
  const existingUser = await db.prepare('SELECT id FROM users WHERE username = ?').bind(normalizedUsername).first<{ id: number } | null>();
  if (existingUser) throw new Error('Username already exists');

  const columns = (await getUserColumns(db)).map((column) => column.name);
  const insertColumns = ['username', passwordColumn, 'role'];
  const insertValues: Array<string | number> = [normalizedUsername, await hashPassword(password), 'user'];
  if (columns.includes('email')) { insertColumns.splice(1, 0, 'email'); insertValues.splice(1, 0, await createSyntheticEmail(normalizedUsername)); }
  if (columns.includes('display_name')) { insertColumns.push('display_name'); insertValues.push(normalizedUsername); }
  if (columns.includes('is_active')) { insertColumns.push('is_active'); insertValues.push(1); }
  const user = await db.prepare(`INSERT INTO users (${insertColumns.join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')}) RETURNING id, username, role, created_at`).bind(...insertValues).first<{ id: number; username: string; role: string; created_at: string } | null>();
  if (!user) throw new Error('Failed to create user.');
  return { token: await signUserToken(user, jwtSecret), user };
};

export const getUserProfile = async (db: D1Database, userId: number): Promise<UserProfile | null> => {
  await ensureUserProfileColumns(db);
  return db.prepare('SELECT id, username, display_name, bio, role, created_at FROM users WHERE id = ?').bind(userId).first<UserProfile | null>();
};

export const updateUserProfile = async (db: D1Database, userId: number, profile: { display_name?: string; bio?: string }): Promise<UserProfile | null> => {
  await ensureUserProfileColumns(db);
  const updated = await db.prepare('UPDATE users SET display_name = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id').bind(profile.display_name?.trim() || null, profile.bio?.trim() || null, userId).first<{ id: number } | null>();
  return updated ? getUserProfile(db, updated.id) : null;
};

export const changeUserPassword = async (db: D1Database, userId: number, currentPassword: string, nextPassword: string) => {
  await ensureUserProfileColumns(db);
  const passwordColumn = await getPasswordColumn(db);
  const user = await db.prepare(`SELECT id, ${passwordColumn} as password_value FROM users WHERE id = ?`).bind(userId).first<{ id: number; password_value: string } | null>();
  if (!user || !(await checkPassword(currentPassword, user.password_value)).valid) throw new Error('Invalid current password');
  await db.prepare(`UPDATE users SET ${passwordColumn} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(await hashPassword(nextPassword), user.id).run();
};

export type AdminUser = UserProfile & { is_active: number };

export const getAdminUsers = async (db: D1Database): Promise<AdminUser[]> => {
  await ensureUserProfileColumns(db);
  const result = await db.prepare('SELECT id, username, display_name, bio, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 500').all<AdminUser>();
  return result.results || [];
};

export const updateAdminUser = async (db: D1Database, userId: number, changes: { is_active?: number; role?: 'user' | 'admin' }): Promise<AdminUser | null> => {
  await ensureUserProfileColumns(db);
  const assignments: string[] = [];
  const values: Array<number | string> = [];
  if (typeof changes.is_active === 'number') { assignments.push('is_active = ?'); values.push(changes.is_active); }
  if (changes.role) { assignments.push('role = ?'); values.push(changes.role); }
  if (!assignments.length) return null;
  assignments.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);
  const updated = await db.prepare(`UPDATE users SET ${assignments.join(', ')} WHERE id = ? RETURNING id`).bind(...values).first<{ id: number } | null>();
  if (!updated) return null;
  return db.prepare('SELECT id, username, display_name, bio, role, is_active, created_at FROM users WHERE id = ?').bind(updated.id).first<AdminUser | null>();
};
