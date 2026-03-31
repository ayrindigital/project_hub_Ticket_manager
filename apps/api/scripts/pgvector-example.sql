CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH generated_vector AS (
  SELECT (
    '[' ||
    array_to_string(
      ARRAY(SELECT '0.001' FROM generate_series(1, 3072)),
      ','
    ) ||
    ']'
  )::vector AS value
)
INSERT INTO "Embedding" (
  "id",
  "content",
  "embedding",
  "sourceType",
  "sourceId",
  "metadata"
)
SELECT
  gen_random_uuid()::text,
  'Ticket: Fix payment gateway timeout',
  value,
  'ticket',
  'ticket-id-placeholder',
  '{"projectName":"E-Commerce Platform","ticketTitle":"Fix payment gateway timeout"}'::jsonb
FROM generated_vector;

WITH query_vector AS (
  SELECT (
    '[' ||
    array_to_string(
      ARRAY(SELECT '0.001' FROM generate_series(1, 3072)),
      ','
    ) ||
    ']'
  )::vector AS value
)
SELECT
  e."id",
  e."content",
  e."sourceType",
  e."sourceId",
  e."metadata",
  (e."embedding" <=> q.value) AS distance
FROM "Embedding" e
CROSS JOIN query_vector q
ORDER BY e."embedding" <=> q.value
LIMIT 5;
