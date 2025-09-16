const { getBaseOptions, getDevOptions } = require('./scripts/buildOptions');

const config = (_, argv) => ({ ...getBaseOptions() });

module.exports = config;