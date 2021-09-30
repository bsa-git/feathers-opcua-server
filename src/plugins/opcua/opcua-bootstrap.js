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
  executeOpcuaClientScript,
  getOpcuaTags
} = require('./opcua-helper');

const {
  saveOpcuaTags,
  isSaveOpcuaToDB,
  getOpcuaSaveModeToDB,
  getOpcuaRemoteDbUrl,
} = require('../db-helpers');

const {
  feathersClient
} = require('../auth');

const {
  MessageSecurityMode,
  SecurityPolicy,
  UserTokenType,
  AttributeIds
} = require('node-opcua');

const chalk = require('chalk');

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

  if (isSaveOpcuaToDB()) {
    // Get opcua tags 
    const opcuaTags = getOpcuaTags();
    if (isLog) inspector('opcuaBootstrap.opcuaTags:', opcuaTags);
    // inspector('opcuaBootstrap.opcuaTags:', opcuaTags);
    // Save opcua tags to local DB
    let saveResult = await saveOpcuaTags(app, opcuaTags);
    logger.info('opcuaBootstrap.saveOpcuaTags.localDB:', saveResult);
    const isRemote = getOpcuaSaveModeToDB() === 'remote';
    if (isRemote) {
      const remoteDbUrl = getOpcuaRemoteDbUrl();
      try {
        await urlExists(remoteDbUrl);
        const appRestClient = feathersClient({ transport: 'rest', serverUrl: remoteDbUrl });
        saveResult =  await saveOpcuaTags(appRestClient, opcuaTags, isRemote);
        logger.info('opcuaBootstrap.saveOpcuaTags.remoteDB:', saveResult);
      } catch (error) {
        if (isLog) inspector('opcuaBootstrap.saveOpcuaTags.error:', error);
        // inspector('opcuaBootstrap.saveOpcuaTags.error:', error);
        if(error.code === 'ECONNREFUSED'){
          console.log(chalk.red('error:'), 'opcuaBootstrap.saveOpcuaTags.remoteDB:', chalk.cyan(`Remote url "${remoteDbUrl}" does not found!`));
        } else {
          console.log(chalk.red('error:'), 'opcuaBootstrap.saveOpcuaTags.remoteDB:', chalk.cyan(`${error.message}`));
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
      if (isLog) inspector('opcuaBootstrap.srvData:', srvData);
      opcuaServer = await service.create(srvData);
      if (isLog) inspector('opcuaBootstrap.opcuaServer:', opcuaServer.server.getCurrentState());
      // inspector('opcuaBootstrap.opcuaServer:', opcuaServer.server.getCurrentState());
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
      if (isLog) inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
      // inspector('opcuaBootstrap.opcuaClient:', opcuaClient.client.getClientInfo());
    }
  }
};