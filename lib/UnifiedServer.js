/**
 * Unified Server (for any request)
 */

// Dependencies
const url = require('url');
const { StringDecoder } = require('string_decoder');
const router = require('./router');
const helpers = require('./helpers');

// All unified logic for http & https servers
const unifiedServer = (req, res) => {
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
    const chosenHandler = (typeof router[trimmedPath] !== 'undefined') ? router[trimmedPath] : router.notFound;

    // construct data object
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
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
};

// Export the module
module.exports = unifiedServer;
