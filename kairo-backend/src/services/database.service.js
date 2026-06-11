import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define our local database storage location on your Mac's drive
const DB_DIR = path.resolve('./database');
const DB_PATH = path.join(DB_DIR, 'kairo.db');

// Ensure the target database directory exists before mounting the file
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Open or create the self-contained SQLite file
const db = new Database(DB_PATH, { verbose: console.log });

// Enforce Foreign Key constraints explicitly at runtime mount
db.pragma('foreign_keys = ON');

/**
 * Initializes the fundamental database schema for the Thread Registry Engine
 */
export const initializeDatabase = () => {
  // Execute our Core Schema Table definitions
  db.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      agent_firmware TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stream_logs (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS runtime_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stream_logs_thread ON stream_logs(thread_id);
  `);
  
  console.log(`[Database Subsystem] Thread Registry Engine mounted cleanly at: ${DB_PATH}`);
};

export default db;