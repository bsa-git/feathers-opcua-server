/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const loStartsWith = require('lodash/startsWith');
const loEndsWith = require('lodash/endsWith');
const loReplace = require('lodash/replace');

const startsWith = 'OPCUA_';
const loginEndsWith = '_LOGIN';
const passEndsWith = '_PASS';

// startsWith
const debug = require('debug')('app:opcua-user-manager');
const isDebug = false;

/**
 * Check user credentials
 * @method isValidUser
 * @param {Object} app 
 * @returns {Boolean} 
 */
const isValidUser = ( userName, password ) => {
  let result = false;
  //---------------------
  if(!userName || !password) {
    throw new Error('Authentication error. "Login" or "Password" must not be empty!');
  }

  // Check user credentials
  const envLoginKeys = Object.keys(process.env).filter(key => loStartsWith(key, startsWith) && loEndsWith(key, loginEndsWith));
  if(isDebug && envLoginKeys) console.log('isValidUser.envLoginKeys:', envLoginKeys);
  for (let index = 0; index < envLoginKeys.length; index++) {
    const key = envLoginKeys[index];
    if(process.env[key] === userName){
      const passKey = loReplace(key, loginEndsWith, passEndsWith);
      if(process.env[passKey] === password) result = true; 
    }
  }
  if(isDebug && userName) console.log(chalk.green(`Server userManager.isValidUser: ${result? 'OK' : 'ERR'} `), 'userName:', chalk.cyan(userName), 'password:', chalk.cyan(password));
  return result;
};


module.exports = {
  isValidUser,
};
