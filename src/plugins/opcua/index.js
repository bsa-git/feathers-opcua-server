
const OpcuaServer = require('./opcua-server.class');
const OpcuaClient = require('./opcua-client.class');
const opcuaHelper = require('./opcua-helper');
const opcuaBootstrap = require('./opcua-bootstrap');
const opcuaUserManager = require('./opcua-user-manager');

module.exports = Object.assign({},
  {
    OpcuaServer,
    OpcuaClient,
    opcuaBootstrap
  },
  opcuaHelper,
  opcuaUserManager
);
