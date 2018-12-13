/**
 * Tokens Controller (all tokens handlers)
 */

// Dependencies
const Data = require('../data');
const helpers = require('../helpers');

// Container for all handlers
const tokens = {};

/**
 * Tokens - post
 * Required data: phone, password
 */
tokens.post = (data, callback) => {
  const phone = (typeof data.payload.phone === 'string') && (data.payload.phone.trim().length === 8) 
    ? data.payload.phone : false;
  const password = (typeof data.payload.password === 'string') && (data.payload.password.trim().length > 0) 
    ? data.payload.password : false;
  if (phone && password) {
    // lookup the user who match the phone number
    Data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        // Hash the password & compare it to the stored hashed password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword && hashedPassword === userData.hashedPassword) {
          // create new token with a random name. set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone,
            id: tokenId,
            expires,
          };

          // store the token
          Data.create('tokens', tokenId, tokenObject, (err1) => {
            if (!err1) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: 'Could not create the new token.' });
            }
          });
        } else {
          callback(400, { Error: 'Password is incorrect.' });
        }
      } else {
        callback(400, { Error: 'Could not find the specified user.' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields.' });
  }
};

/**
 * Tokens - get
 * required data: id
 * optional data: none
 */
tokens.get = (data, callback) => {
  const id = (typeof data.queryStringObject.id === 'string') && (data.queryStringObject.id.trim().length === 20)
    ? data.queryStringObject.id : false;
  if (id) {
    // fins the token by id
    Data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { Error: 'Invalid token.' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field.' });
  }
};

/**
 * Tokens - put
 * required data: id, extend
 * optional data: none
 */
tokens.put = (data, callback) => {
  const id = (typeof data.payload.id === 'string') && (data.payload.id.trim().length === 20) 
    ? data.payload.id : false;
  const extend = (typeof data.payload.extend === 'boolean') && data.payload.extend === true 
    ? data.payload.extend : false;
  if (id && extend) {
    Data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // check if the token is not already expired
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          Data.update('tokens', id, tokenData, (err1) => {
            if (!err1) {
              callback(200);
            } else {
              callback(500, { Error: 'Could not update the token expiration ' });
            }
          });
        } else {
          callback(400, { Error: 'The token already expired.' });
        }
      } else {
        callback(400, { Error: 'Invalid token.' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields.' });
  }
};

/**
 * Tokens - delete
 * required data: id
 */
tokens.delete = (data, callback) => {
  console.log('asdasd');
  // check that the id is valid
  const id = (typeof data.queryStringObject.id === 'string') && (data.queryStringObject.id.trim().length === 20) 
    ? data.queryStringObject.id : false;
  if (id) {
    Data.read('tokens', id, (err, data1) => {
      if (!err && data1) {
        Data.delete('tokens', id, (err1) => {
          if (!err1) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the specified token.' });
          }
        });
      } else {
        callback(400, { Error: 'Could not find the specified token.' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

/**
 * Token
 */
tokens.verifyToken = (id, phone, callback) => {
  Data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // check if the the token is for the specific user and has not expired
      if (tokenData.phone === phone && tokenData.expires > Date.now()) { 
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Export the module
module.exports = tokens;
