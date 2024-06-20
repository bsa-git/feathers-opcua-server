#!/usr/bin/env node
/* eslint-disable no-unused-vars */
/* eslint-disable max-statements */
/* eslint no-process-exit: 0 */

// Overview of the client script
// The script will be organised around the following four steps:
//--------------------------------------------------------------
/**
  _"declaration"

  _"client instantiation"

  _"setting up a series of asynchronous operations"

  // We'll setup a skeleton for the general schedule of the clients life-cycle with placeholders 
  // for the actual functions. The async.series function will execute all tasks in order of their definition, 
  // so we can assume the connection is established before creating a session for example. 
  // After all tasks are done the client will disconnect.
  //-------------------------------------------------------------------------------------------------

_"utility function"

async function main() {
  try {
    // step 1 : connect to
    _"Connection"

    // step 2 : createSession
    _"create session"

    // step 3 : browse
    _"browsing the root folder"

    // step 4 : read a variable with readVariableValue
    _"read a variable with readVariableValue"

    // step 4' : read a variable with read
    _"read a variable with read"

    // step 5: install a subscription and install a monitored item for 10 seconds
    _"install a subscription"

    // step 6: finding the nodeId of a node by Browse name
    _"finding the nodeId of a node by Browse name"

    // close session
    _"closing session"

    // disconnecting
    _"disconnecting"
  } catch(err) {
    console.log("An error has occurred : ",err);
  }
}
main();

 */


const os = require('os');
const {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  makeBrowsePath,
  ClientSubscription,
  TimestampsToReturn,
  MonitoringParametersOptions,
  ReadValueIdOptions,
  ClientMonitoredItem,
  DataValue
} = require('node-opcua');
const chalk = require('chalk');

// Setting up a series of asynchronous operations
const connectionStrategy = {
  initialDelay: 1000,
  maxRetry: 1
};

// Utility function
async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async function sample_client() {
  // Let's use un-secure connection by setting securityMode to None and securityPolicy to None.
  const client = OPCUAClient.create({
    applicationName: 'MyClient',
    connectionStrategy: connectionStrategy,
    securityMode: MessageSecurityMode.None,
    securityPolicy: SecurityPolicy.None,
    endpointMustExist: false
  });
  //const endpointUrl = "opc.tcp://opcuademo.sterfive.com:26543";
  const endpointUrl = 'opc.tcp://' + os.hostname() + ':4334/UA/MyLittleServer';

  // Connection
  await client.connect(endpointUrl);
  console.log(chalk.yellow('Connected!'));

  // Create session
  const session = await client.createSession();
  console.log(chalk.yellow('Session created!'));

  // Browsing the root folder
  //-------------------------
  // We can browse the RootFolder to receive a list of all of it's child nodes. 
  // With the references object of the browseResult we are able to access all attributes. 
  // Let's print the browseName of all the nodes.
  const browseResult = await session.browse('RootFolder');

  console.log(chalk.yellow('references of RootFolder :'));
  for (const reference of browseResult.references) {
    console.log('   -> ', reference.browseName.toString());
  }

  // Read a variable
  //--------------------------
  // To read a specific VariableType node we construct a ReadValueId object with the two 
  // parameters nodeId and attributeId to tell the read function what we want it to do.
  // The first tells it the exact node, the latter which attribute we want to obtain. 
  // The possible values provided by the SDK are enumerated within the AttributeIds enumeration. 
  // Each field contains the OPC-UA compliant AttributeId that is defined by the OPC-UA standard.
  const maxAge = 0;
  let nodeToRead = {
    nodeId: 'ns=1;s=MyVariable1',
    attributeId: AttributeIds.Value
  };
  let dataValue = await session.read(nodeToRead, maxAge);
  console.log(chalk.yellow('MyVariable1:'), dataValue.toString());

  nodeToRead = {
    nodeId: 'ns=1;s=MyVariable2',
    attributeId: AttributeIds.Value
  };
  dataValue = await session.read(nodeToRead, maxAge);
  console.log(chalk.yellow('MyVariable2:'), dataValue.toString());

  // Read a variable with readVariableValue
  //---------------------------------------
  // It is also possible to directly access a variables value with it's nodeId 
  // through the readVariableValue function. See the SDK reference for more simplified access functions.
  const dataValue3 = await session.read({
    nodeId: 'ns=1;s=FreeMemory',
    attributeId: AttributeIds.Value
  });
  console.log(chalk.yellow('FreeMemory = '), dataValue3.toString());

  // Finding the nodeId of a node by Browse name
  //--------------------------------------------
  // If the nodeId is unknown it may be obtained through browsing for it.
  let browsePath = makeBrowsePath(
    'RootFolder',
    '/Objects/Server.ServerStatus.BuildInfo.ProductName'
  );
  
  let result = await session.translateBrowsePath(browsePath);
  let targetId = result.targets[0].targetId;
  console.log(chalk.yellow('productName (NodeId) = '), targetId.toString());


  browsePath = makeBrowsePath(
    'RootFolder',
    '/Objects/Server'
  );
  
  result = await session.translateBrowsePath(browsePath);
  for (const target of result.targets) {
    targetId = target.targetId;
    console.log(chalk.yellow('RootFolder/Objects/Server (NodeId) = '), targetId.toString());
  }
  
  // Install a subscription
  //-----------------------
  // OPC-UA allows for subscriptions to it's objects instead of polling for changes. 
  // You'll create a subscription from session with a parameter object. 
  // Next you'll define a Timeout for the subscription to end and hook into several subscription events like "started". 
  // When defining an actual monitor object you again use the nodeId as well as the attributeId you want to monitor. 
  // The monitor object again allows for hooks into it's event system.
  const subscription = ClientSubscription.create(session, {
    requestedPublishingInterval: 1000,
    requestedLifetimeCount: 100,
    requestedMaxKeepAliveCount: 10,
    maxNotificationsPerPublish: 100,
    publishingEnabled: true,
    priority: 10
  });
  
  subscription
    .on('started', function() {
      console.log(
        chalk.yellow('Subscription started for 2 seconds - subscriptionId='),
        subscription.subscriptionId
      );
    })
    .on('keepalive', function() {
      console.log(chalk.yellow('keepalive'));
    })
    .on('terminated', function() {
      console.log(chalk.yellow('Terminated'));
    });
  
  // Install monitored item
  const itemToMonitor = {
    nodeId: 'ns=1;s=FreeMemory',
    attributeId: AttributeIds.Value
  };
  const parameters = {
    samplingInterval: 100,
    discardOldest: true,
    queueSize: 10
  };
  
  const monitoredItem = ClientMonitoredItem.create(
    subscription,
    itemToMonitor,
    parameters,
    TimestampsToReturn.Both
  );
  
  monitoredItem.on('changed', (dataValue) => {
    console.log(chalk.yellow('FreeMemory:'), dataValue.value.toString());
  });
  
  await timeout(10000);
  
  console.log(chalk.yellow('Now terminating subscription'));
  await subscription.terminate();


  // Closing session
  await session.close();

  // Disconnecting
  await client.disconnect();
  console.log(chalk.yellow('Done!'));



})();
