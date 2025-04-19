
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Ensure the database is provisioned.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Automatically push all schema changes without confirmation
  // This is generally not recommended for production databases,
  // but is fine for development/demo purposes
  push: {
    acceptAllData: true, // Accept all data loss
    acceptAllDeletes: true, // Accept all table deletions
    acceptAllDrops: true // Accept all column drops
  }
});
