/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { inspector, isString, isObject, getBrowseNameFromNodeId, appRoot } = require('../lib');
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
const defaultBrowseDescriptionLike = require(`${appRoot}/src/api/opcua/ClientBrowseDescriptionLike`);
const defaultReadValueIdOptions = require(`${appRoot}/src/api/opcua/ReadValueIdOptions`);

const os = require('os');
const chalk = require('chalk');
const loMerge = require('lodash/merge');
const loConcat = require('lodash/concat');
const moment = require('moment');

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
   * Session not created
   */
  sessionNotCreated() {
    const errTxt = 'Session not created';
    console.log(chalk.red(`ERROR: ${errTxt}`));
    throw new errors.GeneralError(`${errTxt}`);
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
   * @param {String|Object|Array<String|Object>} nameNodeIds 
   * @returns {Array<String|Object>}
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
      if (isDebug) debug('getNodeIds.result:', itemNodeIds);
      return itemNodeIds;
    } catch (err) {
      const errTxt = 'Error while get nodeIds from \'SrvCurrentState.paramsAddressSpace\'';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Get item nodeId
   * @param {String>} nameNodeId 
   * e.g nameNodeId = 'Device1.Temperature'|'ns=1;s=Device1.Temperature'
   * @returns {Object}
   */
  getItemNodeId(nameNodeId) {
    let itemNodeId = null;
    if (!this.SrvCurrentState) return null;
    try {
      let nodeIds = this.SrvCurrentState.paramsAddressSpace;
      nodeIds = loConcat(nodeIds.objects, nodeIds.variables, nodeIds.methods);
      itemNodeId = nodeIds.find(item => item.browseName === nameNodeId);
      if (!itemNodeId) {
        itemNodeId = nodeIds.find(item => item.nodeId === nameNodeId);
      }
      return itemNodeId;
    } catch (err) {
      const errTxt = 'Error while get nodeIds from \'SrvCurrentState.paramsAddressSpace\'';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
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
    if (!this.session) this.sessionNotCreated();
    const endpoint = this.session.endpoint;
    return {
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

  /**
   * Session subscription count
   */
  sessionSubscriptionCount() {
    if (!this.session) this.sessionNotCreated();
    const subscriptionCount = this.session.subscriptionCount;
    return subscriptionCount;
  }

  /**
   * Is reconnecting
   */
  sessionIsReconnecting() {
    if (!this.session) this.sessionNotCreated();
    const isReconnecting = this.session.isReconnecting;
    return isReconnecting;
  }

  /**
   * Session get publish engine
   */
  sessionGetPublishEngine() {
    if (!this.session) this.sessionNotCreated();
    const publishEngine = this.session.getPublishEngine();
    return publishEngine;
  }

  /**
   * Read namespace array for session
   * @async
   * @returns {Promise<string[]}
   */
  async sessionReadNamespaceArray() {
    if (!this.session) this.sessionNotCreated();
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
    if (!this.session) this.sessionNotCreated();
    try {
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
    } catch (err) {
      const errTxt = 'Error while session browse the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Session translate browse path
   * @async
   * @param {BrowsePath|BrowsePath[]} browsePaths 
   * @returns {Promise<BrowsePathResult[]>}
   */
  async sessionTranslateBrowsePath(browsePaths) {
    let result = [];
    if (!this.session) this.sessionNotCreated();
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
   * @param {Number} attributeId 
   * e.g. AttributeIds.BrowseName
   * @param {Number} maxAge 
   * @returns {Promise<DataValue>}
   */
  async sessionRead(nameNodeIds, attributeId = 0, maxAge = 0) {
    let result = [], itemNodeIds = [], dataValues;
    if (!this.session) this.sessionNotCreated();
    try {
      // Get nodeIds
      this.getNodeIds(nameNodeIds).forEach((itemNodeId) => {
        if (isString(itemNodeId)) {
          itemNodeIds.push({ nodeId: itemNodeId, attributeId: attributeId ? attributeId : AttributeIds.Value });
        } else {
          if (itemNodeId.attributeId === undefined) {
            itemNodeIds.push(Object.assign(defaultReadValueIdOptions, itemNodeId, { attributeId: attributeId ? attributeId : AttributeIds.Value }));
          } else {
            itemNodeIds.push(defaultReadValueIdOptions, itemNodeId);
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
   * @param {String|String[]|NodeIdLike|NodeIdLike[]} nameNodeIds 
      * e.g. 'Temperature'|['Temperature', 'PressureVesselDevice']|'ns=1;s=Temperature'|['ns=1;s=Temperature', 'ns=1;s=PressureVesselDevice']
   * @returns {void}
   */
  sessionReadAllAttributes(nameNodeIds, callback) {
    let itemNodeId = null, itemNodeIds = [];
    if (!this.session) this.sessionNotCreated();
    try {
      // Get nodeIds
      itemNodeIds = this.getNodeIds(nameNodeIds);

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
  * 
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
    if (!this.session) this.sessionNotCreated();
    try {
      // Get nodeIds
      const itemNodeIds = this.getNodeIds(nameNodeIds);
      if (itemNodeIds.length) {
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
    if (!this.session) this.sessionNotCreated();
    try {
      // Get nodeIds
      itemNodeIds = this.getNodeIds(nameNodeIds);

      if (itemNodeIds.length) {
        dataValues = await this.session.readHistoryValue(itemNodeIds, start, end);
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
    if (!this.session) this.sessionNotCreated();
    try {
      const monitoredItems = await this.session.getMonitoredItems(subscriptionId);
      if (isLog) inspector('plugins.opcua-client.class::subscriptionGetMonitoredItems.monitoredItems:', monitoredItems);
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
    if (!this.session) this.sessionNotCreated();
    try {
      // Get nodeIds
      const nodeId = this.getNodeIds(nameNodeId)[0];
      const statusCode = await this.session.writeSingleNode(nodeId, variantValue);
      if (isLog) inspector('plugins.opcua-client.class::sessionWriteSingleNode.statusCode:', statusCode);
      return statusCode;
    } catch (err) {
      const errTxt = 'Error while session write single node the OPS-UA client:';
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
    if (!this.session) this.sessionNotCreated();
    try {
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
   * @param {Variant[]} inputArguments
   * e.g. [[new Variant({...}), ... new Variant({...})], [new Variant({...}), ... new Variant({...})]] 
   * @returns {Promise<CallMethodResult[]>}
   */
  async sessionCallMethod(nameNodeIds, inputArguments = []) {
    let result = [], itemNodeIds = [];
    if (!this.session) this.sessionNotCreated();
    try {
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
            itemNodeIds.push(Object.assign(itemNodeId, { objectId: ownerNodeId, inputArguments: inputArguments[index]}));
          }
          if (itemNodeId.methodId && itemNodeId.objectId && !itemNodeId.inputArguments) {
            itemNodeIds.push(Object.assign(itemNodeId, { inputArguments: inputArguments[index]}));
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
    } catch (err) {
      const errTxt = 'Error while session call method:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
 * Get arguments definition for session
 * 
 * @param {String|MethodId} nameNodeId 
 * @returns {Promise<ArgumentDefinition>}
 */
  async sessionGetArgumentDefinition(nameNodeId) {
    if (!this.session) this.sessionNotCreated();
    try {
      const methodId = this.getItemNodeId(nameNodeId).nodeId;
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
    if (!this.session) this.sessionNotCreated();
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
    if (!this.subscription) this.subscriptionNotCreated();
    try {
      await this.subscription.terminate();
    } catch (err) {
      const errTxt = 'Error while subscription terminate the OPS-UA client:';
      console.log(errTxt, err);
      throw new errors.GeneralError(`${errTxt} "${err.message}"`);
    }
  }

  /**
   * Subscription not created
   */
  subscriptionNotCreated() {
    const errTxt = 'Subscription not created';
    console.log(chalk.red(`ERROR: ${errTxt}`));
    throw new errors.GeneralError(`${errTxt}`);
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
    if (!this.subscription) this.subscriptionNotCreated();
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
