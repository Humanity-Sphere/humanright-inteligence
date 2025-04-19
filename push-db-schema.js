#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

// Create a temporary drizzle config file that uses the push-all option
const tempConfig = `
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
`;

// Create the temporary config file
console.log('Creating temporary drizzle config with automatic schema push...');
writeFileSync('./temp-drizzle.config.ts', tempConfig);

try {
  // Run the drizzle-kit push command with our temporary config
  console.log('Pushing schema to database...');
  // Copy the original config file to a backup
  execSync('cp drizzle.config.ts drizzle.config.ts.backup', { stdio: 'inherit' });
  // Replace the original config with our temporary one
  execSync('cp temp-drizzle.config.ts drizzle.config.ts', { stdio: 'inherit' });
  // Run the push command
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('Schema successfully pushed to the database!');
} catch (error) {
  console.error('Error pushing schema to database:', error.message);
} finally {
  // Clean up - restore the original config and remove temporary files
  try {
    execSync('mv drizzle.config.ts.backup drizzle.config.ts', { stdio: 'inherit' });
    execSync('rm -f temp-drizzle.config.ts', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Warning: Failed to clean up temporary config files.');
  }
}

console.log('Database setup is complete.');