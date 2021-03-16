/* eslint-disable no-unused-vars */
// Initializes the `opcua-clients` service on path `/opcua-clients`
const { OpcuaClients } = require('./opcua-clients.class');
const opcuaClientMixins = require('./opcua-client.mixins');
const hooks = require('./opcua-clients.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Mixins have to be added before registering any services
  app.mixins.push(opcuaClientMixins);

  // Initialize our service with any options it requires
  app.use('/opcua-clients', new OpcuaClients(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('opcua-clients');

  service.hooks(hooks);
};
