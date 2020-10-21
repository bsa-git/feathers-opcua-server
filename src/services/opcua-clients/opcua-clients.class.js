/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { OpcuaClient } = require('../../plugins');
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
 * Create opcua client
 * @param {Application} app 
 * @param {Object} data 
 * @returns {Object}
 */
const createOpcuaClient = async (app, data) => {
  // Create OPC-UA client
  const client = new OpcuaClient(app, data.params);
  const opcuaClient = {
    id: data.id,
    client,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
  client.create();
  await client.connect();
  await client.sessionCreate();
  client.subscriptionCreate();

  return opcuaClient;
};

/**
 * Execute service action
 * @param {Object} service 
 * @param {Object} data 
 */
const executeAction = async (service, data) => {
  let client, opcuaClient;
  try {
    // Run client action
    switch (`${data.action}`) {
    case 'create':
      // Create OPC-UA client
      client = new OpcuaClient(service.app, data.params);
      opcuaClient = {
        id: data.id,
        client,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      client.create();
      await client.connect();
      await client.sessionCreate();
      client.subscriptionCreate();
      break;
    case 'shutdown':
      break;
    case 'start':
      break;
    default:
      throw new errors.BadRequest(`No such action - '${data.action}'`);
    }
  } catch (error) {
    console.log(chalk.red('service.opcua-servers::executeAction.error'), chalk.cyan(error.message));
    throw error;
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
    return this.opcuaClients;
  }

  async get(id, params) {
    const opcuaClient = this.opcuaClients.find(client => client.id === id);
    if (!opcuaClient) {
      throw new errors.BadRequest(`No opcua client found for this id = '${id}' in the client list`);
    }
    return opcuaClient;
  }

  async create(data, params) {
    try {
      await executeAction(this, data);
      return data;
    } catch (error) {
      console.log(chalk.red('service.opcua-clients::create.error'), chalk.cyan(error.message));
      throw error;
    }
  }

  async update(id, data, params) {
    return data;
  }

  async patch(id, data, params) {
    return data;
  }

  async remove(id, params) {
    try {
      const opcuaClient = this.get(id);
      await opcuaClient.client.subscriptionTerminate();
      await opcuaClient.client.subscriptionTerminate();
      await opcuaClient.client.sessionClose();
      await opcuaClient.client.disconnect();
      return { id };
    } catch (error) {
      console.log(chalk.red('service.opcua-clients::remove.error'), chalk.cyan(error.message));
      throw error;
    }
  }
}

exports.OpcuaClients = OpcuaClients;
