/**
 * Twilio Api
 */

// Dependencies
const https = require('https');
const queryString = require('querystring');
const config = require('../config');

const api = {};

/**
 * Send an sms message via Tiwlio
 */
api.sendSms = (phone, msg, callback) => {
  // validate the parameters
  phone = (typeof phone === 'string' && phone.trim().length === 8) ? phone.trim() : false;
  msg = (typeof msg === 'string' && msg.trim().length <= 1600) ? msg.trim() : false;
  if (phone && msg) {
    // Configure the request payload
    const payload = {
      From: config.twilio.fromPhone,
      To: `+961${phone}`,
      Body: msg,
    };

    // Stringify the payload
    const stringPayload = queryString.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'post',
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    };

    // Instantiate the request object
    const req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      const status = res.statusCode;
      // Callback  successfully if the request went through
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback(`Status code return was ${status}`);
      }
    });

    // Bind to the error event so it does not get thrown
    req.on('error', (err) => {
      callback(err);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    callback('Given parameters are missing or invalid.');
  }
};

// Export the module
module.exports = api;
