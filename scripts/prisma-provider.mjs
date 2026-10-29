// Keeps prisma/schema.prisma's datasource provider in sync with DATABASE_URL,
// so moving from SQLite to PostgreSQL only needs a .env change.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
let url = process.env.DATABASE_URL ?? "";
if (!url && existsSync(resolve(root, ".env"))) {
  const match = readFileSync(resolve(root, ".env"), "utf8").match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
  url = match?.[1] ?? "";
}
const provider = /^postgres(ql)?:\/\//.test(url) ? "postgresql" : "sqlite";
const schemaPath = resolve(root, "prisma/schema.prisma");
if (!existsSync(schemaPath)) process.exit(0);
const schema = readFileSync(schemaPath, "utf8");
const next = schema.replace(
  /(datasource db \{[^}]*provider\s*=\s*)"[^"]+"/,
  `$1"${provider}"`,
);
if (next !== schema) {
  writeFileSync(schemaPath, next);
  console.log(`[prisma-provider] datasource provider set to ${provider}`);
}
