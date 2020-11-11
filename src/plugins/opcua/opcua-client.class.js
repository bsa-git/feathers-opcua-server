/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { inspector, isString, getBrowseNameFromNodeId, appRoot } = require('../lib');
const {
  OPCUAClient,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
  BrowseDirection,
  Variant,
  StatusCodes
} = require('node-opcua');

const defaultClientOptions = require(`${appRoot}/src/api/opcua/OPCUAClientOptions`);
const defaultSubscriptionOptions = require(`${appRoot}/src/api/opcua/ClientSubscriptionOptions.json`);
const { defaultItemToMonitor, defaultRequestedParameters, defaultTimestampsToReturn } = require(`${appRoot}/src/api/opcua/ClientSubscriptionMonitorOptions`);

const os = require('os');
const chalk = require('chalk');
const loMerge = require('lodash/merge');
const loConcat = require('lodash/concat');
const moment = require('moment');

// const certificateFile ="../packages/node-opcua-samples/certificates/client_selfsigned_cert_2048.pem";
// const privateKeyFile ="../packages/node-opcua-samples/certificates/client_key_2048.pem";

const debug = require('debug')('app:plugins.opcua-client.class');
const isLog = false;
const isDebug = false;

/**
 * Params default
 */
const paramsDefault = {
  port: '26543',
  hostname: os.hostname().toLowerCase(),
  endpointUrl: '',
  nodeIds: [
    { name: 'Device1.Temperature', nodeId: 'ns=1;s=Device1.Temperature' },
    { name: 'Device1.Variable2', nodeId: 'ns=1;s=Device1.Variable2' },
    { name: 'Device1.Variable3', nodeId: 'ns=1;s=Device1.Variable3' },
    { name: 'Device1.PercentageMemoryUsed', nodeId: 'ns=1;s=Device1.PercentageMemoryUsed' },
    { name: 'Device1.VariableForWrite', nodeId: 'ns=1;s=Device1.VariableForWrite' },
    { name: 'Device1.SumMethod', objectId: 'ns=1;i=1000', methodId: 'ns=1;s=Device1.SumMethod' },
    { name: 'Device2.PressureVesselDevice', nodeId: 'ns=1;s=Device2.PressureVesselDevice' },
    // { name: 'Device3.SumMethod', objectId: { identifierType: 1, value: 1014, namespace: 1 }, methodId: 'ns=1;s=Device3.SumMethod' },
    { name: 'Device3.SumMethod', objectId: 'ns=1;i=1014', methodId: 'ns=1;s=Device3.SumMethod' },
    {
      name: 'browseObjectsFolder', browseDescriptions: {
        nodeId: 'ObjectsFolder',
        referenceTypeId: 'Organizes',
        browseDirection: BrowseDirection.Inverse,
        includeSubtypes: true,
        nodeClassMask: 0,
        resultMask: 63
      }
    },
  ],
  endpoint_must_exist: false,
  connectionStrategy: {
    maxRetry: 2,
    initialDelay: 2000,
    maxDelay: 10 * 1000
  },
  subscription: {
    create: {
      requestedPublishingInterval: 1000,
      requestedLifetimeCount: 10,
      requestedMaxKeepAliveCount: 2,
      maxNotificationsPerPublish: 10,
      publishingEnabled: true,
      priority: 10
    },
    monitor: {
      samplingInterval: 1000,
      discardOldest: true,
      queueSize: 10
    },
    timestampsToReturn: TimestampsToReturn.Both
  }
};

class OpcuaClient {
  /**
   * Constructor
   * @param app {Object}
   * @param params {Object}
   */
  constructor(app, params = {}) {
    this.params = loMerge(defaultClientOptions, params);
    this.app = app;
    this.SrvCurrentState = null;
    this.opcuaClient = null;
    this.session = null;
    this.subscription = null;
    if (isDebug) debug('OpcuaClient created - OK');
  }

  /**
   * Create opc-ua client
   */
  create() {
    try {
      // Create OPCUAClient
      this.opcuaClient = OPCUAClient.create(this.params);

      // Retrying connection
      this.opcuaClient.on('backoff', (retry) => console.log(chalk.yellow('Retrying to connect to:'), this.SrvCurrentState.endpointUrl, ' attempt: ', retry));

    } catch (err) {
      const errTxt = 'Error while creating the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Connect opc-ua client to server
   * @param params {Object}
   */
  async connect(params = {}) {
    if (!this.opcuaClient || !params.endpointUrl) return;
    try {
      await this.opcuaClient.connect(params.endpointUrl);
      this.SrvCurrentState = params;
      console.log(chalk.yellow('Client connected to:'), chalk.cyan(params.endpointUrl));
    } catch (err) {
      const errTxt = 'Error while connect the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
  * Client disconnect
  */
  async disconnect() {
    if (!this.opcuaClient) return;
    try {
      await this.opcuaClient.disconnect();
      console.log(chalk.yellow('Client disconnect from:'), chalk.cyan(this.SrvCurrentState.endpointUrl));
    } catch (err) {
      const errTxt = 'Error while client disconnect the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Create session opc-ua client
   */
  async sessionCreate() {
    if (!this.opcuaClient) return;
    try {
      this.session = await this.opcuaClient.createSession();
      console.log(chalk.yellow('Client session created'));
      if (isLog) inspector('plugins.opcua-client.class::sessionCreate.info:', this.sessionToString());
    } catch (err) {
      const errTxt = 'Error while create session the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Close session opc-ua client
   */
  async sessionClose() {
    if (!this.session) return;
    try {
      await this.session.close();
      this.session = null;
      console.log(chalk.yellow('Client session closed'));
    } catch (err) {
      const errTxt = 'Error while create session the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
 * Session to string
 * @returns {String}
 */
  sessionToString() {
    if (!this.session) return;
    try {
      return this.session.toString();
    } catch (err) {
      const errTxt = 'Error while Session to string:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Get nodeIds
   * @param {String|Array<String>} nameNodeIds 
   * @returns {Array<String>}
   */
  getNodeIds(nameNodeIds) {
    let itemNodeId = null, itemNodeIds = [];
    if (!this.SrvCurrentState) return null;
    try {
      let nodeIds = this.SrvCurrentState.paramsAddressSpace;
      nodeIds = loConcat(nodeIds.objects, nodeIds.variables, nodeIds.methods);
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach(nameNodeId => {
          if (isString(nameNodeId)) {
            itemNodeId = nodeIds.find(item => item.browseName === nameNodeId);
            if (itemNodeId) {
              itemNodeIds.push(itemNodeId.nodeId);
            } else {
              itemNodeIds.push(nameNodeId);
            }
          } else {
            itemNodeIds.push(nameNodeId);
          }
        });
      } else {
        if (isString(nameNodeIds)) {
          itemNodeId = nodeIds.find(item => item.browseName === nameNodeIds);
          if (itemNodeId) {
            itemNodeIds.push(itemNodeId.nodeId);
          } else {
            itemNodeIds.push(nameNodeIds);
          }
        } else {
          itemNodeIds.push(nameNodeIds);
        }
      }
      if(isDebug) debug('getNodeIds.result:', itemNodeIds);
      return itemNodeIds;
    } catch (err) {
      const errTxt = 'Error while create session the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Read namespace array for session
   * @returns {Promise<string[]}
   */
  async sessionReadNamespaceArray() {
    if (!this.session) return;
    try {
      const result = await this.session.readNamespaceArray();
      if (isLog) inspector('plugin.opcua-client.class::sessionReadNamespaceArray.result:', result);
      // inspector('plugins.opcua-client.class::sessionReadNamespaceArray.result:', result);
      return result;
    } catch (err) {
      const errTxt = 'Error while create session the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session browse
   * 
   * @example
   *
   * ``` javascript
   * await session.browse([ "RootFolder", "ObjectsFolder"]) {
   *       assert(browseResults.length === 2);
   * });
   * ```
   * 
   *  @example
     * ``` javascript
     * const browseDescriptions = [
     * {
     *   nodeId: "ObjectsFolder",
     *   referenceTypeId: "Organizes",
     *   browseDirection: BrowseDirection.Inverse,
     *   includeSubtypes: true,
     *   nodeClassMask: 0,
     *   resultMask: 63
     * },
     * // {...}
     * ]
     *  await session.browse(browseDescriptions) {
     *
     *   });
     * ```
   * 
   * @param {String|Array} nameNodeIds 
   * e.g. 'browseObjectsFolder'|['browseObjectsFolder', 'browseObjectsFolder2']
   * @returns {Promise<Array>}
   */
  async sessionBrowse(nameNodeIds) {
    let result = [], itemNodeId = null, itemNodeIds = [];
    if (!this.session) return;
    try {
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach(nameNodeId => {
          if (isString(nameNodeId)) {
            itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
            if (itemNodeId) {
              itemNodeIds.push(itemNodeId.browseDescriptions);
            } else {
              itemNodeIds.push(nameNodeId);
            }
          } else {
            itemNodeIds.push(nameNodeId);
          }
        });
      } else {
        if (isString(nameNodeIds)) {
          itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
          if (itemNodeId) {
            itemNodeIds.push(itemNodeId.browseDescriptions);
          } else {
            itemNodeIds.push(nameNodeIds);
          }
        } else {
          itemNodeIds.push(nameNodeIds);
        }
      }

      if (itemNodeIds.length) {
        result = await this.session.browse(itemNodeIds);
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionBrowse.result:', result);
      return result;
    } catch (err) {
      const errTxt = 'Error while session browse the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session translate browse path
   * @param {String|Array} browsePaths 
   * @returns {Promise<Array>}
   */
  async sessionTranslateBrowsePath(browsePaths) {
    let result = [];
    if (!this.session) return;
    try {
      if (!Array.isArray(browsePaths)) {
        browsePaths = [browsePaths];
      }
      if (browsePaths.length) {
        result = await this.session.translateBrowsePath(browsePaths);
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionTranslateBrowsePath.result:', result);
      // inspector('plugins.opcua-client.class::sessionTranslateBrowsePath.result:', result);
      return result;
    } catch (err) {
      const errTxt = 'Error while session browse the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session read
   * 
   * @example
   *
   *   ``` javascript
   *   const nodesToRead = [
   *        {
   *             nodeId:      "ns=2;s=Furnace_1.Temperature",
   *             attributeId: AttributeIds.BrowseName
   *        }
   *   ];
   *   await session.read(nodesToRead) {
   *     ...
   *   });
   *   ```
   * 
   * @param {String|Array} nameNodeIds 
   * e.g. 'temperature'| ['temperature', 'pressureVesselDevice']
   * @param {Number} attributeId 
   * e.g. AttributeIds.BrowseName
   * @param {Number} maxAge 
   * @returns {Promise<Array>}
   */
  async sessionRead(nameNodeIds, attributeId = 0, maxAge = 0) {
    let result = [], itemNodeId = null, itemNodeIds = [], dataValues;
    if (!this.session) return;
    try {
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach(nameNodeId => {
          itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
          if (itemNodeId) {
            itemNodeIds.push({ nodeId: itemNodeId.nodeId, attributeId: attributeId ? attributeId : AttributeIds.Value });
          } else {
            itemNodeIds.push({ nodeId: nameNodeId, attributeId: attributeId ? attributeId : AttributeIds.Value });
          }
        });
      } else {
        itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
        if (itemNodeId) {
          itemNodeIds.push({ nodeId: itemNodeId.nodeId, attributeId: attributeId ? attributeId : AttributeIds.Value });
        } else {
          itemNodeIds.push({ nodeId: nameNodeIds, attributeId: attributeId ? attributeId : AttributeIds.Value });
        }
        nameNodeIds = [nameNodeIds];
      }

      if (itemNodeIds.length) {
        if (maxAge) {
          dataValues = await this.session.read(itemNodeIds, maxAge);
        } else {
          dataValues = await this.session.read(itemNodeIds);
        }

        dataValues.forEach((item, index) => item.nameNodeId = nameNodeIds[index]);
        result = dataValues;
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionRead.result:', result);
      // inspector('plugins.opcua-client.class::sessionRead.result:', result);
      return result;
    } catch (err) {
      const errTxt = 'Error while session read the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session read all attributes
   * 
   * @example
   *
   *  ``` javascript
     *  session.readAllAttributes("ns=2;s=Furnace_1.Temperature",function(err,data) {
     *    if(data.statusCode === StatusCodes.Good) {
     *      console.log(" nodeId      = ",data.nodeId.toString());
     *      console.log(" browseName  = ",data.browseName.toString());
     *      console.log(" description = ",data.description.toString());
     *      console.log(" value       = ",data.value.toString()));
     *    }
     *  });
     *  ```
   * 
   * @param {String|Array} nameNodeIds 
   * e.g. 'temperature'| ['temperature', 'pressureVesselDevice']
   * @returns {void}
   */
  sessionReadAllAttributes(nameNodeIds, callback) {
    let itemNodeId = null, itemNodeIds = [];
    if (!this.session) return;
    try {
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach(nameNodeId => {
          itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
          if (itemNodeId) {
            itemNodeIds.push(itemNodeId.nodeId);
          } else {
            itemNodeIds.push(nameNodeId);
          }
        });
      } else {
        itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
        if (itemNodeId) {
          itemNodeIds.push(itemNodeId.nodeId);
        } else {
          itemNodeIds.push(nameNodeIds);
        }
      }

      if (itemNodeIds.length) {
        this.session.readAllAttributes(itemNodeIds, callback);
      }
    } catch (err) {
      const errTxt = 'Error while session read the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
  * Session read variable value
  * @param {String|Array} nameNodeIds 
  * e.g. 'temperature'| ['temperature', 'pressureVesselDevice']
  * @returns {Promise<Array>}
  */
  async sessionReadVariableValue(nameNodeIds) {
    let result = []; //itemNodeId = null, itemNodeIds = [], dataValues;
    if (!this.session) return;
    try {
      // if (Array.isArray(nameNodeIds)) {
      //   nameNodeIds.forEach(nameNodeId => {
      //     itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
      //     if (itemNodeId) {
      //       itemNodeIds.push(itemNodeId.nodeId);
      //     } else {
      //       itemNodeIds.push(nameNodeId);
      //     }
      //   });
      // } else {
      //   itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
      //   if (itemNodeId) {
      //     itemNodeIds.push(itemNodeId.nodeId);
      //   } else {
      //     itemNodeIds.push(nameNodeIds);
      //   }
      //   nameNodeIds = [nameNodeIds];
      // }
      const itemNodeIds = this.getNodeIds(nameNodeIds);
      debug('itemNodeIds:', itemNodeIds);

      if (itemNodeIds.length) {
        // dataValues = await this.session.readVariableValue(itemNodeIds);
        // dataValues.forEach((item, index) => item.nameNodeId = nameNodeIds[index]);
        // result = dataValues;
        result = await this.session.readVariableValue(itemNodeIds);
      }
      if (isLog) inspector('opcua-client.class::sessionReadVariableValue:', result);
      return result;
    } catch (err) {
      const errTxt = 'Error while session read the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session read history values
   * @param {String|Array} nameNodeIds 
   * e.g. 'temperature'| ['temperature', 'pressureVesselDevice']
   * @param {String} start 
   * @param {String} end 
   * @return {Promise<Array>}
   */
  async sessionReadHistoryValues(nameNodeIds, start, end) {
    let result = [], itemNodeId = null, itemNodeIds = [], dataValues;
    if (!this.session) return;
    try {
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach(nameNodeId => {
          itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
          if (itemNodeId) {
            itemNodeIds.push(itemNodeId.nodeId);
          } else {
            itemNodeIds.push(nameNodeId);
          }
        });
      } else {
        itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
        if (itemNodeId) {
          itemNodeIds.push(itemNodeId.nodeId);
        } else {
          itemNodeIds.push(nameNodeIds);
        }
        nameNodeIds = [nameNodeIds];
      }

      if (itemNodeIds.length) {
        dataValues = await this.session.readHistoryValue(itemNodeIds, start, end);
        dataValues.forEach((item, index) => item.nameNodeId = nameNodeIds[index]);
        result = dataValues;
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionReadHistoryValue.result:', result);
      return result;
    } catch (err) {
      const errTxt = 'Error while session read the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Get monitored items for subscription
   * @param {UInt32} subscriptionId 
   * @returns {Promise<MonitoredItemData>}
   */
  async sessionGetMonitoredItems(subscriptionId) {
    if (!this.session) return;
    try {
      const monitoredItems = await this.session.getMonitoredItems(subscriptionId);
      if (isLog) inspector('plugins.opcua-client.class::subscriptionGetMonitoredItems.monitoredItems:', monitoredItems);
      // inspector('plugins.opcua-client.class::subscriptionGetMonitoredItems.monitoredItems:', monitoredItems);
      return monitoredItems;
    } catch (err) {
      const errTxt = 'Error while subscription get monitored items:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session write single node
   * @param {String} nameNodeId 
   * @param {Variant} variantValue 
   * @returns {Promise<StatusCode>}
   */
  async sessionWriteSingleNode(nameNodeId, variantValue) {
    if (!this.session) return;
    try {
      const itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
      const nodeId = itemNodeId ? itemNodeId.nodeId : nameNodeId;
      const statusCode = await this.session.writeSingleNode(nodeId, variantValue);
      if (isLog) inspector('plugins.opcua-client.class::sessionWriteSingleNode.statusCode:', statusCode);
      return statusCode;
    } catch (err) {
      const errTxt = 'Error while subscription monitor the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session write
   * 
   * @example :
   *
   *     const nodesToWrite = [
   *     {
   *          nodeId: "ns=1;s=SetPoint1",
   *          attributeId: opcua.AttributeIds.Value,
   *          value: {
   *             statusCode: Good,
   *             value: {
   *               dataType: opcua.DataType.Double,
   *               value: 100.0
   *             }
   *          }
   *     },
   *     {
   *          nodeId: "ns=1;s=SetPoint2",
   *          attributeIds opcua.AttributeIds.Value,
   *          value: {
   *             statusCode: Good,
   *             value: {
   *               dataType: opcua.DataType.Double,
   *               value: 45.0
   *             }
   *          }
   *     }
   *     ];
   * 
   *     const statusCodes = await session.write(nodesToWrite);
   * 
   * @param {String|Object|Array} nameNodeIds 
   * @param {Array<Variant>} valuesToWrite 
   * @returns {Promise<Array<StatusCode>>}
   */
  async sessionWrite(nameNodeIds, valuesToWrite = []) {
    let statusCodes = [], itemNodeId = null, itemNodeIds = [];
    if (!this.session) return;
    try {
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach((nameNodeId, index) => {
          if (isString(nameNodeId)) {
            itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
            if (itemNodeId) {
              itemNodeIds.push(Object.assign({ nodeId: itemNodeId.nodeId }, valuesToWrite[index]));
            }
          } else {
            itemNodeIds.push(nameNodeId);
          }
        });
      } else {
        if (isString(nameNodeIds)) {
          itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
          if (itemNodeId) {
            itemNodeIds.push(Object.assign({ nodeId: itemNodeId.nodeId }, valuesToWrite[0]));
          }
        } else {
          itemNodeIds.push(nameNodeIds);
        }
      }

      if (itemNodeIds.length) {
        statusCodes = await this.session.write(itemNodeIds);
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionWrite.statusCodes:', statusCodes);
      return statusCodes;
    } catch (err) {
      const errTxt = 'Error while session call method:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session call method
   * 
   * @example :
   *
   * ```javascript
   * const methodsToCall = [ {
   *     objectId: 'ns=2;i=12',
   *     methodId: 'ns=2;i=13',
   *     inputArguments: [
   *         new Variant({...}),
   *         new Variant({...}),
   *     ]
   * }];
   * session.call(methodsToCall,function(err,callResutls) {
   *    if (!err) {
   *         const callResult = callResutls[0];
   *         console.log(' statusCode = ',rep.statusCode);
   *         console.log(' inputArgumentResults[0] = ',callResult.inputArgumentResults[0].toString());
   *         console.log(' inputArgumentResults[1] = ',callResult.inputArgumentResults[1].toString());
   *         console.log(' outputArgument[0]       = ',callResult.outputArgument[0].toString()); // array of variant
   *    }
   * });
   * ```
   * 
   * @param {String|Object|Array} nameNodeIds 
   * @param {Array<Variant>} inputArguments 
   * @returns {Promise<CallMethodResult[]>}
   */
  async sessionCallMethod(nameNodeIds, inputArguments = []) {
    let result = [], itemNodeId = null, itemNodeIds = [];
    if (!this.session) return;
    try {
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach((nameNodeId, index) => {
          if (isString(nameNodeId)) {
            itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
            if (itemNodeId) {
              itemNodeIds.push({ objectId: itemNodeId.objectId, methodId: itemNodeId.methodId, inputArguments: inputArguments[index] });
            }
          } else {
            itemNodeIds.push(nameNodeId);
          }
        });
      } else {
        if (isString(nameNodeIds)) {
          itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
          if (itemNodeId) {
            itemNodeIds.push({ objectId: itemNodeId.objectId, methodId: itemNodeId.methodId, inputArguments });
          }
        } else {
          itemNodeIds.push(nameNodeIds);
        }
      }

      if (itemNodeIds.length) {
        result = await this.session.call(itemNodeIds);
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionCallMethod.result:', result);
      // inspector('plugins.opcua-client.class::sessionCallMethod.result:', result);
      return result;
    } catch (err) {
      const errTxt = 'Error while session call method:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
 * Get arguments definition for session
 * 
 * @param {String} nameNodeId 
 * @returns {Promise<ArgumentDefinition>}
 */
  async sessionGetArgumentDefinition(nameNodeId) {
    if (!this.session) return;
    try {
      const itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
      const methodId = itemNodeId ? itemNodeId.methodId : nameNodeId;
      const argumentsDefinition = await this.session.getArgumentDefinition(methodId);
      if (isLog) inspector('plugins.opcua-client.class::sessionGetArgumentDefinition.argumentsDefinition:', argumentsDefinition);
      // inspector('plugins.opcua-client.class::sessionGetArgumentDefinition.argumentsDefinition:', argumentsDefinition);
      return argumentsDefinition;
    } catch (err) {
      const errTxt = 'Error while subscription get monitored items:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
  * Subscription create
  * @method createSubscription
  * @async
  *
  * @example
  *
  *    ```js
  *    const options = {
  *      requestedPublishingInterval: 100,
  *      requestedLifetimeCount:      60,
  *      requestedMaxKeepAliveCount:    10,
  *      maxNotificationsPerPublish:  1000,
  *      publishingEnabled:           true,
  *      priority:                    1
  *    };
  *    const subscription = ClientSubscription.create(this.session, options);
  *    ```
  */
  subscriptionCreate(options = {}) {
    if (!this.session) return;
    try {
      const mergeOptions = loMerge(defaultSubscriptionOptions, options);
      this.subscription = ClientSubscription.create(this.session, mergeOptions);

      this.subscription
        .on('started', () => console.log(chalk.yellow('Client subscription started.') + ' SubscriptionId=', this.subscription.subscriptionId))
        .on('keepalive', () => console.log(chalk.yellow('Client subscription keepalive')))
        .on('terminated', () => console.log(chalk.yellow('Client subscription terminated')));
    } catch (err) {
      const errTxt = 'Error while subscription create the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
  * Subscription terminate
  */
  async subscriptionTerminate() {
    if (!this.subscription) return;
    try {
      await this.subscription.terminate();
    } catch (err) {
      const errTxt = 'Error while subscription terminate the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
     * Add a monitor item to the subscription
     *
     * @method monitor
     * @async
     * @param options.itemToMonitor                        {ReadValueId}
     * @param options.itemToMonitor.nodeId                 {NodeId}
     * @param options.itemToMonitor.attributeId            {AttributeId}
     * @param options.itemToMonitor.indexRange             {null|NumericRange}
     * @param options.itemToMonitor.dataEncoding
     * @param options.requestedParameters                  {MonitoringParameters}
     * @param options.requestedParameters.clientHandle     {IntegerId}
     * @param options.requestedParameters.samplingInterval {Duration}
     * @param options.requestedParameters.filter           {ExtensionObject|null} EventFilter/DataChangeFilter
     * @param options.requestedParameters.queueSize        {Counter}
     * @param options.requestedParameters.discardOldest    {Boolean}
     * @param options.timestampsToReturn                   {TimestampsToReturn} //{TimestampsToReturnId}
     * @param  cb                                          {Function} optional done callback
     * @return {ClientMonitoredItem}
     *
     *
     * Monitoring a simple Value Change
     * ---------------------------------
     *
     * @example:
     *
     *   clientSubscription.monitor(
     *     // itemToMonitor:
     *     {
     *       nodeId: "ns=0;i=2258",
     *       attributeId: AttributeIds.Value,
     *       indexRange: null,
     *       dataEncoding: { namespaceIndex: 0, name: null }
     *     },
     *     // requestedParameters:
     *     {
     *        samplingInterval: 3000,
     *        filter: null,
     *        queueSize: 1,
     *        discardOldest: true
     *     },
     *     TimestampsToReturn.Neither
     *   );
     *
     * Monitoring a Value Change With a DataChange  Filter
     * ---------------------------------------------------
     *
     * options.trigger       {DataChangeTrigger} {Status|StatusValue|StatusValueTimestamp}
     * options.deadbandType  {DeadbandType}      {None|Absolute|Percent}
     * options.deadbandValue {Double}
     *
     * @example:
     *
     *   clientSubscription.monitor(
     *     // itemToMonitor:
     *     {
     *       nodeId: "ns=0;i=2258",
     *       attributeId: AttributeIds.Value,
     *     },
     *     // requestedParameters:
     *     {
     *        samplingInterval: 3000,
     *        filter: new DataChangeFilter({
     *             trigger: DataChangeTrigger.StatusValue,
     *             deadbandType: DeadbandType.Absolute,
     *             deadbandValue: 0.1
     *        }),
     *        queueSize: 1,
     *        discardOldest: true
     *     },
     *     TimestampsToReturn.Neither
     *   );
     *
     *
     * Monitoring an Event
     * -------------------
     *
     *  If the monitor attributeId is EventNotifier then the filter must be specified
     *
     * @example:
     *
     *  var filter =  new EventFilter({
     *    selectClauses: [
     *             { browsePath: [ {name: 'ActiveState'  }, {name: 'id'}  ]},
     *             { browsePath: [ {name: 'ConditionName'}                ]}
     *    ],
     *    whereClause: []
     *  });
     *
     *  clientSubscription.monitor(
     *     // itemToMonitor:
     *     {
     *       nodeId: "ns=0;i=2258",
     *       attributeId: AttributeIds.EventNotifier,
     *       indexRange: null,
     *       dataEncoding: { namespaceIndex: 0, name: null }
     *     },
     *     // requestedParameters:
     *     {
     *        samplingInterval: 3000,
     *
     *        filter: filter,
     *
     *        queueSize: 1,
     *        discardOldest: true
     *     },
     *     TimestampsToReturn.Neither
     *   );
     */
  async subscriptionMonitor(options = {}, cb) {// itemToMonitor = {}, requestedParameters = {}, timestampsToReturn,
    if (!this.subscription) return;
    try {
      const mergeItemToMonitor = loMerge(defaultItemToMonitor, options.itemToMonitor);
      const mergeRequestedParameters = options.requestedParameters ? loMerge(defaultRequestedParameters, options.requestedParameters) : defaultRequestedParameters;
      const mergeTimestampsToReturn = options.timestampsToReturn ? options.timestampsToReturn : defaultTimestampsToReturn;

      const monitoredItem = await this.subscription.monitor(
        mergeItemToMonitor,
        mergeRequestedParameters,
        mergeTimestampsToReturn
      );
      if (isLog) inspector('opcua-client.class::subscriptionMonitor.monitoredItem:', monitoredItem);

      monitoredItem.on('changed', (dataValue) => {
        const nameNodeId = getBrowseNameFromNodeId(mergeItemToMonitor.nodeId);
        // debug('subscriptionMonitor.nameNodeId:', nameNodeId); 
        if (isLog) inspector(`opcua-client.class::subscriptionMonitor.${nameNodeId}:`, dataValue);
        cb(mergeItemToMonitor.nodeId, dataValue);
      });
    } catch (err) {
      const errTxt = 'Error while subscription monitor the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }
}

module.exports = OpcuaClient;
