/* eslint-disable no-unused-vars */
const { OpcuaServer } = require('../../plugins');
const chalk = require('chalk');
const moment = require('moment');
const {
  Variant,
  DataType,
  VariantArrayType,
  AttributeIds,
  StatusCodes,
} = require('node-opcua');
const debug = require('debug')('app:service.opcua-servers');
const isDebug = false;
const isLog = false;

/**
 * Create opcua client
 * @param {Application} app 
 * @param {Object} data 
 * @returns {Object}
 */
const createOpcuaServer = async (app, data) => {
  try {
    // Create OPC-UA server
    const server = new OpcuaServer(app, data.params);
    const opcuaServer = {
      id: data.id,
      server
    };

    // Server create and start
    await server.create();
    await server.start();

    return opcuaServer;
  } catch (error) {
    console.log(chalk.red('service.opcua-servers::create.error'), chalk.cyan(error.message));
    throw error;
  }
};

class OpcuaServers {

  setup(app, path) {
    this.app = app;
    this.opcuaServers = [];
  }

  async find(params) {
    // Just return all our opcuaServers
    return this.opcuaServers;
  }

  async get(id, params) {
    return this.opcuaServers.find(srv => srv.id === id);
  }

  async create(data, params) {
    try {
      if (Array.isArray(data)) {
        return Promise.all(data.map(current => this.create(current, params)));
      }
      // Create OPC-UA server
      const opcuaServer = await createOpcuaServer(this.app, data);
      this.opcuaServers.push(opcuaServer);
      return data;
    } catch (error) {
      console.log(chalk.red('service.opcua-clients::create.error'), chalk.cyan(error.message));
      throw error;
    }
  }

  async update(id, data, params) {

  }

  async patch(id, data, params) {

  }

  // OPC-UA server shutdown
  async remove(id, params) {
    try {
      const opcuaServer = this.opcuaServers.find(srv => srv.id === id);
      if (opcuaServer) {
        opcuaServer.server.shutdown();
      }
    } catch (error) {
      console.log(chalk.red('service.opcua-servers::remove.error'), chalk.cyan(error.message));
      throw error;
    }
  }
}

exports.OpcuaServers = OpcuaServers;
