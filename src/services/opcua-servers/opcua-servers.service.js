// Initializes the `opcua-servers` service on path `/opcua-servers`
const { OpcuaServers } = require('./opcua-servers.class');
const opcuaServerMixins = require('./opcua-server.mixins');
const hooks = require('./opcua-servers.hooks');

module.exports = function (app) {

  const options = {
    paginate: app.get('paginate')
  };

  // Mixins have to be added before registering any services
  app.mixins.push(opcuaServerMixins);

  // Initialize our service with any options it requires
  app.use('/opcua-servers', new OpcuaServers(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('opcua-servers');

  service.hooks(hooks);
};
