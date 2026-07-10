CREATE INDEX IF NOT EXISTS idx_articles_category_display_date ON articles (category_id, display_date DESC);
