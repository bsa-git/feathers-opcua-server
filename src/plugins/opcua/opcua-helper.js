/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');

const {
  inspector,
  isTrue,
  appRoot,
  getParseUrl,
  getHostname,
  getMyIp,
  strReplace,
  getInt,
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
const chalk = require('chalk');

const loToInteger = require('lodash/toInteger');
const loToNumber = require('lodash/toNumber');
const loToString = require('lodash/toString');
const loIsObject = require('lodash/isObject');
const loIsString = require('lodash/isString');
const loIsEqual = require('lodash/isEqual');
const loIsFunction = require('lodash/isFunction');
const loToPairs = require('lodash/toPairs');
const loMerge = require('lodash/merge');
const loConcat = require('lodash/concat');
const loOmit = require('lodash/omit');
const loAt = require('lodash/at');
const loForEach = require('lodash/forEach');

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
 * @method getEngineeringUnit
 * @param {String} type 
 * @param {String} locale 
 * @returns {Object} 
 * e.g. EUInformation {
        description: {text: longName},
        displayName: {text: shortName},
        unitId: commonCodeToUInt(symbol),
    }
 */
const getEngineeringUnit = function (type, locale) {
  let result = null;
  let locales = require(`${appRoot}/src/plugins/localization/locales/${locale}.json`);
  let engineeringUnit = locales.standardUnits[type];
  if (!engineeringUnit) {
    locales = require(`${appRoot}/src/plugins/localization/locales/${process.env.FALLBACK_LOCALE}.json`);
    engineeringUnit = locales.standardUnits[type];
  }
  if (engineeringUnit) {
    const args = loAt(engineeringUnit, ['symbol', 'shortName', 'longName']);
    if (isLog) inspector('formatConfigOption.makeEUInformation:', makeEUInformation(...args));
    result = makeEUInformation(...args);
  }
  return result;
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
    engineeringUnit = getEngineeringUnit(formatResult.valueParams.engineeringUnits, locale);
    if (engineeringUnit) {
      formatResult.valueParams.engineeringUnits = engineeringUnit.displayName.text;
    }
  }
  return formatResult;
};

/**
 * @method formatHistoryResults
 * @param {String} id 
 * e.g. 'ua-cherkassy-azot_test1'
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
 * e.g. 'ua-cherkassy-azot_test1'
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
 * @method getOpcuaConfigForIp
 * @param {String} ip 
 * @returns {Array}
 */
const getOpcuaConfigForIp = function (ip = '') {
  let opcuaOption = null;
  const opcuaOptions = require(`${appRoot}/src/api/opcua/OPCUA_Config.json`);
  opcuaOption = opcuaOptions.find(opt => {
    const url = opt.srvServiceUrl ? opt.srvServiceUrl : opt.clientServiceUrl;
    const parts = getParseUrl(url);
    return parts.hostname === ip;
  });
  return opcuaOption;
};

/**
 * @method getOpcuaConfigForMe
 * @returns {Object}
 */
const getOpcuaConfigForMe = function () {
  let opcuaOption = null;
  const myHostname = getHostname().toLowerCase();
  const myIp = getMyIp();
  if (isDebug) debug('getOpcuaConfigForMe.myHostname, myIp:', myHostname, myIp);
  // debug('getOpcuaConfigForMe.myHostname, myIp:', myHostname, myIp);
  const opcuaOptions = require(`${appRoot}/src/api/opcua/OPCUA_Config.json`);
  opcuaOption = opcuaOptions.find(opt => {
    const url = opt.clientServiceUrl ? opt.clientServiceUrl : opt.srvServiceUrl;
    const parts = getParseUrl(url);
    if (isDebug) debug('getOpcuaConfigForMe.getParseUrl:', parts);
    // debug('getOpcuaConfigForMe.getParseUrl:', parts);
    return (parts.hostname.includes(myHostname)) || (parts.hostname === myIp);
  });
  return opcuaOption;
};

/**
 * @method getOpcuaConfigsForMe
 * @returns {Object[]}
 */
const getOpcuaConfigsForMe = function () {
  let opcuaOptions = [];
  const myHostname = getHostname().toLowerCase();
  const myIp = getMyIp();
  if (isDebug) debug('getOpcuaConfigForMe.myHostname, myIp:', myHostname, myIp);
  // debug('getOpcuaConfigForMe.myHostname, myIp:', myHostname, myIp);
  const opcuaConfig = require(`${appRoot}/src/api/opcua/OPCUA_Config.json`);
  opcuaOptions = opcuaConfig.filter(opt => {
    const url = opt.clientServiceUrl ? opt.clientServiceUrl : opt.srvServiceUrl;
    const parts = getParseUrl(url);
    if (isDebug) debug('getOpcuaConfigForMe.getParseUrl:', parts);
    // debug('getOpcuaConfigForMe.getParseUrl:', parts);
    return (parts.hostname.includes(myHostname)) || (parts.hostname === myIp);
  });
  return opcuaOptions;
};

/**
 * @method getOpcuaConfigOptions
 * @param {String} id 
 * @param {String} browseName 
 * @returns {Object}
 */
const getOpcuaConfigOptions = function (id, browseName = '') {
  // Get opcuaOption 
  let opcuaOptions = mergeOpcuaConfigOptions(id);
  opcuaOptions = loConcat(opcuaOptions.objects, opcuaOptions.variables, opcuaOptions.groups, opcuaOptions.methods);
  if (browseName) {
    opcuaOptions = opcuaOptions.find(opt => opt.browseName === browseName);
  }
  return opcuaOptions;
};

/**
 * @name getOpcuaTags
 * @param {String} browseName 
 * @returns {Array|Object}
 */
const getOpcuaTags = function (browseName = '') {
  let mergedOpcuaOptions = {}, opcuaTags = [], opcuaTag = null;
  //-----------------------------
  // Get opcua enable configs for me
  let opcuaOptions = getOpcuaConfigsForMe();
  opcuaOptions = opcuaOptions.filter(item => !item.isDisable);
  // Get all tags
  loForEach(opcuaOptions, opt => {
    mergedOpcuaOptions = mergeOpcuaConfigOptions(opt.id);
    opcuaTags = loConcat(opcuaTags, mergedOpcuaOptions.objects, mergedOpcuaOptions.variables, mergedOpcuaOptions.groups);
  });
  opcuaTags = opcuaTags.filter(item => item && item.browseName);

  if (browseName) {
    opcuaTag = opcuaTags.find(tag => tag.browseName === browseName);
  }
  return opcuaTag? opcuaTag : opcuaTags;
};

/**
 * @method mergeOpcuaConfigOptions
 * @param {String} id 
 * @returns {Object}
 */
const mergeOpcuaConfigOptions = function (id) {
  let baseOptions = {}, mergeOpcuaOptions = {};
  //---------------------------------------------
  // Get opcuaOption 
  let opcuaOptions = getOpcuaConfig(id);
  if (opcuaOptions.paths['base-options']) {
    opcuaOptions.paths['base-options'].forEach(path => {
      const opt = loMerge({}, require(`${appRoot}${path}`));
      loForEach(opt, (value, key) => {
        if (baseOptions[key]) {
          baseOptions[key] = loConcat(baseOptions[key], value);
        } else {
          baseOptions[key] = value;
        }
      });
    });
    if (opcuaOptions.paths.options) {
      const options = require(`${appRoot}${opcuaOptions.paths.options}`);
      loForEach(options, (value, key) => {
        if (baseOptions[key]) {
          loForEach(value, (val) => {
            const findedIndex = baseOptions[key].findIndex(opt => opt.browseName === val.browseName);
            if (findedIndex > -1) {
              const mergeValue = loMerge({}, baseOptions[key][findedIndex], val);
              baseOptions[key][findedIndex] = mergeValue;
            }
          });
        } else {
          baseOptions[key] = value;
        }
      });
    }
    mergeOpcuaOptions = loMerge({}, baseOptions);
  } else {
    mergeOpcuaOptions = loMerge({}, require(`${appRoot}${opcuaOptions.paths.options}`));
  }
  // opcuaOptions = loMerge({}, opcuaOptions);
  // inspector('mergeOpcuaConfigOptions.opcuaOptions.objects:', opcuaOptions.objects);
  return mergeOpcuaOptions;
};


/**
 * @method getSubscriptionHandler
 * @param {String} id 
 * @param {String} nameFile 
 * @returns {Function}
 */
const getSubscriptionHandler = function (id, nameFile = '') {
  let defaultNameFile = 'onChangedCommonHandler', subscriptionHandler = null;
  const subscriptionDefaultHandlers = require('./opcua-subscriptions');
  //-------------------------------------------------------------------
  // Get subscriptionDefaultHandler
  if (nameFile) {
    subscriptionHandler = subscriptionDefaultHandlers[nameFile];
  }
  // Get opcuaOption 
  const opcuaOption = getOpcuaConfig(id);
  // Get subscriptionHandler
  if (opcuaOption.paths.subscriptions && nameFile) {
    const subscriptionHandlers = require(`${appRoot}${opcuaOption.paths.subscriptions}`);
    if (subscriptionHandlers[nameFile]) {
      subscriptionHandler = subscriptionHandlers[nameFile];
    }
  }
  subscriptionHandler = subscriptionHandler ? subscriptionHandler : subscriptionDefaultHandlers[defaultNameFile];
  return subscriptionHandler;
};

/**
 * @method getOpcuaClientScript
 * @param {String} id 
 * @param {String} nameScript 
 * @returns {Function}
 */
const getOpcuaClientScript = function (id, nameScript = '') {
  let opcuaClientScripts, opcuaClientScript = null;
  const defaultOpcuaClientScripts = require('./opcua-client-scripts');
  //--------------------------------------------
  if (isDebug) debug('getOpcuaClientScript.id,nameScript:', id, nameScript);

  // Get defaultOpcuaClientScript
  if (nameScript) {
    opcuaClientScript = defaultOpcuaClientScripts[nameScript];
  }

  // Get opcuaOption 
  const opcuaOption = getOpcuaConfig(id);
  // Get opcuaClientScript
  if (opcuaOption.paths['client-scripts']) {
    opcuaClientScripts = require(`${appRoot}${opcuaOption.paths['client-scripts']}`);
    if (opcuaClientScripts[nameScript]) {
      opcuaClientScript = opcuaClientScripts[nameScript];
    }
  }

  if (!opcuaClientScript) {
    throw new Error(`It is not possible to find the opcua client script for id=${id} and nameScript="${nameScript}"`);
  }
  if (isDebug) debug('getOpcuaClientScript.opcuaClientScripts:', opcuaClientScripts);
  if (isDebug) debug('getOpcuaClientScript.opcuaClientScript:', opcuaClientScript);
  return opcuaClientScript;
};

/**
 * @method getMyHostInfo
 * @async
 * 
 * @returns {Object}
 */
const getMyHostInfo = async function () {
  let myHostname = getHostname();
  myHostname = myHostname.toLowerCase();
  let myDomainName = await extractFullyQualifiedDomainName();
  myDomainName = myDomainName.toLowerCase();
  const myIp = getMyIp();
  const hostInfo = {
    hostname: myHostname,
    domainName: myDomainName,
    ip: myIp
  };
  return hostInfo;
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
  if (!serviceUrl || !myPort) return false;
  if (loIsString(myPort)) {
    myPort = getInt(myPort);
  }
  const serviceHostname = getParseUrl(serviceUrl).hostname.toLowerCase();
  let servicePort = getParseUrl(serviceUrl).port;
  servicePort = getInt(servicePort);
  const myHostname = getHostname();
  let myDomainName = await extractFullyQualifiedDomainName();
  myDomainName = myDomainName.toLowerCase();
  const myIp = getMyIp();
  const hostInfo = {
    serviceHostname,
    servicePort,
    myPort,
    myHostname,
    myDomainName,
    myIp
  };
  if (isDebug) debug('isMyServiceHostname.hostInfo:', hostInfo);
  // debug('isMyServiceHostname:', hostInfo);
  const isPort = (servicePort === myPort);
  const isLocalhost = (serviceHostname === 'localhost') && (process.env.NODE_ENV === 'test');
  const isHost = (serviceHostname === myHostname) || (serviceHostname === myDomainName) || (serviceHostname === myIp) || isLocalhost;
  const result = isPort && isHost;
  if (result) {
    if (isDebug) debug('isMyServiceHostname.hostInfo:', hostInfo);
    // debug('isMyServiceHostname.hostInfo:', hostInfo);
  }
  return result;
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
 * @method getParamsAddressSpace
 * @param {String} id 
 * @returns {Object}
 */
const getParamsAddressSpace = (id) => {
  // const opcuaOption = getOpcuaConfig(id);
  const paramsAddressSpace = {
    objects: [],
    variables: [],
    methods: []
  };
  let opcuaConfigOptions = getOpcuaConfigOptions(id);
  opcuaConfigOptions = opcuaConfigOptions.filter(item => item);
  opcuaConfigOptions = opcuaConfigOptions.filter(item => !item.isDisable);
  let objects = opcuaConfigOptions.filter(opt => opt.type ? (opt.type === 'object') : false);
  let methods = opcuaConfigOptions.filter(opt => (opt.type ? (opt.type === 'method') : false) && objects.find(o => o.browseName === opt.ownerName));
  let variables = opcuaConfigOptions.filter(opt => (opt.type ? opt.type.includes('variable') : false) && objects.find(o => o.browseName === opt.ownerName));
  // group and ownerGroup variables
  const groupVariables = variables.filter(v => v.group);
  const ownerGroupVariables = variables.filter(v => v.ownerGroup && groupVariables.find(gVar => gVar.browseName === v.ownerGroup));
  variables = loConcat(groupVariables, ownerGroupVariables);

  // Map of objects
  paramsAddressSpace.objects = objects.map(o => {
    o.nodeId = `ns=1;s=${o.browseName}`;
    return o;
  });
  // Map of variables
  paramsAddressSpace.variables = variables.map(v => {
    v.nodeId = `ns=1;s=${v.browseName}`;
    return v;
  });
  // Map of methods
  paramsAddressSpace.methods = methods.map(m => {
    m.nodeId = `ns=1;s=${m.browseName}`;
    // Method inputArguments merge 
    if (m.inputArguments && m.inputArguments.length) {
      m.inputArguments = m.inputArguments.map(arg => {
        arg.dataType = DataType[arg.dataType];
        return arg;
      });
    }
    // Method outputArguments merge 
    if (m.outputArguments && m.outputArguments.length) {
      m.outputArguments = m.outputArguments.map(arg => {
        arg.dataType = DataType[arg.dataType];
        return arg;
      });
    }
    return m;
  });

  return paramsAddressSpace;
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
  let currentState = {};
  const service = await getServerService(app, id);
  if (service) {
    const opcuaServer = await service.get(id);
    currentState = opcuaServer.server.currentState;
  } else {
    const opcuaOption = getOpcuaConfig(id);
    currentState.id = id;
    currentState.productName = opcuaOption.name;
    // currentState.port = opcuaOption.port;
    currentState.endpointUrl = opcuaOption.endpointUrl;
    currentState.paramsAddressSpace = getParamsAddressSpace(id);
  }
  return currentState;
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
 * @method executeOpcuaClientScript
 * @param {Object} service 
 * @param {String} id 
 */
const executeOpcuaClientScript = async (service, id) => {
  const defaultScriptName = 'startSubscriptionMonitor';
  //----------------------------------------------------
  const opcuaOption = getOpcuaConfig(id);
  if (isDebug) debug('getOpcuaClientScript.opcuaOption:', opcuaOption);
  const scriptName = opcuaOption.clientScript ? opcuaOption.clientScript : defaultScriptName;
  if (isDebug) debug('getOpcuaClientScript.scriptName:', scriptName);
  const script = getOpcuaClientScript(id, scriptName);
  await script(id, service);
};

/**
 * @method setValueFromSourceForGroup 
 * @param {Object} params 
 * @param {Object} dataItems 
 * e.g. { "02NG_F5": 10.234, "02NG_P5": 2.444 }
 * @returns {void}
 */
const setValueFromSourceForGroup = (params = {}, dataItems = {}) => {
  let groupVariable, browseName;
  const opcuaGetters = require(`${appRoot}src/plugins/opcua/opcua-getters`);
  //-----------------------------------------------------------------------

  if (isDebug) debug('setValueFromSourceForGroup.opcuaGetters:', opcuaGetters);

  // Get group variable list 
  let groupVariableList = params.addedVariableList;
  if (isLog) inspector('setValueFromSourceForGroup.groupVariableList.aliasNames:', groupVariableList.map(v => v.aliasName));
  if (isLog) inspector('setValueFromSourceForGroup.dataItems:', dataItems);
  // inspector('setValueFromSourceForGroup.groupVariableList:', groupVariableList);

  loForEach(dataItems, function (value, key) {
    groupVariable = groupVariableList.find(v => v.browseName === key);
    if (!groupVariable) {
      groupVariable = groupVariableList.find(v => v.aliasName === key);
    }
    // Set value from source
    if (groupVariable) {
      if (isLog) inspector('setValueFromSourceForGroup.groupVariable:', formatUAVariable(groupVariable));
      browseName = formatUAVariable(groupVariable).browseName;
      // Run setValueFromSource for groupVariable
      const currentState = params.myOpcuaServer.getCurrentState();
      const variable = currentState.paramsAddressSpace.variables.find(v => v.browseName === browseName);
      if (isLog) inspector('setValueFromSourceForGroup.variable:', variable);

      if (loIsFunction(opcuaGetters[variable.getter])) {
        params.myOpcuaServer.setValueFromSource(variable, groupVariable, opcuaGetters[variable.getter], value);
        if (isDebug) debug('setValueFromSourceForGroup.browseName:', `"${browseName}" =`, value);
      } else {
        console.log(chalk.red(`Error: is absent getter - "${variable.getter}" for browseName: "${browseName}"`));
        throw new Error(`Error: is absent getter - "${variable.getter}" for browseName: "${browseName}"`);
      }
    }
  });
};

/**
 * Convert alias list data to browseName list data
 * @name convertAliasListToBrowseNameList
 * @param {Object[]} variableList 
 * @param {Object} dataItems 
 * @returns {Object}
 */
const convertAliasListToBrowseNameList = (variableList = [], dataItems = {}) => {
  let browseNameList = {}, dataType = '';
  //------------------------
  if (!Array.isArray(variableList)) throw new Error('Error: variable `variableList` must be an array.');
  loForEach(dataItems, function (value, key) {
    const variable = variableList.find(v => v.aliasName === key);
    if (variable) {
      const formatVariable = formatUAVariable(variable);
      const browseName = formatVariable.browseName;
      dataType = formatVariable.dataType;
      dataType = opcuaDataTypeToString(dataType);
      dataType = dataType.toLowerCase();
      value = convertAnyToValue(dataType, value);
      browseNameList[browseName] = value;
    }
  });
  if (isLog) inspector('convertAliasListToBrowseNameList.browseNameList:', browseNameList);
  return browseNameList;
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
 * @method opcuaDataTypeToString
 * @param {String|Int|Array} dataType 
 * e.g. dataType -> 'Double' | dataType -> 11 | ['Double', 11]
 * @returns {String}
 * e.g. 'Double'
 */
const opcuaDataTypeToString = function (dataType) {
  if (Array.isArray(dataType)) {
    return dataType[0];
  }
  const convertToInteger = loToInteger(dataType);
  const dataTypeList = loToPairs(DataType);
  if (convertToInteger > 0) {// dataType -> 'Integer'
    dataType = dataTypeList.find(item => {
      return loIsEqual(item[1], convertToInteger);
    });
    dataType = dataType[0];
  }
  return dataType;
};

/**
 * @method getInitValueForDataType
 * @param {String|Int} dataType 
 * @returns {any}
 */
const getInitValueForDataType = function (dataType) {
  let result = null;
  dataType = opcuaDataTypeToString(dataType);
  dataType = dataType.toLowerCase();
  switch (dataType) {
  case 'boolean':
    result = false;
    break;
  case 'sbyte':
  case 'byte':
  case 'uint16':
  case 'int32':
  case 'uint32':
  case 'int64':
    result = 0;
    break;
  case 'float':
  case 'double':
    result = 0.0;
    break;
  case 'string':
    result = '';
    break;
  case 'datetime':
    result = moment().format();
    break;
  default:
    break;
  }
  if (isDebug) debug('getInitValueForDataType.dataType:', dataType, result);
  return result;
};

/**
 * 
 * @param {String} dataType 
 * e.g. double|boolean
 * @param {any} value 
 * @returns {Boolean|Number|String|Date}
 */
const convertAnyToValue = function (dataType, value) {
  let result = null;
  switch (dataType) {
  case 'boolean':
    result = isTrue(value);
    break;
  case 'sbyte':
  case 'byte':
  case 'uint16':
  case 'int32':
  case 'uint32':
  case 'int64':
    result = loToInteger(value);
    break;
  case 'float':
  case 'double':
    result = loToNumber(value);
    break;
  case 'string':
    result = loToString(value);
    break;
  case 'datetime':
    result = moment().format(value);
    break;
  default:
    break;
  }
  if (isDebug) debug('convertAnyToValue.dataType:', dataType, result);
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


/**
 * @method canTestRun
 * @param {String} fileName 
 * @returns {Boolean}
 */
const canTestRun = function (fileName) {
  let isTest = false;
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.include && item.include.tests && item.include.tests.length);
  if (isDebug) debug('canTestRun.fileName:', fileName);
  // debug('canTestRun.fileName:', fileName);
  if (isLog) inspector('canTestRun.myConfig:', myConfig);
  // inspector('canTestRun.myConfig:', myConfig);
  if (myConfig) {
    const finded = myConfig.include.tests.find(name => name === fileName);
    isTest = !!finded;
  }
  if (isDebug) debug('canTestRun.isTest:', isTest);
  // debug('canTestRun.isTest:', isTest);
  return isTest;
};

/**
 * @method canServiceRun 
 * @param {String} serviceName 
 * @returns {Boolean}
 */
const canServiceRun = function (serviceName) {
  let isService = true;
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.exclude && item.exclude.services && item.exclude.services.length);
  if (isDebug) debug('canServiceRun.serviceName:', serviceName);
  if (isLog) inspector('canServiceRun.myConfig:', myConfig);
  if (myConfig) {
    const finded = myConfig.exclude.services.find(name => name === serviceName);
    isService = !finded;
  }
  return isService;
};

/**
 * @method canDbClientRun 
 * @param {String} serviceName 
 * @returns {Boolean}
 */
const canDbClientRun = function (dbClientName) {
  let isDbClientName = true;
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.exclude && item.exclude.dbClients && item.exclude.dbClients.length);
  if (isDebug) debug('canDbClientRun.dbClientName:', dbClientName);
  if (isLog) inspector('canDbClientRun.myConfig:', myConfig);
  if (myConfig) {
    const finded = myConfig.exclude.dbClients.find(name => name === dbClientName);
    isDbClientName = !finded;
  }
  return isDbClientName;
};


/**
 * @method getSecurityMode 
 * @param {Number} num 
 * @returns {String}
 */
const getSecurityMode = function (num) {
  let result = '';
  switch (num) {
  case 1:
    result = 'None';
    break;
  case 2:
    result = 'Sign';
    break;
  case 3:
    result = 'SignAndEncrypt';
    break;
  default:
    result = 'None';
    break;
  }
  return result;
};

/**
 * @method getSecurityPolicy 
 * @param {String} value 
 * @returns {String}
 */
const getSecurityPolicy = function (value) {
  return value.split('#')[1];
};


module.exports = {
  nodeIdToString,
  getNodeIdType,
  getValueFromNodeId,
  getNameSpaceFromNodeId,
  getOpcuaDataType,
  getEngineeringUnit,
  formatUAVariable,
  formatConfigOption,
  formatHistoryResults,
  formatDataValue,
  getOpcuaConfig,
  getOpcuaConfigForIp,
  getOpcuaConfigForMe,
  getOpcuaConfigsForMe,
  getOpcuaConfigOptions,
  mergeOpcuaConfigOptions,
  getOpcuaTags,
  getParamsAddressSpace,
  getSubscriptionHandler,
  getOpcuaClientScript,
  getMyHostInfo,
  isMyServiceHost,
  getServerService,
  getClientService,
  getSrvCurrentState,
  getClientCurrentState,
  getClientForProvider,
  getServerForProvider,
  isOpcuaServerInList,
  isOpcuaClientInList,
  executeOpcuaClientScript,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList,
  convertAnyToValue,
  convertTo,
  getInitValueForDataType,
  getTimestamp,
  Unece_to_Locale,
  canTestRun,
  canServiceRun,
  canDbClientRun,
  getSecurityMode,
  getSecurityPolicy
};
