const { dbRun, dbQuery } = require('../utils');

const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

async function createSession(sessionId, username) {
  const expiresAt = Date.now() + SESSION_EXPIRY;
  await dbRun(
    'INSERT INTO sessions (session_id, username, expires_at) VALUES (?, ?, ?)',
    [sessionId, username, expiresAt]
  );
  return expiresAt;
}

async function deleteSession(sessionId) {
  await dbRun('DELETE FROM sessions WHERE session_id = ?', [sessionId]);
}

async function verifyAndRenewSession(sessionId) {
  const now = Date.now();
  const session = await dbQuery(
    'SELECT * FROM sessions WHERE session_id = ? AND expires_at > ?',
    [sessionId, now]
  );
  
  if (session.length) {
    const newExpiry = now + SESSION_EXPIRY;
    await dbRun(
      'UPDATE sessions SET expires_at = ? WHERE session_id = ?',
      [newExpiry, sessionId]
    );
    return true;
  }
  return false;
}

module.exports = {
  createSession,
  deleteSession,
  verifyAndRenewSession
};