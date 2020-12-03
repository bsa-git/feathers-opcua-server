/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { inspector, isString, isObject, appRoot } = require('../lib');
const {
  OPCUAClient,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
  BrowseDirection,
  Variant,
  StatusCodes,
} = require('node-opcua');

const defaultClientOptions = require(`${appRoot}/src/api/opcua/OPCUAClientOptions`);
const defaultSubscriptionOptions = require(`${appRoot}/src/api/opcua/ClientSubscriptionOptions.json`);
const { defaultItemToMonitor, defaultRequestedParameters } = require(`${appRoot}/src/api/opcua/ClientSubscriptionMonitorOptions`);
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
    this.srvCurrentState = null;
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
      this.opcuaClient.on('backoff', (retry) => console.log(chalk.yellow('Retrying to connect to:'), this.srvCurrentState.endpointUrl, ' attempt: ', retry));
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * OPC-UA client not created
   */
  opcuaClientNotCreated() {
    if (!this.opcuaClient) {
      throw new errors.GeneralError('OPC-UA client not created');
    }
  }

  /**
   * Connect opc-ua client to server
   * @async
   * @param params {Object}
   */
  async connect(params = {}) {
    try {
      this.opcuaClientNotCreated();
      await this.opcuaClient.connect(params.endpointUrl);
      this.srvCurrentState = params;
      console.log(chalk.yellow('Client connected to:'), chalk.cyan(params.endpointUrl));
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * Client disconnect
  * @async
  */
  async disconnect() {
    try {
      this.opcuaClientNotCreated();
      await this.opcuaClient.disconnect();
      console.log(chalk.yellow('Client disconnect from:'), chalk.cyan(this.srvCurrentState.endpointUrl));
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Create session opc-ua client
   * @async
   */
  async sessionCreate() {
    try {
      this.opcuaClientNotCreated();
      this.session = await this.opcuaClient.createSession();
      console.log(chalk.yellow('Client session created'));
      if (isLog) inspector('plugins.opcua-client.class::sessionCreate.info:', this.sessionToString());
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Close session opc-ua client
   * @async
   */
  async sessionClose() {
    try {
      this.sessionNotCreated();
      await this.session.close();
      this.session = null;
      console.log(chalk.yellow('Client session closed'));
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Session not created
   */
  sessionNotCreated() {
    if (!this.session) {
      throw new errors.GeneralError('Session not created');
    }
  }

  /**
 * Session to string
 * @returns {String}
 */
  sessionToString() {
    try {
      this.sessionNotCreated();
      return this.session.toString();
    } catch (error) {
      throw new errors.GeneralError(error.message);
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
    try {
      this.sessionNotCreated();
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Session subscription count
   */
  sessionSubscriptionCount() {
    try {
      this.sessionNotCreated();
      const subscriptionCount = this.session.subscriptionCount;
      return subscriptionCount;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Is reconnecting
   */
  sessionIsReconnecting() {
    try {
      this.sessionNotCreated();
      const isReconnecting = this.session.isReconnecting;
      return isReconnecting;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Session get publish engine
   */
  sessionGetPublishEngine() {
    try {
      this.sessionNotCreated();
      const publishEngine = this.session.getPublishEngine();
      return publishEngine;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Read namespace array for session
   * @async
   * @returns {Promise<string[]}
   */
  async sessionReadNamespaceArray() {
    try {
      this.sessionNotCreated();
      const result = await this.session.readNamespaceArray();
      if (isLog) inspector('plugin.opcua-client.class::sessionReadNamespaceArray.result:', result);
      // inspector('plugins.opcua-client.class::sessionReadNamespaceArray.result:', result);
      return result;
    } catch (error) {
      throw new errors.GeneralError(error.message);
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
    try {
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
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
    try {
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
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
    try {
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
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
   * @param {Function<err, data>} callback 
   * @returns {void}
   */
  sessionReadAllAttributes(nameNodeIds, callback) {
    let itemNodeId = null, itemNodeIds = [];
    try {
      this.sessionNotCreated();
      // Get nodeIds
      itemNodeIds = this.getNodeIds(nameNodeIds);

      if (itemNodeIds.length) {
        this.session.readAllAttributes(itemNodeIds, callback);
      }
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
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
    try {
      this.sessionNotCreated();
      // Get nodeIds
      const itemNodeIds = this.getNodeIds(nameNodeIds);
      if (itemNodeIds.length) {
        result = await this.session.readVariableValue(itemNodeIds);
      }
      if (isLog) inspector('opcua-client.class::sessionReadVariableValue:', result);
      return result;
    } catch (error) {
      throw new errors.GeneralError(error.message);
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
    try {
      this.sessionNotCreated();
      // Get nodeIds
      itemNodeIds = this.getNodeIds(nameNodeIds);

      if (itemNodeIds.length) {
        dataValues = await this.session.readHistoryValue(itemNodeIds, start, end);
        result = dataValues;
      }
      if (isLog) inspector('plugins.opcua-client.class::sessionReadHistoryValue.result:', result);
      return result;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Get monitored items for subscription
   * @async
   * 
   * @param {UInt32} subscriptionId 
   * @returns {Promise<MonitoredItemData>}
   */
  async sessionGetMonitoredItems(subscriptionId) {
    try {
      this.sessionNotCreated();
      const monitoredItems = await this.session.getMonitoredItems(subscriptionId);
      if (isLog) inspector('plugins.opcua-client.class::subscriptionGetMonitoredItems.monitoredItems:', monitoredItems);
      return monitoredItems;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
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
    try {
      this.sessionNotCreated();
      // Get nodeIds
      const nodeId = this.getNodeIds(nameNodeId)[0];
      const statusCode = await this.session.writeSingleNode(nodeId, variantValue);
      if (isLog) inspector('plugins.opcua-client.class::sessionWriteSingleNode.statusCode:', statusCode);
      return statusCode;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
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
    try {
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
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
   * @param {Variant[]} inputArguments
   * e.g. [[new Variant({...}), ... new Variant({...})], [new Variant({...}), ... new Variant({...})]] 
   * @returns {Promise<CallMethodResult[]>}
   */
  async sessionCallMethod(nameNodeIds, inputArguments = []) {
    let result = [], itemNodeIds = [];
    try {
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
 * Get arguments definition for session
 * @async
 * 
 * @param {String|MethodId} nameNodeId 
 * @returns {Promise<ArgumentDefinition>}
 */
  async sessionGetArgumentDefinition(nameNodeId) {
    try {
      this.sessionNotCreated();
      const methodId = this.getItemNodeId(nameNodeId).nodeId;
      const argumentsDefinition = await this.session.getArgumentDefinition(methodId);
      if (isLog) inspector('plugins.opcua-client.class::sessionGetArgumentDefinition.argumentsDefinition:', argumentsDefinition);
      // inspector('plugins.opcua-client.class::sessionGetArgumentDefinition.argumentsDefinition:', argumentsDefinition);
      return argumentsDefinition;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * Subscription create
  * @method createSubscription
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
    try {
      this.sessionNotCreated();
      const mergeOptions = loMerge({}, defaultSubscriptionOptions, options);
      this.subscription = ClientSubscription.create(this.session, mergeOptions);

      this.subscription
        .on('started', () => console.log(chalk.yellow('Client subscription started.') + ' SubscriptionId=', this.subscription.subscriptionId))
        .on('keepalive', () => console.log(chalk.yellow('Client subscription keepalive')))
        .on('terminated', () => console.log(chalk.yellow('Client subscription terminated')));
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
  * Subscription terminate
  * @async
  * 
  */
  async subscriptionTerminate() {
    try {
      this.subscriptionNotCreated();
      await this.subscription.terminate();
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * Subscription not created
   */
  subscriptionNotCreated() {
    if (!this.subscription) {
      throw new errors.GeneralError('Subscription not created');
    }
  }

  /**
   * @method subscriptionGetSession
   * @returns {ClientSessionImpl}
   */
  subscriptionGetSession() {
    try {
      this.subscriptionNotCreated();
      return this.subscription.session;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * @method subscriptionHasSession
   * @returns {Boolean}
   */
  subscriptionHasSession() {
    try {
      this.subscriptionNotCreated();
      return this.subscription.hasSession;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * @method subscriptionIsActive
   * @returns {Boolean}
   */
  subscriptionIsActive() {
    try {
      this.subscriptionNotCreated();
      return this.subscription.isActive;
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * @method subscriptionToString
   * @returns {String}
   */
  subscriptionToString() {
    try {
      this.subscriptionNotCreated();
      return this.subscription.toString();
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }

  /**
   * @method subscriptionEvaluateRemainingLifetime 
   * @returns {Number}
   */
  subscriptionEvaluateRemainingLifetime() {
    try {
      this.subscriptionNotCreated();
      return this.subscription.evaluateRemainingLifetime();
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
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
  async subscriptionMonitor(cb, itemToMonitor = {}, requestedParameters = {}, timestampsToReturn = TimestampsToReturn.Neither) {
    try {
      this.subscriptionNotCreated();
      const nodeId = itemToMonitor.nodeId;
      const mergeItemToMonitor = loMerge({}, defaultItemToMonitor, itemToMonitor);
      const mergeRequestedParameters = loMerge({}, defaultRequestedParameters, requestedParameters);

      const monitoredItem = await this.subscription.monitor(
        mergeItemToMonitor,
        mergeRequestedParameters,
        timestampsToReturn
      );
      if (isLog) inspector('opcua-client.class::subscriptionMonitor.monitoredItem:', monitoredItem);

      monitoredItem.on('changed', (dataValue) => {
        if (isLog) inspector(`opcua-client.class::subscriptionMonitor.${nodeId}:`, dataValue);
        cb(nodeId, dataValue);
      });
    } catch (error) {
      throw new errors.GeneralError(error.message);
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
    try {
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
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
    if (!this.srvCurrentState) return null;
    try {
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
    } catch (error) {
      throw new errors.GeneralError(error.message);
    }
  }
}

module.exports = OpcuaClient;
