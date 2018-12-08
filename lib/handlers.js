/**
 * Request handlers
 */

// Define handlers
const handlers = {};

// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};
// Not Found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
