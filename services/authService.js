const sessionService = require('./sessionService');
const { generateSessionToken } = require('../utils');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

async function login(username, password) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const sessionId = generateSessionToken();
    await sessionService.createSession(sessionId, username);
    return { sessionId };
  }
  return null;
}

async function logout(sessionId) {
  await sessionService.deleteSession(sessionId);
}

module.exports = {
  login,
  logout
};