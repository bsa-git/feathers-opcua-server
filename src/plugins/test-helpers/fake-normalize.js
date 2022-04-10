/* eslint-disable no-unused-vars */
const {
  readJsonFileSync,
  writeJsonFileSync,
  inspector,
  appRoot
} = require('../lib');
const {
  dbNullIdValue,
  getEnvTypeDB,
  getIdField
} = require('../db-helpers');
const Auth = require(`${appRoot}/src/plugins/auth/auth-server.class`);
const chalk = require('chalk');

const result = require('dotenv').config();
if (result.error) {
  throw result.error;
}

const isDebug = false;
const isLog = false;

const prefixMongodbIds = '60af3870';
const countMongodbId = 24;
const countNedbId = 16;

// Get json log data
const jsonLogData = readJsonFileSync(`${appRoot}/src/api/app/log-messages/app-log-msg.json`) || {};
const getLogData = (name) => {
  return jsonLogData.filter(item => !item.isConfig).find(item => item.name === name);
};
const logData = getLogData('TEST');

/**
 * @name idsUpdate
 * @param {Object[]} fakeData 
 * @returns {Object[]}
 */
const idsUpdate = (fakeData = []) => {
  const fakeDataUpdated = [], idField = getIdField(fakeData);
  for (let index = 0; index < fakeData.length; index++) {
    const element = fakeData[index];
    const length = element[idField].length;
    if (getEnvTypeDB() === 'mongodb' && length === countNedbId) {
      element[idField] = prefixMongodbIds + element[idField];
      fakeDataUpdated.push(element);
    }
    if (getEnvTypeDB() === 'nedb' && length === countMongodbId) {
      const delta = countMongodbId - countNedbId;
      element[idField] = element[idField].slice(delta);
      fakeDataUpdated.push(element);
    }
  }
  return fakeDataUpdated.length ? fakeDataUpdated : fakeData;
};

// Get generated fake data
let fakeData = readJsonFileSync(`${appRoot}/seeds/fake-data.json`) || {};

let fakeDataUsers = fakeData['users'];
fakeDataUsers = idsUpdate(fakeDataUsers);
let fakeDataUser = fakeDataUsers[0];
let fakeDataUser2 = fakeDataUsers[1];
let fakeDataUser3 = fakeDataUsers[2];
let idFieldUser = 'id' in fakeDataUser ? 'id' : '_id';

let fakeDataRoles = fakeData['roles'];
fakeDataRoles = idsUpdate(fakeDataRoles);
let fakeDataRole = fakeDataRoles[0];
let idFieldRole = 'id' in fakeDataRole ? 'id' : '_id';

let fakeDataTeams = fakeData['teams'];
fakeDataTeams = idsUpdate(fakeDataTeams);
let fakeDataTeam = fakeDataTeams[0];
let idFieldTeam = 'id' in fakeDataTeam ? 'id' : '_id';

let fakeDataUserTeams = fakeData['userTeams'];
fakeDataUserTeams = idsUpdate(fakeDataUserTeams);

let fakeDataUserProfiles = fakeData['userProfiles'];
fakeDataUserProfiles = idsUpdate(fakeDataUserProfiles);
let fakeDataUserProfile = fakeDataUserProfiles[0];
let idFieldUserProfile = 'id' in fakeDataUserProfile ? 'id' : '_id';

let fakeDataLogMessages = fakeData['logMessages'];
fakeDataLogMessages = idsUpdate(fakeDataLogMessages);

let fakeDataChatMessages = fakeData['chatMessages'];
fakeDataChatMessages = idsUpdate(fakeDataChatMessages);

let fakeDataOpcuaTags = fakeData['opcuaTags'];
fakeDataOpcuaTags = idsUpdate(fakeDataOpcuaTags);

let fakeDataOpcuaValues = fakeData['opcuaValues'];
fakeDataOpcuaValues = idsUpdate(fakeDataOpcuaValues);

let fakeDataMessages = fakeData['messages'];
fakeDataMessages = idsUpdate(fakeDataMessages);

const rolesUpdate = () => {
  const roles = Auth.getBaseRoles();
  const roleKeys = Object.keys(Auth.getBaseRoles());
  if (isLog) inspector('fake-service.rolesUpdate.roles:', roles);
  roleKeys.forEach((key, index) => {
    fakeDataRoles[index]['alias'] = key;
    fakeDataRoles[index]['name'] = roles[key];
  });
  if (isLog) inspector('fake-service.rolesUpdate.fakeDataRoles:', fakeDataRoles);
  if (isDebug) console.log(chalk.yellow('Roles Update: Ok'));
};

const usersUpdate = () => {
  // Set  roleId for first user
  fakeDataUsers[0]['roleId'] = fakeDataRole[idFieldRole];
  fakeDataUsers[1]['roleId'] = foundGuestRole[idFieldRole];
  // Set profileId for users
  fakeDataUserProfiles.forEach((profile, index) => {
    fakeDataUsers[index]['profileId'] = profile[idFieldUserProfile];
  });
  // Set  roleId for last user
  fakeDataUsers[fakeDataUsers.length - 1]['roleId'] = foundNotAdminAndNotGuestRole[idFieldRole];

  Object.assign(fakeDataUsers, fakeDataUsers.map((user, index) => {
    const nowDate = new Date(0);
    user.loginAt = nowDate.toJSON();
    // user.avatar = `/img/avatar/people_${index + 1}.png`;
    user.active = true;
    user.isVerified = true;
    // user.verifyToken = '';
    // user.verifyShortToken = '';
    // user.verifyExpires = nowDate.toJSON();
    // user.verifyChanges = {};
    // user.resetToken = '';
    // user.resetShortToken = '';
    // user.resetExpires = nowDate.toJSON();
    return user;
  }));

  if (isLog) inspector('fake-service.usersUpdate.fakeDataUsers:', fakeDataUsers);
  if (isDebug) console.log(chalk.yellow('Users Update: Ok'));
};

const userTeamsUpdate = () => {
  fakeDataTeams.forEach((team, index) => {
    fakeDataUserTeams[index]['teamId'] = team[idFieldTeam];
  });
  fakeDataUsers.forEach((user, index) => {
    fakeDataUserTeams[index]['userId'] = user[idFieldUser];
  });
  if (isLog) inspector('fake-service.userTeamsUpdate.fakeDataUserTeams:', fakeDataUserTeams);
  if (isDebug) console.log(chalk.yellow('UserTeams Update: Ok'));
};

const logMessagesUpdate = () => {
  fakeDataLogMessages[0]['gr'] = logData.gr;
  fakeDataLogMessages[0]['pr'] = logData.pr;
  fakeDataLogMessages[0]['name'] = logData.name;
  fakeDataLogMessages[0]['msg'] = JSON.stringify({ message: 'Ullam eum enim incidunt unde omnis laborum voluptatum explicabo.' });
  fakeDataLogMessages[0]['ownerId'] = fakeDataUser[idFieldUser];
  fakeDataLogMessages[0]['userId'] = fakeDataUser[idFieldUser];
  if (isLog) inspector('fake-service.logMessagesUpdate.fakeDataLogMessages:', fakeDataLogMessages);
  if (isDebug) console.log(chalk.yellow('LogMessages Update: Ok'));
};

const chatMessagesUpdate = () => {
  fakeDataChatMessages[0]['ownerId'] = fakeDataUser[idFieldUser];
  fakeDataChatMessages[0]['roleId'] = foundNotAdminAndNotGuestRole[idFieldRole];
  fakeDataChatMessages[0]['userId'] = dbNullIdValue();
  fakeDataChatMessages[0]['teamId'] = dbNullIdValue();
  fakeDataChatMessages[1]['ownerId'] = fakeDataUser[idFieldUser];
  fakeDataChatMessages[1]['teamId'] = fakeDataTeam[idFieldTeam];
  fakeDataChatMessages[1]['userId'] = dbNullIdValue();
  fakeDataChatMessages[1]['roleId'] = dbNullIdValue();
  fakeDataChatMessages[2]['ownerId'] = fakeDataUser[idFieldUser];
  fakeDataChatMessages[2]['userId'] = fakeDataUser2[idFieldUser];
  fakeDataChatMessages[2]['teamId'] = dbNullIdValue();
  fakeDataChatMessages[2]['roleId'] = dbNullIdValue();
  fakeDataChatMessages[3]['ownerId'] = fakeDataUser[idFieldUser];
  fakeDataChatMessages[3]['userId'] = fakeDataUser3[idFieldUser];
  fakeDataChatMessages[3]['teamId'] = dbNullIdValue();
  fakeDataChatMessages[3]['roleId'] = dbNullIdValue();

  if (isLog) inspector('fake-service.chatMessagesUpdate.fakeDataChatMessages:', fakeDataChatMessages);
  if (isDebug) console.log(chalk.yellow('ChatMessages Update: Ok'));
};

const opcuaValuesUpdate = () => {
  fakeDataOpcuaTags.forEach((tag, index) => {
    if(index > 0){
      fakeDataOpcuaValues[index - 1]['tagId'] = tag[idFieldUser];
    }
  });
  if (isLog) inspector('fake-service.opcuaValuesUpdate.fakeDataOpcuaValues:', fakeDataOpcuaValues);
  if (isDebug) console.log(chalk.yellow('OpcuaValues Update: Ok'));
};

const messagesUpdate = () => {
  fakeDataUsers.forEach((user, index) => {
    fakeDataMessages[index]['userId'] = user[idFieldUser];
  });
  if (isLog) inspector('fake-service.messagesUpdate.fakeDataMessages:', fakeDataMessages);
  if (isDebug) console.log(chalk.yellow('Messages Update: Ok'));
};

const fakeDataUpdate = (isWrite) => {
  Object.assign(fakeData, {
    users: fakeDataUsers,
    roles: fakeDataRoles,
    teams: fakeDataTeams,
    userTeams: fakeDataUserTeams,
    userProfiles: fakeDataUserProfiles,
    logMessages: fakeDataLogMessages,
    chatMessages: fakeDataChatMessages,
    opcuaTags: fakeDataOpcuaTags,
    opcuaValues: fakeDataOpcuaValues,
    messages: fakeDataMessages
  });
  if (isWrite) {
    writeJsonFileSync(`${appRoot}/seeds/fake-data.json`, fakeData);
  }
};

if (isDebug) console.log(chalk.yellow('Start: Fake-Service!'));
// Services fake data update
rolesUpdate();

// Found guest role
const foundGuestRole = fakeDataRoles.find(function (role) {
  return (role.name === Auth.getRoles('isGuest'));
});

// Found not admin and not guest role
const foundNotAdminAndNotGuestRole = fakeDataRoles.find(function (role) {
  return (role.name !== Auth.getRoles('isAdministrator')) && (role.name !== Auth.getRoles('isGuest'));
});

module.exports = function fakeNormalize(isWrite = false) {
  usersUpdate();
  userTeamsUpdate();
  logMessagesUpdate();
  chatMessagesUpdate();
  opcuaValuesUpdate();
  messagesUpdate();
  // All fake data update
  fakeDataUpdate(isWrite);
  if (isDebug) console.log(chalk.yellow('Finish: Fake-Service!'));
  return fakeData;
};
