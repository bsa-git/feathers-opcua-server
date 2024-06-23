/* eslint-disable no-unused-vars */
const assert = require('assert');
const os = require('os');
const chalk = require('chalk');
const {
  OPCUAServer,
  Variant,
  DataType,
  StatusCodes,
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

let server = null, client = null, session = null, subscription = null;

// srvParams
const port = 4334;
const srvParams = {
  port, // the port of the listening socket of the server
  resourcePath: '/UA/MyLittleServer', // this path will be added to the endpoint resource name 
  buildInfo: {
    productName: 'MySampleServer1',
    buildNumber: '7658',
    buildDate: new Date(2014, 5, 2)
  }
};

// Setting up a series of asynchronous operations
const connectionStrategy = {
  initialDelay: 1000,
  maxRetry: 1
};

// Utility function
async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * returns the percentage of free memory on the running machine
 * @return {double}
 */
function available_memory() {
  // var value = process.memoryUsage().heapUsed / 1000000;
  const percentageMemUsed = os.freemem() / os.totalmem() * 100.0;
  return percentageMemUsed;
}


describe('<<=== OPC-UA: Test (sample-opcua.test) ===>>', () => {

  before(async () => {
    console.log(chalk.white('<<=== START: Test (sample-opcua.test) ===>>'));
  });

  after(async () => {
    if (client !== null) client = null;
    if (server !== null) server = null;
    console.log(chalk.white('<<=== END: Test (sample-opcua.test) ===>>'));
  });

  it('#1: Server object created', async () => {
    // Let's create an instance of OPCUAServer
    server = new OPCUAServer(srvParams);
    console.log(chalk.yellow('OPCUAServer created'));

    // Server initialize
    await server.initialize();
    console.log(chalk.yellow('OPCUAServer initialized'));

    assert.ok(server, 'OPCUA server not created');
  });

  it('#2: Extend the default server namespace with our variables', async () => {

    // Post initialization
    // Extend the default server namespace with our variables
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();
    const device = namespace.addObject({
      organizedBy: addressSpace.rootFolder.objects,
      browseName: 'MyDevice'
    });

    // add a variable named MyVariable1 to the newly created folder "MyDevice"
    let variable1 = 1;

    // emulate variable1 changing every 500 ms
    setInterval(() => { variable1 += 1; }, 1000);

    namespace.addVariable({
      componentOf: device,
      nodeId: 'ns=1;s=MyVariable1',
      browseName: 'MyVariable1',
      dataType: 'Double',
      value: {
        get: () => new Variant({ dataType: DataType.Double, value: variable1 })
      }
    });


    // add a variable named MyVariable2 to the newly created folder "MyDevice"
    let variable2 = 10.0;

    namespace.addVariable({
      componentOf: device,
      nodeId: 'ns=1;s=MyVariable2', // some opaque NodeId in namespace 4
      browseName: 'MyVariable2',
      dataType: 'Double',
      minimumSamplingInterval: 1234, // we need to specify a minimumSamplingInterval when using a getter
      value: {
        get: () => new Variant({ dataType: DataType.Double, value: variable2 }),
        set: (variant) => {
          variable2 = parseFloat(variant.value);
          return StatusCodes.Good;
        }
      }
    });

    // Lets create a variable that expose the percentage of free memory on the running machine.
    namespace.addVariable({

      componentOf: device,
      nodeId: 'ns=1;s=FreeMemory', // a string nodeID
      browseName: 'FreeMemory',
      dataType: 'Double',
      value: {
        get: () => new Variant({ dataType: DataType.Double, value: available_memory() })
      }
    });

    assert.ok(device, 'OPCUA server not extend the default server namespace with our variables');
  });

  it('#3: Start the server', async () => {
    // Start the server
    // Once the server has been created and initialised, we use the start asynchronous method 
    //to let the server initiate all its endpoints and start listening to clients.
    await server.start();
    console.log(chalk.yellow('Server started and is now listening ...'), '( press CTRL+C to stop)');

    //  Display endpoint url
    // Once the server has been created and configured, it is possible to retrieve the endpoint url.
    const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
    console.log(chalk.yellow('The primary server endpoint url is:'), endpointUrl);

    assert.ok(endpointUrl, 'OPCUA server not start');
  });

  it('#4: OPCUA client create', async () => {
    // Let's use un-secure connection by setting securityMode to None and securityPolicy to None.
    client = OPCUAClient.create({
      applicationName: 'NodeOPCUA-Client',
      connectionStrategy: connectionStrategy,
      securityMode: MessageSecurityMode.SignAndEncrypt,
      securityPolicy: SecurityPolicy.Basic256Sha256,
      endpointMustExist: false
    });

    assert.ok(client, 'OPCUA client not created');
  });

  it('#5: OPCUA client connect', async () => {

    const endpointUrl = 'opc.tcp://' + os.hostname() + `:${srvParams.port}${srvParams.resourcePath}`;
    // Connection
    await client.connect(endpointUrl);
    console.log(chalk.yellow('OPCUA client connected!'));

    assert.ok(true, 'OPCUA client not connect');
  });

  it('#6: OPCUA client create session', async () => {

    // Create session
    session = await client.createSession();
    console.log(chalk.yellow('OPCUA client session created!'));

    assert.ok(session, 'OPCUA client not create session');
  });

  it('#7: OPCUA client browsing the root folder', async () => {

    // We can browse the RootFolder to receive a list of all of it's child nodes. 
    // With the references object of the browseResult we are able to access all attributes. 
    // Let's print the browseName of all the nodes.
    const browseResult = await session.browse('RootFolder');

    console.log(chalk.yellow('references of RootFolder :'));
    for (const reference of browseResult.references) {
      console.log('   -> ', reference.browseName.toString());
    }

    assert.ok(browseResult, 'OPCUA client not browsing the root folder');
  });

  it('#8: OPCUA client read a variable', async () => {

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

    assert.ok(dataValue, 'OPCUA client not read a variable');

    nodeToRead = {
      nodeId: 'ns=1;s=MyVariable2',
      attributeId: AttributeIds.Value
    };
    dataValue = await session.read(nodeToRead, maxAge);
    console.log(chalk.yellow('MyVariable2:'), dataValue.toString());

    assert.ok(dataValue, 'OPCUA client not read a variable');

    // Read a variable with readVariableValue
    //---------------------------------------
    // It is also possible to directly access a variables value with it's nodeId 
    // through the readVariableValue function. See the SDK reference for more simplified access functions.
    dataValue = await session.read({
      nodeId: 'ns=1;s=FreeMemory',
      attributeId: AttributeIds.Value
    });
    console.log(chalk.yellow('FreeMemory = '), dataValue.toString());

    assert.ok(dataValue, 'OPCUA client not read a variable');
  });

  it('#9: OPCUA client finding the nodeId of a node by Browse name', async () => {

    // If the nodeId is unknown it may be obtained through browsing for it.
    let browsePath = makeBrowsePath(
      'RootFolder',
      '/Objects/Server.ServerStatus.BuildInfo.ProductName'
    );

    let result = await session.translateBrowsePath(browsePath);
    let targetId = result.targets[0].targetId;
    console.log(chalk.yellow('productName (NodeId) = '), targetId.toString());

    assert.ok(targetId, 'OPCUA client not finding the nodeId of a node by Browse name');

    browsePath = makeBrowsePath(
      'RootFolder',
      '/Objects/Server'
    );

    result = await session.translateBrowsePath(browsePath);
    for (const target of result.targets) {
      targetId = target.targetId;
      console.log(chalk.yellow('RootFolder/Objects/Server (NodeId) = '), targetId.toString());
    }

    assert.ok(targetId, 'OPCUA client not finding the nodeId of a node by Browse name');
  });

  it('#10: OPCUA client install a subscription', async () => {

    // OPC-UA allows for subscriptions to it's objects instead of polling for changes. 
    // You'll create a subscription from session with a parameter object. 
    // Next you'll define a Timeout for the subscription to end and hook into several subscription events like "started". 
    // When defining an actual monitor object you again use the nodeId as well as the attributeId you want to monitor. 
    // The monitor object again allows for hooks into it's event system.
    subscription = ClientSubscription.create(session, {
      requestedPublishingInterval: 1000,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10
    });

    subscription
      .on('started', function () {
        console.log(
          chalk.yellow('Subscription started for 2 seconds - subscriptionId='),
          subscription.subscriptionId
        );
      })
      .on('keepalive', function () {
        console.log(chalk.yellow('keepalive'));
      })
      .on('terminated', function () {
        console.log(chalk.yellow('OPCUA client subscription terminated'));
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

    assert.ok(subscription, 'OPCUA client not install a subscription');
  });


  it('#11: OPCUA client Done', async () => {

    await timeout(10000);

    // Subscription terminate
    await subscription.terminate();

    // Closing session
    await session.close();

    // Disconnecting
    await client.disconnect();
    console.log(chalk.yellow('OPCUA client done!'));

    assert.ok(true, 'OPCUA client not done');
  });

  it('#12: Shutdown opc-ua server', async () => {
    const timeout = 1000;
    if (timeout) await server.shutdown(timeout);
    else await server.shutdown();
    if (timeout) console.log(chalk.yellow('Server shutdown'), 'Timeout:', chalk.cyan(`${timeout} Msec.`));
    else console.log(chalk.yellow('Server shutdown.'));

    assert.ok(true, 'OPCUA server not created');
  });

});