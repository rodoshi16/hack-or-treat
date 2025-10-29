import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one level up from server/)
const envPath = path.resolve(__dirname, "..", ".env");
dotenv.config({ path: envPath });

// Debug: Log what connection string we're using (hide password)
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/halloween";
const maskedConnection = connectionString.replace(/:[^:@]+@/, ":****@"); // Mask password
console.log(`📦 Database connection: ${maskedConnection || "Using default fallback"}`);

export const pool = new Pool({ connectionString });

export async function initDb() {
  await pool.query(`
    create extension if not exists pgcrypto;
    create table if not exists gifs (
      id uuid primary key default gen_random_uuid(),
      gif_data bytea not null,
      filter_type text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists roasts (
      id uuid primary key default gen_random_uuid(),
      gif_id uuid references gifs(id) on delete cascade,
      roast_text text not null,
      created_at timestamptz not null default now()
    );
  `);
}


