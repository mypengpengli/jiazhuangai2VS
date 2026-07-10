-- 用户表 (管理员)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT,
    bio TEXT,
    password TEXT NOT NULL, -- 存储哈希后的密码
    role TEXT NOT NULL DEFAULT 'user', -- 添加角色列，默认为 'user'
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    display_date TIMESTAMP NULL, -- 用户设定的显示日期，用于排序
    view_count INTEGER NOT NULL DEFAULT 0, -- 浏览量
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
CREATE INDEX IF NOT EXISTS idx_articles_display_date ON articles (display_date); -- 为显示日期添加索引
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles (view_count); -- 为浏览量添加索引

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending=待审核, approved=显示, hidden=隐藏
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments (article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments (status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at);

-- 订阅者表
CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1 -- 1=活跃, 0=已取消
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers (email);
