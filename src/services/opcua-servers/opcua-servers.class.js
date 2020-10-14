const { OpcuaServer } = require('../../plugins');
const chalk = require('chalk');
// const moment = require('moment');
// const {
// Variant,
// DataType,
// VariantArrayType,
// AttributeIds,
// StatusCodes,
// } = require('node-opcua');
// const debug = require('debug')('app:service.opcua-servers');
// const isDebug = false;
// const isLog = false;

class OpcuaServers {
  constructor(options, app) {
    this.app = app;
    this.options = options;
    this.opcuaServers = [];
  }

  async find() {
    // Just return all our messages
    return this.opcuaServers;
  }

  async get(id) {
    return this.opcuaServers.find(srv => srv.id === id);
  }

  async create(data) {

    try {
      // Create OPC-UA server
      const server = new OpcuaServer(this.app, data.params);
      const opcuaServer = {
        id: data.id,
        srv: server
      };

      this.opcuaServers.push(opcuaServer);

      // Server create and start
      await server.create();
      await server.start();
      // const endpoints = await server.start();
      // console.log(chalk.green('opcuaServer.securityMode'), chalk.cyan(endpoints[0].securityMode));
      // console.log(chalk.green('opcuaServer.securityPolicyUri'), chalk.cyan(endpoints[0].securityPolicyUri));

      return opcuaServer;
    } catch (error) {
      console.log(chalk.red('service.opcua-servers::create.error'), chalk.cyan(error.message));
      throw error;
    }
  }

  // async update(id, data, params) {

  // }

  // async patch(id, data, params) {

  // }

  // OPC-UA server shutdown
  async remove(id) {
    try {
      const server = this.opcuaServers.find(srv => srv.id === id);
      if (server) {
        server.shutdown();
      }
    } catch (error) {
      console.log(chalk.red('service.opcua-servers::remove.error'), chalk.cyan(error.message));
      throw error;
    }
  }

  // setup(app, path) {
  //   this.app = app;
  // }
}

exports.OpcuaServers = OpcuaServers;
