-- Manual document order is scoped to siblings in the experience document tree.
ALTER TABLE articles ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_articles_experience_order
ON articles (category_id, parent_id, sort_order);
