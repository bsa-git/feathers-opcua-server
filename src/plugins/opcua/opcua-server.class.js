/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const moment = require('moment');
const { inspector } = require('../lib');
const {
  OPCUAServer,
  Variant,
  DataType,
  nodesets,
  StatusCodes,
  VariantArrayType,
  standardUnits,
  makeAccessLevelFlag
} = require('node-opcua');
const os = require('os');
const loMerge = require('lodash/merge');
const chalk = require('chalk');

const debug = require('debug')('app:plugins.opcua-server.class');
const isLog = true;
const isDebug = false;

class OpcuaServer {
  /**
   * Constructor
   * @param app {Object}
   * @param params {Object}
   */
  constructor(app, params = {}) {
    const paramsDefault = {
      port: 26543,
      isOnSignInt: false,
      maxAllowedSessionNumber: 10,
      maxConnectionsPerEndpoint: 10,
      isAuditing: false,
      nodeset_filename: [
        nodesets.standard,
        nodesets.di
      ],
      buidIfo: {
        productName: 'NodeOPCUA Server',
        buildNumber: moment().format('X'),
        buildDate: moment().format()
      }
    };
    this.params = loMerge(paramsDefault, params);
    // this.app = Object.assign({}, app);
    this.app = app;
    this.opcuaServer = null;
  }

  /**
   * Create opc-ua server
   */
  async create() {
    try {
      // Let create an instance of OPCUAServer
      this.opcuaServer = new OPCUAServer({
        port: this.params.port,  // the port of the listening socket of the server
        nodeset_filename: this.params.nodeset_filename,
        buidIfo: this.params.buidIfo
      });

      await this.opcuaServer.initialize();
      if (isDebug) debug('certificateFile = ', this.opcuaServer.certificateFile);
      if (isDebug) debug('privateKeyFile  = ', this.opcuaServer.privateKeyFile);
      if (isDebug) debug('rejected folder = ', this.opcuaServer.serverCertificateManager.rejectedFolder);
      if (isDebug) debug('trusted  folder = ', this.opcuaServer.serverCertificateManager.trustedFolder);

      this.constructAddressSpace();

      if (this.params.isOnSignInt) {
        process.on('SIGINT', async () => {
          await this.opcuaServer.shutdown();
          console.log(chalk.yellow('Server terminated'));
        });
      }

      // OPC-UA server created.
      console.log(chalk.yellow('Server created'));
    } catch (err) {
      const errTxt = 'Error while creating the OPS-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Start opc-ua server
   */
  async start() {
    if (!this.opcuaServer) return;
    try {
      await this.opcuaServer.start();
      const endpointUrl = this.opcuaServer.endpoints[0].endpointDescriptions()[0].endpointUrl;
      console.log(chalk.yellow('Server started and now listening ...'), 'EndPoint URL:', chalk.cyan(endpointUrl));
      this.opcuaServer.endpoints[0].endpointDescriptions().forEach(function (endpoint) {
        if (isDebug) debug(endpoint.endpointUrl, endpoint.securityMode.toString(), endpoint.securityPolicyUri.toString());
      });
      const endpoints = this.opcuaServer.endpoints[0].endpointDescriptions().map(endpoint => {
        return {
          endpointUrl: endpoint.endpointUrl,
          securityMode: endpoint.securityMode.toString(),
          securityPolicyUri: endpoint.securityPolicyUri.toString()
        };
      });
      return endpoints;
    } catch (err) {
      const errTxt = 'Error while start the OPS-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Shutdown opc-ua server
   */
  shutdown() {
    if (!this.opcuaServer) return;
    try {
      this.opcuaServer.shutdown();
      console.log(chalk.yellow('Server terminated'));
    } catch (err) {
      const errTxt = 'Error while start the OPS-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
  * Construct address space
  */
  constructAddressSpace() {
    if (!this.opcuaServer) return;
    try {
      const addressSpace = this.opcuaServer.engine.addressSpace;
      const namespace = addressSpace.getOwnNamespace();

      //=== addFolder => "MyDevice" ===//
      const myDevice = namespace.addFolder('ObjectsFolder', {
        // we create a new folder 'MyDevice' under RootFolder
        browseName: 'MyDevice',
        nodeId: 's=MyDevice',
      });

      // now let's add first variable in folder
      // the addVariableInFolder
      const variable1 = 10.0;

      this.opcuaServer.nodeVariable1 = namespace.addVariable({
        componentOf: myDevice,
        nodeId: 's=MyDevice.Temperature',
        browseName: 'MyDevice.Temperature',
        displayName: 'Temperature',
        dataType: 'Double',
        value: {
          get: () => {
            const t = new Date() / 10000.0;
            const value = variable1 + 10.0 * Math.sin(t);
            return new Variant({ dataType: DataType.Double, value: value });
          }
        }
      });

      const nodeVariable2 = namespace.addVariable({
        componentOf: myDevice,
        nodeId: 's=MyDevice.MyVariable2',
        browseName: 'MyDevice.MyVariable2',
        displayName: 'My variable2',
        dataType: 'String',
      });
      nodeVariable2.setValueFromSource({
        dataType: DataType.String,
        value: 'Learn Node-OPCUA ! Read https://leanpub.com/node-opcuabyexample'
      });

      const nodeVariable3 = namespace.addVariable({
        componentOf: myDevice,
        nodeId: 's=MyDevice.MyVariable3',
        browseName: 'MyDevice.MyVariable3',
        displayName: 'My variable3',
        dataType: 'Double',
        arrayDimensions: [3],
        accessLevel: 'CurrentRead | CurrentWrite',
        userAccessLevel: 'CurrentRead | CurrentWrite',
        valueRank: 1

      });
      nodeVariable3.setValueFromSource({
        dataType: DataType.Double,
        arrayType: VariantArrayType.Array,
        value: [1.0, 2.0, 3.0]
      });


      this.opcuaServer.nodeVariable4 = namespace.addVariable({
        componentOf: myDevice,
        nodeId: 's=MyDevice.PercentageMemoryUsed',
        browseName: 'MyDevice.PercentageMemoryUsed',
        displayName: 'Percentage Memory Used',
        dataType: 'Double',
        minimumSamplingInterval: 1000,
        value: {
          get: () => {
            const percentageMemUsed = 1.0 - (os.freemem() / os.totalmem());
            const value = percentageMemUsed * 100;
            return new Variant({ dataType: DataType.Double, value: value });
          }
        }
      });

      this.opcuaServer.nodeVariableForWrite = namespace.addVariable({
        componentOf: myDevice,
        nodeId: 's=MyDevice.VariableForWrite',
        browseName: 'MyDevice.VariableForWrite',
        displayName: 'Variable for write',
        dataType: 'String',
      });

      const method = namespace.addMethod(myDevice, {

        nodeId: 's=MyDevice.SumMethod',
        browseName: 'MyDevice.SumMethod',
        displayName: 'Sum method',

        inputArguments: [
          {
            name: 'number1',
            description: { text: 'first item' },
            dataType: DataType.UInt32
          }, {
            name: 'number2',
            description: { text: 'second item' },
            dataType: DataType.UInt32
          }
        ],

        outputArguments: [{
          name: 'SumResult',
          description: { text: 'sum of numbers' },
          dataType: DataType.UInt32,
          valueRank: 1
        }]
      });

      // optionally, we can adjust userAccessLevel attribute 
      method.outputArguments.userAccessLevel = makeAccessLevelFlag('CurrentRead');
      method.inputArguments.userAccessLevel = makeAccessLevelFlag('CurrentRead');

      method.bindMethod((inputArguments, context, callback) => {

        const number1 = inputArguments[0].value;
        const number2 = inputArguments[1].value;
        let sum = number1 + number2;

        // console.log('Run metod Sum:', sum);

        const callMethodResult = {
          statusCode: StatusCodes.Good,
          outputArguments: [{
            dataType: DataType.UInt32,
            value: sum
          }]
        };
        callback(null, callMethodResult);
      });


      //=== addObject => "Vessel Device" ===//
      const vesselDevice = namespace.addObject({
        browseName: 'VesselDevice',
        displayName: 'Vessel device',
        organizedBy: addressSpace.rootFolder.objects
      });

      const vesselPressure = namespace.addAnalogDataItem({
        nodeId: 's=VesselDevice.PressureVesselDevice',
        browseName: 'VesselDevice.PressureVesselDevice',
        displayName: 'Vessel device',
        engineeringUnitsRange: {
          low: 0,
          high: 10.0
        },
        engineeringUnits: standardUnits.bar,
        componentOf: vesselDevice
      });

      addressSpace.installHistoricalDataNode(vesselPressure);
      // simulate pressure change
      let t = 0;
      setInterval(function () {
        let value = (Math.sin(t / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
        vesselPressure.setValueFromSource({ dataType: 'Double', value: value });
        t = t + 1;
      }, 200);

    } catch (err) {
      const errTxt = 'Error while construct address space OPC-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }
}

module.exports = OpcuaServer;
