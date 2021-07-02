/* eslint-disable no-unused-vars */
// const { canServiceRun } = require('../plugins');

const chatMessages = require('./chat-messages/chat-messages.service');
const logMessages = require('./log-messages/log-messages.service');
const messages = require('./messages/messages.service.js');
const mssqlDatasets = require('./mssql-datasets/mssql-datasets.service');
const opcuaClients = require('./opcua-clients/opcua-clients.service');
const opcuaServers = require('./opcua-servers/opcua-servers.service');
const opcuaTags = require('./opcua-tags/opcua-tags.service');
const roles = require('./roles/roles.service');
const teams = require('./teams/teams.service');
const userProfiles = require('./user-profiles/user-profiles.service');
const userTeams = require('./user-teams/user-teams.service');
const users = require('./users/users.service.js');

module.exports = function (app) {
  // const dirTree = require('directory-tree');
  // const treeList = dirTree(__dirname).children.filter(child => child.type === 'directory').map(child => child.name);
  // if(isDebug) debug('serviceDirTree:', treeList);
  // for (let index = 0; index < treeList.length; index++) {
  //   const serviceName = treeList[index];
  //   if (canServiceRun(serviceName)) {
  //     if(isDebug) debug(`canServiceRun.${serviceName}: OK`);
  //     const service = require(`./${serviceName}/${serviceName}.service.js`);
  //     app.configure(service);
  //   }
  // }

  app.configure(chatMessages);
  app.configure(logMessages);
  app.configure(messages);
  app.configure(mssqlDatasets);
  app.configure(opcuaClients);
  app.configure(opcuaServers);
  app.configure(opcuaTags);
  app.configure(roles);
  app.configure(teams);
  app.configure(userProfiles);
  app.configure(userTeams);
  app.configure(users);
  
};
