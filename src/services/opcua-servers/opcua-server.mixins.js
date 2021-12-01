/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { inspector, getServerForProvider } = require('../../plugins');

const {
  Variant,
  DataType,
  VariantArrayType,
  AttributeIds,
  StatusCodes,
  makeBrowsePath
} = require('node-opcua');

const debug = require('debug')('app:opcua-server.mixins');
const isLog = true;
const isDebug = false;

let result;



module.exports = function opcuaServerMixins(service, path) {

  /**
   * @method getPathForServerMixins
   * @param {String} action 
   * @returns {Array}
   * e.g. return -> ['id', 'params', 'getters', 'methods']
   */
  service.getPathForServerMixins = function (action) {
    switch (action) {
    case 'opcuaServerCreate':
    case 'opcuaServerStart':
    case 'getCurrentState':
    case 'getServerInfo':
    case 'getBuildInfo':
    case 'getBytesWritten':
    case 'getBytesRead':
    case 'getTransactionsCount':
    case 'getCurrentChannelCount':
    case 'getCurrentSubscriptionCount':
    case 'getRejectedSessionCount':
    case 'getRejectedRequestsCount':
    case 'getSessionAbortCount':
    case 'getPublishingIntervalCount':
    case 'getCurrentSessionCount':
    case 'isInitialized':
    case 'isAuditing':
      result = ['id'];
      break;
    case 'opcuaClientCreate':
      result = ['id', 'timeout'];
      break;
    case 'constructAddressSpace':
      result = ['id', 'params', 'getters', 'methods'];
      break;
    default:
      break;
    }
    return result;
  };

  /**
   * @method opcuaServerCreate
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.opcuaServerCreate = async function (id) {
    const opcuaServer = await service.get(id);
    await opcuaServer.server.opcuaServerCreate();
    result = Object.assign({}, opcuaServer, getServerForProvider(opcuaServer.server));
    return result;
  };

  /**
   * @method opcuaServerStart
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.opcuaServerStart = async function (id) {
    const opcuaServer = await service.get(id);
    await opcuaServer.server.opcuaServerStart();
    result = Object.assign({}, opcuaServer, getServerForProvider(opcuaServer.server));
    return result;
  };

  /**
   * @method opcuaServerShutdown
   * @async
   * 
   * @param {String} id 
   * @param {Number} timeout 
   * @returns {Object}
   */
  service.opcuaServerShutdown = async function (id, timeout = 1000) {
    const opcuaServer = await service.get(id);
    await opcuaServer.server.opcuaServerShutdown(timeout);
    result = Object.assign({}, opcuaServer, getServerForProvider(opcuaServer.server));
    return result;
  };

  /**
   * @method constructAddressSpace
   * @async
   * 
   * @param {Object} params 
   * @param {Object} getters
   * @param {Object} methods 
   * @returns {Object}
   */
  service.constructAddressSpace = async function (id, params = null, getters = null, methods = null) {
    const opcuaServer = await service.get(id);
    opcuaServer.server.constructAddressSpace(params = null, getters = null, methods = null);
    result = Object.assign({}, opcuaServer, getServerForProvider(opcuaServer.server));
    return result;
  };

  /**
   * @method getCurrentState
   * @async
   * 
   * @returns {Object}
   */
  service.getCurrentState = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getCurrentState();
    return result;
  };

  /**
   * @method getServerInfo
   * @async
   * 
   * @returns {Object}
   */
  service.getServerInfo = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getServerInfo();
    return result;
  };

  /**
   * @method getBuildInfo
   * @async
   * 
   * @returns {Object}
   */
  service.getBuildInfo = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getBuildInfo();
    return result;
  };

  /**
   * @method getBytesWritten
   * @async
   * 
   * @returns {Number}
   */
  service.getBytesWritten = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getBytesWritten();
    return result;
  };

  /**
   * @method getBytesRead
   * @async
   * 
   * @returns {Number}
   */
  service.getBytesRead = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getBytesRead();
    return result;
  };

  /**
   * @method getTransactionsCount
   * @async
   * 
   * @returns {Number}
   */
  service.getTransactionsCount = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getTransactionsCount();
    return result;
  };

  /**
   * @method getCurrentChannelCount
   * @async
   * 
   * @returns {Number}
   */
  service.getCurrentChannelCount = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getCurrentChannelCount();
    return result;
  };

  /**
   * @method getCurrentSubscriptionCount
   * @async
   * 
   * @returns {Number}
   */
  service.getCurrentSubscriptionCount = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getCurrentSubscriptionCount();
    return result;
  };

  /**
   * @method getRejectedSessionCount
   * @async
   * 
   * @returns {Number}
   */
  service.getRejectedSessionCount = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getRejectedSessionCount();
    return result;
  };

  /**
   * @method getRejectedRequestsCount
   * @async
   * 
   * @returns {Number}
   */
  service.getRejectedRequestsCount = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getRejectedRequestsCount();
    return result;
  };

  /**
   * @method getSessionAbortCount
   * @async
   * 
   * @returns {Number}
   */
  service.getSessionAbortCount = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getSessionAbortCount();
    return result;
  };

  /**
   * @method getPublishingIntervalCount
   * @async
   * 
   * @returns {Number}
   */
  service.getPublishingIntervalCount = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getPublishingIntervalCount();
    return result;
  };

  /**
   * @method getCurrentSessionCount
   * @async
   * 
   * @returns {Number}
   */
  service.getCurrentSessionCount = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.getCurrentSessionCount();
    return result;
  };

  /**
   * @method isInitialized
   * @async
   * 
   * @returns {Boolean}
   */
  service.isInitialized = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.isInitialized();
    return result;
  };

  /**
   * @method isAuditing
   * @async
   * 
   * @returns {Boolean}
   */
  service.isAuditing = async function (id) {
    const opcuaServer = await service.get(id);
    result = opcuaServer.server.isAuditing();
    return result;
  };
};
