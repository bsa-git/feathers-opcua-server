/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { OpcuaServer } = require('../../plugins/opcua');
const opcuaServerMixins = require('./opcua-server.mixins');
const { isOpcuaServerInList, getServerForProvider } = require('../../plugins/opcua/opcua-helper');

const loRemove = require('lodash/remove');
const loAt = require('lodash/at');

const debug = require('debug')('app:opcua-servers.class');
const isDebug = false;

class OpcuaServers {

  setup(app, path) {
    this.app = app;
    this.opcuaServers = [];
  }

  async create(data, params) {
    let result;
    // Execute an OPCUA action through a service method (create)
    if(data.id && data.action){
      opcuaServerMixins(this);
      const path = this.getPathForServerMixins(data.action);
      if(path === null){
        throw new errors.BadRequest(`There is no path for the corresponding action - "${data.action}"`);  
      }
      const args = loAt(data, path);
      result = await this[data.action](...args);
      return result;
    }

    // Get id
    const id = data.params.serverInfo.applicationName;
    if (isOpcuaServerInList(this, id)) {
      throw new errors.BadRequest(`The opcua server already exists for this id = '${id}' in the server list`);
    }
    // Create OPC-UA server
    const server = new OpcuaServer(data.params);
    server.app = this.app;
    // Server create
    await server.opcuaServerCreate();
    // Server constructAddressSpace
    server.constructAddressSpace();
    // Server start
    await server.opcuaServerStart();
    // Add opcuaServer to server list
    const opcuaServer = {
      id: server.getServerInfo().applicationName,
      server,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
    this.opcuaServers.push(opcuaServer);
    // Get result
    result = params.provider ? Object.assign({}, opcuaServer, getServerForProvider(opcuaServer.server)) : opcuaServer;
    return result;
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

  async update(id, data, params) {
    await this.remove(id);
    const result = await this.create(data);
    return result;
  }

  async patch(id, data, params) {
    await this.remove(id);
    const result = await this.create(data);
    return result;
  }

  // OPC-UA server remove
  async remove(id, params) {
    let opcuaServer;
    opcuaServer = await this.get(id);
    await opcuaServer.server.opcuaServerShutdown(1000);
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
