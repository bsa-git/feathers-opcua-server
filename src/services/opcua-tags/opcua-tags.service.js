// Initializes the `opcua-tags` service on path `/opcua-tags`
const { OpcuaTags } = require('./opcua-tags.class');
const createModel = require('../../models/opcua-tags.model');
const hooks = require('./opcua-tags.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate,
    multi: true 
  };

  // Initialize our service with any options it requires
  app.use('/opcua-tags', new OpcuaTags(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('opcua-tags');

  service.hooks(hooks);
};
