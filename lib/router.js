/**
 * Application Router (routes)
 */

// Dependencies
const handlers = require('./handlers');

// Define a request router
const router = {
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
  notFound: handlers.notFound,
};

module.exports = router;
