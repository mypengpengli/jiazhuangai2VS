ALTER TABLE articles ADD COLUMN language TEXT NOT NULL DEFAULT 'zh-CN'
  CHECK (language IN ('zh-CN', 'en'));
ALTER TABLE articles ADD COLUMN translation_of INTEGER REFERENCES articles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_translation_language
  ON articles (translation_of, language) WHERE translation_of IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_language_date
  ON articles (language, COALESCE(display_date, created_at) DESC, created_at DESC, id DESC);
