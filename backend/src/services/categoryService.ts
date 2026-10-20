import { Category } from '../models'; // 导入分类模型

// 定义环境变量类型
type Env = {
  DB: D1Database;
  // ... 其他绑定
};

const SYSTEM_CATEGORIES: Array<Pick<Category, 'name' | 'slug' | 'description'>> = [
  {
    name: '本站经验分享',
    slug: 'site-experience',
    description: '沉淀本站实操经验、工具配置和工作流复盘',
  },
];

/**
 * 只在显式初始化/迁移场景调用。
 * 不要从公开 GET 接口调用：ON CONFLICT DO UPDATE 会把普通读取变成 D1 写入。
 */
export const ensureSystemCategories = async (db: D1Database): Promise<void> => {
  await db.batch(
    SYSTEM_CATEGORIES.map((category) =>
      db.prepare(`
        INSERT INTO categories (name, slug, description)
        VALUES (?, ?, ?)
        ON CONFLICT(slug) DO NOTHING
      `).bind(category.name, category.slug, category.description || null)
    )
  );
};

/**
 * 获取所有分类
 * @param db D1Database 实例
 * @returns 分类列表
 */
export const getAllCategories = async (db: D1Database): Promise<Category[]> => {
  console.log('CategoryService: Fetching all categories');
  try {
    // 系统分类由 migration/初始化负责，公开读取不再执行 INSERT/UPDATE。
    const stmt = db.prepare('SELECT id, name, slug, description, created_at, updated_at FROM categories ORDER BY name ASC');
    const { results } = await stmt.all<Category>();
    console.log(`CategoryService: Found ${results?.length ?? 0} categories`);
    return results ?? [];
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    throw new Error('Failed to fetch categories from database.');
  }
};

/**
 * 创建新分类
 * @param db D1Database 实例
 * @param categoryData 分类数据 (name, slug, description)
 * @returns 新创建的分类对象
 */
export const createCategory = async (db: D1Database, categoryData: Pick<Category, 'name' | 'slug' | 'description'>): Promise<Category> => {
  const { name, slug, description } = categoryData;
  console.log(`CategoryService: Creating category with slug: ${slug}`);

  try {
    const stmt = db.prepare(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) RETURNING id, name, slug, description, created_at, updated_at'
    );
    const result = await stmt.bind(name, slug, description || null).first<Category>();

    if (!result) {
      console.error('CategoryService: Failed to create category, INSERT did not return data.');
      throw new Error('Failed to create category.');
    }
    console.log(`CategoryService: Category created successfully with ID: ${result.id}`);
    return result;
  } catch (error: any) {
    console.error('Error in createCategory:', error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      throw new Error(`Category with slug '${slug}' or name '${name}' already exists.`);
    }
    throw new Error('Failed to create category in database.');
  }
};

/**
 * 更新指定 ID 的分类
 */
export const updateCategory = async (db: D1Database, id: number, categoryData: Partial<Pick<Category, 'name' | 'slug' | 'description'>>): Promise<Category | null> => {
  const { name, slug, description } = categoryData;
  console.log(`CategoryService: Updating category with ID: ${id}`);
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  if (name !== undefined) {
    setClauses.push('name = ?');
    values.push(name);
  }
  if (slug !== undefined) {
    setClauses.push('slug = ?');
    values.push(slug);
  }
  if (description !== undefined) {
    setClauses.push('description = ?');
    values.push(description);
  }
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const sql = `UPDATE categories SET ${setClauses.join(', ')} WHERE id = ? RETURNING id, name, slug, description, created_at, updated_at`;

  try {
    const stmt = db.prepare(sql);
    const result = await stmt.bind(...values).first<Category>();
    if (!result) {
      console.log(`CategoryService: Category with ID ${id} not found for update.`);
      return null;
    }
    console.log(`CategoryService: Category ${id} updated successfully.`);
    return result;
  } catch (error: any) {
    console.error(`Error in updateCategory for ID ${id}:`, error);
    if (error.message?.includes('UNIQUE constraint failed')) {
      throw new Error(`Update failed: Category with slug '${slug}' or name '${name}' already exists.`);
    }
    throw new Error('Failed to update category in database.');
  }
};

/**
 * 删除指定 ID 的分类
 */
export const deleteCategory = async (db: D1Database, id: number): Promise<boolean> => {
  console.log(`CategoryService: Deleting category with ID: ${id}`);
  try {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const info = await stmt.bind(id).run();
    console.log(`CategoryService: Delete operation executed for ID ${id}. Info:`, info);
    return true;
  } catch (error: any) {
    console.error(`Error in deleteCategory for ID ${id}:`, error);
    if (error.message?.includes('FOREIGN KEY constraint failed')) {
      throw new Error(`Cannot delete category ${id} because it is referenced by articles.`);
    }
    throw new Error('Failed to delete category from database.');
  }
};

/**
 * 根据 ID 获取单个分类
 */
export const getCategoryById = async (db: D1Database, id: number): Promise<Category | null> => {
  console.log(`CategoryService: Fetching category with ID: ${id}`);
  try {
    const stmt = db.prepare('SELECT id, name, slug, description, created_at, updated_at FROM categories WHERE id = ?');
    const result = await stmt.bind(id).first<Category>();

    if (!result) {
      console.log(`CategoryService: Category with ID ${id} not found.`);
      return null;
    }

    console.log(`CategoryService: Found category with ID: ${id}`);
    return result;
  } catch (error) {
    console.error(`Error in getCategoryById for ID ${id}:`, error);
    throw new Error('Failed to fetch category from database.');
  }
};

/**
 * 根据 slug 获取单个分类
 */
export const getCategoryBySlug = async (db: D1Database, slug: string): Promise<Category | null> => {
  console.log(`CategoryService: Fetching category with slug: ${slug}`);
  try {
    const stmt = db.prepare('SELECT id, name, slug, description, created_at, updated_at FROM categories WHERE slug = ?');
    const result = await stmt.bind(slug).first<Category>();

    if (!result) {
      console.log(`CategoryService: Category with slug '${slug}' not found.`);
      return null;
    }

    console.log(`CategoryService: Found category with slug: ${slug}`);
    return result;
  } catch (error) {
    console.error(`Error in getCategoryBySlug for slug '${slug}':`, error);
    throw new Error('Failed to fetch category from database.');
  }
};
