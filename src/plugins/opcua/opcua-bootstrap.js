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
  isMyServiceHost,
} = require('./opcua-helper');

const debug = require('debug')('app:opcua-bootstrap');
const isDebug = false;
const isLog = false;


/**
 * Bootstrap of OPC-UA services
 * @param {Object} app 
 */
module.exports = async function opcuaBootstrap(app) {
  let service = null;
  
  const opcuaOptions = getOpcuaConfig();
  opcuaOptions.forEach(async option => {
    const myPort = app.get('port');
    // Create service for OPC-UA server
    const isMySrvService = await isMyServiceHost(option.srvServiceUrl, myPort);
    if (isMySrvService) {
      // service create
      service = await getServerService(app, option.id);
      const srvData = {
        params: {
          port: option.endpointPort, 
          serverInfo: { applicationName: option.id },
        }
      };
      const opcuaServer = await service.create(srvData);
      if(isLog) inspector('opcuaBootstrap.opcuaServer:', opcuaServer.server.getCurrentState());
      // inspector('opcuaBootstrap.opcuaServer:', opcuaServer.server.getCurrentState());
    }
    // Create service for OPC-UA client
    const isMyClientService = await isMyServiceHost(option.clientServiceUrl, myPort);
    if (isMyClientService) {
      // service create
      service = await getClientService(app, option.id);
      const clientData = {
        params: {
          applicationName: option.id,
        }
      };
      const opcuaClient = await service.create(clientData);
      if(isLog) inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
      // inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
    }
  });
};