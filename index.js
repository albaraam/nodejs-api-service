/**
 * Primary file for the API
 */

// Dependencies
const http = require('http');
const https = require('https');
const fs = require('fs');
const config = require('./config');
const unifiedServer = require('./lib/UnifiedServer');

// Instantiate http server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

httpServer.listen(config.httpPort, () => {
  console.log(`The server now listening to port ${config.httpPort} in ${config.envName} mode`);
});

// Instantiate https server
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, () => {
  console.log(`The server now listening to port ${config.httpsPort} in ${config.envName} mode`);
});
