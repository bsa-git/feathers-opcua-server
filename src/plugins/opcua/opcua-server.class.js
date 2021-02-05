/* eslint-disable no-unused-vars */
const { appRoot, inspector } = require('../lib');
const { getOpcuaConfig } = require('./opcua-helper');
const {
  OPCUAServer,
  DataType,
  VariantArrayType,
  standardUnits,
  makeAccessLevelFlag,
} = require('node-opcua');
const opcuaDefaultServerOptions = require(`${appRoot}/src/api/opcua/OPCUAServerOptions`);

const loMerge = require('lodash/merge');
const loOmit = require('lodash/omit');
const chalk = require('chalk');

const debug = require('debug')('app:plugins.opcua-server.class');
const isLog = false;
const isDebug = false;



class OpcuaServer {
  /**
   * Constructor
   * @param app {Object}
   * @param params {Object}
   */
  constructor(app, params = {}) {
    this.app = app;
    // Set process.on to event 'SIGINT'
    this.isOnSignInt = false;
    // Get opcua config
    const opcuaConfig = getOpcuaConfig(params.serverInfo.applicationName);
    params.buildInfo = { productName: opcuaConfig.name };
    this.params = loMerge(opcuaDefaultServerOptions, params);
    this.opcuaServer = null;
    this.addedItemList = [];
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
   * @method opcuaServerNotCreated
   * OPC-UA server not created
   */
  opcuaServerNotCreated() {
    if (!this.opcuaServer) {
      throw new Error('OPC-UA server not created');
    }
  }

  /**
   * @method opcuaServerCreate
   * @async
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
  async opcuaServerCreate() {
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
  }

  /**
   * @method opcuaServerStart
   * @async
   * Start opc-ua server
   * Initiate the server by starting all its endpoints
   * 
   * @returns {Object}
   */
  async opcuaServerStart() {
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
  }

  /**
   * Shutdown opc-ua server
   * shutdown all server endpoints
   * @method opcuaServerShutdown
   * @async
   * 
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
  async opcuaServerShutdown(timeout = 0) {
    this.opcuaServerNotCreated();
    if (timeout) await this.opcuaServer.shutdown(timeout);
    else await this.opcuaServer.shutdown();
    this.currentState.endpointUrl = '';
    this.currentState.endpoints = null;
    this.currentState.isStarted = false;
    this.opcuaServer = null;
    if (timeout) console.log(chalk.yellow('Server terminated.'), 'Timeout:', chalk.cyan(`${timeout} Msec.`));
    else console.log(chalk.yellow('Server terminated.'));
  }


  /**
   * Get current state
   * @method getCurrentState
   * @returns {Object}
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get added item list
   * @method getAddedItemList
   * @returns {Array}
   */
  getAddedItemList(type = '') {
    return type ? this.addedItemList.filter(item => item.type === type) : this.addedItemList;
  }

  /**
   * Get server info
   */
  getServerInfo() {
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
  }

  /**
   * Get server build info
   */
  getBuildInfo() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.buildInfo;
  }

  /**
  * total number of bytes written  by the server since startup
  * @returns {Number}
  */
  getBytesWritten() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.bytesWritten;
  }

  /**
  * total number of bytes read  by the server since startup
  * @returns {Number}
  */
  getBytesRead() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.bytesRead;
  }

  /**
  * Number of transactions processed by the server since startup
  * @returns {Number}
  */
  getTransactionsCount() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.transactionsCount;
  }

  /**
  * the number of connected channel on all existing end points
  * @returns {Number}
  */
  getCurrentChannelCount() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.currentChannelCount;
  }

  /**
  * The number of active subscriptions from all sessions
  * @returns {Number}
  */
  getCurrentSubscriptionCount() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.currentSubscriptionCount;
  }

  /**
  * the number of session activation requests that have been rejected
  * @returns {Number}
  */
  getRejectedSessionCount() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.rejectedSessionCount;
  }

  /**
  * the number of request that have been rejected
  * @returns {Number}
  */
  getRejectedRequestsCount() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.rejectedRequestsCount;
  }

  /**
  * the number of sessions that have been aborted
  * @returns {Number}
  */
  getSessionAbortCount() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.sessionAbortCount;
  }

  /**
  * the publishing interval count
  * @returns {Number}
  */
  getPublishingIntervalCount() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.publishingIntervalCount;
  }

  /**
  * the number of sessions currently active
  * @returns {Number}
  */
  getCurrentSessionCount() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.currentSessionCount;
  }

  /**
  *  true if the server has been initialized
  * @returns {Boolean}
  */
  isInitialized() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.initialized;
  }

  /**
  *  is the server auditing
  * @returns {Boolean}
  */
  isAuditing() {
    this.opcuaServerNotCreated();
    return this.opcuaServer.isAuditing;
  }

  /**
   * Construct AddressSpace
   * @param {Object} params 
   * @param {Object} getters
   * @param {Object} methods  
   */
  constructAddressSpace(params = null, getters = null, methods = null) {
    let addedVariable, addedMethod, object = null;
    let addedVariableList, getterParams;
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
        // Add object to addedItemList
        this.addedItemList.push({
          type: 'object',
          nodeId: object.nodeId.toString(),
          browseName: o.browseName,
          item: object
        });

        // Add variables
        if (params.variables.length) {
          const variables = params.variables.filter(v => v.ownerName === o.browseName);
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

              // Add "this" to getterParams
              getterParams = Object.assign({}, v.getterParams ? v.getterParams : {});
              getterParams.myOpcuaServer = this;

              if (v.variableGetType === 'get') {
                // Value get func merge 
                // loMerge(varParams, { value: { get: () => { return getters[v.getter](v.getterParams ? v.getterParams : {}); } } });
                loMerge(varParams, { value: { get: () => { return getters[v.getter](getterParams); } } });
              }
              // Add variables
              if (v.type === 'analog') {
                addedVariable = namespace.addAnalogDataItem(varParams);
              } else {
                addedVariable = namespace.addVariable(varParams);
              }

              // Set aliasName to addedVariable
              loMerge(addedVariable, v.aliasName ? { aliasName: v.aliasName } : {});

              // Add addedVariable to addedItemList
              this.addedItemList.push({
                type: 'variable',
                ownerName: v.ownerName,
                nodeId: addedVariable.nodeId.toString(),
                browseName: v.browseName,
                item: addedVariable
              });

              // Push variable to paramsAddressSpace.variables
              this.currentState.paramsAddressSpace.variables.push(loMerge({
                nodeId: addedVariable.nodeId.toString(),
                browseName: v.browseName,
                displayName: v.displayName,
                ownerName: v.ownerName,
                dataType: v.dataType,
                type: v.type,
              },
              v.aliasName ? { aliasName: v.aliasName } : {},
              v.group ? { group: v.group } : {},
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
                  // If a variable has group - get group variables
                  if (v.group) {
                    const variables = params.groups.filter(g => v.browseName === g.ownerGroup);
                    // Add group variables
                    addedVariableList = this.addGroupVariables(addressSpace, namespace, object, variables, this.currentState);
                    if (isLog) inspector('constructAddressSpace.addedVariableList:', addedVariableList);
                    getterParams.addedVariableList = addedVariableList;
                  }
                  // Run getter
                  getters[v.getter](getterParams, addedVariable);
                } else {
                  // Set value from source
                  this.setValueFromSource(v, addedVariable, getters[v.getter]);
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
              // Add addedMethod to addedItemList
              this.addedItemList.push({
                type: 'method',
                ownerName: m.ownerName,
                nodeId: addedMethod.nodeId.toString(),
                browseName: m.browseName,
                item: addedMethod
              });
            });
          }
        }
      });
      this.currentState.isConstructedAddressSpace = true;
      // Set currentState.paths
      Object.assign(this.currentState.paths, opcuaConfig.paths);
      // inspector('currentState:', this.currentState);
      console.log(chalk.yellow('Server constructed address space'));
      if (isLog) inspector('constructAddressSpace.addedItemList:', this.addedItemList.map(item => loOmit(item, ['item'])));
    }
  }

  /**
   * @method addGroupVariables
   * @param {Object} addressSpace
   * @param {Object} namespace
   * @param {Object} object 
   * @param {Array} variables 
   * @param {Object} currentState
   * @returns {Array} 
   */
  addGroupVariables(addressSpace, namespace, object, variables, currentState) {
    let addedVariable, addedVariableList = [];
    // Add variables
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
        // Add variables
        if (v.type === 'analog') {
          addedVariable = namespace.addAnalogDataItem(varParams);
        } else {
          addedVariable = namespace.addVariable(varParams);
        }

        // Set aliasName to addedVariable
        loMerge(addedVariable, v.aliasName ? { aliasName: v.aliasName } : {});

        // Add addedVariable to addedItemList
        this.addedItemList.push({
          type: 'variable',
          ownerName: v.ownerName,
          nodeId: addedVariable.nodeId.toString(),
          browseName: v.browseName,
          item: addedVariable
        });

        // Push variable to paramsAddressSpace.variables
        currentState.paramsAddressSpace.variables.push(loMerge({
          nodeId: addedVariable.nodeId.toString(),
          browseName: v.browseName,
          displayName: v.displayName,
          ownerName: v.ownerName,
          ownerGroup: v.ownerGroup,
          dataType: v.dataType,
          type: v.type,
        },
        v.aliasName ? { aliasName: v.aliasName } : {},
        v.variableGetType ? { variableGetType: v.variableGetType } : {},
        v.getter ? { getter: v.getter } : {},
        v.getterParams ? { getterParams: v.getterParams } : {},
        v.valueFromSourceParams ? { valueFromSourceParams: v.valueFromSourceParams } : {},
        loOmit(v.valueParams, ['componentOf'])
        ));
        // Install historical DataNode
        addressSpace.installHistoricalDataNode(addedVariable);
        // Run getter
        // addedVariable.strDataType = v.dataType;
        addedVariableList.push(addedVariable);
      });
    }
    return addedVariableList;
  }

  /**
   * @method setValueFromSource
   * @param {Object} variable 
   * @param {Object} addedVariable 
   * @param {Function} getter 
   * @param {any} value 
   */
  setValueFromSource(variable, addedVariable, getter, value) {

    // getterParams
    let getterParams = Object.assign({}, variable.getterParams ? variable.getterParams : {});
    // Add "value" to getterParams
    loMerge(getterParams, value === undefined ? {} : { value });
    // Add "this" to getterParams
    getterParams.myOpcuaServer = this;

    let valueFromSourceParams = loMerge({}, variable.valueFromSourceParams);
    if (valueFromSourceParams.dataType) {
      const dataType = DataType[valueFromSourceParams.dataType];
      loMerge(valueFromSourceParams, { dataType });
    }
    if (valueFromSourceParams.arrayType) {
      const arrayType = VariantArrayType[valueFromSourceParams.arrayType];
      loMerge(valueFromSourceParams, { arrayType });
    }
    // Value get func merge 
    let valueFromSource = getter(getterParams);
    loMerge(valueFromSourceParams, { value: valueFromSource });
    if (!valueFromSourceParams.dataType) {
      valueFromSourceParams.dataType = DataType[variable.dataType];
    }
    if (isDebug) debug('setValueFromSource.valueFromSourceParams:', valueFromSourceParams);
    addedVariable.setValueFromSource(valueFromSourceParams);
  }
}

module.exports = OpcuaServer;
