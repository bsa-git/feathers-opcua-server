/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const {
  inspector,
  appRoot,
  getParseUrl,
  getHostname,
  getMyIp,
  strReplace
} = require('../lib');

const {
  writeFileSync,
  doesFileExist
} = require('../lib/file-operations');

const {
  DataType,
  makeEUInformation,
  extractFullyQualifiedDomainName
} = require('node-opcua');

const moment = require('moment');
const papa = require('papaparse');

const loToInteger = require('lodash/toInteger');
const loIsObject = require('lodash/isObject');
const loIsString = require('lodash/isString');
const loIsEqual = require('lodash/isEqual');
const loToPairs = require('lodash/toPairs');
const loMerge = require('lodash/merge');
const loConcat = require('lodash/concat');
const loOmit = require('lodash/omit');
const loAt = require('lodash/at');

const debug = require('debug')('app:opcua-helper');
const isLog = false;
const isDebug = false;

/**
 * @method nodeIdToString
 * 
 * @param {String|Object} nodeId 
 * @returns {String}
 */
const nodeIdToString = function (nodeId = '') {
  return !loIsString(nodeId) ? nodeId.toString() : nodeId;
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
  let nodeIdType = nodeId.split(';');
  if (nodeIdType.length > 1) {
    nodeIdType = nodeIdType[1].split('=')[0];
  } else {
    nodeIdType = '';
  }
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
  let nodeIdType = '', value = null;
  nodeId = nodeIdToString(nodeId);
  nodeIdType = getNodeIdType(nodeId);
  if (nodeId && nodeIdType) {
    value = nodeId.split(';')[1].split('=')[1];
    value = (nodeIdType === 'i') ? loToInteger(value) : value;
  } else {
    value = nodeId;
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
 * @method getOpcuaDataType
 * 
 * @param {String|Object} nodeId
 * e.g. nodeId='ns=1;s=Device1.Temperature' 
 * @returns {Array}
 * e.g. ['Double', 11]
 */
const getOpcuaDataType = function (nodeId = '') {
  nodeId = nodeIdToString(nodeId);
  let value = getValueFromNodeId(nodeId);
  const dataTypeList = loToPairs(DataType);
  if (isLog) inspector('getOpcuaDataType.DataTypeList:', dataTypeList);
  const dataType = dataTypeList.find(item => {
    return loIsEqual(item[1], loToInteger(value));
  });
  return dataType;
};

/**
 * @method formatUAVariable
 * @param {Object} uaVariable 
 * @returns {Object}
 */
const formatUAVariable = function (uaVariable = null) {
  let uaVar = {};
  uaVar.nodeClass = uaVariable.nodeClass;
  uaVar.nodeId = nodeIdToString(uaVariable.nodeId);
  uaVar.browseName = uaVariable.browseName.name;
  uaVar.dataType = getOpcuaDataType(uaVariable.dataType);
  uaVar.accessLevel = uaVariable.accessLevel;
  uaVar.userAccessLevel = uaVariable.userAccessLevel;
  uaVar.minimumSamplingInterval = uaVariable.minimumSamplingInterval;
  uaVar.historizing = uaVariable.historizing;
  uaVar.value = uaVariable._dataValue.value.value;
  uaVar.statusCode = uaVariable._dataValue.statusCode.name;
  loMerge(uaVar, uaVariable.aliasName ? { aliasName: uaVariable.aliasName } : {});
  return uaVar;
};

/**
 * @method formatConfigOption
 * @param {Object} configOption 
 * @param {String} locale 
 * e.g. locale -> 'ru'|'en'
 * @returns {Object}
 */
const formatConfigOption = function (configOption, locale) {
  let formatResult = {}, engineeringUnit, locales;
  formatResult.browseName = configOption.browseName;
  formatResult.displayName = configOption.displayName;
  loMerge(formatResult, configOption.aliasName ? { aliasName: configOption.aliasName } : {});
  loMerge(formatResult, configOption.type ? { type: configOption.type } : {});
  loMerge(formatResult, configOption.dataType ? { dataType: configOption.dataType } : {});
  loMerge(formatResult, configOption.valueParams ? { valueParams: configOption.valueParams } : {});
  // Set engineering unit for value
  if (formatResult.valueParams && formatResult.valueParams.engineeringUnits) {
    locales = require(`${appRoot}/src/plugins/localization/locales/${locale}.json`);
    engineeringUnit = locales.standardUnits[formatResult.valueParams.engineeringUnits];
    if (!engineeringUnit) {
      locales = require(`${appRoot}/src/plugins/localization/locales/${process.env.FALLBACK_LOCALE}.json`);
      engineeringUnit = locales.standardUnits[formatResult.valueParams.engineeringUnits];
    }
    if (engineeringUnit) {
      const args = loAt(engineeringUnit, ['symbol', 'shortName', 'longName']);
      formatResult.valueParams.engineeringUnits = makeEUInformation(...args).displayName.text;
    }
  }
  return formatResult;
};

/**
 * @method formatHistoryResults
 * @param {String} id 
 * e.g. 'ua-cherkassy-azot-test1'
 * @param {Object[]} historyResults 
 * @param {String[]} nameNodeIds 
 * e.g. ['CH_M51::01AMIAK:01F4.PNT', 'CH_M51::01AMIAK:01F21_1.PNT'] ||
 * e.g. ['ns=1;s=CH_M51::01AMIAK:01F4.PNT', 'ns=1;s=CH_M51::01AMIAK:01F21_1.PNT']
 * @param {String} locale 
 * e.g. locale -> 'ru'|'en'
 * @param {Object[]}
 */
const formatHistoryResults = function (id, historyResults, nameNodeIds, locale = '') {
  let results = [], result, option, value, nameNodeId;
  const options = getOpcuaConfigOptions(id);
  if (Array.isArray(nameNodeIds) && (nameNodeIds.length === historyResults.length)) {
    historyResults.forEach((historyResult, index) => {
      nameNodeId = nameNodeIds[index];
      nameNodeId = getValueFromNodeId(nameNodeId);
      option = options.find(opt => opt.browseName === nameNodeId);
      option = formatConfigOption(option, locale ? locale : process.env.FALLBACK_LOCALE);
      result = {};
      result.browseName = nameNodeId;
      result.displayName = option.displayName;
      loMerge(result, option.aliasName ? { aliasName: option.aliasName } : {});
      loMerge(result, option.type ? { type: option.type } : {});
      loMerge(result, option.dataType ? { dataType: option.dataType } : {});
      loMerge(result, option.valueParams ? { valueParams: option.valueParams } : {});
      result.statusCode = historyResult.statusCode._name;
      result.dataValues = [];
      historyResult.historyData.dataValues.forEach(v => {
        value = {};
        value.statusCode = v.statusCode.name;
        value.timestamp = getTimestamp(v.sourceTimestamp.toString());
        value.value = v.value.value;
        result.dataValues.push(loMerge({}, value));
      });
      results.push(loMerge({}, result));
    });
  } else {
    results = historyResults;
  }
  return results;
};

/**
 * @method formatDataValue
 * @param {String} id 
 * e.g. 'ua-cherkassy-azot-test1'
 * @param {Object} dataValue 
 * @param {String} nameNodeId 
 * e.g. 'CH_M51::01AMIAK:01F4.PNT' | 'ns=1;s=CH_M51::01AMIAK:01F4.PNT'
 * @param {String} locale 
 * e.g. locale -> 'ru'|'en'
 * @param {Object}
 */
const formatDataValue = function (id, dataValue, nameNodeId, locale = '') {
  let result, option;
  const options = getOpcuaConfigOptions(id);
  nameNodeId = getValueFromNodeId(nameNodeId);
  if (nameNodeId) {
    option = options.find(opt => opt.browseName === nameNodeId);
    option = formatConfigOption(option, locale ? locale : process.env.FALLBACK_LOCALE);
    result = {};
    result.browseName = nameNodeId;
    result.displayName = option.displayName;
    loMerge(result, option.aliasName ? { aliasName: option.aliasName } : {});
    loMerge(result, option.type ? { type: option.type } : {});
    loMerge(result, option.valueParams ? { valueParams: option.valueParams } : {}); 
    loMerge(result, dataValue.sourceTimestamp ? { sourceTimestamp: dataValue.sourceTimestamp } : {});
    loMerge(result, dataValue.serverTimestamp ? { serverTimestamp: dataValue.serverTimestamp } : {});
    result.statusCode = dataValue.statusCode._name;
    result.value = {};
    loMerge(result.value, dataValue.value.dataType ? { dataType: getOpcuaDataType(dataValue.value.dataType)[0] } : {});
    loMerge(result.value, dataValue.value.arrayType ? { arrayType: dataValue.value.arrayType } : {});
    loMerge(result.value, dataValue.value.dimensions ? { dimensions: dataValue.value.dimensions } : {});
    result.value.value = dataValue.value.value;
  } else {
    result = dataValue;
  }
  return result;
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
 * @method getOpcuaConfigOptions
 * @param {String} id 
 * @param {String} browseName 
 * @returns {Object}
 */
const getOpcuaConfigOptions = function (id, browseName = '') {
  // Get opcuaOption 
  let opcuaOptions = getOpcuaConfig(id);
  opcuaOptions = require(`${appRoot}${opcuaOptions.paths.options}`);
  opcuaOptions = loConcat(opcuaOptions.objects, opcuaOptions.variables, opcuaOptions.groups, opcuaOptions.methods);
  opcuaOptions = browseName ? opcuaOptions.find(opt => opt.browseName === browseName) : opcuaOptions;
  return opcuaOptions;
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
 * @method getClientCurrentState
 * Get opcua client currentState
 * @async
 * 
 * @param {Application} app 
 * @param {String} id 
 * @returns {Object}
 */
const getClientCurrentState = async (app, id) => {
  const service = await getClientService(app, id);
  const opcuaClient = await service.get(id);
  return opcuaClient.server.currentState;
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

/**
 * @method convertTo
 * @param {String} convertType 
 * @param {any} value 
 * @returns {any}
 */
const convertTo = function (convertType, value) {
  let result = null;
  switch (convertType) {
  // (kg/h -> m3/h) for ammonia
  case 'ammonia_kg/h_to_m3/h':
    result = value * 1.4;
    break;
    // (m3/h -> kg/h) for ammonia
  case 'ammonia_m3/h_to_kg/h':
    result = value * 0.716;
    break;

  default:
    break;
  }
  return result;
};

/**
 * @method getTimestamp
 * @param {String|Object} timestamp 
 * @returns {String}
 */
const getTimestamp = function (timestamp) {
  // Mon Feb 08 2021 11:47:22 GMT+0200 (GMT+02:00)
  let dt = loIsObject(timestamp) ? timestamp.toString() : timestamp;
  const dtList = dt.split(' ');
  dt = moment(`${dtList[1]} ${dtList[2]} ${dtList[3]} ${dtList[4]}`, 'MMM DD YYYY HH:mm:ss');
  dt = dt.format();
  return dt;
};

/**
 * @method Unece_to_Locale
 * @param {String} pathFrom 
 * @param {String} pathTo 
 */
const Unece_to_Locale = function (pathFrom, pathTo) {
  let standardUnits = {}, longName = '', pathToFile = {};
  // Convert unece data
  let uneceList = require(pathFrom);
  uneceList = uneceList.map(item => loOmit(item, ['unitId']));
  uneceList.forEach(item => {
    longName = item.longName.toLowerCase();
    longName = strReplace(longName, ' - ', '_');
    longName = strReplace(longName, '-', '_');
    longName = strReplace(longName, ' ', '_');
    standardUnits[longName] = { symbol: item.symbol, shortName: item.shortName, longName: item.longName };
  });
  // Merge new data and  pathToFile data
  if (doesFileExist(pathTo)) {
    pathToFile = require(pathTo);
  }
  loMerge(pathToFile, { standardUnits });
  // Write to file
  writeFileSync(pathTo, pathToFile, true);
};


module.exports = {
  nodeIdToString,
  getNodeIdType,
  getValueFromNodeId,
  getNameSpaceFromNodeId,
  getOpcuaDataType,
  formatUAVariable,
  formatConfigOption,
  formatHistoryResults,
  formatDataValue,
  getOpcuaConfig,
  getOpcuaConfigOptions,
  getSubscriptionHandler,
  getServerService,
  getClientService,
  getSrvCurrentState,
  getClientCurrentState,
  getClientForProvider,
  getServerForProvider,
  isOpcuaServerInList,
  isOpcuaClientInList,
  isMyServiceHost,
  convertTo,
  getTimestamp,
  Unece_to_Locale
};
