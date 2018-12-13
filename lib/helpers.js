/**
 * Useful helpers for different tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('../config');

// Container for all the helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = (str) => {
  if (typeof str === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  }
  return false;
};

// Parse a JSON to an object in all cases without throwing exception
helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

// create a string of random alphanumeric characters, of given length
helpers.createRandomString = (strLength) => {
  strLength = (typeof strLength === 'number' && strLength > 0) ? strLength : false;
  if (strLength) {
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let finalString = '';
    for (let i = 1; i <= strLength; i++) {
      const randomCharacter = possibleCharacters.charAt(Math.random() * possibleCharacters.length);
      finalString += randomCharacter;
    }
    return finalString;
  }
  return false;
};

// Export the module
module.exports = helpers;
