const fs = require('fs');
const path = require('path');

const dotenvFile = path.resolve(fs.realpathSync(process.cwd()), '.env');

if (fs.existsSync(dotenvFile)) {
  require('dotenv').config({ // eslint-disable-line global-require
    path: dotenvFile,
  });
}

function getClientEnvironment() {
  const raw = Object.keys(process.env).reduce((env, key) => {
    env[key] = process.env[key]; // eslint-disable-line no-param-reassign
    return env;
  }, {
    // Useful for determining whether we’re running in production mode.
    NODE_ENV: process.env.NODE_ENV || 'development',
  });
  // Stringify all values so we can feed into Webpack DefinePlugin
  return {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]); // eslint-disable-line no-param-reassign
      return env;
    }, {}),
  };
}

module.exports = getClientEnvironment;
