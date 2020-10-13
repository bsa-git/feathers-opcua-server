// const { Service } = require('feathers-nedb');

class OpcuaServers {
  constructor(options, app) {
    this.app = app;
    this.options = options;
    this.opcuaServers = [];
  }

  async find () {
    // Just return all our messages
    return this.opcuaServers;
  }

  async get(id, params) {
    return this.opcuaServers.find(srv => srv.id === id);
  }

  async create (data) {
    const opcuaServer = {
      id: data.id,
      params: data.params
    }

    this.opcuaServers.push(opcuaServer);

    return opcuaServer;
  }

  async update(id, data, params) {

  }

  async patch(id, data, params) {

  }

  async remove(id, params) {
    
  }

  // setup(app, path) {
  //   this.app = app;
  // }
}

exports.OpcuaServers = OpcuaServers;
