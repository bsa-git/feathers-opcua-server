/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { inspector, appRoot, getParseUrl, getHostname, getMyIp } = require('../lib');
const {
  extractFullyQualifiedDomainName
} = require('node-opcua');
const moment = require('moment');

const loToInteger = require('lodash/toInteger');
const loIsObject = require('lodash/isObject');

const debug = require('debug')('app:opcua-helper');
const isLog = true;
const isDebug = false;

/**
 * @method nodeIdToString
 * 
 * @param {String|Object} nodeId 
 * @returns {String}
 */
const nodeIdToString = function (nodeId = '') {
  return loIsObject(nodeId) ? nodeId.toString() : nodeId;
};

/**
 * @method getNodeIdType
 * 
 * @param {String} nodeId
 * e.g. nodeId='ns=1;s=Temperature' => 's' (NodeIdType.STRING)
 * e.g. nodeId='ns=0;i=12345' => 'i' (NodeIdType.NUMERIC)
 * e.g. nodeId='ns=1;g=gsaskwqoieu323242442' => 'g' (NodeIdType.GUID)
 * e.g. nodeId='ns=0;b=adf3456...df456' => 'b' (NodeIdType.BYTESTRING)
 * @return {String}
 */
const getNodeIdType = function (nodeId = '') {
  nodeId = nodeIdToString(nodeId);
  const nodeIdType = nodeId.split(';')[1].split('=')[0];
  return nodeIdType;
};

/**
 * @method getValueFromNodeId
 * 
 * @param {String|Object} nodeId
 * e.g. nodeId='ns=1;s=Device1.Temperature' => 'Device1.Temperature'
 * @return {String}
 */
const getValueFromNodeId = function (nodeId) {
  let value = null;
  nodeId = nodeIdToString(nodeId);
  if (nodeId) {
    value = nodeId.split(';')[1].split('=')[1];
  }
  return value;
};

/**
 * @method getNameSpaceFromNodeId
 * 
 * @param {String|Object} nodeId
 * e.g. nodeId='ns=1;s=Device1.Temperature' => 1
 * @return {Int|void}
 */
const getNameSpaceFromNodeId = function (nodeId = '') {
  let ns = undefined;
  nodeId = nodeIdToString(nodeId);
  if (nodeId) {
    ns = nodeId.split(';')[0].split('=')[1];
    ns = loToInteger(ns);
  }
  return ns;
};

/**
 * @method getOpcuaConfig
 * @param {String} id 
 * @returns {Object|Array}
 */
const getOpcuaConfig = function (id = '') {
  let opcuaOption = null;
  const opcuaOptions = require(`${appRoot}/src/api/opcua/OPCUA_Config.json`);
  if (id) {
    opcuaOption = opcuaOptions.find(opt => opt.id === id);
    if (!opcuaOption) {
      throw new errors.BadRequest(`The opcua option not find for this id = '${id}' in the opcua config list`);
    }
  }

  return id ? opcuaOption : opcuaOptions;
};

/**
 * @method getSubscriptionHandler
 * @param {String} id 
 * @param {String} nameFile 
 * @returns {Function}
 */
const getSubscriptionHandler = function (id, nameFile = '') {
  const defaultNameFile = 'onChangedCommonHandler';
  // Get opcuaOption 
  const opcuaOption = getOpcuaConfig(id);
  // Get subscriptionHandler
  const subscriptionHandlers = require(`${appRoot}${opcuaOption.paths.subscriptions}`);
  return subscriptionHandlers[nameFile] ? subscriptionHandlers[nameFile] : subscriptionHandlers[defaultNameFile];
};

/**
 * @method getServerService
 * @param {Object} app
 * @param {String} id 
 * @returns {Object}
 */
const getServerService = async function (app = null, id) {
  let srvService = null;
  const opcuaOption = getOpcuaConfig(id);
  const myPort = app.get('port');
  const serviceUrl = opcuaOption.srvServiceUrl;
  const _isMyServiceHost = await isMyServiceHost(serviceUrl, myPort);
  if (_isMyServiceHost) {
    srvService = app.service('opcua-servers');
  }
  return srvService;
};

/**
 * @method getClientService
 * @param {Object} app
 * @param {String} id 
 * @returns {Object}
 */
const getClientService = async function (app = null, id) {
  let clientService = null;
  const opcuaOption = getOpcuaConfig(id);
  const myPort = app.get('port');
  const serviceUrl = opcuaOption.clientServiceUrl;
  const _isMyServiceHost = await isMyServiceHost(serviceUrl, myPort);
  if (_isMyServiceHost) {
    clientService = app.service('opcua-clients');
  }
  return clientService;
};

/**
 * @method getSrvCurrentState
 * Get opcua server currentState
 * @async
 * 
 * @param {Application} app 
 * @param {String} id 
 * @returns {Object}
 */
const getSrvCurrentState = async (app, id) => {
  const service = await getServerService(app, id);
  const opcuaServer = await service.get(id);
  return opcuaServer.server.currentState;
};

/**
 * @method getClientForProvider
 * @param {Object} client 
 * @returns {Object}
 */
const getClientForProvider = (client) => {
  return {
    client: client.getClientInfo()
  };
};

/**
 * @method getServerForProvider
 * @param {Object} server 
 * @returns {Object}
 */
const getServerForProvider = (server) => {
  return {
    server: {
      currentState: server.getCurrentState()
    }
  };
};

/**
 * @method isOpcuaServerInList
 * 
 * @param {OpcuaServers} service 
 * @param {String} id 
 * @returns {Boolean}
 */
const isOpcuaServerInList = (service, id) => {
  let opcuaServer = null;
  opcuaServer = service.opcuaServers.find(srv => srv.id === id);
  return !!opcuaServer;
};

/**
 * @method isOpcuaClientInList
 * 
 * @param {OpcuaClients} service 
 * @param {String} id 
 * @returns {Boolean}
 */
const isOpcuaClientInList = (service, id) => {
  let opcuaClient = null;
  opcuaClient = service.opcuaClients.find(client => client.id === id);
  return !!opcuaClient;
};

/**
 * @method isMyServiceHost
 * @async
 * 
 * @param {String} serviceUrl 
 * @param {Number} myPort 
 * @returns {Boolean}
 */
const isMyServiceHost = async function (serviceUrl, myPort) {
  const serviceHostname = getParseUrl(serviceUrl).hostname.toLowerCase();
  const servicePort = getParseUrl(serviceUrl).port;
  const myHostname = getHostname();
  let myDomainName = await extractFullyQualifiedDomainName();
  myDomainName = myDomainName.toLowerCase();
  const myIp = getMyIp();
  if (isDebug) debug('isMyServiceHostname:', {
    serviceHostname,
    servicePort,
    myPort,
    myHostname,
    myDomainName,
    myIp
  });
  return (servicePort === myPort) || (serviceHostname === myHostname) || (serviceHostname === myDomainName) || (serviceHostname === 'localhost') || (serviceHostname === myIp);
};


module.exports = {
  nodeIdToString,
  getNodeIdType,
  getValueFromNodeId,
  getNameSpaceFromNodeId,
  getOpcuaConfig,
  getSubscriptionHandler,
  getServerService,
  getClientService,
  getSrvCurrentState,
  getClientForProvider,
  getServerForProvider,
  isOpcuaServerInList,
  isOpcuaClientInList,
  isMyServiceHost
};
