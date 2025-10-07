const sessionService = require('./sessionService');
const { generateSessionToken } = require('../utils');
const { adminUsername, adminPassword } = require('../config');
const ApiError = require('../utils/ApiError');

async function login(username, password) {
  if (username === adminUsername && password === adminPassword) {
    const sessionId = generateSessionToken();
    await sessionService.createSession(sessionId, username);
    return { sessionId };
  }
  throw new ApiError(401, 'login.error');
}

async function logout(sessionId) {
  await sessionService.deleteSession(sessionId);
}

module.exports = {
  login,
  logout
};