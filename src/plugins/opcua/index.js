
const OpcuaServer = require('./opcua-server.class');
const OpcuaClient = require('./opcua-client.class');
const opcuaHelper = require('./opcua-helper');
const opcuaClientMixins = require('./opcua-client-mixins');

module.exports = Object.assign({},
  {
    OpcuaServer,
    OpcuaClient,
    opcuaClientMixins
  },
  opcuaHelper
);
