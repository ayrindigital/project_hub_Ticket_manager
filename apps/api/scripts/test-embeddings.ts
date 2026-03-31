import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { TaskType } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const sampleTitles = [
  'Fix login bug',
  'Authentication error on signin',
  'Update payment UI',
  'Payment gateway timeout issue',
  'Redesign onboarding screen',
];

const prisma = new PrismaClient();

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function vectorLiteral(values: number[]): string {
  return `[${values.map((value) => value.toFixed(8)).join(',')}]`;
}

function loadDotEnvFile(): void {
  const envPath = join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

async function main(): Promise<void> {
  loadDotEnvFile();

  const geminiApiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!geminiApiKey) {
    throw new Error(
      'GEMINI_API_KEY is missing. Add it to apps/api/.env before running embeddings:test.',
    );
  }

  const documentEmbeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: geminiApiKey,
    model: 'gemini-embedding-001',
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  const queryEmbeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: geminiApiKey,
    model: 'gemini-embedding-001',
    taskType: TaskType.RETRIEVAL_QUERY,
  });

  console.log('Generating embeddings with gemini-embedding-001...\n');

  const vectors = await documentEmbeddings.embedDocuments(sampleTitles);
  const queryText = 'Authentication sign in issue';
  const queryVector = await queryEmbeddings.embedQuery(queryText);

  sampleTitles.forEach((title, index) => {
    const preview = vectors[index].slice(0, 6).map((value) => value.toFixed(4));
    console.log(`${index + 1}. ${title}`);
    console.log(`   vector length: ${vectors[index].length}`);
    console.log(`   preview: [${preview.join(', ')}]\n`);
  });

  console.log('Cosine similarity checks:\n');

  const pairs: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [2, 3],
    [1, 4],
  ];

  for (const [left, right] of pairs) {
    const score = cosineSimilarity(vectors[left], vectors[right]);
    console.log(
      `"${sampleTitles[left]}" <-> "${sampleTitles[right]}" = ${score.toFixed(4)}`,
    );
  }

  console.log('\nExpected pattern: authentication/login titles should be closer to each other than to unrelated UI work.');

  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
  await prisma.$executeRawUnsafe(
    `DELETE FROM "Embedding" WHERE "sourceType" = 'script-demo'`,
  );

  for (const [index, title] of sampleTitles.entries()) {
    const embedding = vectorLiteral(vectors[index]);
    const content = `Ticket title: ${title}`;
    const metadata = JSON.stringify({
      script: 'test-embeddings',
      sampleIndex: index + 1,
      title,
    });

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Embedding" (
        "id",
        "content",
        "embedding",
        "sourceType",
        "sourceId",
        "metadata",
        "createdAt"
      ) VALUES (
        gen_random_uuid()::text,
        '${escapeSql(content)}',
        '${embedding}'::vector,
        'script-demo',
        'sample-${index + 1}',
        '${escapeSql(metadata)}'::jsonb,
        NOW()
      )
    `);
  }

  console.log('\nStored generated embeddings in PostgreSQL using the Embedding table.');

  const searchResults = await prisma.$queryRawUnsafe(`
    SELECT
      "content",
      "sourceId",
      "metadata",
      ("embedding" <=> '${vectorLiteral(queryVector)}'::vector) AS distance
    FROM "Embedding"
    WHERE "sourceType" = 'script-demo'
    ORDER BY "embedding" <=> '${vectorLiteral(queryVector)}'::vector
    LIMIT 3
  `);

  console.log(`\nSimilarity search results for query: "${queryText}"\n`);
  console.table(searchResults);
}

main().catch((error: unknown) => {
  console.error('\nEmbedding test failed.');
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
