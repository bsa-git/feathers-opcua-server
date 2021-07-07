/* eslint-disable no-unused-vars */
// const { canServiceRun } = require('../plugins');

const chatMessages = require('./chat-messages/chat-messages.service');
const logMessages = require('./log-messages/log-messages.service');
const messages = require('./messages/messages.service.js');
const mssqlDatasets = require('./mssql-datasets/mssql-datasets.service');
const opcuaClients = require('./opcua-clients/opcua-clients.service');
const opcuaServers = require('./opcua-servers/opcua-servers.service');
const opcuaTags = require('./opcua-tags/opcua-tags.service');
const opcuaValues = require('./opcua-values/opcua-values.service');
const roles = require('./roles/roles.service');
const teams = require('./teams/teams.service');
const userProfiles = require('./user-profiles/user-profiles.service');
const userTeams = require('./user-teams/user-teams.service');
const users = require('./users/users.service.js');

module.exports = function (app) {
  app.configure(chatMessages);
  app.configure(logMessages);
  app.configure(messages);
  app.configure(mssqlDatasets);
  app.configure(opcuaClients);
  app.configure(opcuaServers);
  app.configure(opcuaTags);
  app.configure(opcuaValues);
  app.configure(roles);
  app.configure(teams);
  app.configure(userProfiles);
  app.configure(userTeams);
  app.configure(users);
  
};
