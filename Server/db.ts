import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pg from 'pg';

// Get Pool constructor from pg
const { Pool } = pg;

// Set the database connection string
const databaseUrl = "postgresql://data_owner:npg_8zQcKnCw9Yys@ep-morning-breeze-a1g71nnk-pooler.ap-southeast-1.aws.neon.tech/data?sslmode=require";

// Create postgres client for Drizzle
export const client = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

// Create the drizzle client
export const db = drizzle(client);

// Create a pg Pool for session store compatibility
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});
