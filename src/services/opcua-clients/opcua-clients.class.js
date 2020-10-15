/* eslint-disable no-unused-vars */
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
    client
  };
  return opcuaClient;
};

/**
 * Opcua clients class
 */
class OpcuaClients {
  constructor(options, app) {
    this.app = app;
    this.options = options || {};
    this.opcuaClients = [];
  }

  async find(params) {
    // Just return all our opcuaClients
    return this.opcuaClients;
  }

  async get(id, params) {
    return this.opcuaClients.find(client => client.id === id);
  }

  async create(data, params) {
    try {
      if (Array.isArray(data)) {
        return Promise.all(data.map(current => this.create(current, params)));
      }
      // Create OPC-UA client
      const opcuaClient = await createOpcuaClient(this.app, data);
      this.opcuaClients.push(opcuaClient);
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
      const opcuaClient = this.opcuaClients.find(srv => srv.id === id);
      if (opcuaClient) {
        // opcuaClient.client.shutdown();
      }
    } catch (error) {
      console.log(chalk.red('service.opcua-servers::remove.error'), chalk.cyan(error.message));
      throw error;
    }
  }
}

exports.OpcuaClients = OpcuaClients;
