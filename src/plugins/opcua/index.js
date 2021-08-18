
const OpcuaServer = require('./opcua-server.class');
const OpcuaClient = require('./opcua-client.class');
const opcuaHelper = require('./opcua-helper');
const opcuaBootstrap = require('./opcua-bootstrap');
const opcuaUserManager = require('./opcua-user-manager');
const opcuaClientScripts = require('./opcua-client-scripts');
const opcuaGetters = require('./opcua-getters');
const opcuaSubscriptions = require('./opcua-subscriptions');

module.exports = Object.assign({},
  {
    OpcuaServer,
    OpcuaClient,
    opcuaBootstrap
  },
  opcuaHelper,
  opcuaUserManager,
  opcuaClientScripts,
  opcuaGetters,
  opcuaSubscriptions
);
