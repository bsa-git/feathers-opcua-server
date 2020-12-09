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
const loMerge = require('lodash/merge');

const debug = require('debug')('app:service.opcua-servers');
const isDebug = false;
const isLog = false;

/**
 * Is opcua server
 * 
 * @param {OpcuaServers} service 
 * @param {String} id 
 * @returns {Boolean}
 */
const _isOpcuaServer = (service, id) => {
  let opcuaServer = null;
  opcuaServer = service.opcuaServers.find(srv => srv.id === id);
  return !!opcuaServer;
};

/**
 * Get server for provider
 * @param {Object} server 
 * @returns {Object}
 */
const _getServerForProvider = (server) => {
  return {
    server: {
      currentState: server.getCurrentState()
    }
  };
};

/**
 * Execute service action
 * @param {Object} service 
 * @param {Object} data 
 */
const _executeAction = async (service, data) => {
  let server, opcuaServer, resultAction, id;
  let AddressSpaceParams, addressSpaceGetters, addressSpaceMethods;
  try {
    // inspector('service.opcua-servers.executeAction.app:', service.app);
    // inspector('service.opcua-servers.executeAction.opcuaServers:', service.opcuaServers);
    // Run service action
    switch (`${data.action}`) {
    case 'create':
      id = data.params.serverInfo.applicationName;
      if (_isOpcuaServer(service, id)) {
        throw new errors.BadRequest(`The opcua server already exists for this id = '${id}' in the server list`);
      }
      // Create OPC-UA server
      server = new OpcuaServer(service.app, data.params);
      // Server create
      await server.create();
      // Server constructAddressSpace
      AddressSpaceParams = require(`${appRoot}${data.paths.options}`);
      addressSpaceGetters = require(`${appRoot}${data.paths.getters}`);
      addressSpaceMethods = require(`${appRoot}${data.paths.methods}`);
      server.constructAddressSpace(AddressSpaceParams, addressSpaceGetters, addressSpaceMethods);
      // Server start
      await server.start();
      // Add opcuaServer to server list
      opcuaServer = {
        id: server.getServerInfo().applicationName,
        server,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      service.opcuaServers.push(opcuaServer);
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaServer, _getServerForProvider(opcuaServer.server)) : opcuaServer;
      break;
    case 'start':
      // Shutdown OPC-UA server
      opcuaServer = service.get(data.id);
      // Server start
      await opcuaServer.server.start();
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaServer, _getServerForProvider(opcuaServer.server)) : opcuaServer;
      break;
    case 'shutdown':
      // Shutdown OPC-UA server
      opcuaServer = service.get(data.id);
      await opcuaServer.server.shutdown(data.timeout ? data.timeout : 0);
      // Get resultAction
      resultAction = data.provider ? Object.assign({}, opcuaServer, _getServerForProvider(opcuaServer.server)) : opcuaServer;
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
        };
      } else {
        opcuaServer = srv;
      }
      return opcuaServer;
    });
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
      };
    }
    return opcuaServer;
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

  // OPC-UA server remove
  async remove(id, params) {
    let opcuaServer;
    opcuaServer = await this.get(id);
    // inspector('Remove the service:', opcuaServer);
    await opcuaServer.server.shutdown();
    opcuaServer = Object.assign({}, {
      id: opcuaServer.id,
      server: { currentState: opcuaServer.server.getCurrentState() },
      createdAt: opcuaServer.createdAt,
      updatedAt: opcuaServer.updatedAt
    });

    loRemove(this.opcuaServers, srv => srv.id === id);
    return opcuaServer;
  }
}

exports.OpcuaServers = OpcuaServers;
