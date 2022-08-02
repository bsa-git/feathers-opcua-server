/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const logger = require('../../logger');
const moment = require('moment');
const fs = require('fs');

const loReduce = require('lodash/reduce');
const loTemplate = require('lodash/template');

const {
  appRoot,
  inspector,
  readJsonFileSync,
  removeFilesFromDirSync,
  isTrue,
} = require('../lib');

const {
  getOpcuaTags,
  getOpcuaConfig,
  getServerService,
  getClientService,
  executeOpcuaClientScript,
  getOpcuaBootstrapParams
} = require('./opcua-helper');

const {
  getStoreParams4Data,
  saveOpcuaTags,
  removeOpcuaGroupValues,
  removeOpcuaStoreValues,
  updateRemoteFromLocalStore,
  integrityCheckOpcua,
  checkStoreParameterChanges,
  saveStoreParameterChanges,
  saveStoreOpcuaGroupValue,
  isSaveOpcuaToDB,
  isRemoteOpcuaToDB,
  isUpdateOpcuaToDB,
  getOpcuaRemoteDbUrl,
  getCountItems,
  syncHistoryAtStartup
} = require('../db-helpers');

const {
  feathersClient
} = require('../auth');

const {
  methodAcmDayReportsDataGet
} = require('./opcua-methods');

const debug = require('debug')('app:opcua-bootstrap');
const isDebug = false;

// Get feathers-specs data
const feathersSpecs = readJsonFileSync(`${appRoot}/config/feathers-specs.json`) || {};


/**
 * Bootstrap of OPC-UA services
 * @param {Object} app 
 */
module.exports = async function opcuaBootstrap(app) {
  let service = null, opcuaServer = null, opcuaClient = null;
  let integrityResult, removeResult, bootstrapParams = null;
  // let methodResult = null, dataItems = [], savedValues = [], savedValuesCount = 0;
  // let methodResultOutputPath;
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

    // Get opcua bootstrap params
    bootstrapParams = getOpcuaBootstrapParams();

    // Get opcua tags 
    const opcuaTags = getOpcuaTags();
    // Check store parameter changes
    const storeChangesBrowseNames = await checkStoreParameterChanges(app, opcuaTags);
    if (isDebug && storeChangesBrowseNames.length) inspector('checkStoreParameterChanges.storeBrowseNames:', storeChangesBrowseNames);

    // Save opcua tags to local DB
    let saveResult = await saveOpcuaTags(app, opcuaTags, false);
    logger.info('opcuaBootstrap.saveOpcuaTags.localDB:', saveResult);
    // Integrity check opcua data
    integrityResult = await integrityCheckOpcua(app, false);
    if (integrityResult) {
      logger.info('Result integrity check opcua.localDB: OK');
    } else {
      logger.error('Result integrity check opcua.localDB: ERR');
    }
    if (isUpdateOpcuaToDB()) {
      removeResult = await removeOpcuaGroupValues(app);
      if (removeResult) logger.info(`opcuaBootstrap.removeOpcuaGroupValues.localDB: ${removeResult}`);
    }

    if (storeChangesBrowseNames.length) {
      const saveStoreResults = await saveStoreParameterChanges(app, storeChangesBrowseNames, opcuaTags);
      if (isDebug && saveStoreResults.length) inspector('saveStoreParameterChanges.saveStoreResults:', saveStoreResults);
      logger.info(`opcuaBootstrap.saveStoreParameterChanges.localDB: ${saveStoreResults.length}`);
    }

    // Remove opcua store values
    if (bootstrapParams && bootstrapParams.clearHistoryAtStartup) {
      removeResult = await removeOpcuaStoreValues(app);
      if (removeResult) logger.info(`opcuaBootstrap.removeOpcuaStoreValues.localDB: ${removeResult}`);
    }

    // Sync opcua store values
    if (bootstrapParams && bootstrapParams.syncHistoryAtStartup) {
      const syncResult = await syncHistoryAtStartup(app, opcuaTags, 'methodAcmDayReportsDataGet');
      const statusCode = syncResult.statusCode;
      if(statusCode === 'Good'){
        logger.info(`opcuaBootstrap.syncHistoryAtStartup.localDB: {"saved": ${syncResult.savedValuesCount}, "removed": ${syncResult.removedValuesCount}}`);
        // Remove files from dir
        removeFilesFromDirSync([appRoot, syncResult.methodResultOutputPath]);
      } else {
        logger.error(`opcuaBootstrap.syncHistoryAtStartup.localDB - ERROR. StatusCode: '${statusCode}'.`);
      }
    }

    const isRemote = isRemoteOpcuaToDB();
    if (isRemote) {
      const remoteDbUrl = getOpcuaRemoteDbUrl();
      const appRestClient = await feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
      if (appRestClient) {
        // Save opcua tags to remote DB
        saveResult = await saveOpcuaTags(appRestClient, opcuaTags, isRemote);
        logger.info('opcuaBootstrap.saveOpcuaTags.remoteDB:', saveResult);
        // Integrity check opcua data
        integrityResult = await integrityCheckOpcua(appRestClient, isRemote);
        if (integrityResult) {
          logger.info('Result integrity check opcua.remoteDB: OK');
        } else {
          logger.error('Result integrity check opcua.remoteDB: ERR');
        }
        // Remove opcua group values
        if (isUpdateOpcuaToDB()) {
          removeResult = await removeOpcuaGroupValues(appRestClient);
          if (removeResult) logger.info(`opcuaBootstrap.removeOpcuaGroupValues.localDB: ${removeResult}`);
        }

        // Remove opcua remote store values
        if (bootstrapParams && bootstrapParams.clearHistoryAtStartup) {
          removeResult = await removeOpcuaStoreValues(appRestClient);
          if (removeResult) logger.info(`opcuaBootstrap.removeOpcuaStoreValues.remoteDB: ${removeResult}`);
        }
        // Update remote store from local store
        const updateStores = await updateRemoteFromLocalStore(app, appRestClient, opcuaTags);
        logger.info(`opcuaBootstrap.updateRemoteFromLocalStore.updateStores: ${updateStores}`);
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
      if (isDebug && srvData) inspector('opcuaBootstrap.srvData:', srvData);
      opcuaServer = await service.create(srvData);
      if (isDebug && opcuaServer) inspector('opcuaBootstrap.opcuaServer:', opcuaServer.server.getCurrentState());
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

      if (isDebug) inspector('opcuaBootstrap.clientData:', clientData);
      // Create client service
      opcuaClient = await service.create(clientData);
      // Execute client script
      await executeOpcuaClientScript(service, id);
      if (isDebug && opcuaClient) inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
    }
  }
};