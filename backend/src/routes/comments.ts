import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { adminMiddleware, authMiddleware, AuthUser } from '../middleware/authMiddleware';
import {
  createComment,
  deleteComment,
  getAdminComments,
  getCommentsByArticleSlug,
  updateCommentStatus
} from '../services/commentService';

type Env = {
  DB: D1Database;
  JWT_SECRET?: string;
};

type Variables = {
  user?: AuthUser;
};

const commentRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();

const articleSlugParamSchema = z.object({
  slug: z.string().min(1, 'Slug 不能为空'),
});

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID 必须是数字'),
});

const createCommentSchema = z.object({
  content: z.string().trim().min(1, '评论内容不能为空').max(1000, '评论最多1000个字符'),
});

const updateCommentSchema = z.object({
  status: z.enum(['approved', 'hidden']),
});

commentRoutes.get(
  '/article/:slug',
  zValidator('param', articleSlugParamSchema),
  async (c) => {
    const { slug } = c.req.valid('param');

    try {
      const comments = await getCommentsByArticleSlug(c.env.DB, slug);
      return c.json({ items: comments });
    } catch (error: any) {
      console.error(`Error fetching comments for article ${slug}:`, error);
      return c.json({ error: 'Failed to fetch comments', message: error.message }, 500);
    }
  }
);

commentRoutes.post(
  '/article/:slug',
  authMiddleware,
  zValidator('param', articleSlugParamSchema),
  zValidator('json', createCommentSchema),
  async (c) => {
    const { slug } = c.req.valid('param');
    const { content } = c.req.valid('json');
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
      const comment = await createComment(c.env.DB, slug, Number(user.sub), content);
      if (!comment) {
        return c.json({ error: 'Not Found', message: `Article with slug '${slug}' not found.` }, 404);
      }
      return c.json(comment, 201);
    } catch (error: any) {
      console.error(`Error creating comment for article ${slug}:`, error);
      return c.json({ error: 'Failed to create comment', message: error.message }, 500);
    }
  }
);

const protectedCommentRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();
protectedCommentRoutes.use('*', authMiddleware);
protectedCommentRoutes.use('*', adminMiddleware);

protectedCommentRoutes.get('/', async (c) => {
  try {
    const comments = await getAdminComments(c.env.DB);
    return c.json({ items: comments });
  } catch (error: any) {
    console.error('Error fetching admin comments:', error);
    return c.json({ error: 'Failed to fetch comments', message: error.message }, 500);
  }
});

protectedCommentRoutes.patch(
  '/:id',
  zValidator('param', idParamSchema),
  zValidator('json', updateCommentSchema),
  async (c) => {
    const { id } = c.req.valid('param');
    const { status } = c.req.valid('json');

    try {
      const comment = await updateCommentStatus(c.env.DB, Number(id), status);
      if (!comment) {
        return c.json({ error: 'Not Found', message: `Comment with ID ${id} not found.` }, 404);
      }
      return c.json(comment);
    } catch (error: any) {
      console.error(`Error updating comment ${id}:`, error);
      return c.json({ error: 'Failed to update comment', message: error.message }, 500);
    }
  }
);

protectedCommentRoutes.delete(
  '/:id',
  zValidator('param', idParamSchema),
  async (c) => {
    const { id } = c.req.valid('param');

    try {
      const deleted = await deleteComment(c.env.DB, Number(id));
      if (!deleted) {
        return c.json({ error: 'Not Found', message: `Comment with ID ${id} not found.` }, 404);
      }
      return c.body(null, 204);
    } catch (error: any) {
      console.error(`Error deleting comment ${id}:`, error);
      return c.json({ error: 'Failed to delete comment', message: error.message }, 500);
    }
  }
);

commentRoutes.route('/', protectedCommentRoutes);

export default commentRoutes;
