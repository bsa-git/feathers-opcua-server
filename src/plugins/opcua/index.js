
const OpcuaServer = require('./opcua-server.class');
const OpcuaClient = require('./opcua-client.class');
const opcuaHelper = require('./opcua-helper');
const opcuaClientMixins = require('./opcua-client-mixins');
const opcuaServerMixins = require('./opcua-server-mixins');
const opcuaBootstrap = require('./opcua-bootstrap');

module.exports = Object.assign({},
  {
    OpcuaServer,
    OpcuaClient,
    opcuaClientMixins,
    opcuaServerMixins,
    opcuaBootstrap
  },
  opcuaHelper
);
