import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator'; // 导入验证器
import { z } from 'zod'; // 导入 zod
import { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../services/categoryService'; // 导入服务函数
import { authMiddleware } from '../middleware/authMiddleware'; // 导入认证中间件

// 定义环境变量和变量类型 (与 auth.ts 类似)
type Env = {
  DB: D1Database;
  // ... 其他绑定
};
type Variables = {
    user?: { id: string; username: string };
};

const categoryRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();

// 获取所有分类 (公开访问)
categoryRoutes.get('/', async (c) => {
  console.log('Route: GET /api/categories');
  try {
    const categories = await getAllCategories(c.env.DB); // 调用服务函数
    return c.json({ items: categories }); // 修改为返回 { items: [...] } 格式
    // --- 移除临时占位符 ---
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories', message: error.message }, 500);
  }
});

// 获取单个分类 (公开访问)
categoryRoutes.get(
  '/:id',
  zValidator('param', z.object({ id: z.string().regex(/^\d+$/, "ID 必须是数字") })), // 验证路径参数 ID
  async (c) => {
    const { id } = c.req.valid('param');
    const categoryId = parseInt(id, 10);
    console.log(`Route: GET /api/categories/${categoryId}`);

    try {
      const category = await getCategoryById(c.env.DB, categoryId);
      if (!category) {
        return c.json({ error: 'Not Found', message: `Category with ID ${categoryId} not found.` }, 404);
      }
      return c.json(category);
    } catch (error: any) {
      console.error(`Error fetching category ${categoryId}:`, error);
      return c.json({ error: 'Failed to fetch category', message: error.message }, 500);
    }
  }
);

// --- 需要认证的路由 ---
// 应用认证中间件到后续需要保护的路由组
const protectedCategoryRoutes = new Hono<{ Bindings: Env, Variables: Variables }>();
protectedCategoryRoutes.use('*', authMiddleware); // 对这个 Hono 实例下的所有路由应用中间件

// 定义创建分类的请求体 Schema
const createCategorySchema = z.object({
    name: z.string().min(1, "分类名称不能为空"),
    slug: z.string().min(1, "Slug 不能为空").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug 格式无效 (只能包含小写字母、数字和连字符)"),
    description: z.string().optional(),
});

// 创建分类 (需要认证)
protectedCategoryRoutes.post(
    '/',
    zValidator('json', createCategorySchema), // 应用请求体验证
    async (c) => {
        const categoryData = c.req.valid('json');
        const user = c.get('user'); // 从上下文中获取认证用户信息
        console.log(`Route: POST /api/categories by user: ${user?.username} with data:`, categoryData);

        try {
            const newCategory = await createCategory(c.env.DB, categoryData);
            return c.json(newCategory, 201); // 返回 201 Created 和新创建的资源
        } catch (error: any) {
            console.error('Error creating category:', error);
            // 如果是唯一性约束错误，返回 409 Conflict
            if (error.message?.includes('already exists')) {
                return c.json({ error: 'Conflict', message: error.message }, 409);
            }
            return c.json({ error: 'Failed to create category', message: error.message }, 500);
        }
    }
);

// 定义更新分类的请求体 Schema (所有字段可选)
const updateCategorySchema = createCategorySchema.partial();

// 更新分类 (需要认证)
protectedCategoryRoutes.put(
    '/:id',
    zValidator('param', z.object({ id: z.string().regex(/^\d+$/, "ID 必须是数字") })), // 验证路径参数 ID
    zValidator('json', updateCategorySchema), // 验证请求体
    async (c) => {
        const { id } = c.req.valid('param');
        const categoryData = c.req.valid('json');
        const user = c.get('user');
        const categoryId = parseInt(id, 10); // 将 ID 转换为数字

        console.log(`Route: PUT /api/categories/${categoryId} by user: ${user?.username} with data:`, categoryData);

        if (Object.keys(categoryData).length === 0) {
            return c.json({ error: 'Bad Request', message: 'No fields provided for update.' }, 400);
        }

        try {
            const updatedCategory = await updateCategory(c.env.DB, categoryId, categoryData);
            if (!updatedCategory) {
                return c.json({ error: 'Not Found', message: `Category with ID ${categoryId} not found.` }, 404);
            }
            return c.json(updatedCategory);
        } catch (error: any) {
            console.error(`Error updating category ${categoryId}:`, error);
            // 处理唯一性约束错误
            if (error.message?.includes('already exists')) {
                return c.json({ error: 'Conflict', message: error.message }, 409);
            }
            return c.json({ error: 'Failed to update category', message: error.message }, 500);
        }
    }
);

// 删除分类 (需要认证)
protectedCategoryRoutes.delete(
    '/:id',
    zValidator('param', z.object({ id: z.string().regex(/^\d+$/, "ID 必须是数字") })), // 验证路径参数 ID
    async (c) => {
        const { id } = c.req.valid('param');
        const user = c.get('user');
        const categoryId = parseInt(id, 10);

        console.log(`Route: DELETE /api/categories/${categoryId} by user: ${user?.username}`);

        try {
            const deleted = await deleteCategory(c.env.DB, categoryId);
            if (!deleted) {
                // D1 的 DELETE 在 ID 不存在时不报错，所以我们可能无法区分是未找到还是删除失败
                // 暂时返回 404，但更准确的可能是返回 204 No Content 或根据 deleteCategory 的返回值判断
                return c.json({ error: 'Not Found or Delete Failed', message: `Category with ID ${categoryId} not found or could not be deleted.` }, 404);
            }
            // 删除成功，返回 204 No Content
            return c.body(null, 204);
        } catch (error: any) {
            console.error(`Error deleting category ${categoryId}:`, error);
            // 处理外键约束错误
            if (error.message?.includes('FOREIGN KEY constraint failed')) {
                return c.json({ error: 'Conflict', message: error.message }, 409);
            }
            return c.json({ error: 'Failed to delete category', message: error.message }, 500);
        }
    }
);

// 将受保护的路由挂载到主分类路由下
categoryRoutes.route('/', protectedCategoryRoutes);

export default categoryRoutes;