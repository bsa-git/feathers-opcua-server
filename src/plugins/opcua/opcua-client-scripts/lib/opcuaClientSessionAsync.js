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

/**
 node opcua - Need example on how a client can get all the variables for a given UAObject node ID
 -----------------------------------------------------------------------------------------------
const { OPCUAClient, NodeClass } = require("node-opcua");

const nodeId = "ns=0;i=2253"; // RootFolder.Objects.Server
const endpointUri = "opc.tcp://localhost:48010";

(async () => {

    const client = OPCUAClient.create({ endpoint_must_exist: false});
    client.on("backoff", () => console.log("Backoff: trying to connect to ", endpointUri));

    await client.withSessionAsync(endpointUri, async (session) => {
        let browseResult = await session.browse({
            nodeId,
            nodeClassMask: NodeClass.Variable, // we only want sub node that are Variables
            resultMask: 63 // extract all information possible 
        });
        console.log("BrowseResult = ", browseResult.toString());
    });
})();
 */

module.exports = opcuaClientSessionAsync;