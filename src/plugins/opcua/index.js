
const OpcuaServer = require('./opcua-server.class');
const OpcuaClient = require('./opcua-client.class');
const opcuaHelper = require('./opcua-helper');
const opcuaBootstrap = require('./opcua-bootstrap');

module.exports = Object.assign({},
  {
    OpcuaServer,
    OpcuaClient,
    opcuaBootstrap
  },
  opcuaHelper
);
