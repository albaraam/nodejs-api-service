/**
 * Application Router (routes)
 */

// Dependencies
const handlers = require('./handlers');

// Define a request router
const router = {
  ping: handlers.ping,
  notFound: handlers.notFound,
};

module.exports = router;
