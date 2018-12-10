/**
 * Library for storing and editing data
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the lib (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../.data/');

// Write data to a file
lib.create = (dir, file, data, callback) => {
  // Open the file or writing
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);
      fs.write(fileDescriptor, stringData, (err3) => {
        if (!err3) {
          fs.close(fileDescriptor, (err2) => {
            if (!err2) {
              callback(false);
            } else {
              callback('Error closing file.');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist.');
    }
  });
};

// Read data from a file
lib.read = (dir, file, callback) => {
  // Open the file or writing
  fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf-8', (err, data) => {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Update data to a file
lib.update = (dir, file, data, callback) => {
  // Open the file or writing
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      fs.truncate(fileDescriptor, (err1) => {
        if (!err1) {
          fs.write(fileDescriptor, stringData, (err2) => {
            if (!err2) {
              fs.close(fileDescriptor, (err3) => {
                if (!err3) {
                  callback(false);
                } else {
                  callback('Error closing existing file.');
                }
              });
            } else {
              callback('Error writing to existing file');
            }
          });
        } else {
          callback('Error truncating the file');
        }
      });
    } else {
      callback('Could not open the file for updating, it may not exist yet.');
    }
  });
};

// Delete a file
lib.delete = (dir, file, callback) => {
  fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting the file');
    }
  });
};

// Export the module
module.exports = lib;
