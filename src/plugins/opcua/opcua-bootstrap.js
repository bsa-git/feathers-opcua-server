/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const logger = require('../../logger');

const {
  appRoot,
  inspector,
  readJsonFileSync,
  isTrue,
  isUrlExists
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
  saveOpcuaTags,
  removeOpcuaGroupValues,
  removeOpcuaStoreValues,
  integrityCheckOpcua,
  checkStoreParameterChanges,
  saveStoreParameterChanges,
  isSaveOpcuaToDB,
  isRemoteOpcuaToDB,
  isUpdateOpcuaToDB,
  getOpcuaRemoteDbUrl,
  syncHistoryAtStartup,
  syncReportAtStartup,
  initRemoteDB,
  setInitRemoteDB,
  getInitRemoteDB
} = require('../db-helpers');

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
  let methodName;
  //--------------------------------------------------------

  setInitRemoteDB(false);

  // Determine if command line argument exists for seeding data
  const isSeedServices = ['--seed', '-s'].some(str => process.argv.slice(2).includes(str));
  if (isSeedServices) return;
  // Check is opcua bootstrap enable
  const isOpcuaBootstrapEnable = isTrue(process.env.OPCUA_BOOTSTRAP_ENABLE);
  if (!isOpcuaBootstrapEnable) return;
  // Check is opcua bootstrap allowed
  const isOpcuaBootstrapAllowed = feathersSpecs.app.envAllowingOpcuaBootstrap.find(item => item === app.get('env'));
  if (!isOpcuaBootstrapAllowed) return;

  // Get opcua bootstrap params
  bootstrapParams = getOpcuaBootstrapParams();
  const isClearHistoryAtStartup = bootstrapParams && bootstrapParams.clearHistoryAtStartup;
  const isSyncHistoryAtStartup = bootstrapParams && bootstrapParams.syncHistoryAtStartup && bootstrapParams.syncHistoryAtStartup.active;
  const isSyncReportAtStartup = bootstrapParams && bootstrapParams.syncReportAtStartup && bootstrapParams.syncReportAtStartup.active;

  if (isSaveOpcuaToDB()) {
    // Get opcua tags 
    const opcuaTags = getOpcuaTags();
    // Check store parameter changes
    const storeChangesBrowseNames = await checkStoreParameterChanges(app, opcuaTags);
    if (isDebug && storeChangesBrowseNames.length) inspector('checkStoreParameterChanges.storeBrowseNames:', storeChangesBrowseNames);

    // Save opcua tags to local DB
    let saveResult = await saveOpcuaTags(app, opcuaTags, false);
    logger.info('opcuaBootstrap.saveOpcuaTags.localDB: OK.');
    logger.info('opcuaBootstrap.saveOpcuaTags.saveResult: %s', saveResult);
    // Integrity check opcua data
    integrityResult = await integrityCheckOpcua(app, false);
    if (integrityResult) {
      logger.info('opcuaBootstrap.Result integrity check opcua.localDB: OK.');
    } else {
      logger.error('opcuaBootstrap.Result integrity check opcua.localDB: ERR.');
    }
    if (isUpdateOpcuaToDB()) {
      removeResult = await removeOpcuaGroupValues(app);
      if (removeResult) logger.info(`opcuaBootstrap.removeOpcuaGroupValues.localDB: OK. (${removeResult})`);
    }

    if (storeChangesBrowseNames.length) {
      const saveStoreResults = await saveStoreParameterChanges(app, storeChangesBrowseNames, opcuaTags);
      if (isDebug && saveStoreResults.length) inspector('saveStoreParameterChanges.saveStoreResults:', saveStoreResults);
      logger.info(`opcuaBootstrap.saveStoreParameterChanges.localDB: OK. (${saveStoreResults.length})`);
    }

    // Remove opcua store values
    if (isClearHistoryAtStartup) {
      removeResult = await removeOpcuaStoreValues(app);
      if (removeResult) logger.info(`opcuaBootstrap.removeOpcuaStoreValues.localDB: OK. (${removeResult})`);
    }

    // Sync opcua store at startup
    if (isSyncHistoryAtStartup) {
      methodName = bootstrapParams.syncHistoryAtStartup.methodName;
      const syncResult = await syncHistoryAtStartup(app, opcuaTags, methodName);
      if (isDebug && syncResult) inspector('opcuaBootstrap.syncHistoryAtStartup.syncResult:', syncResult);
      logger.info(`opcuaBootstrap.syncHistoryAtStartup.localDB: OK. {"saved": ${syncResult.savedValuesCount}, "removed": ${syncResult.removedValuesCount}}`);
    }

    // Sync opcua store values
    if (isSyncReportAtStartup) {
      methodName = bootstrapParams.syncReportAtStartup.methodName;
      const syncResult = await syncReportAtStartup(app, opcuaTags, methodName);
      if (isDebug && syncResult) inspector('opcuaBootstrap.syncReportAtStartup.syncResult:', syncResult);
      logger.info('opcuaBootstrap.syncReportAtStartup.localDB: OK.');
    }

    const isRemote = isRemoteOpcuaToDB();
    const remoteDbUrl = getOpcuaRemoteDbUrl();
    const isURL = isRemote ? await isUrlExists(remoteDbUrl) : false;

    if (isRemote && !isURL) {
      const intervalId = setInterval( async function () {
        
        const isURL = isRemote ? await isUrlExists(remoteDbUrl, { showMsg: false }) : false;
        const isInitRemoteDB = getInitRemoteDB();
        // console.log(`Start Interval for InitRemoteDB: OK, isURL=${isURL}, isInitRemoteDB=${isInitRemoteDB}`);
        logger.info(`Start Interval for InitRemoteDB: OK, isURL=${isURL}, isInitRemoteDB=${isInitRemoteDB}`);
        if (isRemote && isURL && !isInitRemoteDB){
          clearInterval(intervalId);
          // Init remote DB
          await initRemoteDB(app, remoteDbUrl, opcuaTags, isClearHistoryAtStartup);
          setInitRemoteDB(true);
        }
      }, 5000);
    }

    if (isRemote && isURL) {
      // Init remote DB
      await initRemoteDB(app, remoteDbUrl, opcuaTags, isClearHistoryAtStartup);
      setInitRemoteDB(true);
    }
  }

  // Create mssql datasets
  if (bootstrapParams &&
    bootstrapParams.mssqlDataBases &&
    bootstrapParams.mssqlDataBases.length) {
    const mssqlDataBases = bootstrapParams.mssqlDataBases;
    for (let index = 0; index < mssqlDataBases.length; index++) {
      const mssqlDataBase = mssqlDataBases[index];
      const service = app.service('mssql-datasets');
      await service.create({ config: mssqlDataBase });
    }
    logger.info(`opcuaBootstrap.CreateMssqlDatasets: OK. (${mssqlDataBases.length})`);
  }
  logger.info('-------------------------------------------------------------------');

  // Create server and client services
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
      logger.info('-------------------------------------------------------------------');
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
      logger.info('-------------------------------------------------------------------');
    }
  }
};