import { CommentStatus, CommentWithAuthor } from '../models';

let ensureCommentsTablePromise: Promise<void> | null = null;

const ensureCommentsTable = async (db: D1Database): Promise<void> => {
  if (!ensureCommentsTablePromise) {
    ensureCommentsTablePromise = (async () => {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          article_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'approved',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      await db.batch([
        db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments (article_id)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_status ON comments (status)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at)'),
      ]);
    })();
  }

  return ensureCommentsTablePromise;
};

const mapCommentRow = (row: any): CommentWithAuthor => ({
  id: row.id,
  article_id: row.article_id,
  user_id: row.user_id,
  content: row.content,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  username: row.username,
  article_title: row.article_title,
  article_slug: row.article_slug,
});

export const getCommentsByArticleSlug = async (db: D1Database, slug: string): Promise<CommentWithAuthor[]> => {
  await ensureCommentsTable(db);

  const result = await db.prepare(`
    SELECT
      cm.id, cm.article_id, cm.user_id, cm.content, cm.status, cm.created_at, cm.updated_at,
      u.username,
      a.title as article_title,
      a.slug as article_slug
    FROM comments cm
    JOIN users u ON cm.user_id = u.id
    JOIN articles a ON cm.article_id = a.id
    WHERE a.slug = ? AND cm.status = 'approved'
    ORDER BY cm.created_at ASC
  `).bind(slug).all();

  return (result.results || []).map(mapCommentRow);
};

export const createComment = async (
  db: D1Database,
  articleSlug: string,
  userId: number,
  content: string
): Promise<CommentWithAuthor | null> => {
  await ensureCommentsTable(db);

  const article = await db
    .prepare('SELECT id FROM articles WHERE slug = ?')
    .bind(articleSlug)
    .first<{ id: number } | null>();

  if (!article) {
    return null;
  }

  const inserted = await db.prepare(`
    INSERT INTO comments (article_id, user_id, content, status)
    VALUES (?, ?, ?, 'approved')
    RETURNING id
  `).bind(article.id, userId, content.trim()).first<{ id: number } | null>();

  if (!inserted) {
    throw new Error('Failed to create comment.');
  }

  return getCommentById(db, inserted.id);
};

export const getAdminComments = async (db: D1Database): Promise<CommentWithAuthor[]> => {
  await ensureCommentsTable(db);

  const result = await db.prepare(`
    SELECT
      cm.id, cm.article_id, cm.user_id, cm.content, cm.status, cm.created_at, cm.updated_at,
      u.username,
      a.title as article_title,
      a.slug as article_slug
    FROM comments cm
    JOIN users u ON cm.user_id = u.id
    JOIN articles a ON cm.article_id = a.id
    ORDER BY cm.created_at DESC
    LIMIT 200
  `).all();

  return (result.results || []).map(mapCommentRow);
};

export const getCommentById = async (db: D1Database, id: number): Promise<CommentWithAuthor | null> => {
  await ensureCommentsTable(db);

  const row = await db.prepare(`
    SELECT
      cm.id, cm.article_id, cm.user_id, cm.content, cm.status, cm.created_at, cm.updated_at,
      u.username,
      a.title as article_title,
      a.slug as article_slug
    FROM comments cm
    JOIN users u ON cm.user_id = u.id
    JOIN articles a ON cm.article_id = a.id
    WHERE cm.id = ?
  `).bind(id).first();

  return row ? mapCommentRow(row) : null;
};

export const updateCommentStatus = async (
  db: D1Database,
  id: number,
  status: CommentStatus
): Promise<CommentWithAuthor | null> => {
  await ensureCommentsTable(db);

  const updated = await db.prepare(`
    UPDATE comments
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING id
  `).bind(status, id).first<{ id: number } | null>();

  if (!updated) {
    return null;
  }

  return getCommentById(db, updated.id);
};

export const deleteComment = async (db: D1Database, id: number): Promise<boolean> => {
  await ensureCommentsTable(db);

  const result = await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
};
