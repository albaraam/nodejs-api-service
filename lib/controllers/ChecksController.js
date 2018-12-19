/**
 * Checks Controller (all checks handlers)
 */

// Dependencies
const Data = require('../data');
const helpers = require('../helpers');
const config = require('../../config');
const TokensController = require('./TokensController');

// Container for all handlers
const checks = {};

/**
 * Checks - post
 * Required data: protocol, url, method, successCodes, timeoutSeconds
 */
checks.post = (data, callback) => {
  const protocol = (typeof data.payload.protocol === 'string') && (['http', 'https'].indexOf(data.payload.protocol.trim()) > -1)
    ? data.payload.protocol : false;
  const url = (typeof data.payload.url === 'string') && (data.payload.url.trim().length > 0)
    ? data.payload.url : false;
  const method = (typeof data.payload.method === 'string')
    && (['get', 'post', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1)
    ? data.payload.method : false;
  const statusCodes = (typeof data.payload.statusCodes === 'object')
    && (data.payload.statusCodes instanceof Array)
    && (data.payload.statusCodes.length > 0)
    ? data.payload.statusCodes : false;
  const timeoutSeconds = (typeof data.payload.timeoutSeconds === 'number')
    && (data.payload.timeoutSeconds % 1 === 0)
    && (data.payload.timeoutSeconds >= 1)
    && (data.payload.timeoutSeconds <= 5)
    ? data.payload.timeoutSeconds : false;
  if (protocol && url && method && statusCodes && timeoutSeconds) {
    // Get the token from the headers
    const token = (typeof data.headers.token === 'string') ? data.headers.token : false;
    if (token) {
      // Lookup the user by reading the token
      Data.read('tokens', token, (err, tokenData) => {
        if (!err) {
          const userPhone = tokenData.phone;
          // Lookup the user data
          Data.read('users', userPhone, (err1, userData) => {
            if (!err1) {
              const userChecks = (typeof userData.checks === 'object') && (userData.checks instanceof Array)
                ? userData.checks : [];
              // Verify user has less than the max number of checks per user
              if (userChecks.length < config.maxChecks) {
                // create a random id for the check
                const checkId = helpers.createRandomString(20);
                // create the check object and include the user's phone
                const checkObject = {
                  id: checkId,
                  userPhone,
                  protocol,
                  url,
                  method,
                  statusCodes,
                  timeoutSeconds,
                };
                Data.create('checks', checkId, checkObject, (err2) => {
                  if (!err2) {
                    // add the checkId to user's object
                    userData.checks = userChecks;
                    userData.checks.push(checkId);
                    Data.update('users', userData.phone, userData, (err3) => {
                      if (!err3) {
                        callback(200, checkObject);
                      } else {
                        callback(500, { Error: 'Could not update the user with the new check.' });
                      }
                    });
                  } else {
                    callback(500, { Error: 'Could not create the check' });
                  }
                });
              } else {
                callback(400, { Error: `The user already has the max number of checks ${config.maxChecks}` });
              }
            } else {
              callback(403);
            }
          });
        } else {
          callback(403);
        }
      });
    } else {
      callback(403);
    }
  } else {
    callback(400, { Error: 'Missing required fields. or inputs are invalid' });
  }
};

/**
 * Checks - get
 * required data: id
 * optional data: none
 */
checks.get = (data, callback) => {
  // check that the id is valid
  const id = (typeof data.queryStringObject.id === 'string') && (data.queryStringObject.id.trim().length === 20)
    ? data.queryStringObject.id : false;
  if (id) {
    // Lookup the check
    Data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the header
        const token = (typeof data.headers.token === 'string') ? data.headers.token : false;
        // verify that the given token is valid and belongs to the user who created the check
        TokensController.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            callback(200, checkData);
          } else {
            callback(403, { Error: 'Missing required token, or its invalid.' });
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing id.' });
  }
};

/**
 * Checks - put
 * required data: id
 * optional data: protocol, url, method, successCodes, timeoutSeconds ( at least one)
 */
checks.put = (data, callback) => {
  const id = (typeof data.payload.id === 'string') && (data.payload.id.trim().length === 20)
    ? data.payload.id : false;
  const protocol = (typeof data.payload.protocol === 'string') && (['http', 'https'].indexOf(data.payload.protocol.trim()) > -1)
    ? data.payload.protocol : false;
  const url = (typeof data.payload.url === 'string') && (data.payload.url.trim().length > 0)
    ? data.payload.url : false;
  const method = (typeof data.payload.method === 'string')
    && (['get', 'post', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1)
    ? data.payload.method : false;
  const statusCodes = (typeof data.payload.statusCodes === 'object')
    && (data.payload.statusCodes instanceof Array)
    && (data.payload.statusCodes.length > 0)
    ? data.payload.statusCodes : false;
  const timeoutSeconds = (typeof data.payload.timeoutSeconds === 'number')
    && (data.payload.timeoutSeconds % 1 === 0)
    && (data.payload.timeoutSeconds >= 1)
    && (data.payload.timeoutSeconds <= 5)
    ? data.payload.timeoutSeconds : false;
  if (id) {
    if (protocol || url || method || statusCodes || timeoutSeconds) {
      Data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          // Get the token from the header
          const token = (typeof data.headers.token === 'string') ? data.headers.token : false;
          // verify that the given token is valid and belongs to the user who created the check
          TokensController.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
            if (tokenIsValid) {
              if (protocol) { checkData.protocol = protocol; }
              if (url) { checkData.url = url; }
              if (method) { checkData.method = method; }
              if (statusCodes) { checkData.statusCodes = statusCodes; }
              if (timeoutSeconds) { checkData.timeoutSeconds = timeoutSeconds; }
              Data.update('checks', id, checkData, (err1) => {
                if (!err1) {
                  callback(200);
                } else {
                  callback(500, { Error: 'Could not update the check.' });
                }
              });
            } else {
              callback(403, { Error: 'Missing required token, or its invalid.' });
            }
          });
        } else {
          callback(400, { Error: 'Invalid check id.' });
        }
      });
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing required fields.' });
  }
};

/**
 * Checks - delete
 * required data: id
 */
checks.delete = (data, callback) => {
  // check that the id is valid
  const id = (typeof data.queryStringObject.id === 'string') && (data.queryStringObject.id.trim().length === 20)
    ? data.queryStringObject.id : false;
  if (id) {
    Data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the header
        const token = (typeof data.headers.token === 'string') ? data.headers.token : false;
        // verify that the given token is valid and belongs to the user who created the check
        TokensController.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            Data.delete('checks', id, (err1) => {
              if (!err1) {
                Data.read('users', checkData.userPhone, (err2, userData) => {
                  if (!err2 && userData) {
                    const userChecks = (typeof userData.checks === 'object') && (userData.checks instanceof Array)
                      ? userData.checks : [];
                    const checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      userData.checks = userChecks;
                      Data.update('users', userData.phone, userData, (err3) => {
                        if (!err3) {
                          callback(200);
                        } else {
                          callback(500, { Error: 'Could not update the user.' });
                        }
                      });
                    } else {
                      callback(500, { Error: 'Could not find the check on the user object.' });
                    }
                  } else {
                    callback(400, { Error: 'Could not find the user.' });
                  }
                });
              } else {
                callback(500, { Error: 'Could not delete the specified check.' });
              }
            });
          } else {
            callback(403, { Error: 'Missing required token, or its invalid.' });
          }
        });
      } else {
        callback(400, { Error: 'Could not find the specified check.' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Export the module
module.exports = checks;
