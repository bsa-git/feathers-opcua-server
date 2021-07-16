/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const logger = require('../../logger');
const fs = require('fs');
const {
  readJsonFileSync, 
  inspector, 
  appRoot,
  isTrue
} = require('../lib');

const {
  getOpcuaConfig,
  getServerService,
  getClientService,
  executeOpcuaClientScript,
  getOpcuaTags
} = require('./opcua-helper');

const {
  saveOpcuaTags
} = require('../db-helpers');

const {
  MessageSecurityMode,
  SecurityPolicy,
  UserTokenType
} = require('node-opcua');

const debug = require('debug')('app:opcua-bootstrap');
const isDebug = false;
const isLog = false;

// Get feathers-specs data
const feathersSpecs = readJsonFileSync(`${appRoot}/config/feathers-specs.json`) || {};


/**
 * Bootstrap of OPC-UA services
 * @param {Object} app 
 */
module.exports = async function opcuaBootstrap(app) {
  let service = null, opcuaServer = null, opcuaClient = null;
  //--------------------------------------------------------
  
  // Determine if command line argument exists for seeding data
  const isSeedServices = ['--seed', '-s'].some(str => process.argv.slice(2).includes(str));
  if (isSeedServices) return;
  // Check is opcua bootstrap enable
  const isOpcuaBootstrapEnable = isTrue(process.env.OPCUA_BOOTSTRAP_ENABLE);
  if (!isOpcuaBootstrapEnable) return;
  // Check is opcua bootstrap allowed
  const isOpcuaBootstrapAllowed = feathersSpecs.app.envAllowingOpcuaBootstrap.find(item => item === app.get('env'));
  if (!isOpcuaBootstrapAllowed) return;
  
  // Remove all tags
  // await  app.service('opcua-values').remove(null);
  // await  app.service('opcua-tags').remove(null);
  // Get opcua tags 
  const opcuaTags = getOpcuaTags();
  if (isLog) inspector('opcuaBootstrap.opcuaTags:', opcuaTags);
  // Save opcua tags 
  const saveResult = await saveOpcuaTags(app, opcuaTags);
  logger.info('opcuaBootstrap.saveOpcuaTags:', saveResult);

  let opcuaOptions = getOpcuaConfig();
  opcuaOptions = opcuaOptions.filter(item => !item.isDisable);
  for (let index = 0; index < opcuaOptions.length; index++) {
    const option = opcuaOptions[index];
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
      if (isLog) inspector('opcuaBootstrap.srvData:', srvData);
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

      if (isLog) inspector('opcuaBootstrap.clientData:', clientData);
      // Create client service
      opcuaClient = await service.create(clientData);
      if (isLog) inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
      // Execute client script
      await executeOpcuaClientScript(service, option.id);
    }
  }
};