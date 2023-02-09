/* eslint-disable no-unused-vars */
const {
  appRoot,
  inspector,
  logger,
  assert,
  isFunction,
  isObject
} = require('../lib');

const {
  getOpcuaConfig,
  getEngineeringUnit,
  mergeOpcuaConfigOptions,
  getInitValueForDataType,
  convertArrayToTypedArray,
  setOpcuaValueFromSource
} = require('./opcua-helper');
const {
  OPCUAServer,
  DataType,
  VariantArrayType,
  makeAccessLevelFlag,
} = require('node-opcua');
const opcuaDefaultServerOptions = require(`${appRoot}/src/api/opcua/config/OPCUA_ServerOptions`);
const opcuaDefaultVariableHistorianOptions = require(`${appRoot}/src/api/opcua/config/ServerVariableHistorianOptions`);
const opcuaDefaultGetters = require('./opcua-getters');
const opcuaDefaultMethods = require('./opcua-methods');

const loMerge = require('lodash/merge');
const loOmit = require('lodash/omit');
const loIsInteger = require('lodash/isInteger');
const chalk = require('chalk');

const debug = require('debug')('app:opcua-server.class');
const isDebug = false;
//----------------------------------------------------

//====================//
//=== OPCUA SERVER ===//
//====================//

class OpcuaServer {
  /**
   * Constructor
   * @param params {Object}
   */
  constructor(params = {}) {
    params = Object.assign({}, params);
    this.id = params.serverInfo.applicationName;
    this.app = null;
    // Set process.on to event 'SIGINT'
    this.isOnSignInt = true;
    // Get opcua config
    const opcuaConfig = getOpcuaConfig(this.id);
    // params.buildInfo = { productName: opcuaConfig.name };// productUri: this.id
    this.locale = (params.locale === undefined) ? process.env.LOCALE : params.locale;
    this.params = loMerge({}, opcuaDefaultServerOptions, params);
    this.opcuaServer = null;
    this.addedItemList = [];
    this.currentState = {
      id: this.id,
      locale: this.locale,
      serverInfo: null,
      productName: this.params.buildInfo.productName,
      applicationUri: '',
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
    if (isDebug && this.opcuaServer) inspector('opcuaServer.certificateFile = ', this.opcuaServer.certificateFile);
    if (isDebug && this.opcuaServer) inspector('opcuaServer.privateKeyFile  = ', this.opcuaServer.privateKeyFile);
    if (isDebug && this.opcuaServer) inspector('opcuaServer.rejectedFolder = ', this.opcuaServer.serverCertificateManager.rejectedFolder);
    if (isDebug && this.opcuaServer) inspector('opcuaServer.trustedFolder = ', this.opcuaServer.serverCertificateManager.trustedFolder);
    if (isDebug && this.opcuaServer) inspector('opcuaServer.serverCapabilities = ', this.opcuaServer.options.serverCapabilities);
    if (isDebug && this.opcuaServer) inspector('opcuaServer.options = ', this.opcuaServer.options);

    if (this.isOnSignInt) {
      process.on('SIGINT', async () => {
        // Opcua server shutdown
        await this.opcuaServer.shutdown();
        console.log(chalk.yellow('Server terminated'));
      });
    }

    this.currentState.isCreated = true;
    // OPC-UA server created.
    // console.log(chalk.yellow('OPCUAServer created ...'), 'opcuaServer.id:', chalk.cyan(this.id));
    logger.info('OPCUAServer created OK. id: %s', this.id);
    if (isDebug && this.params) inspector('opcuaServerCreate.params:', this.params);
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
    this.currentState.serverInfo = this.getServerInfo();
    const applicationUri = this.currentState.serverInfo.applicationUri;
    this.currentState.applicationUri = applicationUri;
    // console.log(chalk.yellow('Server applicationUri:'), chalk.cyan(applicationUri));
    // console.log(chalk.yellow('Server started and now listening ...'), 'EndPoint URL:', chalk.cyan(endpointUrl));
    
    logger.info('Server applicationUri: %s', applicationUri);
    logger.info('Server EndPointURL: %s', endpointUrl);
    
    const endpoints = this.opcuaServer.endpoints[0].endpointDescriptions().map(endpoint => {
      return {
        endpointUrl: endpoint.endpointUrl,
        securityMode: endpoint.securityMode.toString(),
        securityPolicyUri: endpoint.securityPolicyUri.toString(),
        userIdentityTokens: endpoint.userIdentityTokens
      };
    });

    this.currentState.endpoints = endpoints;
    this.currentState.isStarted = true;
    if (isDebug && this.currentState) inspector('opcuaServerStart.currentState.endpoints:', this.currentState.endpoints);
    if (isDebug && this) inspector('opcuaServerStart.getServerInfo:', this.getServerInfo());
    if (isDebug && this) inspector('opcuaServerStart.getBuildInfo:', this.getBuildInfo());
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
   * @method getAddedItemList{
   * @param {String} type
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
    let addedVariableList, getterParams, valueParams, engineeringUnit;
    //------------------------------------------------------------------

    this.opcuaServerNotCreated();
    const id = this.id;
    
    const opcuaConfig = getOpcuaConfig(id);
    // Merge params
    if (params === null) {
      params = mergeOpcuaConfigOptions(id);
    }
    if (isDebug && params) inspector('constructAddressSpace.params:', params);

    if (Array.isArray(params.objects) && params.objects.length) {
      if(isDebug && params.objects.length) inspector('params.objects:', params.objects);
      params.objects = params.objects.filter(item => item.isEnable || item.isEnable === undefined);
    } else {
      params.objects = [];
    }
    if (Array.isArray(params.variables) && params.variables.length) {
      params.variables = params.variables.filter(item => item.isEnable || item.isEnable === undefined);
    } else {
      params.variables = [];
    }
    if (Array.isArray(params.groups) && params.groups.length) {
      params.groups = params.groups.filter(item => item.isEnable || item.isEnable === undefined);
    } else {
      params.groups = [];
    }
    if (Array.isArray(params.methods) && params.methods.length) {
      params.methods = params.methods.filter(item => item.isEnable || item.isEnable === undefined);
    } else {
      params.methods = [];
    }
    if (isDebug && params) inspector('constructAddressSpace.filterParams:', params);
    // Merge getters
    if (getters === null && opcuaConfig.paths.getters) {
      getters = require(`${appRoot}${opcuaConfig.paths.getters}`);
    }
    getters = Object.assign({}, opcuaDefaultGetters, getters ? getters : {});
    assert(Object.keys(getters).length, 'Getters is not object.');

    // Merge methods
    if (methods === null && opcuaConfig.paths.methods) {
      methods = require(`${appRoot}${opcuaConfig.paths.methods}`);
    }
    methods = Object.assign({}, opcuaDefaultMethods, methods ? methods : {});
    if (isDebug && methods) inspector('constructAddressSpace.methods:', methods);

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
          description: o.description ? o.description : '',
          organizedBy: addressSpace.rootFolder.objects
        });
        // Push object to paramsAddressSpace.objects
        this.currentState.paramsAddressSpace.objects.push(
          loMerge({ nodeId: object.nodeId.toString() }, o)
        );
        // );
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
                description: v.description ? v.description : '',
                dataType: v.dataType,
              };
              if (v.valueParams) {
                valueParams = loMerge({}, v.valueParams);
                if (v.valueParams.engineeringUnits) {
                  engineeringUnit = getEngineeringUnit(v.valueParams.engineeringUnits, this.locale);
                  if (engineeringUnit) {
                    valueParams.engineeringUnits = engineeringUnit;
                  }
                }
                // Value params merge 
                loMerge(varParams, valueParams);
              }

              getterParams = Object.assign({}, v.getterParams ? v.getterParams : {});
              // Add "dataType" to getterParams
              getterParams.dataType = v.dataType;
              // Add "this" to getterParams
              getterParams.myOpcuaServer = this;

              if (v.variableGetType === 'get') {
                // Value get func merge 
                assert(v.getter, 'Getter function name not set');
                assert(isFunction(getters[v.getter]), `getters["${v.getter}"] is not a function`);
                loMerge(varParams, { value: { get: () => { return getters[v.getter](getterParams); } } });
              }
              // Add variables
              if (v.type === 'variable.analog') {
                addedVariable = namespace.addAnalogDataItem(varParams);
              } else {
                addedVariable = namespace.addVariable(varParams);
              }

              // Set aliasName to addedVariable
              loMerge(addedVariable, v.aliasName ? { aliasName: v.aliasName } : {});

              // Add addedVariable to addedItemList
              this.addedItemList.push({
                type: v.type,
                ownerName: v.ownerName,
                nodeId: addedVariable.nodeId.toString(),
                browseName: v.browseName,
                item: addedVariable
              });

              // Push variable to paramsAddressSpace.variables
              this.currentState.paramsAddressSpace.variables.push(
                loMerge({ nodeId: addedVariable.nodeId.toString() }, v)
              );

              // Value from source
              if (v.variableGetType === 'valueFromSource') {

                if (v.group) {
                  const variables = params.groups.filter(g => v.browseName === g.ownerGroup);
                  // Add group variables
                  addedVariableList = this.addGroupVariables(addressSpace, namespace, object, variables, this.currentState);
                  if (isDebug && addedVariableList) inspector('constructAddressSpace.addedVariableList:', addedVariableList);
                }

                // If a variable has history
                if (v.hist) {
                  /*
                  InstallHistoricalDataNode does a few things for us:
                    it instantiate a HA Configuration object
                    it sets the historizing flag of the variable
                    it starts recording value changes into a small online data storage of 1000 values.
                  */
                  // Set new maxOnlineValues
                  if (v.hist > 1) {
                    const variableHistorianOptions = Object.assign({}, opcuaDefaultVariableHistorianOptions, { maxOnlineValues: v.hist });
                    addressSpace.installHistoricalDataNode(addedVariable, variableHistorianOptions);
                  } else {
                    addressSpace.installHistoricalDataNode(addedVariable, opcuaDefaultVariableHistorianOptions);
                  }

                  // If a variable has group - get group variables
                  if (v.group) {
                    getterParams.addedVariableList = addedVariableList;
                  }
                  // Run getter
                  assert(v.getter, 'Getter function name not set');
                  assert(isFunction(getters[v.getter]), `getters["${v.getter}"] is not a function`);
                  getters[v.getter](getterParams, addedVariable);
                } else {
                  // Set value from source
                  const variable = Object.assign({}, v);
                  if (v.group) {
                    variable.group = addedVariableList;
                  }
                  assert(v.getter, 'Getter function name not set');
                  assert(isFunction(getters[v.getter]), `getters["${v.getter}"] is not a function`);
                  this.setValueFromSource(variable, addedVariable, getters[v.getter]);
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
              if (!methods[m.bindMethod]) return;
              let methodParams = {
                nodeId: `s=${m.browseName}`,
                browseName: m.browseName,
                displayName: m.displayName,
                description: m.description ? m.description : '',
              };
              // Method inputArguments merge 
              if (m.inputArguments && m.inputArguments.length) {
                m.inputArguments = m.inputArguments.map(arg => {
                  arg.dataType = DataType[arg.dataType];
                  return arg;
                });
                loMerge(methodParams, { inputArguments: m.inputArguments });
              }
              // Method outputArguments merge 
              if (m.outputArguments && m.outputArguments.length) {
                m.outputArguments = m.outputArguments.map(arg => {
                  arg.dataType = DataType[arg.dataType];
                  return arg;
                });
                loMerge(methodParams, { outputArguments: m.outputArguments });
              }

              // Add method
              addedMethod = namespace.addMethod(object, methodParams);

              // Push method to paramsAddressSpace.methods
              this.currentState.paramsAddressSpace.methods.push(
                loMerge({ nodeId: addedMethod.nodeId.toString() }, m)
              );

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
      // console.log(chalk.yellow('Server constructed address space: OK'), `(${this.addedItemList.length})`);
      logger.info('Server constructed address space: OK (%d)', this.addedItemList.length);
      if (isDebug && this.addedItemList.length) inspector('constructAddressSpace.addedItemList:', this.addedItemList.map(item => loOmit(item, ['item'])));
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
    let addedVariable, addedVariableList = [], engineeringUnit, valueParams;
    // Add variables
    if (variables.length) {
      variables.forEach(v => {
        let varParams = {
          componentOf: object,
          nodeId: `s=${v.browseName}`,
          browseName: v.browseName,
          displayName: v.displayName,
          description: v.description ? v.description : '',
          dataType: v.dataType,
        };
        if (v.valueParams) {
          valueParams = loMerge({}, v.valueParams);
          if (v.valueParams.engineeringUnits) {
            engineeringUnit = getEngineeringUnit(v.valueParams.engineeringUnits, this.locale);
            if (engineeringUnit) {
              valueParams.engineeringUnits = engineeringUnit;
            }
          }
          // Value params merge 
          loMerge(varParams, valueParams);
        }
        // Add variables
        if (v.type === 'variable.analog') {
          addedVariable = namespace.addAnalogDataItem(varParams);
        } else {
          addedVariable = namespace.addVariable(varParams);
        }

        // Set aliasName to addedVariable
        loMerge(addedVariable, v.aliasName ? { aliasName: v.aliasName } : {});

        // Add addedVariable to addedItemList
        this.addedItemList.push({
          type: v.type,
          ownerName: v.ownerName,
          nodeId: addedVariable.nodeId.toString(),
          browseName: v.browseName,
          item: addedVariable
        });

        // Push variable to paramsAddressSpace.variables
        currentState.paramsAddressSpace.variables.push(
          loMerge({ nodeId: addedVariable.nodeId.toString() }, v)
        );

        // Install historical DataNode
        if (v.hist) {
          /*
          InstallHistoricalDataNode does a few things for us:
            it instantiate a HA Configuration object
            it sets the historizing flag of the variable
            it starts recording value changes into a small online data storage of 2000 values.
          */
          if (v.hist > 1) {
            const variableHistorianOptions = Object.assign({}, opcuaDefaultVariableHistorianOptions, { maxOnlineValues: v.hist });
            addressSpace.installHistoricalDataNode(addedVariable, variableHistorianOptions);
          } else {
            addressSpace.installHistoricalDataNode(addedVariable, opcuaDefaultVariableHistorianOptions);
          }
        }
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
    getterParams.dataType = variable.dataType;
    if (getterParams.value === null && getterParams.dataType) {
      getterParams.value = getInitValueForDataType(getterParams.dataType);
    }
    // Add "this" to getterParams
    getterParams.myOpcuaServer = this;
    // Add "group" to getterParams.addedVariableList
    if (variable.group) {
      getterParams.addedVariableList = variable.group;
    }

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
    // Set OPCUA value from source
    setOpcuaValueFromSource(addedVariable, valueFromSourceParams);
  }
}

module.exports = OpcuaServer;
