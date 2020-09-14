const errors = require('@feathersjs/errors');
const moment = require('moment');
const { inspector } = require('../lib');
const {
  OPCUAServer,
  Variant,
  DataType,
  nodesets,
  // StatusCodes,
  VariantArrayType,
  // ServerEngine
} = require('node-opcua');
const os = require('os');
const loMerge = require('lodash/merge');

const debug = require('debug')('app:plugins.opcua-server.class');
const isLog = false;
const isDebug = false;

class OpcuaServer {
  /**
   * Constructor
   * @param app {Object}
   * @param params {Object}
   */
  constructor(app, params) {
    const paramsDefault = {
      port: 26543,
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

      this.constructAddressSpace();

      process.on('SIGINT', async () => {
        await this.opcuaServer.shutdown();
        console.log('OPC-UA server terminated');
      });
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

      console.log('Server is now listening ... ( press CTRL+C to stop) ');
      this.opcuaServer.endpoints[0].endpointDescriptions().forEach(function (endpoint) {
        if(isLog) inspector('plugins.opcua-server.class::start:', endpoint);
        if(isDebug) debug(endpoint.endpointUrl, endpoint.securityMode.toString(), endpoint.securityPolicyUri.toString());
      });
    } catch (err) {
      const errTxt = 'Error while start the OPS-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Shutdown opc-ua server
   */
  async shutdown() {
    if (!this.opcuaServer) return;
    try {
      this.opcuaServer.shutdown();
      console.log('OPC-UA server terminated');
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

      // we create a new folder under RootFolder
      const myDevice = namespace.addFolder('ObjectsFolder', {
        browseName: 'MyDevice'
      });

      // now let's add first variable in folder
      // the addVariableInFolder
      const variable1 = 10.0;

      this.opcuaServer.nodeVariable1 = namespace.addVariable({
        componentOf: myDevice,
        nodeId: 's=Temperature',
        browseName: 'Temperature',
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
        browseName: 'MyVariable2',
        dataType: 'String',
      });
      nodeVariable2.setValueFromSource({
        dataType: DataType.String,
        value: 'Learn Node-OPCUA ! Read https://leanpub.com/node-opcuabyexample'
      });

      const nodeVariable3 = namespace.addVariable({
        componentOf: myDevice,
        browseName: 'MyVariable3',
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


      const nodeVariable4 = namespace.addVariable({
        componentOf: myDevice,
        nodeId: 'b=1020ffab',
        browseName: 'Percentage Memory Used',
        dataType: 'Double',
        minimumSamplingInterval: 1000,
        value: {
          get: () => {
            // const value = process.memoryUsage().heapUsed / 1000000;
            const percentageMemUsed = 1.0 - (os.freemem() / os.totalmem());
            const value = percentageMemUsed * 100;
            return new Variant({ dataType: DataType.Double, value: value });
          }
        }
      });
      if(isLog) inspector('plugins.opcua-server.class::nodeVariable4:', nodeVariable4);
    } catch (err) {
      const errTxt = 'Error while construct address space OPC-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }
}

module.exports = OpcuaServer;
