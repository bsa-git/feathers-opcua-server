/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const logger = require('../../logger');
const fs = require('fs');
const {
  readJsonFileSync,
  inspector,
  appRoot,
  isTrue,
  urlExists,
} = require('../lib');

const {
  getOpcuaConfig,
  getServerService,
  getClientService,
  executeOpcuaClientScript
} = require('./opcua-helper');

const {
  saveOpcuaTags,
  removeOpcuaValues,
  integrityCheckOpcua,
  isSaveOpcuaToDB,
  isRemoteOpcuaToDB,
  isUpdateOpcuaToDB,
  getOpcuaRemoteDbUrl,
  getCountItems
} = require('../db-helpers');

const {
  feathersClient
} = require('../auth');


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
  let integrityResult, removeResult;
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

  if (isSaveOpcuaToDB()) {
    // Save opcua tags to local DB
    let saveResult = await saveOpcuaTags(app);
    logger.info('opcuaBootstrap.saveOpcuaTags.localDB:', saveResult);
    // Integrity check opcua data
    integrityResult = await integrityCheckOpcua(app);
    if (integrityResult) {
      logger.info('Result integrity check opcua.localDB: OK');
    } else {
      logger.error('Result integrity check opcua.localDB: ERR');
    }
    if (isUpdateOpcuaToDB()) {
      removeResult = await removeOpcuaValues(app);
      if(removeResult)
        logger.info(`opcuaBootstrap.removeOpcuaValues.localDB: ${removeResult}`);
    }

    const isRemote = isRemoteOpcuaToDB();
    if (isRemote) {
      const remoteDbUrl = getOpcuaRemoteDbUrl();
      const appRestClient = await feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
      if (appRestClient) {
        // Save opcua tags to remote DB
        saveResult = await saveOpcuaTags(appRestClient, isRemote);
        logger.info('opcuaBootstrap.saveOpcuaTags.remoteDB:', saveResult);
        // Integrity check opcua data
        integrityResult = await integrityCheckOpcua(appRestClient);
        if (integrityResult) {
          logger.info('Result integrity check opcua.remoteDB: OK');
        } else {
          logger.error('Result integrity check opcua.remoteDB: ERR');
        }
        if (isUpdateOpcuaToDB()) {
          removeResult = await removeOpcuaValues(appRestClient);
          if(removeResult) logger.info(`opcuaBootstrap.removeOpcuaValues.localDB: ${removeResult}`);
        }
      }
    }
  }

  let opcuaOptions = getOpcuaConfig();
  opcuaOptions = opcuaOptions.filter(item => item.isEnable || item.isEnable === undefined);
  for (let index = 0; index < opcuaOptions.length; index++) {
    const option = opcuaOptions[index];
    const id = option.id;
    // Create service for OPC-UA server
    service = await getServerService(app, id);
    if (service) {
      // service create
      const srvData = {
        params: {
          port: option.endpointPort,
          serverInfo: { applicationName: id },
        }
      };
      if (isLog && srvData) inspector('opcuaBootstrap.srvData:', srvData);
      opcuaServer = await service.create(srvData);
      if (isLog && opcuaServer) inspector('opcuaBootstrap.opcuaServer:', opcuaServer.server.getCurrentState());
    }
    // Create service for OPC-UA client
    service = await getClientService(app, id);
    if (service) {
      // service create
      const clientData = {
        params: {
          applicationName: id,
        }
      };

      if (isLog) inspector('opcuaBootstrap.clientData:', clientData);
      // Create client service
      opcuaClient = await service.create(clientData);
      // Execute client script
      await executeOpcuaClientScript(service, id);
      if (isLog && opcuaClient) inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
    }
  }
};