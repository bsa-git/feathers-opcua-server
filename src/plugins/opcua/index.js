
const OpcuaServer = require('./opcua-server.class');
const OpcuaClient = require('./opcua-client.class');
const opcuaHelper = require('./opcua-helper');

module.exports = Object.assign({},
  {
    OpcuaServer,
    OpcuaClient,
  },
  opcuaHelper
);
