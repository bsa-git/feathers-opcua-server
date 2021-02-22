/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const fs = require('fs');
const {
  inspector,
  readOnlyNewFile
} = require('../lib');
const {
  getOpcuaConfig,
  getServerService,
  getClientService,
  executeOpcuaClientScript,
} = require('./opcua-helper');

const debug = require('debug')('app:opcua-bootstrap');
const isDebug = false;
const isLog = false;


/**
 * Bootstrap of OPC-UA services
 * @param {Object} app 
 */
module.exports = async function opcuaBootstrap(app) {
  let service = null, opcuaServer = null, opcuaClient = null;

  const opcuaOptions = getOpcuaConfig();
  for (let index = 0; index < opcuaOptions.length; index++) {
    const option = opcuaOptions[index];
    const myPort = app.get('port');
    if (isDebug) debug('opcuaBootstrap.opcuaOptionID:', option.id);
    // Create service for OPC-UA server
    service = await getServerService(app, option.id);
    if (service) {
      // service create
      const srvData = {
        params: {
          port: option.endpointPort,
          serverInfo: { applicationName: option.id },
        }
      };
      opcuaServer = await service.create(srvData);
      if (isLog) inspector('opcuaBootstrap.opcuaServer:', opcuaServer.server.getCurrentState());
      // inspector('opcuaBootstrap.opcuaServer:', opcuaServer.server.getCurrentState());
    }
    // Create service for OPC-UA client
    service = await getClientService(app, option.id);
    if (service) {
      // service create
      const clientData = {
        params: {
          applicationName: option.id,
        }
      };
      opcuaClient = await service.create(clientData);
      if (isLog) inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
      // Execute client script
      await executeOpcuaClientScript(service, option.id);
    }
  }
};