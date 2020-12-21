/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { inspector, appRoot } = require('../lib');
const { getSrvCurrentState, getClientForProvider, getSubscriptionHandler } = require('./opcua-helper');

const {
  Variant,
  DataType,
  VariantArrayType,
  AttributeIds,
  StatusCodes,
  makeBrowsePath
} = require('node-opcua');

const debug = require('debug')('app:opcua-client-mixins');
const isLog = true;
const isDebug = false;

let result;



module.exports = function opcuaClientMixins(service, path) {

  /**
   * @method connect
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.connect = async function (id) {
    const srvCurrentState = await getSrvCurrentState(service.app, id);
    const opcuaClient = await service.get(id);
    await opcuaClient.client.connect(srvCurrentState);
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method disconnect
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.disconnect = async function (id) {
    const opcuaClient = await service.get(id);
    await opcuaClient.client.disconnect();
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method sessionCreate
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.sessionCreate = async function (id) {
    const opcuaClient = await service.get(id);
    await opcuaClient.client.sessionCreate();
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method sessionClose
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.sessionClose = async function (id) {
    const opcuaClient = await service.get(id);
    await opcuaClient.client.sessionClose();
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method subscriptionCreate
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.subscriptionCreate = async function (id) {
    const opcuaClient = await service.get(id);
    opcuaClient.client.subscriptionCreate();
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method subscriptionTerminate
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.subscriptionTerminate = async function (id) {
    const opcuaClient = await service.get(id);
    await opcuaClient.client.subscriptionTerminate();
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method getNodeIds
   * @async
   * 
   * @param {String} id 
   * @param {String|Object|String[]|Object[]} nameNodeIds 
   * @returns {String[]|Object[]}
   */
  service.getNodeIds = async function (id, nameNodeIds) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.getNodeIds(nameNodeIds);
    return result;
  };

  /**
   * Get item nodeId
   * @param {String>} nameNodeId 
   * e.g nameNodeId = 'Device1.Temperature'|'ns=1;s=Device1.Temperature'
   * @returns {Object}
   */
  service.getItemNodeId = async function (id, nameNodeIds) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.getNodeIds(nameNodeIds);
    return result;
  };

  /**
   * @method sessionReadNamespaceArray
   * @async
   * 
   * @param {String} id 
   * @returns {Promise<string[]}
   */
  service.sessionReadNamespaceArray = async function (id) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionReadNamespaceArray();
    return result;
  };

  /**
   * @method sessionBrowse
   * @async
   * 
   * @param {String} id 
   * @param {String|String[]|BrowseDescriptionLike|BrowseDescriptionLike[]} nameNodeIds 
   * @returns {Promise<BrowseResult[]}
   */
  service.sessionBrowse = async function (id, nameNodeIds) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionBrowse(nameNodeIds);
    return result;
  };

  /**
   * @method sessionTranslateBrowsePath
   * @async
   * 
   * @param {String} id 
   * @param {BrowsePath|BrowsePath[]} browsePaths 
   * @returns {Promise<BrowsePathResult[]>}
   */
  service.sessionTranslateBrowsePath = async function (id, folder, path) {
    const opcuaClient = await service.get(id);
    const browsePath = makeBrowsePath(folder, path);
    result = await opcuaClient.client.sessionTranslateBrowsePath(browsePath);
    return result;
  };

  /**
   * @method sessionRead
   * @async
   * 
   * @param {String} id 
   * @param {String|String[]|ReadValueIdLike|ReadValueIdLike[]} nameNodeIds 
   * @param {Number|Number[]} attributeIds
   * @param {Number} maxAge
   * @returns {Promise<DataValue>}
   */
  service.sessionRead = async function (id, nameNodeIds, attributeIds, maxAge) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionRead(nameNodeIds, attributeIds, maxAge);
    return result;
  };

  /**
   * @method sessionReadVariableValue
   * @async
   * 
   * @param {String} id 
   * @param {String|String[]|NodeIdLike|NodeIdLike[]} nameNodeIds
   * @returns {Promise<DataValue>}
   */
  service.sessionReadVariableValue = async function (id, nameNodeIds) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionReadVariableValue(nameNodeIds);
    return result;
  };

  /**
   * @method sessionReadAllAttributes
   * @async
   * 
   * @param {String} id 
   * @param {String|String[]|NodeIdLike|NodeIdLike[]} nameNodeIds
   * @returns {Promise<NodeAttributes[]>}
   */
  service.sessionReadAllAttributes = async function (id, nameNodeIds) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionReadAllAttributes(nameNodeIds);
    return result;
  };

  /**
   * @method sessionReadHistoryValues
   * @async
   * 
   * @param {String} id 
   * @param {ReadValueIdLike|ReadValueIdLike[]} nameNodeIds
   * @param {String} start   the start time in UTC format
   * @param {String} end     the end time in UTC format
   * @returns {Promise<HistoryReadResult[]>}
   */
  service.sessionReadHistoryValues = async function (id, nameNodeIds, start, end) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionReadHistoryValues(nameNodeIds, start, end);
    return result;
  };

  /**
   * @method sessionWriteSingleNode
   * @async
   * 
   * @param {String} id 
   * @param {String} nameNodeId
   * @param {Variant} variantValue
   * @returns {Promise<StatusCode>}
   */
  service.sessionWriteSingleNode = async function (id, nameNodeId, variantValue) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionWriteSingleNode(nameNodeId, variantValue);
    return result;
  };

  /**
   * @method sessionWrite
   * @async
   * 
   * @param {String} id 
   * @param {String|String[]|Object|Object[]} nameNodeIds
   * @param {Variant[]} valuesToWrite
   * @returns {Promise<StatusCode>}
   */
  service.sessionWrite = async function (id, nameNodeIds, valuesToWrite) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionWrite(nameNodeIds, valuesToWrite);
    return result;
  };

  /**
   * @method sessionCallMethod
   * @async
   * 
   * @param {String} id 
   * @param {String|Object|Array} nameNodeIds
   * @param {Array<Variant[]>} inputArguments
   * e.g. [[new Variant({...}), ... new Variant({...})], [new Variant({...}), ... new Variant({...})]]
   * @returns {Promise<CallMethodResult[]>}
   */
  service.sessionCallMethod = async function (id, nameNodeIds, inputArguments) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionCallMethod(nameNodeIds, inputArguments);
    return result;
  };

  /**
   * @method sessionGetArgumentDefinition
   * @async
   * 
   * @param {String} id 
   * @param {String|MethodId} nameNodeId
   * @returns {Promise<ArgumentDefinition>}
   */
  service.sessionGetArgumentDefinition = async function (id, nameNodeId) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionGetArgumentDefinition(nameNodeId);
    return result;
  };

  /**
   * @method sessionGetMonitoredItems
   * @async
   * 
   * @param {String} id 
   * @returns {Promise<MonitoredItemData>}
   */
  service.sessionGetMonitoredItems = async function (id) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionGetMonitoredItems(opcuaClient.client.subscription.subscriptionId);
    return result;
  };

  /**
   * @method subscriptionMonitor
   * @async
   * 
   * @param {String} id 
   * @param {String} subscriptionHandlerName 
   * @param {ReadValueId} itemToMonitor 
   * @param {MonitoringParameters} requestedParameters 
   * @param {TimestampsToReturn} timestampsToReturn 
   * @returns {ClientMonitoredItem}
   */
  service.subscriptionMonitor = async function (id, subscriptionHandlerName, itemToMonitor, requestedParameters, timestampsToReturn) {
    const opcuaClient = await service.get(id);
    const subscriptionHandler = getSubscriptionHandler(id, subscriptionHandlerName);
    result = await opcuaClient.client.subscriptionMonitor(subscriptionHandler, itemToMonitor, requestedParameters, timestampsToReturn);
    return result;
  };
};
