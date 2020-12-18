/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { OpcuaClient, inspector } = require('../../plugins');
const {
  isOpcuaClientInList,
  getClientForProvider,
  getSrvCurrentState,
  getSubscriptionHandler
} = require('../../plugins/opcua/opcua-helper');
const chalk = require('chalk');
const moment = require('moment');
const {
  Variant,
  DataType,
  VariantArrayType,
  AttributeIds,
  StatusCodes,
  makeBrowsePath
} = require('node-opcua');

const loRemove = require('lodash/remove');

const debug = require('debug')('app:service.opcua-client');
const isDebug = false;
const isLog = false;

/**
 * Is opcua client
 * 
 * @param {OpcuaClients} service 
 * @param {String} id 
 * @returns {Boolean}
 */
const _isOpcuaClient = (service, id) => {
  let opcuaClient = null;
  opcuaClient = service.opcuaClients.find(client => client.id === id);
  return !!opcuaClient;
};

/**
 * Is opcua server
 * 
 * @param {Application} app 
 * @param {Object} data 
 * @returns {Boolean}
 */
const _isOpcuaServer = async (app, data) => {
  let result, opcuaServer = null;
  try {
    const service = app.service('opcua-servers');
    const id = data.params.applicationName;
    opcuaServer = await service.get(id);
    result = true;
  } catch (error) {
    result = false;
  }
  return result;
};

/**
 * Get opcua server currentState
 * 
 * @param {Application} app 
 * @param {Object} data 
 * @returns {Object}
 */
const _getSrvCurrentState = async (app, data) => {
  let opcuaServer = null;
  const service = app.service('opcua-servers');
  const id = data.params.applicationName;
  opcuaServer = await service.get(id);
  return opcuaServer.server.currentState;
};

/**
 * Get client for provider
 * @param {Object} client 
 * @returns {Object}
 */
const _getClientForProvider = (client) => {
  return {
    client: client.getClientInfo()
  };
};


/**
 * Execute service action
 * @param {Object} service 
 * @param {Object} data 
 */
const _executeAction = async (service, data) => {
  let client, opcuaClient, resultAction, id, path;
  let srvCurrentState, isOpcuaServer = false;
  let subscriptionHandler;
  try {
    // Get id
    id = (data.action === 'create') ? data.params.applicationName : data.id;
    // Get OPC-UA client
    if (data.action !== 'create') {
      opcuaClient = await service.get(id);
    }
    // Run client action
    switch (`${data.action}`) {
    case 'create':
      if (isOpcuaClientInList(service, id)) {
        throw new errors.BadRequest(`The opcua client already exists for this id = '${id}' in the client list`);
      }
      // Create OPC-UA client
      client = new OpcuaClient(service.app, data.params);
      // Client create
      await client.create();

      // Client connect and sessionCreate
      srvCurrentState = await getSrvCurrentState(service.app, id);
      await client.connect(srvCurrentState);
      await client.sessionCreate();

      // Add opcuaClient to client list
      opcuaClient = {
        id,
        client,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      service.opcuaClients.push(opcuaClient);
      resultAction = data.provider ? Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'connect':
      // Client connect
      srvCurrentState = await getSrvCurrentState(service.app, id);
      await opcuaClient.client.connect(srvCurrentState);
      resultAction = data.provider ? Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'disconnect':
      await opcuaClient.client.disconnect();
      resultAction = data.provider ? Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'sessionCreate':
      // Client session create
      await opcuaClient.client.sessionCreate();
      resultAction = data.provider ? Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'sessionClose':
      // Client session create
      await opcuaClient.client.sessionClose();
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'subscriptionCreate':
      // Client subscription create
      opcuaClient.client.subscriptionCreate();
      resultAction = data.provider ? Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'subscriptionTerminate':
      // Client subscription terminate
      await opcuaClient.client.subscriptionTerminate();
      resultAction = data.provider ? Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'getNodeIds':
      // Get item nodeId
      resultAction = await Promise.resolve(opcuaClient.client.getNodeIds(data.nameNodeIds));
      break;
    case 'getItemNodeId':
      // Get item nodeId
      resultAction = await Promise.resolve(opcuaClient.client.getItemNodeId(data.nameNodeId));
      break;
    case 'sessionReadNamespaceArray':
      // Client session create
      resultAction = await opcuaClient.client.sessionReadNamespaceArray();
      break;
    case 'sessionBrowse':
      // Client session browse
      resultAction = await opcuaClient.client.sessionBrowse({ nodeId: data.path });
      break;
    case 'sessionTranslateBrowsePath':
      // Client session translate browse path
      path = makeBrowsePath(data.folder, data.path);
      resultAction = await opcuaClient.client.sessionTranslateBrowsePath(path);
      break;
    case 'sessionRead':
      // Client session read
      if (data.attributeIds) {
        resultAction = await opcuaClient.client.sessionRead(data.nameNodeIds, data.attributeIds);
      } else {
        resultAction = await opcuaClient.client.sessionRead(data.nameNodeIds);
      }
      break;
    case 'sessionReadVariableValue':
      // Client session read variable value
      resultAction = await opcuaClient.client.sessionReadVariableValue(data.nameNodeIds);
      break;
    case 'sessionReadAllAttributes':
      // Client session read all attributes of variable
      resultAction = await opcuaClient.client.sessionReadAllAttributes(data.nameNodeIds);
      break;
    case 'sessionReadHistoryValues':
      // Client session read history values
      resultAction = await opcuaClient.client.sessionReadHistoryValues(data.nameNodeIds, data.start, data.end);
      break;
    case 'sessionWriteSingleNode':
      // Client session write single node
      resultAction = await opcuaClient.client.sessionWriteSingleNode(data.nameNodeIds, data.value);
      break;
    case 'sessionWrite':
      // Client session write
      resultAction = await opcuaClient.client.sessionWrite(data.nameNodeIds, data.values);
      break;
    case 'sessionCallMethod':
      // Client session call method
      resultAction = await opcuaClient.client.sessionCallMethod(data.nameNodeIds, data.inputArguments);
      break;
    case 'sessionGetArgumentDefinition':
      // Client session get argument definition
      resultAction = await opcuaClient.client.sessionGetArgumentDefinition(data.nameNodeIds);
      break;
    case 'sessionGetMonitoredItems':
      // Client session get monitored items
      resultAction = await opcuaClient.client.sessionGetMonitoredItems(opcuaClient.client.subscription.subscriptionId);
      break;
    case 'subscriptionMonitor':
      // Client subscription monitor
      subscriptionHandler = getSubscriptionHandler(data.id, data.subscriptionHandlerName);
      resultAction = await opcuaClient.client.subscriptionMonitor(subscriptionHandler, data.itemToMonitor, data.requestedParameters, data.timestampsToReturn);
      break;
    default:// 
      throw new errors.BadRequest(`No such action - '${data.action}'`);
    }
    return resultAction;
  } catch (error) {
    throw new errors.BadRequest(`Error for action - '${data.action}'. ${error.message}`);
  }
};
/**
 * Opcua clients class
 */
class OpcuaClients {

  setup(app, path) {
    this.app = app;
    this.opcuaClients = [];
  }

  async find(params) {
    let opcuaClients, opcuaClient;
    // Just return all our opcuaServers
    opcuaClients = this.opcuaClients.map(client => {
      if (params.provider) {
        opcuaClient = {
          id: client.id,
          client: getClientForProvider(client.client).client,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        };
      } else {
        opcuaClient = client;
      }
      return opcuaClient;
    });
    return opcuaClients;
  }

  async get(id, params) {
    let opcuaClient = this.opcuaClients.find(client => client.id === id);
    if (!opcuaClient) {
      throw new errors.BadRequest(`No opcua client found for this id = '${id}' in the client list`);
    }
    if (params.provider) {
      opcuaClient = {
        id: opcuaClient.client.id,
        client: getClientForProvider(opcuaClient.client).client,
        createdAt: opcuaClient.client.createdAt,
        updatedAt: opcuaClient.client.updatedAt
      };
    }
    return opcuaClient;
  }

  async create(data, params) {
    // Get id
    const id = data.params.applicationName;
    // data.provider = params.provider;
    // const resultAction = await _executeAction(this, data);

    if (isOpcuaClientInList(this, id)) {
      throw new errors.BadRequest(`The opcua client already exists for this id = '${id}' in the client list`);
    }
    // Create OPC-UA client
    const client = new OpcuaClient(this.app, data.params);
    // Client create
    await client.create();

    // Client connect and sessionCreate
    const srvCurrentState = await getSrvCurrentState(this.app, id);
    await client.connect(srvCurrentState);
    await client.sessionCreate();

    // Add opcuaClient to client list
    const opcuaClient = {
      id,
      client,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
    this.opcuaClients.push(opcuaClient);
    const result = params.provider ? Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client)) : opcuaClient;
    return result;
  }

  async update(id, data, params) {
    await this.remove(id);
    data.action = 'create';
    const resultAction = await this.create(data);
    return resultAction;
  }

  async patch(id, data, params) {
    await this.remove(id);
    data.action = 'create';
    const resultAction = await this.create(data);
    return resultAction;
  }

  async remove(id, params) {
    let opcuaClient = await this.get(id);
    if (opcuaClient.client.subscription) {
      await opcuaClient.client.subscriptionTerminate();
    }
    if (opcuaClient.client.session) {
      await opcuaClient.client.sessionClose();
    }
    await opcuaClient.client.disconnect();

    opcuaClient = Object.assign({}, {
      id: opcuaClient.id,
      client: getClientForProvider(opcuaClient.client).client,
      createdAt: opcuaClient.createdAt,
      updatedAt: opcuaClient.updatedAt
    });

    loRemove(this.opcuaClients, srv => srv.id === id);
    return opcuaClient;
  }
}

exports.OpcuaClients = OpcuaClients;
