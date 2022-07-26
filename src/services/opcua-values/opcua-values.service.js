// Initializes the `messages` service on path `/messages`
const { OpcuaValues } = require('./opcua-values.class');
const opcuaValuesMixins = require('./opcua-values.mixins');
const createModel = require('../../models/opcua-values.model');
const hooks = require('./opcua-values.hooks');
const { getEnvTypeDB } = require('../../plugins');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate,
    multi: true 
  };

  if (getEnvTypeDB() === 'nedb') {
    options.whitelist = ['$not', '$and'];
  }

  if (getEnvTypeDB() === 'mongodb') {
    options.whitelist = ['$nor'];
  }

  // Mixins have to be added before registering any services
  app.mixins.push(opcuaValuesMixins);

  // Initialize our service with any options it requires
  app.use('/opcua-values', new OpcuaValues(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('opcua-values');

  service.hooks(hooks);
};
