/* eslint-disable no-unused-vars */
const { isMyIp } = require('../plugins/lib/net-operations');

console.log('isMyFile:', __filename);

const users = require('./users/users.service.js');
const messages = require('./messages/messages.service.js');
const opcuaServers = require('./opcua-servers/opcua-servers.service');
const opcuaClients = require('./opcua-clients/opcua-clients.service.js');
// if(isMyIp(['10.60.1.220'])) {
  
// } 
module.exports = function (app) {
  app.configure(users);
  app.configure(messages);
  app.configure(opcuaServers);
  app.configure(opcuaClients);
  if(isMyIp(['10.60.1.220'])) {
    const mssqlTags = require('./mssql-tags/mssql-tags.service.js');
    app.configure(mssqlTags);
  } 
};
