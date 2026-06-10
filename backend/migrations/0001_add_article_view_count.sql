-- 为文章表添加浏览量字段
ALTER TABLE articles ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- 为浏览量添加索引，支持按浏览量排序（热门文章）
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles (view_count);
