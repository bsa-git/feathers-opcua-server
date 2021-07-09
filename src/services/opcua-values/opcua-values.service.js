// Initializes the `messages` service on path `/messages`
const { OpcuaValues } = require('./opcua-values.class');
const createModel = require('../../models/opcua-values.model');
const hooks = require('./opcua-values.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate,
    multi: true 
  };

  // Initialize our service with any options it requires
  app.use('/opcua-values', new OpcuaValues(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('opcua-values');

  service.hooks(hooks);
};
