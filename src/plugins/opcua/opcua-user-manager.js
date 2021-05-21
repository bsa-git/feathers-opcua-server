/* eslint-disable no-unused-vars */
const chalk = require('chalk');
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
  // Check user credentials
  result = (process.env.OPCUA_USER_NAME === userName && process.env.OPCUA_USER_PASS === password) || 
  (process.env.OPCUA_ADMIN_NAME === userName && process.env.OPCUA_ADMIN_PASS === password);
  console.log(chalk.green(`Server userManager.isValidUser: ${result? 'OK' : 'ERR'} `), 'userName:', chalk.cyan(userName), 'password:', chalk.cyan(password));
  return result;
};


module.exports = {
  isValidUser,
};
