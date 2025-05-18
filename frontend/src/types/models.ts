// 定义数据库记录对应的 TypeScript 类型
// 注意：这些类型应与后端 API 返回的数据结构保持一致

export interface User {
  id: string; // 从 JWT 的 'sub' 字段获取，通常是字符串
  username: string;
  role?: string; // 从 JWT 获取，设为可选以保持灵活性
  // created_at 在仅通过 JWT 获取用户信息时不可用，因此设为可选
  created_at?: string; // D1 返回的是 ISO 8601 字符串
}

// 定义 JWT Payload 的结构，方便 jwt-decode 使用
export interface DecodedToken {
  sub: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content_type: string; // 新增：例如 'markdown', 'html'
  content?: string;
  category_id?: number;
  parent_id?: number;
  // image_urls 已移除，使用 attachments
  created_at: string;
  updated_at: string;
  // 前端可能需要直接访问关联的分类信息
  category?: Category;
  attachments?: ArticleAttachment[]; // 新增：附件列表
}

export interface ArticleAttachment {
  id: number;
  article_id: number; // 在从后端获取时通常会有
  file_type: string;
  file_url: string;
  filename?: string;
  description?: string;
  publicUrl?: string; // 新增：用于前端显示的完整公共 URL
  created_at: string;
}

// (可选) 定义用于 API 响应或请求的特定类型
// 例如，创建文章时可能不需要 id, created_at, updated_at
// export type CreateArticleInput = Omit<Article, 'id' | 'created_at' | 'updated_at' | 'category'>;

// 例如，获取文章列表时可能包含关联的分类信息
// export interface ArticleWithCategory extends Article {
//     category?: Category;
// }

// 例如，用于树形结构的数据类型
// export interface ArticleTreeNode extends Article {
//     children?: ArticleTreeNode[];
// }

// 前端特定的类型，例如 API 响应结构
export interface ArticlesApiResponse {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}