/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { 
  inspector, 
  appRoot 
} = require('../../plugins/lib');

const { 
  getClientForProvider, 
  getSubscriptionHandler,
  getOpcuaConfig
} = require('../../plugins/opcua/opcua-helper');

const {
  Variant,
  makeBrowsePath
} = require('node-opcua');

const debug = require('debug')('app:opcua-client.mixins');
const isDebug = true;

let result = null;

module.exports = function opcuaClientMixins(service, path) {

  /**
   * @method getPathForClientMixins
   * @param {String} action 
   * @returns {Array}
   * e.g. return -> ['id', 'params']
   */
  service.getPathForClientMixins = function (action) {
    switch (action) {
    case 'opcuaClientDisconnect':
    case 'sessionClose':
    case 'subscriptionCreate':
    case 'subscriptionTerminate':
    case 'getCurrentState':
    case 'getSrvCurrentState':
    case 'getClientInfo':
    case 'sessionToString':
    case 'sessionEndpoint':
    case 'sessionSubscriptionCount':
    case 'sessionIsReconnecting':
    case 'sessionGetPublishEngine':
    case 'sessionReadNamespaceArray':
    case 'sessionGetMonitoredItems':
      result = ['id'];
      break;
    case 'opcuaClientCreate':
    case 'opcuaClientConnect':
      result = ['id', 'params'];
      break;
    case 'sessionCreate':
      result = ['id', 'userIdentityInfo'];
      break;
    case 'getNodeIds':
    case 'sessionBrowse':
    case 'sessionReadVariableValue':
    case 'sessionReadAllAttributes':
      result = ['id', 'nameNodeIds'];
      break;
    case 'getItemNodeId':
    case 'sessionGetArgumentDefinition':
      result = ['id', 'nameNodeId'];
      break;
    case 'sessionTranslateBrowsePath':
      result = ['id', 'folder', 'path'];
      break;
    case 'sessionRead':
      result = ['id', 'nameNodeIds', 'attributeIds', 'maxAge'];
      break;
    case 'sessionReadHistoryValues':
    case 'sessionReadHistoryValuesEx':
      result = ['id', 'nameNodeIds', 'start', 'end'];
      break;
    case 'sessionWriteSingleNode':
      result = ['id', 'nameNodeId', 'variantValue'];
      break;
    case 'sessionWrite':
      result = ['id', 'nameNodeIds', 'valuesToWrite'];
      break;
    case 'sessionCallMethod':
      result = ['id', 'nameNodeIds', 'inputArguments'];
      break;
    case 'subscriptionMonitor':
      result = ['id', 'subscriptionHandlerName', 'itemToMonitor', 'requestedParameters', 'timestampsToReturn'];
      break;
    default:
      break;
    }
    return result;
  };

  /**
   * @method opcuaClientCreate
   * @async
   * 
   * @param {String} id 
   * @param {Object} params 
   * @returns {Object}
   */
  service.opcuaClientCreate = async function (id, params) {
    const opcuaClient = await service.get(id);
    await opcuaClient.client.opcuaClientCreate(params);
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method opcuaClientConnect
   * @async
   * 
   * @param {String} id 
   * @param {Object} params 
   * @returns {Object}
   */
  service.opcuaClientConnect = async function (id, params) {
    const opcuaClient = await service.get(id);
    await opcuaClient.client.opcuaClientConnect(params);
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method opcuaClientDisconnect
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.opcuaClientDisconnect = async function (id) {
    const opcuaClient = await service.get(id);
    await opcuaClient.client.opcuaClientDisconnect();
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };

  /**
   * @method sessionCreate
   * @async
   * 
   * @param {String} id 
   * @param {AnonymousIdentity | UserIdentityInfoX509 | UserIdentityInfoUserName} userIdentityInfo 
   * @example
   export interface UserIdentityInfoUserName {
        type: UserTokenType.UserName;
        userName: string;
        password: string;
    }
    export interface UserIdentityInfoX509 extends X509IdentityTokenOptions {
        type: UserTokenType.Certificate;
        certificateData: ByteString;
        privateKey: PrivateKeyPEM;
    }
    export interface AnonymousIdentity {
        type: UserTokenType.Anonymous;
    }
   * @returns {Object}
   */
  service.sessionCreate = async function (id, userIdentityInfo) {
    const opcuaClient = await service.get(id);
    await opcuaClient.client.sessionCreate(userIdentityInfo);
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
   * @method getItemNodeId
   * @async
   * 
   * @param {String} id 
   * @param {String>} nameNodeId 
   * e.g nameNodeId = 'Device1.Temperature'|'ns=1;s=Device1.Temperature'
   * @returns {Object}
   */
  service.getItemNodeId = async function (id, nameNodeId) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.getItemNodeId(nameNodeId);
    return result;
  };

  /**
   * @method getCurrentState
   * @async
   * 
   * @param {String>} id 
   * @returns {Object}
   */
  service.getCurrentState = async function (id) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.getCurrentState();
    return result;
  };

  /**
   * @method getSrvCurrentState
   * @async
   * 
   * @param {String>} id 
   * @returns {Object}
   */
  service.getSrvCurrentState = async function (id) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.getSrvCurrentState();
    return result;
  };

  /**
   * @method getClientInfo
   * @async
   * 
   * @param {String>} id 
   * @returns {Object}
   */
  service.getClientInfo = async function (id) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.getClientInfo();
    return result;
  };

  /**
   * @method sessionToString
   * @async
   * 
   * @param {String>} id 
   * @returns {Object}
   */
  service.sessionToString = async function (id) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.sessionToString();
    return result;
  };

  /**
   * @method sessionEndpoint
   * @async
   * 
   * @param {String>} id 
   * @returns {Object}
   */
  service.sessionEndpoint = async function (id) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.sessionEndpoint();
    return result;
  };

  /**
   * @method sessionSubscriptionCount
   * @async
   * 
   * @param {String>} id 
   * @returns {Object}
   */
  service.sessionSubscriptionCount = async function (id) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.sessionSubscriptionCount();
    return result;
  };

  /**
   * @method sessionIsReconnecting
   * @async
   * 
   * @param {String>} id 
   * @returns {Object}
   */
  service.sessionIsReconnecting = async function (id) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.sessionIsReconnecting();
    return result;
  };

  /**
   * @method sessionGetPublishEngine
   * @async
   * 
   * @param {String>} id 
   * @returns {Object}
   */
  service.sessionGetPublishEngine = async function (id) {
    const opcuaClient = await service.get(id);
    result = opcuaClient.client.sessionGetPublishEngine();
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
   * @method sessionReadHistoryValuesEx
   * @async
   * 
   * @param {String} id 
   * @param {ReadValueIdLike|ReadValueIdLike[]} browseNames
   * @param {String} start   the start time in UTC format
   * @param {String} end     the end time in UTC format
   * @returns {Promise<HistoryReadResult[]>}
   */
  service.sessionReadHistoryValuesEx = async function (id, browseNames, start, end) {
    const opcuaClient = await service.get(id);
    result = await opcuaClient.client.sessionReadHistoryValuesEx(browseNames, start, end);
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
    let subscriptionHandler = null;
    //------------------------------------
    const opcuaClient = await service.get(id);

    if (subscriptionHandlerName) {
      subscriptionHandler = getSubscriptionHandler(id, subscriptionHandlerName);
    } else {
      // Get subscriptionHandlerName
      const nodeId = itemToMonitor.nodeId;
      const itemNodeId = await service.getItemNodeId(id, nodeId);
      // Get subscriptionHandler for variable
      if (itemNodeId.subscription) {
        subscriptionHandlerName = itemNodeId.subscription;
        subscriptionHandler = getSubscriptionHandler(id, subscriptionHandlerName);
      } else {
        // Get opcuaOption 
        const opcuaOption = getOpcuaConfig(id);
        // Get subscriptionHandler for opcua option
        if(opcuaOption.subscription){
          subscriptionHandlerName = opcuaOption.subscription;
          subscriptionHandler = getSubscriptionHandler(id, subscriptionHandlerName);
        }
      }
    }
    if(!subscriptionHandler){
      subscriptionHandler = getSubscriptionHandler(id);
    }
    result = await opcuaClient.client.subscriptionMonitor(subscriptionHandler, itemToMonitor, requestedParameters, timestampsToReturn);
    return result;
  };
};
