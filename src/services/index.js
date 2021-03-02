const users = require('./users/users.service.js');
const messages = require('./messages/messages.service.js');
const opcuaServers = require('./opcua-servers/opcua-servers.service');
const opcuaClients = require('./opcua-clients/opcua-clients.service.js');
const mssqlTags = require('./mssql-tags/mssql-tags.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(users);
  app.configure(messages);
  app.configure(opcuaServers);
  app.configure(opcuaClients);
  app.configure(mssqlTags);
};
