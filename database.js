const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { dbPath } = require('./config');
const fs = require('fs');
const path = require('path');

let db;

async function initializeDatabase() {
  // Ensure the database directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`创建数据目录: ${dbDir}`);
  }

  db = await open({
    filename: dbPath,
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
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { initializeDatabase, getDB };