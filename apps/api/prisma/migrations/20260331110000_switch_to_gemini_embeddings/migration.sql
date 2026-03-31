CREATE EXTENSION IF NOT EXISTS vector;

DELETE FROM "Embedding";

ALTER TABLE "Embedding" DROP COLUMN "embedding";

ALTER TABLE "Embedding"
ADD COLUMN "embedding" vector(3072) NOT NULL;
