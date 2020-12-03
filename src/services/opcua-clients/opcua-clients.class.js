/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { OpcuaClient, appRoot } = require('../../plugins');
const chalk = require('chalk');
const moment = require('moment');
const {
  Variant,
  DataType,
  VariantArrayType,
  AttributeIds,
  StatusCodes,
} = require('node-opcua');
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
  opcuaClient = service.opcuaClients.find(client => client.id === client);
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
 * Execute service action
 * @param {Object} service 
 * @param {Object} data 
 */
const _executeAction = async (service, data) => {
  let client, opcuaClient, opcuaServer, resultAction, id;
  let srvCurrentState, isOpcuaServer = false;
  let AddressSpaceParams, addressSpaceGetters, addressSpaceMethods;
  try {
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
        id: client.applicationName,
        client,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      service.opcuaClients.push(opcuaClient);
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaClient, {
        client: {
          srvCurrentState: opcuaClient.client.srvCurrentState,
          session: opcuaClient.client.sessionToString(),
          endpoint: opcuaClient.client.sessionEndpoint(),
          subscription: opcuaClient.client.subscriptionToString()
        }
      }) : opcuaClient;
      break;
    case 'connect':
      // Connect OPC-UA client
      opcuaClient = service.get(data.id);
      // Client connect
      isOpcuaServer = await _isOpcuaServer(service.app, data);
      if (isOpcuaServer) {
        srvCurrentState = await _getSrvCurrentState(service.app, data);
        await opcuaClient.client.connect(srvCurrentState);
      }
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaClient, {
        client: {
          srvCurrentState: opcuaClient.client.srvCurrentState,
          session: opcuaClient.client.sessionToString(),
          endpoint: opcuaClient.client.sessionEndpoint(),
          subscription: opcuaClient.client.subscriptionToString()
        }
      }) : opcuaClient;
      break;
    case 'disconnect':
      // Shutdown OPC-UA server
      opcuaClient = service.get(data.id);
      await opcuaClient.client.disconnect();
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaClient, {
        client: {
          srvCurrentState: opcuaClient.client.srvCurrentState,
          session: opcuaClient.client.sessionToString(),
          endpoint: opcuaClient.client.sessionEndpoint(),
          subscription: opcuaClient.client.subscriptionToString()
        }
      }) : opcuaClient;
      break;
    case 'sessionCreate':
      // Get OPC-UA client
      opcuaClient = service.get(data.id);
      // Client session create
      await opcuaClient.client.sessionCreate();
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaClient, {
        client: {
          srvCurrentState: opcuaClient.client.srvCurrentState,
          session: opcuaClient.client.sessionToString(),
          endpoint: opcuaClient.client.sessionEndpoint(),
          subscription: opcuaClient.client.subscriptionToString()
        }
      }) : opcuaClient;
      break;
    case 'sessionClose':
      // Get OPC-UA client
      opcuaClient = service.get(data.id);
      // Client session create
      await opcuaClient.client.sessionClose();
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaClient, {
        client: {
          srvCurrentState: opcuaClient.client.srvCurrentState,
          session: opcuaClient.client.sessionToString(),
          endpoint: opcuaClient.client.sessionEndpoint(),
          subscription: opcuaClient.client.subscriptionToString()
        }
      }) : opcuaClient;
      break;
    default:
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
          client: {
            srvCurrentState: client.srvCurrentState,
            session: client.sessionToString(),
            endpoint: client.sessionEndpoint(),
            subscription: client.subscriptionToString()
          },
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
        client: {
          srvCurrentState: opcuaClient.client.srvCurrentState,
          session: opcuaClient.client.sessionToString(),
          endpoint: opcuaClient.client.sessionEndpoint(),
          subscription: opcuaClient.client.subscriptionToString()
        },
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
    const opcuaClient = this.get(id);
    if (opcuaClient.client.subscription) {
      await opcuaClient.client.subscriptionTerminate();
    }
    if (opcuaClient.client.session) {
      await opcuaClient.client.sessionClose();
    }
    await opcuaClient.client.disconnect();
    return opcuaClient;
  }
}

exports.OpcuaClients = OpcuaClients;
