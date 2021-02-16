/* eslint-disable no-unused-vars */
const { inspector, isString, isObject, appRoot } = require('../lib');
const { 
  getOpcuaConfig, 
  getSubscriptionHandler,
  formatHistoryResults
} = require('./opcua-helper');
const {
  OPCUAClient,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
  Variant,
} = require('node-opcua');

const moment = require('moment');

const defaultClientOptions = require(`${appRoot}/src/api/opcua/OPCUAClientOptions`);
const defaultSubscriptionOptions = require(`${appRoot}/src/api/opcua/ClientSubscriptionOptions.json`);
const { defaultItemToMonitor, defaultRequestedParameters } = require(`${appRoot}/src/api/opcua/ClientSubscriptionMonitorOptions`);
const defaultBrowseDescriptionLike = require(`${appRoot}/src/api/opcua/ClientBrowseDescriptionLike`);
const defaultReadValueIdOptions = require(`${appRoot}/src/api/opcua/ReadValueIdOptions`);

const chalk = require('chalk');
const loMerge = require('lodash/merge');
const loConcat = require('lodash/concat');

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
    this.id = params.applicationName;
    // Get opcua config
    const opcuaConfig = getOpcuaConfig(this.id);
    this.locale = (params.locale === undefined)? process.env.LOCALE : params.locale;
    params.clientName = opcuaConfig.name;
    this.params = loMerge(defaultClientOptions, params);
    this.app = app;
    this.srvCurrentState = null;
    this.currentState = {
      id: this.id,
      locale: this.locale,
      clientName: this.params.clientName,
      port: null,
      endpointUrl: '',
      isCreated: false,
      isConnect: false,
      isSessionCreated: false,
      isSubscriptionCreated: false
    };
    this.opcuaClient = null;
    this.session = null;
    this.subscription = null;
    if (isDebug) debug('OpcuaClient created - OK');
  }

  /**
   * @method opcuaClientNotCreated
   * OPC-UA client not created
   */
  opcuaClientNotCreated() {
    if (!this.opcuaClient) {
      throw new Error('OPC-UA client not created');
    }
  }

  /**
   * Session not created
   */
  sessionNotCreated() {
    if (!this.session) {
      throw new Error('Session not created');
    }
  }

  /**
   * Subscription not created
   */
  subscriptionNotCreated() {
    if (!this.subscription) {
      throw new Error('Subscription not created');
    }
  }

  /**
   * @method opcuaClientCreate
   * Create opc-ua client
   * 
   * @param {Object} params
   */
  opcuaClientCreate(params = null) {
    // Create OPCUAClient
    params = params ? params : this.params;
    this.opcuaClient = OPCUAClient.create(this.params);
    // Retrying connection
    this.opcuaClient.on('backoff', (retry) => console.log(chalk.yellow('Retrying to connect to:'), this.srvCurrentState.endpointUrl, ' attempt: ', retry));

    this.currentState.isCreated = true;
  }

  /**
   * @method opcuaClientConnect
   * @async
   * Connect opc-ua client to server
   * 
   * @param params {Object}
   */
  async opcuaClientConnect(params = {}) {
    this.opcuaClientNotCreated();
    await this.opcuaClient.connect(params.endpointUrl);
    this.srvCurrentState = params;
    this.currentState.isConnect = true;
    this.currentState.endpointUrl = params.endpointUrl;
    this.currentState.port = params.endpointUrl.split(':')[2];
    console.log(chalk.yellow('Client connected to:'), chalk.cyan(params.endpointUrl));
  }

  /**
   * @method opcuaClientDisconnect
   *  @async
   * Client disconnect
   */
  async opcuaClientDisconnect() {
    this.opcuaClientNotCreated();
    await this.opcuaClient.disconnect();
    this.currentState.isConnect = false;
    this.currentState.endpointUrl = '';
    this.currentState.port = null;
    console.log(chalk.yellow('Client disconnect from:'), chalk.cyan(this.srvCurrentState.endpointUrl));
  }

  /**
   * Create session opc-ua client
   * @async
   */
  async sessionCreate() {
    this.opcuaClientNotCreated();
    this.session = await this.opcuaClient.createSession();
    this.currentState.isSessionCreated = true;
    console.log(chalk.yellow('Client session created'));
    if (isLog) inspector('plugins.opcua-client.class::sessionCreate.info:', this.sessionToString());
  }

  /**
   * Close session opc-ua client
   * @async
   */
  async sessionClose() {
    this.sessionNotCreated();
    await this.session.close();
    this.session = null;
    this.currentState.isSessionCreated = false;
    console.log(chalk.yellow('Client session closed'));
  }

  /**
   * Get current state
   * @returns {Object}
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Get server current state
   * @returns {Object}
   */
  getSrvCurrentState() {
    return this.srvCurrentState;
  }

  /**
   * Get client info
   */
  getClientInfo() {
    return {
      currentState: this.currentState,
      srvCurrentState: this.srvCurrentState,
      session: this.session ? this.sessionToString() : null,
      endpoint: this.session && this.session.endpoint ? this.sessionEndpoint() : null,
      subscription: this.subscription ? this.subscriptionToString() : null,
    };
  }

  /**
 * Session to string
 * @returns {String}
 */
  sessionToString() {
    this.sessionNotCreated();
    return this.session.toString();
  }

  /**
   * Session endpoint
   * 
   * endpointUrl               UAString            : opc.tcp://M5-0095488.OSTCHEM.COM.UA:26543
   * server                    ApplicationDescri   : {
   applicationUri              UAString            : urn:NodeOPCUA-Server-default
   productUri                  UAString            : NodeOPCUA-Server
   applicationName             LocalizedText       : locale=null text=NodeOPCUA
   applicationType             ApplicationType     : ApplicationType.Server (0)
   gatewayServerUri            UAString            : 
   discoveryProfileUri         UAString            : 
   discoveryUrls               UAString         [] : [ empty ] }
 serverCertificate             ByteString       BUFFER
 securityMode                  MessageSecurityMo   : MessageSecurityMode.None (1)
 securityPolicyUri             UAString            : http://opcfoundation.org/UA/SecurityPolicy#None
 userIdentityTokens            UserTokenPolicy  [] : [
   { 0
     policyId                  UAString            : username_basic256
     tokenType                 UserTokenType       : UserTokenType.UserName (1)
     issuedTokenType           UAString            : null
     issuerEndpointUrl         UAString            : null
     securityPolicyUri         UAString            : http://opcfoundation.org/UA/SecurityPolicy#Basic256
   },
   { 1
     policyId                  UAString            : username_basic128Rsa15
     tokenType                 UserTokenType       : UserTokenType.UserName (1)
     issuedTokenType           UAString            : null
     issuerEndpointUrl         UAString            : null
     securityPolicyUri         UAString            : http://opcfoundation.org/UA/SecurityPolicy#Basic128Rsa15
   },
   { 2
     policyId                  UAString            : username_basic256Sha256
     tokenType                 UserTokenType       : UserTokenType.UserName (1)
     issuedTokenType           UAString            : null
     issuerEndpointUrl         UAString            : null
     securityPolicyUri         UAString            : http://opcfoundation.org/UA/SecurityPolicy#Basic256Sha256
   },
   { 3
     policyId                  UAString            : certificate_basic256
     tokenType                 UserTokenType       : UserTokenType.UserName (1)
     issuedTokenType           UAString            : null
     issuerEndpointUrl         UAString            : null
     securityPolicyUri         UAString            : http://opcfoundation.org/UA/SecurityPolicy#Basic256
   },
   { 4
     policyId                  UAString            : certificate_basic256Sha256
     tokenType                 UserTokenType       : UserTokenType.Certificate (2)
     issuedTokenType           UAString            : null
     issuerEndpointUrl         UAString            : null
     securityPolicyUri         UAString            : http://opcfoundation.org/UA/SecurityPolicy#Basic256Sha256
   },
   { 5
     policyId                  UAString            : anonymous
     tokenType                 UserTokenType       : UserTokenType.Anonymous (0)
     issuedTokenType           UAString            : null
     issuerEndpointUrl         UAString            : null
     securityPolicyUri         UAString            : null
   }
 ]
 transportProfileUri           UAString            : http://opcfoundation.org/UA-Profile/Transport/uatcp-uasc-uabinary
 securityLevel                 Byte                : 1
  */
  sessionEndpoint() {
    this.sessionNotCreated();
    let result = null;
    const endpoint = (this.session && this.session.endpoint) ? this.session.endpoint : null;
    if (endpoint) {
      result = {
        endpointUrl: endpoint.endpointUrl,
        server: {
          applicationUri: endpoint.server.applicationUri,
          productUri: endpoint.server.productUri,
          applicationName: endpoint.server.applicationName.text,
          applicationType: endpoint.server.applicationType,
          gatewayServerUri: endpoint.server.gatewayServerUri,
          discoveryProfileUri: endpoint.server.discoveryProfileUri,
          discoveryUrls: endpoint.server.discoveryUrls,
        },
        serverCertificate: endpoint.serverCertificate,
        securityMode: endpoint.securityMode,
        securityPolicyUri: endpoint.securityPolicyUri,
        userIdentityTokens: endpoint.userIdentityTokens,
        transportProfileUri: endpoint.transportProfileUri,
        securityLevel: endpoint.securityLevel
      };
    }
    return result;
  }

  /**
   * Session subscription count
   */
  sessionSubscriptionCount() {
    this.sessionNotCreated();
    const subscriptionCount = this.session.subscriptionCount;
    return subscriptionCount;
  }

  /**
   * Is reconnecting
   */
  sessionIsReconnecting() {
    this.sessionNotCreated();
    const isReconnecting = this.session.isReconnecting;
    return isReconnecting;
  }

  /**
   * Session get publish engine
   */
  sessionGetPublishEngine() {
    this.sessionNotCreated();
    const publishEngine = this.session.getPublishEngine();
    return publishEngine;
  }

  /**
   * Read namespace array for session
   * @async
   * @returns {Promise<string[]}
   */
  async sessionReadNamespaceArray() {
    this.sessionNotCreated();
    const result = await this.session.readNamespaceArray();
    if (isLog) inspector('plugin.opcua-client.class::sessionReadNamespaceArray.result:', result);
    return result;
  }

  /**
   * Session browse
   * @async
   *
   * @example
   *
   *    ```javascript
   *    session.browse("RootFolder",function(err,browseResult) {
   *      if(err) return callback(err);
   *      console.log(browseResult.toString());
   *      callback();
   *    } );
   *    ```
   *
   *
   * @example
   *
   *    ``` javascript
   *    const browseDescription = {
   *       nodeId: "ObjectsFolder",
   *       referenceTypeId: "Organizes",
   *       browseDirection: BrowseDirection.Inverse,
   *       includeSubtypes: true,
   *       nodeClassMask: 0,
   *       resultMask: 63
   *    }
   *    session.browse(browseDescription,function(err, browseResult) {
   *       if(err) return callback(err);
   *       console.log(browseResult.toString());
   *       callback();
   *    });
   *    ```
   * @example
   *
   * ``` javascript
   * session.browse([ "RootFolder", "ObjectsFolder"],function(err, browseResults) {
   *       assert(browseResults.length === 2);
   * });
   * ```
   *
   * @example
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
   *  session.browse(browseDescriptions,function(err, browseResults) {
   *
   *   });
   * ```
   * @param {String|String[]|BrowseDescriptionLike|BrowseDescriptionLike[]} nameNodeIds 
   * @returns {Promise<BrowseResult[]>}
   */
  async sessionBrowse(nameNodeIds) {
    let result = [], itemNodeIds = [];
    this.sessionNotCreated();
    if (Array.isArray(nameNodeIds)) {
      nameNodeIds.forEach(nameNodeId => {
        if (isObject(nameNodeId)) {
          itemNodeIds.push(Object.assign(defaultBrowseDescriptionLike, nameNodeId));
        } else {
          itemNodeIds.push(nameNodeId);
        }
      });
    } else {
      if (isObject(nameNodeIds)) {
        itemNodeIds.push(Object.assign(defaultBrowseDescriptionLike, nameNodeIds));
      } else {
        itemNodeIds.push(nameNodeIds);
      }
    }

    if (itemNodeIds.length) {
      // inspector('sessionBrowse.itemNodeIds:', itemNodeIds);
      result = await this.session.browse(itemNodeIds);
    }
    if (isLog) inspector('plugins.opcua-client.class::sessionBrowse.result:', result);
    return result;
  }

  /**
   * Session translate browse path
   * @async
   * @param {BrowsePath|BrowsePath[]} browsePaths 
   * @returns {Promise<BrowsePathResult[]>}
   */
  async sessionTranslateBrowsePath(browsePaths) {
    let result = [];
    this.sessionNotCreated();
    if (!Array.isArray(browsePaths)) {
      browsePaths = [browsePaths];
    }
    if (browsePaths.length) {
      result = await this.session.translateBrowsePath(browsePaths);
    }
    if (isLog) inspector('plugins.opcua-client.class::sessionTranslateBrowsePath.result:', result);
    // inspector('plugins.opcua-client.class::sessionTranslateBrowsePath.result:', result);
    return result;
  }

  /**
   * Session read
   * @async
   * 
   * @example
   *
   *   ``` javascript
   *   const nodesToRead = [{
   *          nodeId: "ns=2;s=Furnace_1.Temperature",
   *          attributeId: AttributeIds.BrowseName
   *        }];
   *   await session.read(nodesToRead) {
   *     ...
   *   });
   *   ```
   * 
   * @param {String|String[]|ReadValueIdLike|ReadValueIdLike[]} nameNodeIds 
   * e.g. 'Temperature'|
   * ['Temperature', 'Temperature2']|
   * { nodeId: "ns=2;s=Temperature", attributeId: AttributeIds.BrowseName }|
   * [{ nodeId: "ns=2;s=Temperature", attributeId: AttributeIds.Value }, { nodeId: "ns=2;s=Temperature2", attributeId: AttributeIds.BrowseName }]
   * @param {Number|Number[]} attributeIds 
   * e.g. AttributeIds.BrowseName|[AttributeIds.BrowseName, AttributeIds.Value]
   * @param {Number} maxAge 
   * @returns {Promise<DataValue>}
   */
  async sessionRead(nameNodeIds, attributeIds, maxAge = 0) {
    let result = [], itemNodeIds = [], dataValues;
    this.sessionNotCreated();
    // Get nodeIds
    this.getNodeIds(nameNodeIds).forEach((itemNodeId, index) => {
      if (isString(itemNodeId)) {
        if (Array.isArray(attributeIds)) {
          itemNodeIds.push({ nodeId: itemNodeId, attributeId: attributeIds[index] ? attributeIds[index] : AttributeIds.Value });
        } else {
          itemNodeIds.push({ nodeId: itemNodeId, attributeId: attributeIds ? attributeIds : AttributeIds.Value });
        }
      } else {
        if (itemNodeId.attributeId === undefined) {
          if (Array.isArray(attributeIds)) {
            itemNodeIds.push(Object.assign(defaultReadValueIdOptions, itemNodeId, { attributeId: attributeIds[index] ? attributeIds[index] : AttributeIds.Value }));
          } else {
            itemNodeIds.push(Object.assign(defaultReadValueIdOptions, itemNodeId, { attributeId: attributeIds ? attributeIds : AttributeIds.Value }));
          }
        } else {
          itemNodeIds.push(Object.assign(defaultReadValueIdOptions, itemNodeId));
        }
      }
    });

    if (itemNodeIds.length) {
      if (maxAge) {
        dataValues = await this.session.read(itemNodeIds, maxAge);
      } else {
        dataValues = await this.session.read(itemNodeIds);
      }
      result = dataValues;
    }
    if (isLog) inspector('plugins.opcua-client.class::sessionRead.result:', result);
    return result;
  }

  /**
   * Session read all attributes
   * @async
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
   * @param {String|String[]|NodeIdLike|NodeIdLike[]} nameNodeIds 
   * e.g. 'Temperature'|['Temperature', 'PressureVesselDevice']|'ns=1;s=Temperature'|['ns=1;s=Temperature', 'ns=1;s=PressureVesselDevice']
   * @returns {NodeAttributes[]}
   */
  async sessionReadAllAttributes(nameNodeIds) {
    let itemNodeId = null, itemNodeIds = [], result = [];
    const self = this;
    this.sessionNotCreated();
    // Get nodeIds
    itemNodeIds = this.getNodeIds(nameNodeIds);
    if (itemNodeIds.length) {
      result = await new Promise(function (resolve, reject) {
        self.session.readAllAttributes(itemNodeIds, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }
    return result;
  }

  /**
  * Session read variable value
  * @async
  * @example
  * ```javascript
  *  const dataValues = await session.readVariableValue(["ns=1;s=Temperature","ns=1;s=Pressure"]);
  * ```
  * 
  * @param {String|String[]|NodeIdLike|NodeIdLike[]} nameNodeIds 
  * NodeIdLike = string | NodeId | number;
  * e.g. 'Temperature'|['Temperature', 'PressureVesselDevice']|'ns=1;s=Temperature'|['ns=1;s=Temperature', 'ns=1;s=PressureVesselDevice']
  * @returns {Promise<DataValue[]>}
  * 
  * const schemaDataValue: StructuredTypeSchema = buildStructuredType({
    baseType: "BaseUAObject",
    name: "DataValue",

    fields: [
        { name: "value", fieldType: "Variant", defaultValue: null },
        { name: "statusCode", fieldType: "StatusCode", defaultValue: StatusCodes.Good },
        { name: "sourceTimestamp", fieldType: "DateTime", defaultValue: null },
        { name: "sourcePicoseconds", fieldType: "UInt16", defaultValue: 0 },
        { name: "serverTimestamp", fieldType: "DateTime", defaultValue: null },
        { name: "serverPicoseconds", fieldType: "UInt16", defaultValue: 0 }
    ]
});
  */
  async sessionReadVariableValue(nameNodeIds) {
    let result = [];
    this.sessionNotCreated();
    // Get nodeIds
    const itemNodeIds = this.getNodeIds(nameNodeIds);
    if (itemNodeIds.length) {
      result = await this.session.readVariableValue(itemNodeIds);
    }
    if (isLog) inspector('opcua-client.class::sessionReadVariableValue:', result);
    return result;
  }

  /**
   * @method sessionReadHistoryValues
   * @async
   *
   * @example
   *
   * ```javascript
   * //  es5
   * session.readHistoryValue(
   *   "ns=5;s=Simulation Examples.Functions.Sine1",
   *   "2015-06-10T09:00:00.000Z",
   *   "2015-06-10T09:01:00.000Z", function(err,dataValues) {
   *
   * });
   * ```
   *
   * ```javascript
   * //  es6
   * const dataValues = await session.readHistoryValue(
   *   "ns=5;s=Simulation Examples.Functions.Sine1",
   *   "2015-06-10T09:00:00.000Z",
   *   "2015-06-10T09:01:00.000Z");
   * ```
   * 
   * ```javascript
   * //  es6
   * const dataValues = await session.readHistoryValue(
   *   [{
   *  nodeId: "ns=0;i=2258",
   *  attributeId: AttributeIds.Value,
   *  indexRange: null,
   *  dataEncoding: { namespaceIndex: 0, name: null }
   *}],
   *   "2015-06-10T09:00:00.000Z",
   *   "2015-06-10T09:01:00.000Z");
   * ```
   * @param {ReadValueIdLike|ReadValueIdLike[]} nameNodeIds   the read value id
   * @param {String} start   the start time in UTC format
   * @param {String} end     the end time in UTC format
   * @return {Promise<HistoryReadResult[]>}
   */
  async sessionReadHistoryValues(nameNodeIds, start, end) {
    let result = [], itemNodeIds = [], dataValues;
    this.sessionNotCreated();
    // Get nodeIds
    itemNodeIds = this.getNodeIds(nameNodeIds);

    if (itemNodeIds.length) {
      dataValues = await this.session.readHistoryValue(itemNodeIds, start, end);
      result = dataValues;
    }
    if (isLog) inspector('plugins.opcua-client.class::sessionReadHistoryValue.result:', result);
    return result;
  }

  /**
   * @method sessionReadHistoryValuesEx
   * @async
   *
   * @example
   *
   * ```javascript
   * //  es5
   * session.readHistoryValue(
   *   "ns=5;s=Simulation Examples.Functions.Sine1",
   *   "2015-06-10T09:00:00.000Z",
   *   "2015-06-10T09:01:00.000Z", function(err,dataValues) {
   *
   * });
   * ```
   *
   * ```javascript
   * //  es6
   * const dataValues = await session.readHistoryValue(
   *   "ns=5;s=Simulation Examples.Functions.Sine1",
   *   "2015-06-10T09:00:00.000Z",
   *   "2015-06-10T09:01:00.000Z");
   * ```
   * 
   * ```javascript
   * //  es6
   * const dataValues = await session.readHistoryValue(
   *   [{
   *  nodeId: "ns=0;i=2258",
   *  attributeId: AttributeIds.Value,
   *  indexRange: null,
   *  dataEncoding: { namespaceIndex: 0, name: null }
   *}],
   *   "2015-06-10T09:00:00.000Z",
   *   "2015-06-10T09:01:00.000Z");
   * ```
   * @param {ReadValueIdLike|ReadValueIdLike[]} nameNodeIds   the read value id
   * @param {String} start   the start time in UTC format
   * @param {String} end     the end time in UTC format
   * @return {Promise<HistoryReadResult[]>}
   */
  async sessionReadHistoryValuesEx(nameNodeIds, start, end) {
    let result = [], itemNodeIds = [], dataValues;
    this.sessionNotCreated();
    // Get nodeIds
    itemNodeIds = this.getNodeIds(nameNodeIds);

    if (itemNodeIds.length) {
      dataValues = await this.session.readHistoryValue(itemNodeIds, start, end);
      dataValues = formatHistoryResults(this.id, dataValues, itemNodeIds, this.locale);
      result = dataValues;
    }
    if (isLog) inspector('plugins.opcua-client.class::sessionReadHistoryValue.result:', result);
    return result;
  }

  /**
   * Get monitored items for subscription
   * @async
   * 
   * @param {UInt32} subscriptionId 
   * @returns {Promise<MonitoredItemData>}
   */
  async sessionGetMonitoredItems(subscriptionId) {
    this.sessionNotCreated();
    const monitoredItems = await this.session.getMonitoredItems(subscriptionId);
    if (isLog) inspector('plugins.opcua-client.class::subscriptionGetMonitoredItems.monitoredItems:', monitoredItems);
    return monitoredItems;
  }

  /**
   * Session write single node
   * @async
   * 
   * @param {String} nameNodeId 
   * @param {Variant} variantValue 
   * @returns {Promise<StatusCode>}
   */
  async sessionWriteSingleNode(nameNodeId, variantValue) {
    this.sessionNotCreated();
    // Get nodeIds
    const nodeId = this.getNodeIds(nameNodeId)[0];
    const statusCode = await this.session.writeSingleNode(nodeId, variantValue);
    if (isLog) inspector('plugins.opcua-client.class::sessionWriteSingleNode.statusCode:', statusCode);
    return statusCode;
  }

  /**
   * Session write
   * @async
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
   *          attributeId opcua.AttributeIds.Value,
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
   * @param {String|String[]|Object|Object[]} nameNodeIds 
   * @param {Variant[]} valuesToWrite 
   * @returns {Promise<StatusCode[]>}
   */
  async sessionWrite(nameNodeIds, valuesToWrite = []) {
    let statusCodes = [], itemNodeIds = [];
    this.sessionNotCreated();
    // Get nodeIds
    this.getNodeIds(nameNodeIds).forEach((itemNodeId, index) => {
      if (isString(itemNodeId)) {
        itemNodeIds.push(Object.assign({ nodeId: itemNodeId }, { attributeId: AttributeIds.Value }, valuesToWrite[index]));
      } else {
        if (itemNodeId.nodeId && !itemNodeId.attributeId && !itemNodeId.value) {
          itemNodeIds.push(Object.assign(itemNodeId, { attributeId: AttributeIds.Value }, valuesToWrite[index]));
        }
        if (itemNodeId.nodeId && itemNodeId.attributeId && !itemNodeId.value) {
          itemNodeIds.push(Object.assign(itemNodeId, valuesToWrite[index]));
        }
        if (itemNodeId.nodeId && itemNodeId.attributeId && itemNodeId.value) {
          itemNodeIds.push(itemNodeId);
        }
      }
    });

    if (itemNodeIds.length) {
      statusCodes = await this.session.write(itemNodeIds);
    }
    if (isLog) inspector('plugins.opcua-client.class::sessionWrite.statusCodes:', statusCodes);
    return statusCodes;
  }

  /**
   * Session call method
   * @async
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
   * @param {Array<Variant[]>} inputArguments
   * e.g. [[new Variant({...}), ... new Variant({...})], [new Variant({...}), ... new Variant({...})]] 
   * @returns {Promise<CallMethodResult[]>}
   */
  async sessionCallMethod(nameNodeIds, inputArguments = []) {
    let result = [], itemNodeIds = [];
    this.sessionNotCreated();
    // Get nodeIds
    this.getNodeIds(nameNodeIds).forEach((itemNodeId, index) => {
      if (isString(itemNodeId)) {
        const ownerName = this.getItemNodeId(itemNodeId).ownerName;
        const ownerNodeId = this.getItemNodeId(ownerName).nodeId;
        itemNodeIds.push({ objectId: ownerNodeId, methodId: itemNodeId, inputArguments: inputArguments[index] });
      } else {
        if (itemNodeId.methodId && !itemNodeId.objectId && !itemNodeId.inputArguments) {
          const ownerName = this.getItemNodeId(itemNodeId.methodId).ownerName;
          const ownerNodeId = this.getItemNodeId(ownerName).nodeId;
          itemNodeIds.push(Object.assign(itemNodeId, { objectId: ownerNodeId, inputArguments: inputArguments[index] }));
        }
        if (itemNodeId.methodId && itemNodeId.objectId && !itemNodeId.inputArguments) {
          itemNodeIds.push(Object.assign(itemNodeId, { inputArguments: inputArguments[index] }));
        }
        if (itemNodeId.nodeId && itemNodeId.objectId && itemNodeId.inputArguments) {
          itemNodeIds.push(itemNodeId);
        }
      }
    });

    if (itemNodeIds.length) {
      result = await this.session.call(itemNodeIds);
    }
    if (isLog) inspector('plugins.opcua-client.class::sessionCallMethod.result:', result);
    return result;
  }

  /**
 * Get arguments definition for session
 * @async
 * 
 * @param {String|MethodId} nameNodeId 
 * @returns {Promise<ArgumentDefinition>}
 */
  async sessionGetArgumentDefinition(nameNodeId) {
    this.sessionNotCreated();
    const methodId = this.getItemNodeId(nameNodeId).nodeId;
    const argumentsDefinition = await this.session.getArgumentDefinition(methodId);
    if (isLog) inspector('plugins.opcua-client.class::sessionGetArgumentDefinition.argumentsDefinition:', argumentsDefinition);
    // inspector('plugins.opcua-client.class::sessionGetArgumentDefinition.argumentsDefinition:', argumentsDefinition);
    return argumentsDefinition;
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
  async subscriptionCreate(options = {}) {
    this.sessionNotCreated();
    const mergeOptions = loMerge({}, defaultSubscriptionOptions, options);
    this.subscription = await Promise.resolve(ClientSubscription.create(this.session, mergeOptions));

    this.subscription
      .on('started', () => console.log(chalk.yellow('Client subscription started.') + ' SubscriptionId=', this.subscription.subscriptionId))
      .on('keepalive', () => console.log(chalk.yellow('Client subscription keepalive')))
      .on('terminated', () => console.log(chalk.yellow('Client subscription terminated')));

    this.currentState.isSubscriptionCreated = true;
  }

  /**
  * Subscription terminate
  * @async
  * 
  */
  async subscriptionTerminate() {
    this.subscriptionNotCreated();
    await this.subscription.terminate();
    this.currentState.isSubscriptionCreated = false;
  }

  /**
   * @method subscriptionGetSession
   * @returns {ClientSessionImpl}
   */
  subscriptionGetSession() {
    this.subscriptionNotCreated();
    return this.subscription.session;
  }

  /**
   * @method subscriptionHasSession
   * @returns {Boolean}
   */
  subscriptionHasSession() {
    this.subscriptionNotCreated();
    return this.subscription.hasSession;
  }

  /**
   * @method subscriptionIsActive
   * @returns {Boolean}
   */
  subscriptionIsActive() {
    this.subscriptionNotCreated();
    return this.subscription.isActive;
  }

  /**
   * @method subscriptionToString
   * @returns {String}
   */
  subscriptionToString() {
    this.subscriptionNotCreated();
    return this.subscription.toString();
  }

  /**
   * @method subscriptionEvaluateRemainingLifetime 
   * @returns {Number}
   */
  subscriptionEvaluateRemainingLifetime() {
    this.subscriptionNotCreated();
    return this.subscription.evaluateRemainingLifetime();
  }


  /**
     * Add a monitor item to the subscription
     *
     * @method monitor
     * @async
     * 
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
  async subscriptionMonitor(cb = null, itemToMonitor = {}, requestedParameters = {}, timestampsToReturn = TimestampsToReturn.Neither) {
    let subscriptionHandler, subscriptionHandlerName = '';
    this.subscriptionNotCreated();
    const nodeId = itemToMonitor.nodeId;
    if (this.getItemNodeId(nodeId)) {
      // Get subscriptionHandlerName
      const itemNodeId = this.getItemNodeId(nodeId);
      if (itemNodeId.subscription) {
        subscriptionHandlerName = itemNodeId.subscription;
      }

      // subscription.monitor
      const mergeItemToMonitor = loMerge({}, defaultItemToMonitor, itemToMonitor);
      const mergeRequestedParameters = loMerge({}, defaultRequestedParameters, requestedParameters);

      const monitoredItem = await this.subscription.monitor(
        mergeItemToMonitor,
        mergeRequestedParameters,
        timestampsToReturn
      );
      if (isLog) inspector('opcua-client.class::subscriptionMonitor.monitoredItem:', monitoredItem);

      // Run subscriptionHandler
      monitoredItem.on('changed', (dataValue) => {
        if (isLog) inspector(`opcua-client.class::subscriptionMonitor.${nodeId}:`, dataValue);
        itemToMonitor.id = this.id;
        itemToMonitor.locale = this.locale;
        // itemToMonitor.timestamp = moment().format();
        dataValue.sourceTimestamp = moment().format();
        if (cb) {
          cb(itemToMonitor, dataValue);
        } else {
          // Get subscriptionHandler
          // const id = this.getCurrentState().id;
          subscriptionHandler = getSubscriptionHandler(this.id, subscriptionHandlerName);
          subscriptionHandler(itemToMonitor, dataValue);
        }

      });
    }
  }

  /**
   * Get nodeIds
   * 
   * @param {String|Object|String[]|Object[]} nameNodeIds 
   * @returns {String[]|Object[]}
   */
  getNodeIds(nameNodeIds) {
    let itemNodeId = null, itemNodeIds = [];
    if (!this.srvCurrentState) return null;
    let nodeIds = this.srvCurrentState.paramsAddressSpace;
    if (nodeIds) {
      nodeIds = loConcat(nodeIds.objects, nodeIds.variables, nodeIds.methods);
    } else {
      nodeIds = [];
    }

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
    if (isDebug) debug('getNodeIds.result:', itemNodeIds);
    return itemNodeIds;
  }

  /**
   * Get item nodeId
   * @param {String>} nameNodeId 
   * e.g nameNodeId = 'Device1.Temperature'|'ns=1;s=Device1.Temperature'
   * @returns {Object}
   */
  getItemNodeId(nameNodeId) {
    let itemNodeId = null;
    if (!this.srvCurrentState) return null;
    let nodeIds = this.srvCurrentState.paramsAddressSpace;
    if (nodeIds) {
      nodeIds = loConcat(nodeIds.objects, nodeIds.variables, nodeIds.methods);
    } else {
      nodeIds = [];
    }
    itemNodeId = nodeIds.find(item => item.browseName === nameNodeId);
    if (!itemNodeId) {
      itemNodeId = nodeIds.find(item => item.nodeId === nameNodeId);
    }
    return itemNodeId;
  }
}

module.exports = OpcuaClient;
