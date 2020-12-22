/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { OpcuaServer, inspector, appRoot } = require('../../plugins');
const { isOpcuaServerInList, getServerForProvider } = require('../../plugins/opcua/opcua-helper');
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

const debug = require('debug')('app:opcua-servers.class');
const isDebug = false;
const isLog = false;

class OpcuaServers {

  setup(app, path) {
    this.app = app;
    this.opcuaServers = [];
  }

  async create(data, params) {
    // Get id
    const id = data.params.serverInfo.applicationName;
    if (isOpcuaServerInList(this, id)) {
      throw new errors.BadRequest(`The opcua server already exists for this id = '${id}' in the server list`);
    }
    // Create OPC-UA server
    const server = new OpcuaServer(this.app, data.params);
    // Server create
    await server.create();
    // Server constructAddressSpace
    server.constructAddressSpace();
    // Server start
    await server.start();
    // Add opcuaServer to server list
    const opcuaServer = {
      id: server.getServerInfo().applicationName,
      server,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
    this.opcuaServers.push(opcuaServer);
    // Get result
    const result = params.provider ? Object.assign({}, opcuaServer, getServerForProvider(opcuaServer.server)) : opcuaServer;
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
    data.action = 'create';
    const result = await this.create(data);
    return result;
  }

  async patch(id, data, params) {
    await this.remove(id);
    data.action = 'create';
    const result = await this.create(data);
    return result;
  }

  // OPC-UA server remove
  async remove(id, params) {
    let opcuaServer;
    opcuaServer = await this.get(id);
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
