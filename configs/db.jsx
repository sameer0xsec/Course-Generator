import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/configs/schema';

// Use environment variable for database connection
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set in environment variables.');
}

// Add connection options for better reliability
const client = neon(DATABASE_URL || 'postgresql://placeholder:placeholder@localhost/placeholder', {
  fetch: (url, opts) => {
    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    return fetch(url, { ...opts, signal: controller.signal }).finally(() => {
      clearTimeout(timeoutId);
    });
  }
});

export const db = drizzle(client, { schema });