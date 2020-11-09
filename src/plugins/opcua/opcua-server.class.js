/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const moment = require('moment');
const { inspector, appRoot } = require('../lib');
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
const opcuaDefaultServerOptions = require(`${appRoot}/src/api/opcua/OPCUAServerOptions`);

const os = require('os');
const loMerge = require('lodash/merge');
const loOmit = require('lodash/omit');
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
    // Set process.on to event 'SIGINT'
    this.isOnSignInt = false;
    this.params = loMerge(opcuaDefaultServerOptions, params);
    this.app = app;
    this.opcuaServer = null;
    this.currentState = {
      port: this.params.port,
      endpointUrl: '',
      endpoints: null,
      isCreated: false,
      isStarted: false,
      isConstructedAddressSpace: false,
      paramsAddressSpace: {
        objects: [],
        variables: [],
        methods: []
      }
    };
  }

  /**
   * Create opc-ua server
   * Initialize the server by installing default node set.
   *
   * and instruct the server to listen to its endpoints.
   *
   * ```javascript
   * const server = new OPCUAServer();
   * await server.initialize();
   *
   * // default server namespace is now initialized
   * // it is a good time to create life instance objects
   * const namespace = server.engine.addressSpace.getOwnNamespace();
   * namespace.addObject({
   *     browseName: "SomeObject",
   *     organizedBy: server.engine.addressSpace.rootFolder.objects
   * });
   *
   * // the addressSpace is now complete
   * // let's now start listening to clients
   * await server.start();
   * ```
 */
  async create() {
    try {
      // Let create an instance of OPCUAServer
      this.opcuaServer = new OPCUAServer({
        port: this.params.port,  // the port of the listening socket of the server
        nodeset_filename: this.params.nodeset_filename,
        buildInfo: this.params.buildInfo
      });

      await this.opcuaServer.initialize();
      if (isDebug) debug('certificateFile = ', this.opcuaServer.certificateFile);
      if (isDebug) debug('privateKeyFile  = ', this.opcuaServer.privateKeyFile);
      if (isDebug) debug('rejected folder = ', this.opcuaServer.serverCertificateManager.rejectedFolder);
      if (isDebug) debug('trusted  folder = ', this.opcuaServer.serverCertificateManager.trustedFolder);

      // this.constructAddressSpace();

      if (this.isOnSignInt) {
        process.on('SIGINT', async () => {
          await this.opcuaServer.shutdown();
          console.log(chalk.yellow('Server terminated'));
        });
      }

      this.currentState.isCreated = true;
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
   * Initiate the server by starting all its endpoints
   */
  async start() {
    if (!this.opcuaServer) return;
    try {
      await this.opcuaServer.start();
      const endpointUrl = this.opcuaServer.endpoints[0].endpointDescriptions()[0].endpointUrl;
      this.currentState.endpointUrl = endpointUrl;
      console.log(chalk.yellow('Server started and now listening ...'), 'EndPoint URL:', chalk.cyan(endpointUrl));
      this.opcuaServer.endpoints[0].endpointDescriptions().forEach(function (endpoint) {
        if (isDebug) debug('opcuaServer.endpoint:', endpoint.endpointUrl, endpoint.securityMode.toString(), endpoint.securityPolicyUri.toString());
      });
      const endpoints = this.opcuaServer.endpoints[0].endpointDescriptions().map(endpoint => {
        return {
          endpointUrl: endpoint.endpointUrl,
          securityMode: endpoint.securityMode.toString(),
          securityPolicyUri: endpoint.securityPolicyUri.toString()
        };
      });
      this.currentState.endpoints = endpoints;
      this.currentState.isStarted = true;
      return endpoints;
    } catch (err) {
      const errTxt = 'Error while start the OPS-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Shutdown opc-ua server
   * shutdown all server endpoints
   * @method shutdown
   * @param  timeout the timeout (in ms) before the server is actually shutdown
   *
   * @example
   *
   * ```javascript
   *    // shutdown immediately
   *    server.shutdown(function(err) {
   *    });
   *    // shutdown within 10 seconds
   *    server.shutdown(10000,function(err) {
   *    });
   *   ``` 
   */
  async shutdown(timeout = 0) {
    if (!this.opcuaServer) return;
    try {
      if (timeout) await this.opcuaServer.shutdown(timeout);
      else await this.opcuaServer.shutdown();
      this.currentState.endpoints = null;
      this.currentState.isStarted = false;
      console.log(chalk.yellow('Server terminated'));
    } catch (err) {
      const errTxt = 'Error while start the OPS-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Get server info
   */
  getServerInfo() {
    if (!this.opcuaServer) return;
    try {
      let applicationUri, serverInfo = this.opcuaServer.serverInfo, _serverInfo = {};
      applicationUri = serverInfo.applicationUri;
      _serverInfo.applicationUri = applicationUri;
      _serverInfo.productUri = serverInfo.productUri;
      _serverInfo.applicationName = serverInfo.applicationName.text;
      _serverInfo.applicationType = serverInfo.applicationType;
      _serverInfo.gatewayServerUri = serverInfo.gatewayServerUri;
      _serverInfo.discoveryProfileUri = serverInfo.discoveryProfileUri;
      _serverInfo.discoveryUrls = serverInfo.discoveryUrls;
      return _serverInfo; //Object.assign({}, _serverInfo);
    } catch (err) {
      const errTxt = 'Error while start the OPS-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Get server info
   */
  getBuildInfo() {
    if (!this.opcuaServer) return;
    try {
      return this.opcuaServer.buildInfo;
    } catch (err) {
      const errTxt = 'Error while start the OPS-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
  * total number of bytes written  by the server since startup
  */
  getBytesWritten() {
    return this.opcuaServer.bytesWritten;
  }

  /**
  * total number of bytes read  by the server since startup
  */
  getBytesRead() {
    return this.opcuaServer.bytesRead;
  }

  /**
  * Number of transactions processed by the server since startup
  */
  getTransactionsCount() {
    return this.opcuaServer.transactionsCount;
  }

  /**
  * the number of connected channel on all existing end points
  */
  getCurrentChannelCount() {
    return this.opcuaServer.currentChannelCount;
  }

  /**
  * The number of active subscriptions from all sessions
  */
  getCurrentSubscriptionCount() {
    return this.opcuaServer.currentSubscriptionCount;
  }

  /**
  * the number of session activation requests that have been rejected
  */
  getRejectedSessionCount() {
    return this.opcuaServer.rejectedSessionCount;
  }

  /**
  * the number of request that have been rejected
  */
  getRejectedRequestsCount() {
    return this.opcuaServer.rejectedRequestsCount;
  }

  /**
  * the number of sessions that have been aborted
  */
  getSessionAbortCount() {
    return this.opcuaServer.sessionAbortCount;
  }

  /**
  * the publishing interval count
  */
  getPublishingIntervalCount() {
    return this.opcuaServer.publishingIntervalCount;
  }

  /**
  * the number of sessions currently active
  */
  getCurrentSessionCount() {
    return this.opcuaServer.currentSessionCount;
  }

  /**
  *  true if the server has been initialized
  */
  isInitialized() {
    return this.opcuaServer.initialized;
  }

  /**
  *  is the server auditing
  */
  isAuditing() {
    return this.opcuaServer.isAuditing;
  }

  /**
   * Construct AddressSpace
   * @param {Object} params 
   * @param {Object} getters
   * @param {Object} methods  
   */
  constructAddressSpace(params = {}, getters = {}, methods = {}) {
    try {
      let addedVariable, addedMethod;
      if (!this.opcuaServer) return;
      const addressSpace = this.opcuaServer.engine.addressSpace;
      const namespace = addressSpace.getOwnNamespace();
      // Add objects
      if (params.objects.length) {
        params.objects.forEach(o => {
          // addObject
          const object = namespace.addObject({
            browseName: o.browseName,
            displayName: o.displayName,
            organizedBy: addressSpace.rootFolder.objects
          });
          // Push object to paramsAddressSpace.objects
          this.currentState.paramsAddressSpace.objects.push({
            nodeId: object.nodeId.toString(),
            browseName: o.browseName,
            displayName: o.displayName
          });

          // Add variables
          if (params.variables.length) {
            const variables = params.variables.filter(v => v.variableOwnerName === o.browseName);
            if (variables.length) {
              variables.forEach(v => {
                let varParams = {
                  componentOf: object,
                  nodeId: `s=${v.browseName}`,
                  browseName: v.browseName,
                  displayName: v.displayName,
                  dataType: v.dataType,
                };
                if (v.valueParams) {
                  // Value params merge 
                  loMerge(varParams, v.valueParams);
                  // Value of engineeringUnits param merge 
                  loMerge(varParams, v.valueParams.engineeringUnits ? standardUnits[v.valueParams.engineeringUnits] : {});
                }
                if (v.variableGetType === 'get') {
                  // Value get func merge 
                  loMerge(varParams, { value: { get: () => { return getters[v.getter](v.getterParams ? v.getterParams : {}); } } });
                }
                // Add variables
                if (v.type === 'analog') {
                  addedVariable = namespace.addAnalogDataItem(varParams);
                } else {
                  addedVariable = namespace.addVariable(varParams);
                }

                // Push variable to paramsAddressSpace.variables
                this.currentState.paramsAddressSpace.variables.push(loMerge({
                  nodeId: addedVariable.nodeId.toString(),
                  browseName: v.browseName,
                  displayName: v.displayName,
                  variableOwnerName: v.variableOwnerName,
                  dataType: v.dataType,
                  type: v.type,
                },
                v.variableGetType? {variableGetType: v.variableGetType} : {}, 
                v.getter? {getter: v.getter} : {}, 
                v.getterParams? {getterParams: v.getterParams} : {},  
                v.valueFromSourceParams? {valueFromSourceParams: v.valueFromSourceParams} : {}, 
                loOmit(v.valueParams, ['componentOf'])));

                // Value from source
                if (v.variableGetType === 'valueFromSource') {
                  // If a variable has history
                  if (v.hist) {
                    addressSpace.installHistoricalDataNode(addedVariable);
                    let getterParams = v.getterParams ? v.getterParams : {};
                    getters[v.getter](getterParams, addedVariable);
                  } else {
                    let valueFromSourceParams = loMerge({}, v.valueFromSourceParams);
                    if (valueFromSourceParams.dataType) {
                      const dataType = DataType[valueFromSourceParams.dataType];
                      loMerge(valueFromSourceParams, { dataType });
                    }
                    if (valueFromSourceParams.arrayType) {
                      const arrayType = VariantArrayType[valueFromSourceParams.arrayType];
                      loMerge(valueFromSourceParams, { arrayType });
                    }
                    // Value get func merge 
                    let valueFromSource = getters[v.getter](v.getterParams ? v.getterParams : {});
                    loMerge(valueFromSourceParams, { value: valueFromSource });
                    addedVariable.setValueFromSource(valueFromSourceParams);
                  }
                }
              });
            }
          }
          // Add methods for object
          if (params.methods.length) {
            const filterMethods = params.methods.filter(m => m.methodOwnerName === o.browseName);
            if (filterMethods.length) {
              filterMethods.forEach(m => {
                let methodParams = {
                  nodeId: `s=${m.browseName}`,
                  browseName: m.browseName,
                  displayName: m.displayName,
                };
                // Method inputArguments merge 
                if (m.inputArguments.length) {
                  m.inputArguments = m.inputArguments.map(arg => {
                    arg.dataType = DataType[arg.dataType];
                    return arg;
                  });
                  loMerge(methodParams, { inputArguments: m.inputArguments });
                }
                // Method outputArguments merge 
                if (m.outputArguments.length) {
                  m.outputArguments = m.outputArguments.map(arg => {
                    arg.dataType = DataType[arg.dataType];
                    return arg;
                  });
                  loMerge(methodParams, { outputArguments: m.outputArguments });
                }

                // Add method
                addedMethod = namespace.addMethod(object, methodParams);

                // Push method to paramsAddressSpace.methods
                this.currentState.paramsAddressSpace.methods.push(loMerge(
                  loOmit(methodParams, ['componentOf', 'propertyOf', 'organizedBy', 'encodingOf']), 
                  { nodeId: addedMethod.nodeId.toString() }));

                // optionally, we can adjust userAccessLevel attribute 
                if (m.userAccessLevel && m.userAccessLevel.inputArguments) {
                  addedMethod.inputArguments.userAccessLevel = makeAccessLevelFlag(m.userAccessLevel.inputArguments);
                }
                if (m.userAccessLevel && m.userAccessLevel.outputArguments) {
                  addedMethod.outputArguments.userAccessLevel = makeAccessLevelFlag(m.userAccessLevel.outputArguments);
                }

                // Bind method
                addedMethod.bindMethod(methods[m.bindMethod]);
              });
            }
          }
        });
        this.currentState.isConstructedAddressSpace = true;
        inspector('currentState:', this.currentState);
        console.log(chalk.yellow('Server constructed address space'));
      }
    } catch (err) {
      const errTxt = 'Error while construct address space OPC-UA server:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }
}

module.exports = OpcuaServer;
