// 定义数据库记录对应的 TypeScript 类型

export interface User {
  id: number;
  username: string;
  display_name?: string | null;
  bio?: string | null;
  role?: string;
  // 注意：密码哈希不应包含在此模型中，避免意外泄露
  created_at: string; // D1 返回的是 ISO 8601 字符串
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
  content_type: string; // 例如: 'markdown', 'html'
  content?: string;
  category_id?: number;
  parent_id?: number;
  display_date?: string | null; // 用户设定的显示日期，用于排序
  view_count?: number; // 浏览量
  cover_image?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleAttachment {
  id: number;
  article_id: number;
  file_type: string; // 'image', 'video', 'document', etc.
  file_url: string;  // R2 URL or identifier
  filename?: string;
  description?: string;
  created_at: string;
}

export type CommentStatus = 'pending' | 'approved' | 'hidden';

export interface Comment {
  id: number;
  article_id: number;
  user_id: number;
  content: string;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends Comment {
  username: string;
  article_title?: string;
  article_slug?: string;
}

// (可选) 定义用于 API 响应或请求的特定类型
// 例如，创建文章时可能不需要 id, created_at, updated_at
// 创建时，附件信息可能是 file_key 列表或其他结构
export type CreateArticleInput = Omit<Article, 'id' | 'created_at' | 'updated_at' | 'display_date'> & { // display_date 也从 Omit 移除，单独定义为可选
  display_date?: string | null; // 允许在创建时提供
  attachments?: Array<Omit<ArticleAttachment, 'id' | 'article_id' | 'created_at'>>; // 创建时不需要 id 和 article_id
};

// 例如，获取文章列表时可能包含关联的分类信息和附件信息
export interface ArticleWithCategoryAndAttachments extends Article {
  category?: Category;
  attachments?: ArticleAttachment[];
}

// 例如，用于树形结构的数据类型
export interface ArticleTreeNode extends Article {
  children?: ArticleTreeNode[];
  attachments?: ArticleAttachment[]; // 树节点也可能需要附件信息
}
