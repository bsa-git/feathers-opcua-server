/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { OpcuaClient, inspector } = require('../../plugins');
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
  let fnPromise;
  try {
    // Get OPC-UA client
    if (data.action !== 'create') {
      opcuaClient = await service.get(data.id);
    }
    // Run client action
    switch (`${data.action}`) {
    case 'create':
      id = data.params.applicationName;
      if (_isOpcuaClient(service, id)) {
        throw new errors.BadRequest(`The opcua client already exists for this id = '${id}' in the client list`);
      }
      // Create OPC-UA client
      client = new OpcuaClient(service.app, data.params);
      // Client create
      await client.create();

      // Client connect and sessionCreate
      isOpcuaServer = await _isOpcuaServer(service.app, data);
      if (isOpcuaServer) {
        srvCurrentState = await _getSrvCurrentState(service.app, data);
        await client.connect(srvCurrentState);
        await client.sessionCreate();
      }

      // Add opcuaClient to client list
      opcuaClient = {
        id,
        client,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      service.opcuaClients.push(opcuaClient);
      resultAction = data.provider ? Object.assign({}, opcuaClient, _getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'connect':
      // Client connect
      isOpcuaServer = await _isOpcuaServer(service.app, data);
      if (isOpcuaServer) {
        srvCurrentState = await _getSrvCurrentState(service.app, data);
        await opcuaClient.client.connect(srvCurrentState);
      }
      resultAction = data.provider ? Object.assign({}, opcuaClient, _getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'disconnect':
      await opcuaClient.client.disconnect();
      resultAction = data.provider ? Object.assign({}, opcuaClient, _getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'sessionCreate':
      // Client session create
      await opcuaClient.client.sessionCreate();
      resultAction = data.provider ? Object.assign({}, opcuaClient, _getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'sessionClose':
      // Client session create
      await opcuaClient.client.sessionClose();
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaClient, _getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'subscriptionCreate':
      // Client subscription create
      opcuaClient.client.subscriptionCreate();
      resultAction = data.provider ? Object.assign({}, opcuaClient, _getClientForProvider(opcuaClient.client)) : opcuaClient;
      break;
    case 'subscriptionTerminate':
      // Client subscription terminate
      await opcuaClient.client.subscriptionTerminate();
      resultAction = data.provider ? Object.assign({}, opcuaClient, _getClientForProvider(opcuaClient.client)) : opcuaClient;
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
      resultAction = await opcuaClient.client.sessionCallMethod(data.nameNodeIds, [data.inputArguments]);
      break;
    case 'sessionGetArgumentDefinition':
      // Client session get argument definition
      resultAction = await opcuaClient.client.sessionGetArgumentDefinition(data.nameNodeIds);
      break;
    case 'subscriptionMonitor':
      // Client subscription monitor
      // resultAction = await opcuaClient.client.subscriptionMonitor(data.nameNodeIds);
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
    // Just return all our opcuaClients
    // return this.opcuaClients;
    let opcuaClients, opcuaClient;
    // Just return all our opcuaServers
    opcuaClients = this.opcuaClients.map(client => {
      if (params.provider) {
        opcuaClient = {
          id: client.id,
          client: _getClientForProvider(client.client).client,
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
        client: _getClientForProvider(opcuaClient.client).client,
        createdAt: opcuaClient.client.createdAt,
        updatedAt: opcuaClient.client.updatedAt
      };
    }
    return opcuaClient;
  }

  async create(data, params) {
    data.provider = params.provider;
    const resultAction = await _executeAction(this, data);
    return resultAction;
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

    // const _client = _getClientForProvider(opcuaClient.client);
    // debug('remove._client:', _client);

    if (opcuaClient.client.subscription) {
      await opcuaClient.client.subscriptionTerminate();
    }
    if (opcuaClient.client.session) {
      await opcuaClient.client.sessionClose();
    }
    await opcuaClient.client.disconnect();

    opcuaClient = Object.assign({}, {
      id: opcuaClient.id,
      client: _getClientForProvider(opcuaClient.client).client,
      createdAt: opcuaClient.createdAt,
      updatedAt: opcuaClient.updatedAt
    });

    loRemove(this.opcuaClients, srv => srv.id === id);
    return opcuaClient;
  }
}

exports.OpcuaClients = OpcuaClients;
