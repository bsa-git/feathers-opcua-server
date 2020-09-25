const errors = require('@feathersjs/errors');
const { inspector, isString } = require('../lib');
const {
  OPCUAClient,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
  BrowseDirection
} = require('node-opcua');
const os = require('os');
const chalk = require('chalk');
const loMerge = require('lodash/merge');
// const moment = require('moment');

const debug = require('debug')('app:plugins.opcua-client.class');
const isLog = false;
const isDebug = false;

/**
 * Params default
 */
const paramsDefault = {
  port: '26543',
  hostname: os.hostname().toLowerCase(),
  nodeIds: [
    { name: 'temperature', nodeId: 'ns=1;s=Temperature', attributeId: AttributeIds.Value },
    { name: 'myVariable2', nodeId: 'ns=1;s=MyVariable2', attributeId: AttributeIds.Value },
    { name: 'myVariable3', nodeId: 'ns=1;s=MyVariable3', attributeId: AttributeIds.Value },
    { name: 'percentageMemoryUsed', nodeId: 'ns=1;b=1020ffab', attributeId: AttributeIds.Value },
    { name: 'pressureVesselDevice', nodeId: 'ns=1;s=PressureVesselDevice', attributeId: AttributeIds.Value },
    { name: 'variableForWrite', nodeId: 'ns=1;s=VariableForWrite', attributeId: AttributeIds.Value },
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
    this.params = loMerge(paramsDefault, params);
    this.app = app;
    this.endpointUrl = `opc.tcp://${this.params.hostname}:${this.params.port}`;
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
      this.opcuaClient = OPCUAClient.create({
        endpoint_must_exist: this.params.endpoint_must_exist,
        connectionStrategy: this.params.connectionStrategy
      });

      // Retrying connection
      this.opcuaClient.on('backoff', (retry) => console.log(chalk.yellow('Retrying to connect to:'), this.endpointUrl, ' attempt: ', retry));

    } catch (err) {
      const errTxt = 'Error while creating the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Connect opc-ua client to server
   */
  async connect() {
    if (!this.opcuaClient) return;
    try {
      await this.opcuaClient.connect(this.endpointUrl);
      console.log(chalk.yellow('Client connected to:'), chalk.cyan(this.endpointUrl));
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
      console.log(chalk.yellow('Client disconnect from:'), chalk.cyan(this.endpointUrl));
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
            itemNodeIds.push({ nodeId: itemNodeId.nodeId, attributeId: attributeId ? attributeId : itemNodeId.attributeId });
          }
        });
      } else {
        itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
        nameNodeIds = [nameNodeIds];
        if (itemNodeId) itemNodeIds.push({ nodeId: itemNodeId.nodeId, attributeId: attributeId ? attributeId : itemNodeId.attributeId });
      }

      if (itemNodeIds.length) {
        if (maxAge) {
          dataValues = await this.session.read(itemNodeIds, maxAge);
        } else {
          dataValues = await this.session.read(itemNodeIds);
        }

        dataValues.forEach((item, index) => item.nameNodeId = nameNodeIds[index]);
        result = dataValues.map(item => {
          return {
            nameNodeId: item.nameNodeId,
            statusCode: item.statusCode,
            value: {
              dataType: item.value.dataType,
              value: item.value.value
            },
          };
        });
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
  * Session read variable value
  * @param {String|Array} nameNodeIds 
  * e.g. 'temperature'| ['temperature', 'pressureVesselDevice']
  * @returns {Promise<Array>}
  */
  async sessionReadVariableValue(nameNodeIds) {
    let result = [], itemNodeId = null, itemNodeIds = [], dataValues;
    if (!this.session) return;
    try {
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach(nameNodeId => {
          itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
          if (itemNodeId) {
            itemNodeIds.push(itemNodeId.nodeId);
          }
        });
      } else {
        itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
        nameNodeIds = [nameNodeIds];
        if (itemNodeId) itemNodeIds.push(itemNodeId.nodeId);
      }

      if (itemNodeIds.length) {
        dataValues = await this.session.readVariableValue(itemNodeIds);
        dataValues.forEach((item, index) => item.nameNodeId = nameNodeIds[index]);
        result = dataValues.map(item => {
          return {
            nameNodeId: item.nameNodeId,
            statusCode: item.statusCode,
            value: {
              dataType: item.value.dataType,
              value: item.value.value
            },
          };
        });
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionReadVariableValue.result:', result);
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
   * @param {Boolean} statusGood 
   * @return {Promise<Array>}
   */
  async sessionReadHistoryValues(nameNodeIds, start, end, statusGood = false) {
    let result = [], itemNodeId = null, itemNodeIds = [], dataValues;
    if (!this.session) return;
    try {
      if (Array.isArray(nameNodeIds)) {
        nameNodeIds.forEach(nameNodeId => {
          itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
          if (itemNodeId) {
            itemNodeIds.push(itemNodeId.nodeId);
          }
        });
      } else {
        itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeIds);
        nameNodeIds = [nameNodeIds];
        if (itemNodeId) itemNodeIds.push(itemNodeId.nodeId);
      }

      if (itemNodeIds.length) {
        dataValues = await this.session.readHistoryValue(itemNodeIds, start, end);
        dataValues.forEach((item, index) => item.nameNodeId = nameNodeIds[index]);
        if (statusGood) {
          dataValues = dataValues.filter(val => val.statusCode.name === 'Good');
          dataValues = dataValues.map(item => {
            return {
              nameNodeId: item.nameNodeId,
              values: item.historyData.dataValues.filter(dataValue => dataValue.statusCode.name === 'Good')
            };
          });
          result = dataValues.map(item => {
            return {
              nameNodeId: item.nameNodeId,
              values: item.values.map(val => {
                return {
                  dataType: val.value.dataType,
                  value: val.value.value,
                  timestamp: val.sourceTimestamp
                };
              })
            };
          });
        } else {
          result = dataValues.map(item => {
            return {
              nameNodeId: item.nameNodeId,
              statusCode: item.statusCode,
              values: item.historyData.dataValues.map(val => {
                return {
                  statusCode: val.statusCode,
                  dataType: val.value.dataType,
                  value: val.value.value,
                  timestamp: val.sourceTimestamp
                };
              })
            };
          });
        }
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionReadHistoryValue.result:', result);
      // inspector('plugins.opcua-client.class::sessionReadHistoryValue.result:', result);
      return result;
    } catch (err) {
      const errTxt = 'Error while session read the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  async sessionWriteSingleNode(nameNodeId, variantValue) {
    if (!this.session) return;
    try {
      const itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
      if (itemNodeId) {
        const statusCode = await this.session.writeSingleNode(itemNodeId.nodeId, variantValue);
        if (isLog) inspector('plugins.opcua-client.class::sessionWriteSingleNode.statusCode:', statusCode);
        return statusCode;
      }
    } catch (err) {
      const errTxt = 'Error while subscription monitor the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
  * Subscription create
  */
  subscriptionCreate() {
    if (!this.session) return;
    try {
      this.subscription = ClientSubscription.create(this.session, this.params.subscription.create);

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
  * Subscription monitor
  * @param {String} nameNodeId
  * @param {Function} cb
  * e.g. 'temperature'
  */
  async subscriptionMonitor(nameNodeId, cb) {
    if (!this.subscription) return;
    try {
      const itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
      if (itemNodeId) {
        if (isLog) inspector('plugins.opcua-client.class::subscriptionMonitor.itemNodeId:', itemNodeId);
        const monitoredItem = await this.subscription.monitor(
          {
            nodeId: itemNodeId.nodeId,
            attributeId: itemNodeId.attributeId
          },
          this.params.subscription.monitor,
          this.params.subscription.timestampsToReturn
        );

        // monitoredItem.on("changed", (dataValue) => console.log(` Temperature = ${dataValue.value.value.toString()}`));
        monitoredItem.on('changed', (dataValue) => cb(nameNodeId, dataValue.value.value.toString()));
      }
    } catch (err) {
      const errTxt = 'Error while subscription monitor the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }
}

module.exports = OpcuaClient;
