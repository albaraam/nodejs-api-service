/**
 * Request handlers
 */

// Dependencies
const UsersController = require('./controllers/UsersController');

// Define handlers
const handlers = {};

// Users handler
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    UsersController[data.method](data, callback);
  }
};

  }
};

// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
};

// Not Found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
