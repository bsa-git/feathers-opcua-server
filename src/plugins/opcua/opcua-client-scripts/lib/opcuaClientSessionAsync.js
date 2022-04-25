/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const { OPCUAClient } = require('node-opcua');

const isDebug = false;

async function opcuaClientSessionAsync(endpointUrl, params, callback) {
  let result = null;
  //----------------
  // Run script
  const client = OPCUAClient.create({ endpointMustExist: false });
  await client.withSessionAsync(endpointUrl, async (session) => {
    result = await callback(session, params);
    if (isDebug && result) inspector('opcuaClientSessionAsync.result:', result);
  });
  return result;
}

module.exports = opcuaClientSessionAsync;