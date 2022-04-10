const errors = require('@feathersjs/errors');
const {inspector, appRoot, readJsonFileSync} = require('../lib');
const {dbNullIdValue} = require('../db-helpers');
const AuthServer = require('../auth/auth-server.class');
const HookHelper = require('./hook-helper.class');
const debug = require('debug')('app:plugins.getLogMessage');

const isDebug = false;
const isLog = false;

/**
 * Get log message
 * @param context
 * @return {Promise.<void>}
 */
module.exports = async function getLogMessage(context) {
  // Create HookHelper object
  const hookHelper = new HookHelper(context);

  let payload, logData, idField, msg, userId, ownerId, user, team, result, action, mailerData;
  const loHasProp = require('lodash/has');
  const loKebabCase = require('lodash/kebabCase');
  // Get json log data
  const jsonLogData = readJsonFileSync([appRoot, 'src/api/app/log-messages/app-log-msg.json']) || {};
  const getLogData = (name) => {
    return jsonLogData.filter(item => !item.isConfig).find(item => item.name === name);
  };
  const configLogData = jsonLogData.find(item => item.isConfig);

  //----- LOG MESSAGE ---//
  switch (`${hookHelper.contextPath}.${hookHelper.contextMethod}.${hookHelper.contextType}`) {
  // User login
  case 'authentication.create.after':
    logData = getLogData('LOGIN');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    payload = hookHelper.contextPayload;
    if(!payload){
      throw new errors.BadRequest('There is no payload');
    }

    user = await hookHelper.getItem('users', payload.userId);
    // debug('getLogMsg.user:', user);
    msg = {email: user['email'], fullName: `${user['firstName']} ${user['lastName']}`};
    result = {gr: logData.gr, pr: logData.pr, name: logData.name, ownerId: payload.userId, userId: payload.userId, msg: JSON.stringify(msg)};
    break;
    // User logout
  case 'authentication.remove.after':
    logData = getLogData('LOGOUT');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    payload = await AuthServer.verifyJWT(hookHelper.contextAccessToken);
    if(!payload){
      throw new errors.BadRequest('There is no payload');
    }
    user = await hookHelper.getItem('users', payload.userId);
    msg = {email: user['email'], fullName: `${user['firstName']} ${user['lastName']}`};
    result = {gr: logData.gr, pr: logData.pr, name: logData.name, ownerId: payload.userId, userId: payload.userId, msg: JSON.stringify(msg)};
    break;
    // Create user
  case 'users.create.after':
    logData = getLogData('USER-CREATE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextResult);
    ownerId = hookHelper.contextUser ? hookHelper.contextUser[idField] : hookHelper.contextResult[idField];
    userId = hookHelper.contextResult[idField];
    msg = {
      email: hookHelper.contextResult['email'],
      fullName: `${hookHelper.contextResult['firstName']} ${hookHelper.contextResult['lastName']}`
    };
    result = {gr: logData.gr, pr: logData.pr, name: logData.name, ownerId, userId, msg: JSON.stringify(msg)};
    break;
    // Remove user
  case 'users.remove.after':
    logData = getLogData('USER-REMOVE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    // idField = HookHelper.getIdField(hookHelper.contextUser);
    idField = HookHelper.getIdField(hookHelper.contextResult);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextResult[idField];
    msg = {
      email: hookHelper.contextResult['email'],
      fullName: `${hookHelper.contextResult['firstName']} ${hookHelper.contextResult['lastName']}`
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Change user
  case 'users.patch.after':
    logData = getLogData('USER-CHANGE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextResult[idField];
    msg = {
      email: hookHelper.contextResult['email'],
      fullName: `${hookHelper.contextResult['firstName']} ${hookHelper.contextResult['lastName']}`
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    // debug('getLogMsg.users.patch.after:', hookHelper.contextResult);
    break;
    // Change user-profile
  case 'user-profiles.patch.after':
    logData = getLogData('PROFILE-CHANGE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextUser[idField];
    msg = {
      email: hookHelper.contextUser['email'],
      fullName: `${hookHelper.contextUser['firstName']} ${hookHelper.contextUser['lastName']}`
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Create role
  case 'roles.create.after':
    logData = getLogData('ROLE-CREATE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextUser[idField];
    msg = {
      roleName: hookHelper.contextResult['name']
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Remove role
  case 'roles.remove.after':
    logData = getLogData('ROLE-REMOVE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextUser[idField];
    msg = {
      roleName: hookHelper.contextResult['name']
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Change role
  case 'roles.patch.after':
    logData = getLogData('ROLE-CHANGE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextUser[idField];
    msg = {
      roleName: hookHelper.contextResult['name']
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Create team
  case 'teams.create.after':
    logData = getLogData('TEAM-CREATE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextUser[idField];
    msg = {
      teamName: hookHelper.contextResult['name']
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Remove team
  case 'teams.remove.after':
    logData = getLogData('TEAM-REMOVE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextUser[idField];
    msg = {
      teamName: hookHelper.contextResult['name']
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Change team
  case 'teams.patch.after':
    logData = getLogData('TEAM-CHANGE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextUser[idField];
    msg = {
      teamName: hookHelper.contextResult['name']
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Create user-team
  case 'user-teams.create.after':
    logData = getLogData('USER-TEAM-CREATE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextResult['userId'];
    team = await hookHelper.getItem('teams', hookHelper.contextResult['teamId']);
    msg = {
      teamName: team['name']
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Remove user-team
  case 'user-teams.remove.after':
    logData = getLogData('USER-TEAM-REMOVE');
    if(!logData.isEnable) break;
    if(configLogData.excludeGroups.includes(logData.gr)) break;
    idField = HookHelper.getIdField(hookHelper.contextUser);
    ownerId = hookHelper.contextUser[idField];
    userId = hookHelper.contextResult['userId'];
    team = await hookHelper.getItem('teams', hookHelper.contextResult['teamId']);
    msg = {
      teamName: team['name']
    };
    result = {
      gr: logData.gr,
      pr: logData.pr,
      name: logData.name,
      ownerId,
      userId,
      msg: JSON.stringify(msg)
    };
    break;
    // Before create auth-management
  case 'auth-management.create.before':
    action = hookHelper.contextRecords.action? hookHelper.contextRecords.action : '';
    if(hookHelper.contextRecords){
      context.action = action;
    }
    break;
    // After create auth-management
  case 'auth-management.create.after':
    action = context.action? context.action : '';
    if(action){
      if(isDebug) debug('context.action:', context.action);
      const key = loKebabCase(action).toUpperCase();
      logData = getLogData(key);
      if(!logData.isEnable) break;
      if(configLogData.excludeGroups.includes(logData.gr)) break;
      idField = HookHelper.getIdField(hookHelper.contextResult);
      ownerId = hookHelper.contextResult[idField];
      userId = hookHelper.contextResult[idField];
      msg = {
        email: hookHelper.contextResult['email'],
        fullName: `${hookHelper.contextResult['firstName']} ${hookHelper.contextResult['lastName']}`
      };
      result = {
        gr: logData.gr,
        pr: logData.pr,
        name: logData.name,
        ownerId,
        userId,
        msg: JSON.stringify(msg)
      };
    }
    break;
    // Before create mailer
  case 'mailer.create.before':
    mailerData = Object.assign({}, hookHelper.contextRecords);
    if(mailerData){
      context.mailerData = mailerData;
    }
    break;
    // After create mailer
  case 'mailer.create.after':
    mailerData = context.mailerData? context.mailerData : null;
    if(mailerData){
      logData = getLogData('MAILER-CREATE');
      if(!logData.isEnable) break;
      if(configLogData.excludeGroups.includes(logData.gr)) break;
      if(mailerData.senderId){
        // mailerData.senderId = mailerData.senderId.toString();
        user = await hookHelper.getItem('users', mailerData.senderId);
        msg = {
          sender: {
            email: user['email'],
            fullName: `${user['firstName']} ${user['lastName']}`,
          },
          mailerBody: {
            from: mailerData.from,
            to: mailerData.to,
            subject: mailerData.subject,
            html: mailerData.html
          }
        };
      }else {
        msg = {
          mailerBody: {
            from: mailerData.from,
            to: mailerData.to,
            subject: mailerData.subject,
            html: mailerData.html
          }
        };
      }
      ownerId = mailerData.senderId? mailerData.senderId : dbNullIdValue();
      userId = mailerData.senderId? mailerData.senderId : dbNullIdValue();
      result = {
        gr: logData.gr,
        pr: logData.pr,
        name: logData.name,
        ownerId,
        userId,
        msg: JSON.stringify(msg)
      };
    }
    break;
    // Before create data-management
  case 'data-management.create.before':
    if(hookHelper.contextData){
      context.contextBeforeData = hookHelper.contextData;
    }
    break;
    // After create data-management
  case 'data-management.create.after':
    if(context.contextBeforeData){
      logData = getLogData('DATA-REQUEST');
      if(!logData.isEnable) break;
      if(configLogData.excludeGroups.includes(logData.gr)) break;
      if(hookHelper.contextAuthenticated){
        idField = HookHelper.getIdField(hookHelper.contextUser);
        ownerId = hookHelper.contextUser[idField];
        userId = hookHelper.contextUser[idField];
      }else {
        ownerId = dbNullIdValue();
        userId = dbNullIdValue();
      }
      msg = Object.assign({}, context.contextBeforeData);
      result = {
        gr: logData.gr,
        pr: logData.pr,
        name: logData.name,
        ownerId,
        userId,
        msg: JSON.stringify(msg)
      };
    }
    break;
  default:
    // Error
    if (hookHelper.contextError) {
      logData = getLogData('ERROR-SRV');
      if(!logData.isEnable) break;
      if(configLogData.excludeGroups.includes(logData.gr)) break;
      if (loHasProp(hookHelper.contextError, ['hook', 'params', 'user'])) {
        user = hookHelper.contextError.hook.params.user;
        idField = HookHelper.getIdField(user);
      }
      ownerId = user ? user[idField] : dbNullIdValue();
      userId = user ? user[idField] : dbNullIdValue();
      msg = {message: hookHelper.contextError.message, info: hookHelper.getDebugError()};

      result = {
        gr: logData.gr,
        pr: logData.pr,
        name: logData.name,
        ownerId,
        userId,
        msg: JSON.stringify(msg)
      };
    } else {
      result = null;
    }
  }
  // Timeout of 5000ms exceeded calling create on users
  if(isLog) inspector('plugins.getLogMessage.result:', result);
  return result;
};
