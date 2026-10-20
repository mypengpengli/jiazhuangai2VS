-- Reduce D1 row reads for public article listing.
-- 1) Make display_date indexable by removing legacy NULL values.
UPDATE articles
SET display_date = created_at
WHERE display_date IS NULL;

-- 2) Index the most common public ordering/filtering patterns.
CREATE INDEX IF NOT EXISTS idx_articles_display_date_created_at
ON articles (display_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_updated_at_created_at
ON articles (updated_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_category_display_date_created_at
ON articles (category_id, display_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_attachments_cover
ON article_attachments (article_id, file_type, id);

-- 3) Maintain tiny per-category counters so normal list requests do not need COUNT(*).
-- category_id = -1 represents articles whose category_id is NULL.
CREATE TABLE IF NOT EXISTS article_count_stats (
    category_id INTEGER PRIMARY KEY,
    article_count INTEGER NOT NULL DEFAULT 0 CHECK (article_count >= 0)
);

DELETE FROM article_count_stats;
INSERT INTO article_count_stats (category_id, article_count)
SELECT COALESCE(category_id, -1), COUNT(*)
FROM articles
GROUP BY COALESCE(category_id, -1);

DROP TRIGGER IF EXISTS trg_article_count_stats_insert;
CREATE TRIGGER trg_article_count_stats_insert
AFTER INSERT ON articles
BEGIN
    INSERT INTO article_count_stats (category_id, article_count)
    VALUES (COALESCE(NEW.category_id, -1), 1)
    ON CONFLICT(category_id) DO UPDATE SET
        article_count = article_count + 1;
END;

DROP TRIGGER IF EXISTS trg_article_count_stats_delete;
CREATE TRIGGER trg_article_count_stats_delete
AFTER DELETE ON articles
BEGIN
    UPDATE article_count_stats
    SET article_count = CASE WHEN article_count > 0 THEN article_count - 1 ELSE 0 END
    WHERE category_id = COALESCE(OLD.category_id, -1);
END;

DROP TRIGGER IF EXISTS trg_article_count_stats_category_update;
CREATE TRIGGER trg_article_count_stats_category_update
AFTER UPDATE OF category_id ON articles
WHEN COALESCE(OLD.category_id, -1) <> COALESCE(NEW.category_id, -1)
BEGIN
    UPDATE article_count_stats
    SET article_count = CASE WHEN article_count > 0 THEN article_count - 1 ELSE 0 END
    WHERE category_id = COALESCE(OLD.category_id, -1);

    INSERT INTO article_count_stats (category_id, article_count)
    VALUES (COALESCE(NEW.category_id, -1), 1)
    ON CONFLICT(category_id) DO UPDATE SET
        article_count = article_count + 1;
END;
