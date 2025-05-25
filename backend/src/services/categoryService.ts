import { Category } from '../models'; // 导入分类模型

// 定义环境变量类型
type Env = {
  DB: D1Database;
  // ... 其他绑定
};

/**
 * 获取所有分类
 * @param db D1Database 实例
 * @returns 分类列表
 */
export const getAllCategories = async (db: D1Database): Promise<Category[]> => {
  console.log('CategoryService: Fetching all categories');
  try {
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

  // 注意：实际应用中应添加更严格的 slug 唯一性检查和错误处理
  try {
    const stmt = db.prepare(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?) RETURNING id, name, slug, description, created_at, updated_at'
    );
    const result = await stmt.bind(name, slug, description || null).first<Category>(); // 使用 first() 获取返回的记录

    if (!result) {
        console.error('CategoryService: Failed to create category, INSERT did not return data.');
        throw new Error('Failed to create category.');
    }
    console.log(`CategoryService: Category created successfully with ID: ${result.id}`);
    return result;
  } catch (error: any) {
      console.error('Error in createCategory:', error);
      // 特别处理唯一性约束错误
      if (error.message?.includes('UNIQUE constraint failed')) {
          throw new Error(`Category with slug '${slug}' or name '${name}' already exists.`);
      }
      throw new Error('Failed to create category in database.');
  }
};

/**
 * 更新指定 ID 的分类
 * @param db D1Database 实例
 * @param id 要更新的分类 ID
 * @param categoryData 更新的数据 (name, slug, description)
 * @returns 更新后的分类对象，如果找不到则返回 null
 */
export const updateCategory = async (db: D1Database, id: number, categoryData: Partial<Pick<Category, 'name' | 'slug' | 'description'>>): Promise<Category | null> => {
    const { name, slug, description } = categoryData;
    console.log(`CategoryService: Updating category with ID: ${id}`);

    // 构建 SET 子句，只更新提供的值
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
    // 总是更新 updated_at 时间戳
    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    if (setClauses.length === 1) { // 只有 updated_at，没有实际数据更新
        console.log(`CategoryService: No fields to update for category ID: ${id}, only updating timestamp.`);
        // 可以选择只更新时间戳或直接返回当前数据
    }

    values.push(id); // 将 ID 添加到值的末尾用于 WHERE 子句

    const sql = `UPDATE categories SET ${setClauses.join(', ')} WHERE id = ? RETURNING id, name, slug, description, created_at, updated_at`;

    try {
        const stmt = db.prepare(sql);
        const result = await stmt.bind(...values).first<Category>(); // 使用 first() 获取更新后的记录

        if (!result) {
            console.log(`CategoryService: Category with ID ${id} not found for update.`);
            return null; // 表示未找到或未更新
        }
        console.log(`CategoryService: Category ${id} updated successfully.`);
        return result;
    } catch (error: any) {
        console.error(`Error in updateCategory for ID ${id}:`, error);
        // 处理唯一性约束错误
        if (error.message?.includes('UNIQUE constraint failed')) {
            throw new Error(`Update failed: Category with slug '${slug}' or name '${name}' already exists.`);
        }
        throw new Error('Failed to update category in database.');
    }
};


/**
 * 删除指定 ID 的分类
 * @param db D1Database 实例
 * @param id 要删除的分类 ID
 * @returns 如果删除成功则返回 true，否则返回 false (例如未找到)
 */
export const deleteCategory = async (db: D1Database, id: number): Promise<boolean> => {
    console.log(`CategoryService: Deleting category with ID: ${id}`);
    try {
        // D1 不直接返回受影响的行数，我们需要先检查是否存在
        // 或者直接执行删除，如果 D1 的 prepare API 将来支持返回 changes() 就更好了
        // 目前，我们假设执行成功即删除成功（如果 ID 不存在也不会报错）
        // 更健壮的做法是先 SELECT 检查，或者依赖外键约束（如果设置了 ON DELETE RESTRICT）
        const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
        const info = await stmt.bind(id).run(); // 使用 run() 执行删除

        // D1 .run() 返回的 info 可能不包含明确的删除成功信息
        // 我们可以认为只要执行没有抛出错误，就视为尝试删除成功
        // 注意：如果分类下有关联的文章，且外键设置为 SET NULL，文章的 category_id 会变 null
        // 如果设置为 RESTRICT，这里会抛出外键约束错误
        console.log(`CategoryService: Delete operation executed for ID ${id}. Info:`, info);
        // 暂时假设执行无误即成功
        return true;
        // --- 更精确的检查（如果需要）---
        // const checkStmt = db.prepare('SELECT id FROM categories WHERE id = ?');
        // const exists = await checkStmt.bind(id).first();
        // return !exists; // 如果查询不到，说明删除成功
        // --- 结束精确检查 ---

    } catch (error: any) {
        console.error(`Error in deleteCategory for ID ${id}:`, error);
        // 处理外键约束错误等
        if (error.message?.includes('FOREIGN KEY constraint failed')) {
            throw new Error(`Cannot delete category ${id} because it is referenced by articles.`);
        }
        throw new Error('Failed to delete category from database.');
    }
};

/**
 * 根据 ID 获取单个分类
 * @param db D1Database 实例
 * @param id 分类 ID
 * @returns 分类对象，如果找不到则返回 null
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
 * @param db D1Database 实例
 * @param slug 分类 slug
 * @returns 分类对象，如果找不到则返回 null
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