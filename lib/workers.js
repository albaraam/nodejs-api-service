/**
 * Workers related tasks
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const Data = require('./data');
const TwilioApi = require('./TwilioApi');


// Container
const workers = {};

/**
 * Lookup all checks, get their data, send to a validator
 */
workers.gatherAllChecks = () => {
  // Get all the checks
  Data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        // Read in the check data
        Data.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            // Pass it to check validator, and let that function to continue or log error
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one of the checks data.');
          }
        });
      });
    } else {
      console.log('Could not find checks to process');
    }
  });
};

/**
 * Sanity-check the check-data
 */
workers.validateCheckData = (originalCheckData) => {
  // Original Check Data
  originalCheckData = (typeof originalCheckData === 'object' && originalCheckData !== null) ? originalCheckData : false;
  // ID
  originalCheckData.id = (typeof originalCheckData.id === 'string' && originalCheckData.id.trim().length === 20)
    ? originalCheckData.id.trim() : false;
  // User Phone
  originalCheckData.userPhone = (typeof originalCheckData.userPhone === 'string' && originalCheckData.userPhone.trim().length === 8) ? originalCheckData.userPhone.trim() : false;
  // Protocol
  originalCheckData.protocol = (typeof originalCheckData.protocol === 'string') && (['http', 'https'].indexOf(originalCheckData.protocol.trim()) > -1) ? originalCheckData.protocol : false;
  // Url
  originalCheckData.url = (typeof originalCheckData.url === 'string') && (originalCheckData.url.trim().length > 0)
    ? originalCheckData.url : false;
  // Method
  originalCheckData.method = (typeof originalCheckData.method === 'string')
    &&  (['get', 'post', 'put', 'delete'].indexOf(originalCheckData.method.trim()) > -1)
    ? originalCheckData.method : false;
  // Status Codes
  originalCheckData.statusCodes = (typeof originalCheckData.statusCodes === 'object')
  && (originalCheckData.statusCodes instanceof Array)
    && (originalCheckData.statusCodes.length > 0)
    ? originalCheckData.statusCodes : false;
  // Timeout Seconds
  originalCheckData.timeoutSeconds = (typeof originalCheckData.timeoutSeconds === 'number')
    && (originalCheckData.timeoutSeconds % 1 === 0)
    && (originalCheckData.timeoutSeconds >= 1)
    && (originalCheckData.timeoutSeconds <= 5)
    ? originalCheckData.timeoutSeconds : false;

  // Set the keys that may not be set (if the workers haven't seen this check before)
  originalCheckData.state = (typeof originalCheckData.state === 'string') && (['up', 'down'].indexOf(originalCheckData.state.trim()) > -1) ? originalCheckData.state : 'down';

  originalCheckData.lastChecked = (typeof originalCheckData.lastChecked === 'number')
    && (originalCheckData.lastChecked > 0)
    ? originalCheckData.lastChecked : false;

  // If all the checks pass, pass the data to the next step in the process
  if (originalCheckData.id
    && originalCheckData.userPhone
    && originalCheckData.protocol
    && originalCheckData.url
    && originalCheckData.method
    && originalCheckData.statusCodes
    && originalCheckData.timeoutSeconds) {
    workers.performCheck(originalCheckData);
  } else {
    console.log('Error: one the checks is not properly formatted. Skipping it.');
  }
};

/**
 * Perform the check, send the originalCheckData and the outcome of the process to the next step
 */
workers.performCheck = (originalCheckData) => {
  // Prepare of the initial check outcome
  const checkOutcome = {
    error: false,
    responseCode: false,
  };

  // Mark that the outcome has not been sent yet
  let outcomeSent = false;

  // Parse the hostname and the path out of the original check data
  const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
  const hostName = parsedUrl.hostname;
  const { path } = parsedUrl; // Using path and not pathname because we want the query string

  // Constructing the request
  const requestDetails = {
    protocol: `${originalCheckData.protocol}:`,
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  // Instantiate the request object (using either http or https)
  const moduleToUse = originalCheckData.protocol === 'https' ? https : http;
  const req = moduleToUse.request(requestDetails, (res) => {
    // Grab the status of the sent request
    const status = res.statusCode;
    // Update the checkOutcome and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the error event so it doesn't get thrown
  req.on('error', (e) => {
    // update the checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: e,
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event so it doesn't get thrown
  req.on('timeout', () => {
    // update the checkOutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: 'timeout',
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // End the request
  req.end();
};

/**
 * Process the check outcome, update the check data as needed, trigger an alert if needed
 * Special logic for accommodating a check that has never been tested(don 't alert on that)
 */
workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  // decide if the check is considered up or down
  const state = (!checkOutcome.error
    && checkOutcome.responseCode
    && originalCheckData.statusCodes.indexOf(checkOutcome.responseCode) > -1)
    ? 'up' : 'down';

  // Decide if an alert is warranted
  const alertWarranted = (originalCheckData.lastChecked && originalCheckData.state !== state);

  // Update the check data
  let newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // Save the updates
  Data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      // send the new check data to the next phase of the process if needed
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Check outcome has not changed, no alert needed.');
      }
    } else {
      console.log('Could not update check data.');
    }
  });
};

/**
 * Alert the user as to a change in their check status
 */
workers.alertUserToStatusChange = (newCheckData) => {
  const msg = `Alert: your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;
  TwilioApi.sendSms(newCheckData.userPhone, msg, (err) => {
    if (!err) {
      console.log('Success: user was alerted about their check status change via sms', msg);
    } else {
      console.log('Error: could not send an sms alert.');
    }
  });
};

/**
 * Timer to execute the worker - process once per minute
 */
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

/**
 * Init script
 */
workers.init = () => {
  // Execute all the checks immediately
  workers.gatherAllChecks();
  // Call the loop so the checks will execute later on
  workers.loop();
};

// Export the module
module.exports = workers;
