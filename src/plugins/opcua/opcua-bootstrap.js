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
    // debug('opcuaBootstrap.opcuaOptionID:', option.id);
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

      // await service.subscriptionCreate(id);

      // const srvCurrentState = await service.getSrvCurrentState(id);
      // // Start subscriptionMonitor
      // let variables = srvCurrentState.paramsAddressSpace.variables;
      // variables = variables.filter(v => v.ownerGroup === 'CH_M51::ValueFromFile').map(v => v.browseName);
      // const groups = getGroupsFromArray(variables, 10);
      // for (let index = 0; index < groups.length; index++) {
      //   const group = groups[index];
      //   const nodeIds = await service.getNodeIds(id, group);
      //   for (let index2 = 0; index2 < nodeIds.length; index2++) {
      //     const nodeId = nodeIds[index2];
      //     await service.subscriptionMonitor(id, 'onChangedCH_M5Handler', { nodeId });
      //   }
      // }

      // inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
    }
  }
};