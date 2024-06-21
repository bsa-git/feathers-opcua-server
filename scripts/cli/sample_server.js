#!/usr/bin/env node
/* eslint-disable no-unused-vars */
/* eslint-disable max-statements */
/* eslint no-process-exit: 0 */

/**
    // In this example, we want to create a OPCUA Server that exposes 3 read/write variables
    // The server will expose the variable under a new object named "MyDevice".
    //---------------------------------------------------------------------------------------
        + RootFolder
        + Objects
            + MyDevice
                + MyVariable1
                + MyVariable2
    
    // The script will be organised around the following four steps:
    _"declaration"


    (async ()=>{

        _"server instantiation"
        _"server initialization"

    })();

 */

const os = require('os');
const { OPCUAServer, Variant, DataType, StatusCodes } = require('node-opcua');
const chalk = require('chalk');

/**
 * returns the percentage of free memory on the running machine
 * @return {double}
 */
function available_memory() {
  // var value = process.memoryUsage().heapUsed / 1000000;
  const percentageMemUsed = os.freemem() / os.totalmem() * 100.0;
  return percentageMemUsed;
}

(async function sample_server() {
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
  // Let's create an instance of OPCUAServer
  const server = new OPCUAServer(srvParams);

  // Server initialize
  await server.initialize();
  console.log(chalk.yellow('Initialized'));

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

  // Start the server
  // Once the server has been created and initialised, we use the start asynchronous method 
  //to let the server initiate all its endpoints and start listening to clients.
  await server.start();
  console.log(chalk.yellow('Server started and is now listening ...'), '( press CTRL+C to stop)');

  //  Display endpoint url
  // Once the server has been created and configured, it is possible to retrieve the endpoint url.
  const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
  console.log(chalk.yellow('The primary server endpoint url is:'), endpointUrl);
  console.log(chalk.yellow('Port: '), port);
})();
