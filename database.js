const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const config = require('./config');
const fs = require('fs');
const path = require('path');

let db;

async function initializeDatabase() {
  // Ensure the database directory exists
  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`创建数据目录: ${dbDir}`);
  }

  db = await open({
    filename: config.databasePath,
    driver: sqlite3.Database
  });

  await createTables();
  return db;
}

async function createTables() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT UNIQUE NOT NULL,
      subconvert_url TEXT,
      custom_template TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      original_link TEXT NOT NULL,
      type TEXT,
      node_order INTEGER DEFAULT 0,
      enabled BOOLEAN DEFAULT 1,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  // Add new columns if they don't exist (for existing databases)
  try {
    await db.exec(`ALTER TABLE subscriptions ADD COLUMN subconvert_url TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Migration: rename subconvert_api to subconvert_url (for existing databases)
  try {
    // Check if old column exists
    const tables = await db.exec(`PRAGMA table_info(subscriptions)`);
    const hasOldColumn = tables.some(col => col.name === 'subconvert_api');
    const hasNewColumn = tables.some(col => col.name === 'subconvert_url');

    if (hasOldColumn && hasNewColumn) {
      // Migrate data from old column to new column
      await db.exec(`UPDATE subscriptions SET subconvert_url = subconvert_api WHERE subconvert_url IS NULL AND subconvert_api IS NOT NULL`);
    }
  } catch (e) {
    // Migration error, ignore
  }

  try {
    await db.exec(`ALTER TABLE subscriptions ADD COLUMN custom_template TEXT`);
  } catch (e) {
    // Column already exists
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { initializeDatabase, getDB };