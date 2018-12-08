/**
 * Create and export configurations variables
 */

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
  port: 3000,
  envName: 'staging',
};

// Production (default) environment
environments.production = {
  port: 5000,
  envName: 'production',
};

// Determine which environment to export
const currentEnvironment = (typeof process.env.NODE_ENV === 'string') ? process.env.NODE_ENV.toLowerCase() : '';
const environmentToExport = (typeof environments[currentEnvironment] === 'object') ? environments[currentEnvironment] : environments.staging;

// export the module
module.exports = environmentToExport;
