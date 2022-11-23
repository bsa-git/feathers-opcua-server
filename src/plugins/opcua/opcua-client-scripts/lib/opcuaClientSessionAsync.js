/* eslint-disable no-unused-vars */
const url = require('url');

const {
  appRoot,
  logger,
  inspector,
  isString
} = require('../../../lib');

const {
  getSecurityMode,
  getSecurityPolicy
} = require('../../../opcua/opcua-helper');

const {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  UserTokenType
} = require('node-opcua');

const loMerge = require('lodash/merge');
const chalk = require('chalk');

const defaultClientOptions = require(`${appRoot}/src/api/opcua/config/OPCUA_ClientOptions`);
const clientEndpointWithUserIdentity = require(`${appRoot}/src/api/opcua/config/ClientEndpointWithUserIdentity`);
defaultClientOptions.securityMode = MessageSecurityMode.SignAndEncrypt;
defaultClientOptions.securityPolicy = SecurityPolicy.Basic256Sha256;


const isDebug = false;

/**
 * @async
 * @method opcuaClientSessionAsync
 * @param {String} endpointUrl 
 * @param {Object} params 
 * @param {Function} callback 
 * @returns {Object|Object[]}
 */
async function opcuaClientSessionAsync(endpointUrl, params, callback) {
  let result = null, msg = '';
  //----------------
  // Check endpointUrl
  url.parse(endpointUrl);

  // OPCUAClient create
  const clientParams = loMerge({}, defaultClientOptions, params.clientParams ? params.clientParams : {});
  const opcuaClient = OPCUAClient.create(clientParams);
  const applicationUri = opcuaClient._applicationUri;
  opcuaClient.on('backoff', () => logger.error(`Backoff: trying to connect to ${endpointUrl}`));
  // Show messages
  console.log(chalk.yellow('Client connected to:'), chalk.cyan(endpointUrl));
  console.log(chalk.yellow('Client applicationUri:'), chalk.cyan(applicationUri));
  console.log(chalk.yellow('Client securityMode:'), chalk.cyan(getSecurityMode(clientParams.securityMode)));
  console.log(chalk.yellow('Client securityPolicy:'), chalk.cyan(getSecurityPolicy(clientParams.securityPolicy)));
  
  // Get sessParams 
  const userIdentityType = (params.userIdentityInfo && params.userIdentityInfo.type) ? params.userIdentityInfo.type : UserTokenType.Anonymous;
  const sessParams = (userIdentityType === UserTokenType.Anonymous) ? endpointUrl : { endpointUrl, userIdentity: params.userIdentityInfo };
  if(isDebug && sessParams) console.log('opcuaClient.withSessionAsync.sessParams:', sessParams);
  
  // Create sessionAsync
  await opcuaClient.withSessionAsync(sessParams, async (session) => {
    
    // Show mesage
    if(!isString(sessParams) && params.userIdentityInfo.type === UserTokenType.UserName){
      msg = `user: "${params.userIdentityInfo.userName}" is authenticated`;
    } else {
      msg = 'user: "Anonymous"';
    }
    console.log(chalk.yellow('Client session is created.'), chalk.cyan(msg));
    
    // Run callback
    result = await callback(session, params);
    if (isDebug && result) inspector('opcuaClientSessionAsync.result:', result);
    session.close();
  });
  return result;
}

module.exports = opcuaClientSessionAsync;