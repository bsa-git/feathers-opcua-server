/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');

const {
  inspector,
  isTrue,
  appRoot,
  getBitDepthOS,
  getParseUrl,
  getHostname,
  getMyIp,
  strReplace,
  getInt,
  convertObject2Array,
  removeDuplicatedValFromArray
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
const loHead = require('lodash/head');
const { isString } = require('../lib/type-of');

const debug = require('debug')('app:opcua-helper');
const isDebug = false;

const opcuaDataType = [
  'Null',
  'Boolean',
  'SByte',
  'Byte',
  'Int16',
  'UInt16',
  'Int32',
  'UInt32',
  'Int64',
  'UInt64',
  'Float',
  'Double',
  'String',
  'DateTime',
  'Guid',
  'ByteString',
  'XmlElement',
  'NodeId',
  'ExpandedNodeId',
  'StatusCode',
  'QualifiedName',
  'LocalizedText',
  'ExtensionObject',
  'DataValue',
  'Variant',
  'DiagnosticInfo'
];

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
 * @method isNodeId
 * @param {String|Object} nodeId 
 * @returns {Boolean}
 */
const isNodeId = function (nodeId = '') {
  let result = false;
  //--------------------------
  nodeId = nodeIdToString(nodeId);
  let arrNodeId = nodeId.split(';');
  if (arrNodeId.length === 2) {
    const ns = arrNodeId[0].split('=')[0];
    const nodeIdType = arrNodeId[1].split('=')[0];
    result = (ns === 'ns') && (nodeIdType === getNodeIdType(nodeId));
  }
  return result;
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
 * @method getNodeIdForClient
 * 
 * @param {String} id 
 * @returns {Object}
 e.g {
    namespaceIndex: 1,
    identifierType: 'displayName',
    identifierPrefix: 'Channel1.Device1',
    addObjectItem: true
  } 
 */
const getNodeIdForClient = function (id) {
  let NodeId = {
    namespaceIndex: 1, // e.g 1|2 ...
    identifierType: 'browseName', // e.g. browseName|displayName
    identifierPrefix: '', // e.g. Channel1.Device1
    addObjectItem: false
  };
  const opcuaOption = getOpcuaConfig(id);
  if (opcuaOption.NodeId) {
    Object.assign(NodeId, opcuaOption.NodeId);
  }
  return NodeId;
};


/**
 * @method getLastNameFromNodeId
 * @param {String} id 
 * @param {Object|String} nodeId 
 * e.g. { nodeId: "ns=1;s=Device1.Temperature" }|"Device1.Temperature"
 * @returns {String}
 * e.g. CH_M52::02SKLAD:02F20_2" -> "CH_M52::02SKLAD:02F20_2"
 * e.g. { nodeId: "ns=1;s=Channel1.Device1.Cherkassy 'AZOT' M5-2.02HNO3_F20_2" } -> "02HNO3_F20_2"
 * e.g. { nodeId: "ns=1;s=Channel1.Device1.CH_M52.CH_M52::02SKLAD:02F20_2" } -> "CH_M52::02SKLAD:02F20_2"
 */
const getLastNameFromNodeId = function (id, nodeId) {
  let lastName = '';
  //------------------------------
  if (isNodeId(nodeId)) {
    const NodeId = getNodeIdForClient(id);
    lastName = getValueFromNodeId(nodeId);
    if (NodeId.identifierPrefix) {
      lastName = strReplace(lastName, NodeId.identifierPrefix + '.', '');
    }
    if (NodeId.addObjectItem) {
      const objectItem = lastName.split('.')[0];
      lastName = strReplace(lastName, objectItem + '.', '');
    }
  } else {
    lastName = getValueFromNodeId(nodeId);
  }
  return lastName;
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
  if (isDebug) inspector('getOpcuaDataType.DataTypeList:', dataTypeList);
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
    if (isDebug) inspector('formatConfigOption.makeEUInformation:', makeEUInformation(...args));
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
  if (uaVariable) {
    uaVar.nodeClass = uaVariable.nodeClass;
    uaVar.nodeId = nodeIdToString(uaVariable.nodeId);
    uaVar.browseName = uaVariable.browseName.name;
    uaVar.dataType = getOpcuaDataType(uaVariable.dataType);
    uaVar.accessLevel = uaVariable.accessLevel;
    uaVar.userAccessLevel = uaVariable.userAccessLevel;
    uaVar.minimumSamplingInterval = uaVariable.minimumSamplingInterval;
    uaVar.historizing = uaVariable.historizing;
    if (uaVariable['$dataValue'] && uaVariable['$dataValue'].value) {
      uaVar.value = uaVariable['$dataValue'].value.value;
    } else {
      uaVar.value = null;
    }
    if (uaVariable['$dataValue'] && uaVariable['$dataValue'].statusCode) {
      uaVar.statusCode = uaVariable['$dataValue'].statusCode.name;
    } else {
      uaVar.statusCode = 'Undefined';
    }
    loMerge(uaVar, uaVariable.aliasName ? { aliasName: uaVariable.aliasName } : {});
  }
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
 * @param {String[]} browseNames 
 * e.g. ['CH_M51::01AMIAK:01F4.PNT', 'CH_M51::01AMIAK:01F21_1.PNT'] ||
 * @param {String} locale 
 * e.g. locale -> 'ru'|'en'
 * @returns {Object[]}
 */
const formatHistoryResults = function (id, historyResults, browseNames, locale = '') {
  let results = [], result, option, value, browseName;
  const options = getOpcuaConfigOptions(id);
  if (!Array.isArray(browseNames)) {
    browseNames = [browseNames];
  }
  if (Array.isArray(browseNames) && (browseNames.length === historyResults.length)) {
    historyResults.forEach((historyResult, index) => {
      browseName = browseNames[index];
      browseName = isNodeId(browseName) ? getValueFromNodeId(browseName) : browseName;
      option = options.find(opt => opt.browseName === browseName);
      if (option) {
        locale = locale ? locale : process.env.FALLBACK_LOCALE;
        option = formatConfigOption(option, locale);
        result = {};
        result.browseName = browseName;
        result.displayName = option.displayName;
        loMerge(result, option.aliasName ? { aliasName: option.aliasName } : {});
        loMerge(result, option.type ? { type: option.type } : {});
        loMerge(result, option.dataType ? { dataType: option.dataType } : {});
        loMerge(result, option.valueParams ? { valueParams: option.valueParams } : {});
        result.statusCode = {
          code: historyResult.statusCode._code,
          description: historyResult.statusCode._description,
          name: historyResult.statusCode._name
        };
        result.historyData = {};
        result.historyData.dataValues = [];
        historyResult.historyData.dataValues.forEach(v => {
          value = formatDataValue(id, v, browseName, locale);
          result.historyData.dataValues.push(loMerge({}, value));
        });
        results.push(loMerge({}, result));
      } else {
        results.push(historyResult);
      }
    });
  } else {
    results = historyResults;
  }
  return results;
};

/**
 * @method formatSimpleHistoryResults
 * @param {Object[]} historyResults 
 * @param {String[]} browseNames 
 * e.g. ['CH_M51::01AMIAK:01F4.PNT', 'CH_M51::01AMIAK:01F21_1.PNT'] ||
 * @returns {Object[]}
 */
const formatSimpleHistoryResults = function (historyResults, browseNames) {
  let results = [], result, value, browseName;
  //---------------------------------------------------
  if (!Array.isArray(browseNames)) {
    browseNames = [browseNames];
  }
  if (Array.isArray(browseNames) && (browseNames.length === historyResults.length)) {
    historyResults.forEach((historyResult, index) => {
      browseName = browseNames[index].nodeId ? browseNames[index].nodeId : browseNames[index];
      browseName = isNodeId(browseName) ? getValueFromNodeId(browseName) : browseName;
      result = {};
      result.browseName = browseName;
      result.statusCode = {
        code: historyResult.statusCode._code,
        description: historyResult.statusCode._description,
        name: historyResult.statusCode._name
      };
      result.historyData = {};
      result.historyData.dataValues = [];
      historyResult.historyData.dataValues.forEach(v => {
        value = formatSimpleDataValue(v);
        result.historyData.dataValues.push(loMerge({}, value));
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
 * @param {String} browseName 
 * e.g. 'CH_M51::01AMIAK:01F4.PNT'
 * @param {String} locale 
 * e.g. locale -> 'ru'|'en'
 * @returns {Object}
 */
const formatDataValue = function (id, dataValue, browseName, locale = '') {
  let result, option;
  //---------------------
  const options = getOpcuaConfigOptions(id);
  if (browseName) {
    option = options.find(opt => opt.browseName === browseName);
    option = formatConfigOption(option, locale ? locale : process.env.FALLBACK_LOCALE);
    result = {};
    result.browseName = browseName;
    result.displayName = option.displayName;
    loMerge(result, option.aliasName ? { aliasName: option.aliasName } : {});
    loMerge(result, option.type ? { type: option.type } : {});
    loMerge(result, option.valueParams ? { valueParams: option.valueParams } : {});
    loMerge(result, dataValue.sourceTimestamp ? { sourceTimestamp: getTimestamp(dataValue.sourceTimestamp) } : {});
    loMerge(result, dataValue.serverTimestamp ? { serverTimestamp: getTimestamp(dataValue.serverTimestamp) } : {});
    result.statusCode = {
      code: dataValue.statusCode._value,
      description: dataValue.statusCode._description,
      name: dataValue.statusCode._name
    };

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
 * @method formatSimpleDataValue
 * @param {Object|Object[]} dataValue 
 * @returns {Object|Object[]}
 */
const formatSimpleDataValue = function (dataValue) {
  let result, results = [], dataValues;
  //------------------------------------------------
  dataValues = Array.isArray(dataValue) ? dataValue : [dataValue];

  for (let index = 0; index < dataValues.length; index++) {
    const _dataValue = dataValues[index];
    result = {};
    loMerge(result, _dataValue.sourceTimestamp ? { sourceTimestamp: getTimestamp(_dataValue.sourceTimestamp) } : {});
    loMerge(result, _dataValue.serverTimestamp ? { serverTimestamp: getTimestamp(_dataValue.serverTimestamp) } : {});
    result.statusCode = {
      code: _dataValue.statusCode._value,
      description: _dataValue.statusCode._description,
      name: _dataValue.statusCode._name
    };

    result.value = {};
    loMerge(result.value, _dataValue.value.dataType ? { dataType: getOpcuaDataType(_dataValue.value.dataType)[0] } : {});
    loMerge(result.value, _dataValue.value.arrayType ? { arrayType: _dataValue.value.arrayType } : {});
    loMerge(result.value, _dataValue.value.dimensions ? { dimensions: _dataValue.value.dimensions } : {});
    result.value.value = _dataValue.value.value;

    results.push(result);
  }

  return Array.isArray(dataValue) ? results : result;
};

/**
 * @method getOpcuaConfig
 * @param {String} id 
 * @returns {Object|Array}
 */
const getOpcuaConfig = function (id = '') {
  let opcuaOption = null;
  const opcuaOptions = require(`${appRoot}/src/api/opcua/config/OPCUA_Config.json`);
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
  const opcuaOptions = require(`${appRoot}/src/api/opcua/config/OPCUA_Config.json`);
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
  const opcuaOptions = require(`${appRoot}/src/api/opcua/config/OPCUA_Config.json`);
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
  if (isDebug && myHostname) debug('getOpcuaConfigForMe.myHostname, myIp:', myHostname, myIp);
  const opcuaConfig = require(`${appRoot}/src/api/opcua/config/OPCUA_Config.json`);
  opcuaOptions = opcuaConfig.filter(opt => {
    const url = opt.clientServiceUrl ? opt.clientServiceUrl : opt.srvServiceUrl;
    const parts = getParseUrl(url);
    if (isDebug && parts) debug('getOpcuaConfigForMe.getParseUrl:', parts);
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
 * @method getOpcuaSaveModeToDB
 * @returns {String}
 * e.g. (localAdd|localUpdate|remoteAdd|remoteUpdate|no)
 */
const getOpcuaSaveModeToDB = function () {
  const myConfigs = getOpcuaConfigsForMe();
  // const myConfig = myConfigs.find(item => (item.isEnable || item.isEnable === undefined) && item.opcuaSaveModeToDB);
  const myConfig = myConfigs.find(item => item.opcuaSaveModeToDB);
  return myConfig ? myConfig.opcuaSaveModeToDB : process.env.DEFAULT_OPCUA_SAVEMODE_TODB;
};

/**
 * @method isMyLocalhostToIP
 * @returns {Boolean}
 * e.g. "localhost" -> "10.60.5.128"
 */
const isMyLocalhostToIP = function () {
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.isMyLocalhostToIP !== undefined);
  return myConfig ? myConfig.isMyLocalhostToIP : isTrue(process.env.MY_LOCALHOST_TO_IP);
};

/**
 * @method getOpcuaBootstrapParams
 * @returns {Object|null}
 * e.g. { clearHistoryAtStartup: true }
 */
const getOpcuaBootstrapParams = function () {
  const myConfigs = getOpcuaConfigsForMe();
  const myConfig = myConfigs.find(item => item.opcuaBootstrapParams);
  return myConfig ? myConfig.opcuaBootstrapParams : null;
};



/**
 * @method whereMethodsAreExecuted
 * @param {String} id
 * @returns {String}
 * e.g. (client|server|asyncServer)
 */
const whereMethodsAreExecuted = function (id) {
  const config = getOpcuaConfig(id);
  const executeMethodsFrom = config.executeMethodsFrom ? config.executeMethodsFrom : process.env.DEFAULT_EXECUTE_METHODS_FROM;
  if (executeMethodsFrom === 'client' || executeMethodsFrom === 'server' || executeMethodsFrom === 'asyncServer') {
    return executeMethodsFrom;
  } else {
    throw new Error(`whereMethodsAreExecuted function has an invalid value: '${executeMethodsFrom}'. List of correct values: 'client', 'server', 'asyncServer'.`);
  }

};

/**
 * @method getSavingValuesMode
 * @returns {String}
 * e.g. (add|update|no)
 */
const getSavingValuesMode = function () {
  const saveMode = getOpcuaSaveModeToDB();
  const isSaveOpcuaToDB = saveMode !== 'no';
  const isUpdateOpcuaToDB = (saveMode === 'localUpdate') || (saveMode === 'remoteUpdate');
  const savingValuesMode = isSaveOpcuaToDB ? isUpdateOpcuaToDB ? 'update' : 'add' : 'no';
  return savingValuesMode;
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
  let opcuaConfigs = getOpcuaConfigsForMe();
  opcuaConfigs = opcuaConfigs.filter(item => item.isEnable || item.isEnable === undefined);
  // Get all tags
  loForEach(opcuaConfigs, cfg => {
    mergedOpcuaOptions = mergeOpcuaConfigOptions(cfg.id);
    const mergedOpcuaOptionsObjects = mergedOpcuaOptions.objects.map(obj => {
      if (!obj.histParams) {
        obj.histParams = {};
      }
      obj.histParams.opcuaId = cfg.id;
      obj.histParams.opcuaUrl = cfg.clientServiceUrl;
      obj.histParams.savingValuesMode = getSavingValuesMode();
      return obj;
    });
    opcuaTags = loConcat(opcuaTags, mergedOpcuaOptionsObjects, mergedOpcuaOptions.variables, mergedOpcuaOptions.groups, mergedOpcuaOptions.methods);
  });
  opcuaTags = opcuaTags.filter(item => item && item.browseName);

  if (browseName) {
    opcuaTag = opcuaTags.find(tag => tag.browseName === browseName);
  }
  return browseName ? opcuaTag : opcuaTags;
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
  if(isDebug && opcuaOptions) inspector('mergeOpcuaConfigOptions.opcuaOptions:', opcuaOptions);
  if (opcuaOptions.paths['base-options']) {
    opcuaOptions.paths['base-options'].forEach(path => {
      const opt = loMerge({}, require(`${appRoot}${path}`));
      loForEach(opt, (value, key) => {
        if (baseOptions[key]) {
          baseOptions[key] = loConcat(baseOptions[key], value);
        } else {
          baseOptions[key] = value;
        }
        baseOptions[key] = removeDuplicatedValFromArray(baseOptions[key], 'browseName');
      });
    });
    if(isDebug && baseOptions) inspector('mergeOpcuaConfigOptions.baseOptions.objects:', baseOptions.objects);  
    if (opcuaOptions.paths.options) {
      const options = require(`${appRoot}${opcuaOptions.paths.options}`);
      loForEach(options, (value, key) => {
        if (baseOptions[key]) {
          loForEach(value, (val) => {
            const findedIndex = baseOptions[key].findIndex(opt => opt.browseName === val.browseName);
            if (findedIndex > -1) {
              const mergeValue = loMerge({}, baseOptions[key][findedIndex], val);
              baseOptions[key][findedIndex] = mergeValue;
            } else {
              baseOptions[key].push(val);
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
  if(isDebug && mergeOpcuaOptions) inspector('mergeOpcuaConfigOptions.mergeOpcuaOptions.objects:', mergeOpcuaOptions.objects);
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
  //--------------------------------------------------------------------
  if (isDebug && nameScript) debug('getOpcuaClientScript.id,nameScript:', id, nameScript);

  // Get defaultOpcuaClientScript
  if (nameScript) {
    opcuaClientScript = defaultOpcuaClientScripts[nameScript];
  }

  // Get opcuaConfig 
  const opcuaConfig = getOpcuaConfig(id);
  // Get opcuaClientScript
  if (opcuaConfig.paths['client-scripts']) {
    opcuaClientScripts = require(`${appRoot}${opcuaConfig.paths['client-scripts']}`);
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

  // Get NodeId for client
  const NodeId = getNodeIdForClient(id);

  const paramsAddressSpace = {
    objects: [],
    variables: [],
    methods: []
  };
  let opcuaConfigOptions = getOpcuaConfigOptions(id);
  opcuaConfigOptions = opcuaConfigOptions.filter(item => item);
  opcuaConfigOptions = opcuaConfigOptions.filter(item => item.isEnable || item.isEnable === undefined);
  let objects = opcuaConfigOptions.filter(opt => opt.type ? (opt.type === 'object') : false);
  let methods = opcuaConfigOptions.filter(opt => (opt.type ? (opt.type === 'method') : false) && objects.find(o => o.browseName === opt.ownerName));
  let variables = opcuaConfigOptions.filter(opt => (opt.type ? opt.type.includes('variable') : false) && objects.find(o => o.browseName === opt.ownerName));

  // Map of objects
  paramsAddressSpace.objects = objects.map(o => {
    const identifier = NodeId.identifierPrefix ? NodeId.identifierPrefix + '.' : '';
    o.nodeId = `ns=${NodeId.namespaceIndex};s=${identifier}${o[NodeId.identifierType]}`;
    return o;
  });
  // Map of variables
  paramsAddressSpace.variables = variables.map(v => {
    let identifier = '';
    //--------------------
    if (NodeId.addObjectItem) {
      const object = paramsAddressSpace.objects.find(o => o.browseName === v.ownerName);
      identifier = getValueFromNodeId(object.nodeId) + '.';
    }
    v.nodeId = `ns=${NodeId.namespaceIndex};s=${identifier}${v[NodeId.identifierType]}`;
    return v;
  });
  // Map of methods
  paramsAddressSpace.methods = methods.map(m => {
    let identifier = '';
    //--------------------
    if (NodeId.addObjectItem) {
      const object = paramsAddressSpace.objects.find(o => o.browseName === m.ownerName);
      identifier = getValueFromNodeId(object.nodeId) + '.';
    }
    m.nodeId = `ns=${NodeId.namespaceIndex};s=${identifier}${m[NodeId.identifierType]}`;
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
  if (isDebug && opcuaOption) debug('getOpcuaClientScript.opcuaOption:', opcuaOption);
  const scriptName = opcuaOption.clientScript ? opcuaOption.clientScript : defaultScriptName;
  if (isDebug && scriptName) debug('getOpcuaClientScript.scriptName:', scriptName);
  const script = getOpcuaClientScript(id, scriptName);
  await script(id, service);
};

/**
 * Set value from source
 * @param {Object} addedVariable 
 * e.g. {
  dataType: 3,
  arrayType: 1,
  value: [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
  ]
}
 * @param {Object} valueWithParams 
 * @returns {Object}
 * e.g. {
  dataType: 3,
  arrayType: 1,
  value: Uint8Array(24) [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0
  ]
}
 */
const setOpcuaValueFromSource = (addedVariable, valueWithParams) => {
  convertArrayToTypedArray(valueWithParams);
  addedVariable.setValueFromSource(valueWithParams);
  if (isDebug && valueWithParams) inspector('setValueFromSource:', valueWithParams);
  return valueWithParams;
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
  const opcuaGetters = require(`${appRoot}/src/plugins/opcua/opcua-getters`);
  //-----------------------------------------------------------------------

  if (isDebug) debug('setValueFromSourceForGroup.opcuaGetters:', opcuaGetters);

  // Get group variable list 
  let groupVariableList = params.addedVariableList;
  if (isDebug && groupVariableList) inspector('setValueFromSourceForGroup.groupVariableList.browseName:', groupVariableList.map(v => v.browseName.name));
  if (isDebug && dataItems) inspector('setValueFromSourceForGroup.dataItems:', dataItems);

  loForEach(dataItems, function (value, key) {
    groupVariable = groupVariableList.find(v => v.browseName.name === key);
    if (!groupVariable) {
      groupVariable = groupVariableList.find(v => v.aliasName === key);
    }
    // Set value from source
    if (groupVariable) {
      if (isDebug && groupVariable) inspector('setValueFromSourceForGroup.groupVariable:', formatUAVariable(groupVariable));
      browseName = formatUAVariable(groupVariable).browseName;
      // Run setValueFromSource for groupVariable
      const currentState = params.myOpcuaServer.getCurrentState();
      const variable = currentState.paramsAddressSpace.variables.find(v => v.browseName === browseName);
      if (isDebug && variable) inspector('setValueFromSourceForGroup.variable:', variable);

      if (loIsFunction(opcuaGetters[variable.getter])) {
        params.myOpcuaServer.setValueFromSource(variable, groupVariable, opcuaGetters[variable.getter], value);
        if (isDebug && browseName) debug('setValueFromSourceForGroup.browseName:', `"${browseName}" =`, value);
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
 * @param {Object|Object[]} dataItems 
 * @returns {Object}
 */
const convertAliasListToBrowseNameList = (variableList = [], dataItems) => {
  let browseNameList = {}, aliasValueList = {}, dataType = '';
  //------------------------
  if (!Array.isArray(variableList)) throw new Error('Error: variable `variableList` must be an array.');
  if (Array.isArray(dataItems)) {
    aliasValueList = convertObject2Array(dataItems);
    loForEach(aliasValueList, function (values, key) {
      const variable = variableList.find(v => v.aliasName === key);
      if (variable) {
        const formatVariable = variable.nodeId ? formatUAVariable(variable) : variable;
        const browseName = formatVariable.browseName;
        browseNameList[browseName] = values;
      }
    });
  } else {
    loForEach(dataItems, function (value, key) {
      const variable = variableList.find(v => v.aliasName === key);
      if (variable) {
        const formatVariable = variable.nodeId ? formatUAVariable(variable) : variable;
        const browseName = formatVariable.browseName;
        dataType = formatVariable.dataType;
        dataType = opcuaDataTypeToString(dataType);
        dataType = dataType.toLowerCase();
        value = convertAnyToValue(dataType, value);
        browseNameList[browseName] = value;
      }
    });
  }
  if (isDebug) inspector('convertAliasListToBrowseNameList.browseNameList:', browseNameList);
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
  //-----------------------------------------------
  dataType = dataType.toLowerCase();
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
 * Convert simple array to TypedArray
 * @param {Object} valueWithParams 
 * @returns {Object}
 */
const convertArrayToTypedArray = function (valueWithParams) {
  let result = null;
  //-----------------------------------------------
  // getOsPlatform,
  // getOsArchitecture,
  const bitDepthOS = getBitDepthOS();
  let dataType = valueWithParams.dataType;
  let value = valueWithParams.value;
  if (!Array.isArray(value)) return valueWithParams;
  dataType = loIsString(dataType) ? dataType.toLowerCase() : opcuaDataType[dataType].toLowerCase();
  switch (dataType) {
  case 'boolean':
    result = value.map(v => getInt(v));
    result = new Uint8Array(result);
    break;
  case 'sbyte':
  case 'byte':
    result = new Uint8Array(value);
    break;
  case 'uint16':
    result = new Uint16Array(value);
    break;
  case 'int32':
  case 'uint32':
    result = new Uint32Array(value);
    break;
  case 'float':
  case 'double':
    result = new Float64Array(value); //(bitDepthOS === 64) ? new Float64Array(value) : new Float32Array(value);
    break;
  default:
    break;
  }
  if (isDebug) debug('convertAnyToValue.dataType:', dataType, result);
  if (result) {
    valueWithParams.value = result;
  }
  return valueWithParams;
};

/**
 * @method getTimestamp
 * @param {String|Object} timestamp 
 * e.g. Mon Feb 08 2021 11:47:22 GMT+0200 (GMT+02:00) | 2022-01-12T12:10:12
 * @returns {String}
 * e.g. 2022-01-12T12:10:12.123
 */
const getTimestamp = function (timestamp) {
  // Mon Feb 08 2021 11:47:22 GMT+0200 (GMT+02:00)
  let dt = loIsObject(timestamp) ? timestamp.toString() : timestamp;
  if(isDebug && dt) console.log('opcua-helper.timestamp: ', timestamp);
  const dtList = dt.split(' ');
  if (dtList.length >= 5) {
    dt = moment(`${dtList[1]} ${dtList[2]} ${dtList[3]} ${dtList[4]}`, 'MMM DD YYYY HH:mm:ss');
    dt = dt.format();
  } else {
    dt = moment(dt).format();
  }
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
  if (isDebug) inspector('canTestRun.myConfig:', myConfig);
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
  if (isDebug) inspector('canServiceRun.myConfig:', myConfig);
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
  if (isDebug) inspector('canDbClientRun.myConfig:', myConfig);
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

/**
 * @method checkQueueOfSubscribe
 * @param {Array} queue 
 * @param {String} browseName 
 * @param {Boolean} show
 * @returns {Boolean}
 */
const checkQueueOfSubscribe = function (queue, browseName, show = false) {
  let isBusy = false;
  //---------------------------
  const subscribe = loHead(queue);
  if (subscribe) {
    isBusy = subscribe.browseName !== browseName;
    if (show && isBusy) console.log(`'${browseName}'`, chalk.cyan(' wait '), `'${subscribe.browseName}'`);
  }
  return isBusy;
};

/**
 * @method checkTokenQueueOfSubscribe
 * @param {Array} queue 
 * @param {String} token 
 * @param {Boolean} show
 * @returns {Boolean}
 */
const checkTokenQueueOfSubscribe = function (queue, token, show = false) {
  let isBusy = false;
  //---------------------------
  const subscribe = loHead(queue);
  if (subscribe) {
    isBusy = subscribe.token !== token;
    if (show && isBusy) console.log(`'${token}'`, chalk.cyan(' wait '), `'${subscribe.token}'`);
  }
  return isBusy;
};

module.exports = {
  nodeIdToString,
  isNodeId,
  getNodeIdType,
  getValueFromNodeId,
  getNodeIdForClient,
  getLastNameFromNodeId,
  getNameSpaceFromNodeId,
  getOpcuaDataType,
  getEngineeringUnit,
  formatUAVariable,
  formatConfigOption,
  formatHistoryResults,
  formatSimpleHistoryResults,
  formatDataValue,
  formatSimpleDataValue,
  getOpcuaConfig,
  getOpcuaConfigForIp,
  getOpcuaConfigForMe,
  getOpcuaConfigsForMe,
  getOpcuaConfigOptions,
  getOpcuaSaveModeToDB,
  getOpcuaBootstrapParams,
  whereMethodsAreExecuted,
  getSavingValuesMode,
  mergeOpcuaConfigOptions,
  getOpcuaTags,
  getParamsAddressSpace,
  getSubscriptionHandler,
  getOpcuaClientScript,
  getMyHostInfo,
  isMyServiceHost,
  isMyLocalhostToIP,
  getServerService,
  getClientService,
  getSrvCurrentState,
  getClientCurrentState,
  getClientForProvider,
  getServerForProvider,
  isOpcuaServerInList,
  isOpcuaClientInList,
  executeOpcuaClientScript,
  setOpcuaValueFromSource,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList,
  convertAnyToValue,
  convertArrayToTypedArray,
  convertTo,
  getInitValueForDataType,
  getTimestamp,
  Unece_to_Locale,
  canTestRun,
  canServiceRun,
  canDbClientRun,
  getSecurityMode,
  getSecurityPolicy,
  checkQueueOfSubscribe,
  checkTokenQueueOfSubscribe,
};
