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

const debug = require('debug')('app:opcua-client.class');
const isDebug = false;
const isLog = false;

/**
 * Opcua clients class
 */
class OpcuaClients {

  setup(app, path) {
    this.app = app;
    this.opcuaClients = [];
  }

  async create(data, params) {
    // Get id
    const id = data.params.applicationName;

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
