const env = require('../config/env');

const providers = {
  mock: require('./mock.provider'),
  aftership: require('./aftership.provider'),
};

module.exports = () => providers[env.TRACKING_PROVIDER];
