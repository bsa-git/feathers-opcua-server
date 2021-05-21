/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const debug = require('debug')('app:opcua-user-manager');
const isDebug = false;

/**
 * @method isValidUser
 * @param {Object} app 
 * @returns {Boolean} 
 */
const isValidUser = ( userName, password ) => {
  console.log(chalk.green('Server userManager: OK'), 'userName:', chalk.cyan(userName), 'password:', chalk.cyan(password));
  return true;
};


module.exports = {
  isValidUser,
};
