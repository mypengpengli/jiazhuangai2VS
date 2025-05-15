-- 用户表 (管理员)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, -- 存储哈希后的密码
    role TEXT NOT NULL DEFAULT 'user', -- 添加角色列，默认为 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- 用于 URL 访问
    content_type TEXT DEFAULT 'markdown', -- 内容类型 (markdown, html, etc.)
    content TEXT,
    category_id INTEGER,
    parent_id INTEGER, -- 用于树形结构 (AI相关纪事)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES articles(id) ON DELETE SET NULL -- 自引用
);

-- 文章附件表
CREATE TABLE IF NOT EXISTS article_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    file_type TEXT NOT NULL, -- 'image', 'video', 'document', etc.
    file_url TEXT NOT NULL,  -- R2 URL or identifier
    filename TEXT,           -- Original filename (optional)
    description TEXT,        -- Alt text for images, or description (optional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_attachments_article_id ON article_attachments (article_id);

-- (可选) 为 slug 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles (category_id);
CREATE INDEX IF NOT EXISTS idx_articles_parent_id ON articles (parent_id);