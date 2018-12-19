/**
 * Create and export configurations variables
 */

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
  hashingSecret: 'ThisIsASecret',
  maxChecks: 5,
};

// Production (default) environment
environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
  hashingSecret: 'ThisIsASecret',
  maxChecks: 5,
};

// Determine which environment to export
const currentEnvironment = (typeof process.env.NODE_ENV === 'string') ? process.env.NODE_ENV.toLowerCase() : '';
const environmentToExport = (typeof environments[currentEnvironment] === 'object') ? environments[currentEnvironment] : environments.staging;

// export the module
module.exports = environmentToExport;
