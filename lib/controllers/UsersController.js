/**
 * Users Controller (all users handlers)
 */

// Dependencies
const TokensController = require('./TokensController');
const Data = require('../data');
const helpers = require('../helpers');

// Container for all handlers
const users = {};

/**
 * Users - post
 * Required data: firstName, lastName, phone, password, tosAgreement
 */
users.post = (data, callback) => {
  const firstName = (typeof data.payload.firstName === 'string') && (data.payload.firstName.trim().length > 0)
    ? data.payload.firstName : false;
  const lastName = (typeof data.payload.lastName === 'string') && (data.payload.lastName.trim().length > 0)
    ? data.payload.lastName : false;
  const phone = (typeof data.payload.phone === 'string') && (data.payload.phone.trim().length === 8)
    ? data.payload.phone : false;
  const password = (typeof data.payload.password === 'string') && (data.payload.password.trim().length > 0)
    ? data.payload.password : false;
  const tosAgreement = ((typeof data.payload.tosAgreement === 'boolean') && (data.payload.tosAgreement === true));

  if (firstName && lastName && phone && password && tosAgreement) {
    // Make sure that the user is doesn't exist
    Data.read('users', phone, (err, data) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          // Create new user
          const userObject = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement,
          };
          // Store the user
          Data.create('users', phone, userObject, (err1) => {
            if (!err1) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not save the new user.' });
            }
          });
        } else {
          callback(500, { Error: 'Could not hash the password of the user' });
        }
      } else {
        // User already exists
        callback(400, { Error: 'A user with this phone number already exist.' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields.' });
  }
};

/**
 * Users - get
 * required data: phone
 * optional data: none
 */
users.get = (data, callback) => {
  // check that the phone number is valid
  const phone = (typeof data.queryStringObject.phone === 'string') && (data.queryStringObject.phone.trim().length === 8)
    ? data.queryStringObject.phone : false;
  if (phone) {
    // Get the token from the header
    const token = (typeof data.headers.token === 'string') ? data.headers.token : false;
    TokensController.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        Data.read('users', phone, (err, data1) => {
          if (!err && data1) {
            delete data1.hashedPassword;
            callback(200, {
              user: data1,
            });
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, { Error: 'Missing required token, or its invalid.' });
      }
    });
  } else {
    callback(400, { Error: 'Missing phone number.' });
  }
};

/**
 * Users - put
 * required data: phone
 * optional data: firstName, lastName, password (at least one must be specified)
 */
users.put = (data, callback) => {
  // check required fields
  const phone = (typeof data.payload.phone === 'string') && (data.payload.phone.trim().length === 8)
    ? data.payload.phone : false;
  // check optional fields
  const firstName = (typeof data.payload.firstName === 'string') && (data.payload.firstName.trim().length > 0)
    ? data.payload.firstName : false;
  const lastName = (typeof data.payload.lastName === 'string') && (data.payload.lastName.trim().length > 0)
    ? data.payload.lastName : false;
  const password = (typeof data.payload.password === 'string') && (data.payload.password.trim().length > 0)
    ? data.payload.password : false;
  if (phone) {
    // Get the token from the header
    const token = (typeof data.headers.token === 'string') ? data.headers.token : false;
    TokensController.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        if (firstName || lastName || password) {
          Data.read('users', phone, (err, userData) => {
            if (!err && userData) {
              // update the necessary fields
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.password = helpers.hash(password);
              }
              Data.update('users', phone, userData, (err1) => {
                if (!err1) {
                  callback(200);
                } else {
                  callback(500, { Error: 'Could not update the user.' });
                }
              });
            } else {
              callback(400, { Error: 'User does not exist.' });
            }
          });
        } else {
          callback(400, { Error: 'Missing fields to update' });
        }
      } else {
        callback(403, { Error: 'Missing required token, or its invalid.' });
      }
    });
  } else {
    callback(400, { Error: 'Missing phone number' });
  }
};

/**
 * Users - delete
 * required data: phone
 * @TODO Cleanup (delete) any other data files associated with this user
 */
users.delete = (data, callback) => {
  // check that the phone number is valid
  const phone = (typeof data.queryStringObject.phone === 'string') && (data.queryStringObject.phone.trim().length === 8)
    ? data.queryStringObject.phone : false;
  if (phone) {
    // Get the token from the header
    const token = (typeof data.headers.token === 'string') ? data.headers.token : false;
    TokensController.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        Data.read('users', phone, (err, userData) => {
          if (!err && userData) {
            Data.delete('users', phone, (err1) => {
              if (!err1) {
                // Delete each of the checks associated
                const userChecks = (typeof userData.checks === 'object') && (userData.checks instanceof Array)
                  ? userData.checks : [];
                const checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  let checksDeleted = 0;
                  let deletionErrors = false;
                  userChecks.forEach((checkId) => {
                    // delete the check
                    Data.delete('checks', checkId, (err2) => {
                      if (err2) {
                        deletionErrors = true;
                      }
                      checksDeleted += 1;
                      if (checksDeleted === checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, { Error: 'Errors encountered while attempting to delete all the users checks.' });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: 'Could not delete the specified user.' });
              }
            });
          } else {
            callback(400, { Error: 'Could not find the specified user.' });
          }
        });
      } else {
        callback(403, { Error: 'Missing required token, or its invalid.' });
      }
    });
  }
};

// Export the module
module.exports = users;
