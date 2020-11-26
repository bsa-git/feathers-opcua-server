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

const loRemove = require('lodash/remove');

const debug = require('debug')('app:service.opcua-servers');
const isDebug = false;
const isLog = false;

/**
 * Execute service action
 * @param {Object} service 
 * @param {Object} data 
 */
const executeAction = async (service, data) => {
  let server, opcuaServer, resultAction;
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
        // Get resultAction
        resultAction = {
          id: opcuaServer.id,
          data,
          server: { currentState: opcuaServer.server.getCurrentState() },
          createdAt: opcuaServer.createdAt,
          updatedAt: opcuaServer.updatedAt
        }
        break;
        case 'start':
          // Shutdown OPC-UA server
          opcuaServer = service.get(data.id);
          // Server start
          await opcuaServer.server.start();
          // Get resultAction
          resultAction = {
            id: opcuaServer.id,
            data,
            server: { currentState: opcuaServer.server.getCurrentState() },
            createdAt: opcuaServer.createdAt,
            updatedAt: opcuaServer.updatedAt
          }
          break;  
      case 'shutdown':
        // Shutdown OPC-UA server
        opcuaServer = service.get(data.id);
        await opcuaServer.server.shutdown(data.timeout ? data.timeout : 0);
        // Get resultAction
        resultAction = {
          id: opcuaServer.id,
          data,
          server: { currentState: opcuaServer.server.getCurrentState() },
          createdAt: opcuaServer.createdAt,
          updatedAt: opcuaServer.updatedAt
        }
        break;
      default:
        throw new errors.BadRequest(`No such action - '${data.action}'`);
    }
    return resultAction;
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
    let opcuaServers, opcuaServer;
    // Just return all our opcuaServers
    opcuaServers = this.opcuaServers.map(srv => {
      if (params.provider) {
        opcuaServer = {
          id: srv.id,
          server: { currentState: srv.server.getCurrentState() },
          createdAt: srv.createdAt,
          updatedAt: srv.updatedAt
        }
      } else{
        opcuaServer = srv;
      }  
      return opcuaServer;
    })
    return opcuaServers;
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
        server: { currentState: opcuaServer.server.getCurrentState() },
        createdAt: opcuaServer.createdAt,
        updatedAt: opcuaServer.updatedAt
      }
    }
    return opcuaServer
  }

  async create(data, params) {
    try {
      const resultAction = await executeAction(this, data);
      return resultAction;
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

  // OPC-UA server remove
  async remove(id, params) {
    let opcuaServer;
    try {
      opcuaServer = this.get(id);
      await opcuaServer.server.shutdown();
      opcuaServer = Object.assign({}, {
        id: opcuaServer.id,
        server: { currentState: opcuaServer.server.getCurrentState() },
        createdAt: opcuaServer.createdAt,
        updatedAt: opcuaServer.updatedAt
      });
      loRemove(this.opcuaServers, srv => srv.id === id);
      return opcuaServer;
    } catch (error) {
      console.log(chalk.red('service.opcua-servers::remove.error'), chalk.cyan(error.message));
      throw error;
    }
  }
}

exports.OpcuaServers = OpcuaServers;
