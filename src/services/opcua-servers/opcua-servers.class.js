/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { OpcuaServer, inspector, appRoot } = require('../../plugins');
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
 * Execute service action
 * @param {Object} service 
 * @param {Object} data 
 */
const executeAction = async (service, data) => {
  let server, opcuaServer;
  try {
    // Run service action
    switch (`${data.action}`) {
      case 'create':
        // Create OPC-UA server
        server = new OpcuaServer(service.app, data.params);
        opcuaServer = {
          id: server.getServerInfo().applicationName,
          server,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
        // Server create
        await server.create();
        // Server constructAddressSpace
        const AddressSpaceParams = require(`${appRoot}${data.paths.options}`);
        const addressSpaceGetters = require(`${appRoot}${data.paths.getters}`);
        const addressSpaceMethods = require(`${appRoot}${data.paths.methods}`);
        server.constructAddressSpace(AddressSpaceParams, addressSpaceGetters, addressSpaceMethods);
        // Server start
        await server.start();
        service.opcuaServers.push(opcuaServer);
        break;
      case 'shutdown':
        // Shutdown OPC-UA server
        opcuaServer = service.get(data.id);
        await opcuaServer.server.shutdown(data.timeout ? data.timeout : 0);
        break;
      default:
        throw new errors.BadRequest(`No such action - '${data.action}'`);
    }
  } catch (error) {
    throw new errors.BadRequest(`Error for action - '${data.action}'. ${error.message}`);
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
    let opcuaServer = null;
    opcuaServer = this.opcuaServers.find(srv => srv.id === id);
    if (!opcuaServer) {
      throw new errors.BadRequest(`No opcua server found for this id = '${id}' in the server list`);
    }
    if (params.provider) {
      opcuaServer = {
        id: opcuaServer.id,
        server: { currentState: opcuaServer.getCurrentState() },
        createdAt: opcuaServer.createdAt,
        updatedAt: opcuaServer.updatedAt
      }
    }
    return opcuaServer
  }

  async create(data, params) {
    try {
      await executeAction(this, data);
      return data;
    } catch (error) {
      console.log(chalk.red('service.opcua-servers::create.error'), chalk.cyan(error.message));
      throw error;
    }
  }

  async update(id, data, params) {
    return { data };
  }

  async patch(id, data, params) {
    return { data };
  }

  // OPC-UA server shutdown
  async remove(id, params) {
    try {
      const opcuaServer = this.get(id);
      opcuaServer.server.shutdown();
      return { id };
    } catch (error) {
      console.log(chalk.red('service.opcua-servers::remove.error'), chalk.cyan(error.message));
      throw error;
    }
  }
}

exports.OpcuaServers = OpcuaServers;
