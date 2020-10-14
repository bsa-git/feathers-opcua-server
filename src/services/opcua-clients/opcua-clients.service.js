// Initializes the `opcua-clients` service on path `/opcua-clients`
const { OpcuaClients } = require('./opcua-clients.class');
const hooks = require('./opcua-clients.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/opcua-clients', new OpcuaClients(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('opcua-clients');

  service.hooks(hooks);
};
