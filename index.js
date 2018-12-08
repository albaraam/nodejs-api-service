/**
 * Primary file for the API
 */

// Dependencies
const url = require('url');
const http = require('http');
const { StringDecoder } = require('string_decoder');
const config = require('./config');

const server = http.createServer((req, res) => {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const { headers } = req;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    // Choose the right handler
    const chosenHandler = (typeof router[trimmedPath] !== 'undefined') ? router[trimmedPath] : handlers.notFound;

    // construct data object
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer,
    };

    chosenHandler(data, (statusCode, payload) => {
      // Set default values
      statusCode = (typeof statusCode === 'number') ? statusCode : 200;
      payload = (typeof payload === 'object') ? payload : {};
      const payloadString = JSON.stringify(payload);

      // return response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      console.log('Returning this response: ', statusCode, payloadString);
    });
  });
});

server.listen(config.port, () => {
  console.log(`The server now listening to port ${config.port} in ${config.envName} mode`);
});

// Define handlers
let handlers = {};

// Sample handler
handlers.sample = (data, callback) => {
  callback(406, { name: 'Sample handler' });
};
// Not Found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Define a request router
const router = {
  sample: handlers.sample,
}
