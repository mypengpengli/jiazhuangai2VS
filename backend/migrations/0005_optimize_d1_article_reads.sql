-- Additive optimization: keep existing article values, pagination and write APIs.
-- COALESCE is intentional: clients may omit/clear display_date. Match the existing
-- ORDER BY expression instead of rewriting dates or changing NULL semantics.
CREATE INDEX IF NOT EXISTS idx_articles_effective_date
ON articles (COALESCE(display_date, created_at) DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_category_effective_date
ON articles (category_id, COALESCE(display_date, created_at) DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_popular_effective_date
ON articles (view_count DESC, COALESCE(display_date, created_at) DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_attachments_cover
ON article_attachments (article_id, file_type, id);

-- Initialize once, so public GET handlers no longer write on every visit.
INSERT INTO categories (name, slug, description)
VALUES ('本站经验分享', 'site-experience', '沉淀本站实操经验、工具配置和工作流复盘')
ON CONFLICT(slug) DO NOTHING;
