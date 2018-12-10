/**
 * Application Router (routes)
 */

// Dependencies
const handlers = require('./handlers');

// Define a request router
const router = {
  users: handlers.users,
  notFound: handlers.notFound,
};

module.exports = router;
