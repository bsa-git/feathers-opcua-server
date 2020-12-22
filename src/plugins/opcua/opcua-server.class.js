/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const moment = require('moment');
const { inspector, appRoot, getIpAddresses, getHostname, getParseUrl, isIP, getMyIp } = require('../lib');
const { getOpcuaConfig } = require('./opcua-helper');
const {
  OPCUAServer,
  Variant,
  DataType,
  nodesets,
  StatusCodes,
  VariantArrayType,
  standardUnits,
  makeAccessLevelFlag,
} = require('node-opcua');
const opcuaDefaultServerOptions = require(`${appRoot}/src/api/opcua/OPCUAServerOptions`);

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
    // Get opcua config
    const opcuaConfig = getOpcuaConfig(params.serverInfo.applicationName);
    params.buildInfo = { productName: opcuaConfig.name };
    this.params = loMerge(opcuaDefaultServerOptions, params);
    this.app = app;
    this.opcuaServer = null;
    this.currentState = {
      id: this.params.serverInfo.applicationName,
      productName: this.params.buildInfo.productName,
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
      },
      paths: {
        options: '',
        getters: '',
        methods: '',
        subscriptions: '',
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
      this.opcuaServer = new OPCUAServer(this.params);
      // this.params.port of the listening socket of the server
      await this.opcuaServer.initialize();
      if (isDebug) debug('certificateFile = ', this.opcuaServer.certificateFile);
      if (isDebug) debug('privateKeyFile  = ', this.opcuaServer.privateKeyFile);
      if (isDebug) debug('rejected folder = ', this.opcuaServer.serverCertificateManager.rejectedFolder);
      if (isDebug) debug('trusted  folder = ', this.opcuaServer.serverCertificateManager.trustedFolder);

      if (this.isOnSignInt) {
        process.on('SIGINT', async () => {
          await this.opcuaServer.shutdown();
          console.log(chalk.yellow('Server terminated'));
        });
      }

      this.currentState.isCreated = true;
      // OPC-UA server created.
      console.log(chalk.yellow('Server created'));
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * OPC-UA server not created
   */
  opcuaServerNotCreated() {
    if (!this.opcuaServer) {
      throw new errors.GeneralError('OPC-UA server not created');
    }
  }

  /**
   * Start opc-ua server
   * Initiate the server by starting all its endpoints
   */
  async start() {
    try {
      this.opcuaServerNotCreated();
      await this.opcuaServer.start();
      const endpointUrl = this.opcuaServer.endpoints[0].endpointDescriptions()[0].endpointUrl;
      this.currentState.endpointUrl = endpointUrl;
      const port = this.opcuaServer.endpoints[0].port;
      console.log(chalk.yellow('Server started and now listening ...'), 'Port:', chalk.cyan(port));
      console.log(chalk.yellow('Server started and now listening ...'), 'EndPoint URL:', chalk.cyan(endpointUrl));
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
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
    try {
      this.opcuaServerNotCreated();
      if (timeout) await this.opcuaServer.shutdown(timeout);
      else await this.opcuaServer.shutdown();
      this.currentState.endpointUrl = '';
      this.currentState.endpoints = null;
      this.currentState.isStarted = false;
      this.opcuaServer = null;
      if (timeout) console.log(chalk.yellow('Server terminated.'), 'Timeout:', chalk.cyan(`${timeout} Msec.`));
      else console.log(chalk.yellow('Server terminated.'));
      
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }


  /**
   * Get current state
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get server info
   */
  getServerInfo() {
    try {
      this.opcuaServerNotCreated();
      let applicationUri, _serverInfo = {};
      const serverInfo = this.opcuaServer.serverInfo;
      applicationUri = serverInfo.applicationUri;
      _serverInfo.applicationUri = applicationUri;
      _serverInfo.productUri = serverInfo.productUri;
      _serverInfo.applicationName = serverInfo.applicationName.text;
      _serverInfo.applicationType = serverInfo.applicationType;
      _serverInfo.gatewayServerUri = serverInfo.gatewayServerUri;
      _serverInfo.discoveryProfileUri = serverInfo.discoveryProfileUri;
      _serverInfo.discoveryUrls = serverInfo.discoveryUrls;
      return _serverInfo; 
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Get server build info
   */
  getBuildInfo() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.buildInfo;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * total number of bytes written  by the server since startup
  * @returns {Number}
  */
  getBytesWritten() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.bytesWritten;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * total number of bytes read  by the server since startup
  * @returns {Number}
  */
  getBytesRead() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.bytesRead;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * Number of transactions processed by the server since startup
  * @returns {Number}
  */
  getTransactionsCount() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.transactionsCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * the number of connected channel on all existing end points
  * @returns {Number}
  */
  getCurrentChannelCount() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.currentChannelCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * The number of active subscriptions from all sessions
  * @returns {Number}
  */
  getCurrentSubscriptionCount() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.currentSubscriptionCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * the number of session activation requests that have been rejected
  * @returns {Number}
  */
  getRejectedSessionCount() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.rejectedSessionCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * the number of request that have been rejected
  * @returns {Number}
  */
  getRejectedRequestsCount() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.rejectedRequestsCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * the number of sessions that have been aborted
  * @returns {Number}
  */
  getSessionAbortCount() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.sessionAbortCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * the publishing interval count
  * @returns {Number}
  */
  getPublishingIntervalCount() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.publishingIntervalCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * the number of sessions currently active
  * @returns {Number}
  */
  getCurrentSessionCount() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.currentSessionCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  *  true if the server has been initialized
  * @returns {Boolean}
  */
  isInitialized() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.initialized;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  *  is the server auditing
  * @returns {Boolean}
  */
  isAuditing() {
    try {
      this.opcuaServerNotCreated();
      return this.opcuaServer.isAuditing;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Construct AddressSpace
   * @param {Object} params 
   * @param {Object} getters
   * @param {Object} methods  
   */
  constructAddressSpace(params = null, getters = null, methods = null) {
    try {
      let addedVariable, addedMethod, object = null;
      this.opcuaServerNotCreated();
      const id = this.params.serverInfo.applicationName;
      const opcuaConfig = getOpcuaConfig(id);
      // Set arguments
      if (params === null) {
        params = require(`${appRoot}${opcuaConfig.paths.options}`);
      }
      if (getters === null) {
        getters = require(`${appRoot}${opcuaConfig.paths.getters}`);
      }
      if (methods === null) {
        methods = require(`${appRoot}${opcuaConfig.paths.methods}`);
      }
      // Get addressSpace and  namespace
      const addressSpace = this.opcuaServer.engine.addressSpace;
      const namespace = addressSpace.getOwnNamespace();
      // Add objects
      if (params.objects.length) {
        params.objects.forEach(o => {
          // Add only those objects that do not exist in the current state list
          const foundObject = this.currentState.paramsAddressSpace.objects.find(_o => _o.browseName === o.browseName);
          if (!foundObject) {
            // addObject
            object = namespace.addObject({
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
              const variables = params.variables.filter(v => v.ownerName === o.browseName);
              if (variables.length) {
                variables.forEach(v => {
                  // Add only those variables that do not exist in the current state list
                  const foundVariable = this.currentState.paramsAddressSpace.variables.find(_v => _v.browseName === v.browseName);
                  if (!foundVariable) {
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
                      ownerName: v.ownerName,
                      dataType: v.dataType,
                      type: v.type,
                    },
                    v.variableGetType ? { variableGetType: v.variableGetType } : {},
                    v.getter ? { getter: v.getter } : {},
                    v.getterParams ? { getterParams: v.getterParams } : {},
                    v.valueFromSourceParams ? { valueFromSourceParams: v.valueFromSourceParams } : {},
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
                  }
                });
              }
            }

            // Add methods for object
            if (params.methods.length) {
              const filterMethods = params.methods.filter(m => m.ownerName === o.browseName);
              if (filterMethods.length) {
                filterMethods.forEach(m => {
                  // Add only those methods that do not exist in the current state list
                  const foundMethod = this.currentState.paramsAddressSpace.methods.find(_m => _m.browseName === m.browseName);
                  if (!foundMethod) {
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
                      {
                        nodeId: addedMethod.nodeId.toString(),
                        ownerName: m.ownerName,
                      }));

                    // optionally, we can adjust userAccessLevel attribute 
                    if (m.userAccessLevel && m.userAccessLevel.inputArguments) {
                      addedMethod.inputArguments.userAccessLevel = makeAccessLevelFlag(m.userAccessLevel.inputArguments);
                    }
                    if (m.userAccessLevel && m.userAccessLevel.outputArguments) {
                      addedMethod.outputArguments.userAccessLevel = makeAccessLevelFlag(m.userAccessLevel.outputArguments);
                    }

                    // Bind method
                    addedMethod.bindMethod(methods[m.bindMethod]);
                  }
                });
              }
            }
          }
        });
        this.currentState.isConstructedAddressSpace = true;
        // Set currentState.paths
        Object.assign(this.currentState.paths, opcuaConfig.paths);
        // inspector('currentState:', this.currentState);
        console.log(chalk.yellow('Server constructed address space'));
      }
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }
}

module.exports = OpcuaServer;
