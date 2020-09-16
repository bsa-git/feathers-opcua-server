const errors = require('@feathersjs/errors');
const { inspector } = require('../lib');
const {
  OPCUAClient,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
} = require('node-opcua');
const os = require('os');
const chalk = require('chalk');
const loMerge = require('lodash/merge');

const debug = require('debug')('app:plugins.opcua-client.class');
const isLog = false;
const isDebug = false;

class OpcuaClient {
  /**
   * Constructor
   * @param app {Object}
   * @param params {Object}
   */
  constructor(app, params = {}) {
    const paramsDefault = {
      port: '26543',
      hostname: os.hostname().toLowerCase(),
      nodeIds: [{ name: 'temperature', nodeId: 'ns=1;s=Temperature', attributeId: AttributeIds.Value }],
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
    this.params = loMerge(paramsDefault, params);
    // this.app = Object.assign({}, app);
    this.app = app;
    this.endpointUrl = `opc.tcp://${this.params.hostname}:${this.params.port}`;
    this.opcuaClient = null;
    this.session = null;
    this.subscription = null;
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
   * @param {String} path 
   * e.g. 'RootFolder'
   * @returns {*}
   */
  async sessionBrowse(path) {
    if (!this.session) return;
    try {
      const browseResult = await this.session.browse(path);
      if (isDebug) debug('sessionBrowse.path:', path);
      // if (isLog) inspector('sessionBrowse.browseResult:', browseResult.references);
      if (isLog) console.log(browseResult.references.map((r) => r.browseName.toString()).join('\n'));
      return browseResult;
    } catch (err) {
      const errTxt = 'Error while session browse the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session read
   * @param {String} nameNodeId 
   * e.g. 'temperature'
   * @returns {String}
   */
  async sessionRead(nameNodeId) {
    let result = '';
    if (!this.session) return;
    try {
      const itemNodeId = this.params.nodeIds.find(item => item.name === nameNodeId);
      if (itemNodeId) {
        if (isLog) inspector('plugins.opcua-client.class::sessionRead.itemNodeId:', itemNodeId);
        const dataValue = await this.session.read({ nodeId: itemNodeId.nodeId, attributeId: itemNodeId.attributeId });
        if (isDebug) debug('sessionRead.dataValue:', dataValue.value.value.toString());
        result = dataValue.value.value.toString();
        return result;
      }
      return result;
    } catch (err) {
      const errTxt = 'Error while session read the OPS-UA client:';
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
