/* eslint-disable no-unused-vars */
const url = require('url');

const {
  inspector,
} = require('../../../lib');

const logger = require('../../../../logger');

const { OPCUAClient } = require('node-opcua');

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
  let result = null;
  //----------------
  // Check endpointUrl
  url.parse(endpointUrl);

  // Run script
  const client = OPCUAClient.create({ endpointMustExist: false });
  client.on('backoff', () => logger.error(`Backoff: trying to connect to ${endpointUrl}`));
  await client.withSessionAsync(endpointUrl, async (session) => {
    result = await callback(session, params);
    if (isDebug && result) inspector('opcuaClientSessionAsync.result:', result);
    session.close();
  });
  return result;
}

module.exports = opcuaClientSessionAsync;