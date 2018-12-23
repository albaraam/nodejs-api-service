/**
 * A library for storing and reading logs
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Container
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '../.logs/');

/**
 * Append a string to a file, and create it if it doesn't exist
 */
lib.append = (file, str, callback) => {
  // Open the file
  fs.open(`${lib.baseDir}${file}.log`, 'a', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Append to the file and close it
      fs.appendFile(fileDescriptor, `${str}\n`, (err1) => {
        if (!err1) {
          fs.close(fileDescriptor, (err2) => {
            if (!err2) {
              callback(false);
            } else {
              callback('Error closing the file that was being appended.');
            }
          });
        } else {
          callback('Error appending to the file.');
        }
      });
    } else {
      callback('Could not open the file for appending.');
    }
  });
};

/**
 * List all the logs, and optionally include the compressed ones
 */
lib.list = (includeCompressedLogs, callback) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (!err && data && data.length > 0) {
      const trimmedFileNames = [];
      data.forEach((fileName) => {
        // Add the .log files
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''));
        }

        // Add the compressed (.gz) files
        if (includeCompressedLogs && fileName.indexOf('.gz.b64') > -1) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

/**
 * Compress the content of one of the .log files into .gz.b64 within the same directory
 */
lib.compress = (logId, newFileId, callback) => {
  const sourceFile = `${logId}.log`;
  const destFile = `${newFileId}.gz.b64`;

  // Read the source file
  fs.readFile(`${lib.baseDir}${sourceFile}`, 'utf8', (err, inputString) => {
    if (!err && inputString) {
      // Compress the data with gzip (comes inside zlib)
      zlib.gzip(inputString, (err1, buffer) => {
        if (!err1 && buffer) {
          // Send the new compressed data to the new file
          fs.open(`${lib.baseDir}${destFile}`, 'wx', (err2, fileDescriptor) => {
            if (!err2 && fileDescriptor) {
              fs.writeFile(fileDescriptor, buffer.toString('base64'), (err3) => {
                if (!err3) {
                  // Close the destination file
                  fs.close(fileDescriptor, (err4) => {
                    if (!err4) {
                      callback(false);
                    } else {
                      callback(err4);
                    }
                  });
                } else {
                  callback(err3);
                }
              });
            } else {
              callback(err2);
            }
          });
        } else {
          callback(err1);
        }
      });
    } else {
      callback(err);
    }
  });
};

/**
  * Decompress the content of .gz.b64 file content to a string
  */
lib.decompress = (fileId, callback) => {
  const fileName = `${fileId}.gz.b64`;
  fs.readFile(`${lib.baseDir}${fileName}`, 'utf8', (err, str) => {
    if (!err && str) {
      // decompress the data
      const inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, (err1, outputBuffer) => {
        if (!err1 && outputBuffer) {
          // Callback
          const uncompressedStr = outputBuffer.toString();
          callback(false, uncompressedStr);
        } else {
          callback(err1);
        }
      });
    } else {
      callback(err);
    }
  });
};

/**
 * Truncate a log file
 */
lib.truncate = (logId, callback) => {
  fs.truncate(`${lib.baseDir}${logId}.log`, 0, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};

// Export the module
module.exports = lib;
