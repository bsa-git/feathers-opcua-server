/* eslint-disable no-unused-vars */
const {
  inspector,
  logger,
  isString,
  isObject,
  appRoot,
  isProd
} = require('../lib');

const {
  getOpcuaConfig,
  formatHistoryResults,
  getSecurityMode,
  getSecurityPolicy,
} = require('./opcua-helper');

const {
  OPCUAClient,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
  Variant,
  UserTokenType
} = require('node-opcua');

const moment = require('moment');

const defaultClientOptions = require(`${appRoot}/src/api/opcua/config/OPCUA_ClientOptions`);
const defaultSubscriptionOptions = require(`${appRoot}/src/api/opcua/config/ClientSubscriptionOptions.json`);
const { defaultItemToMonitor, defaultRequestedParameters } = require(`${appRoot}/src/api/opcua/config/ClientSubscriptionMonitorOptions`);
const defaultBrowseDescriptionLike = require(`${appRoot}/src/api/opcua/config/ClientBrowseDescriptionLike`);
const defaultReadValueIdOptions = require(`${appRoot}/src/api/opcua/config/ReadValueIdOptions`);

const chalk = require('chalk');
const loMerge = require('lodash/merge');
const loConcat = require('lodash/concat');

const debug = require('debug')('app:opcua-client.class');
const isDebug = false;

class OpcuaClient {
  /**
   * Constructor
   * @param params {Object}
   */
  constructor(params = {}) {
    const params_ = Object.assign({}, params);
    this.id = params_.applicationName;
    this.app = null;
    // Get opcua config
    const opcuaConfig = getOpcuaConfig(this.id);
    this.locale = (params_.locale === undefined) ? process.env.LOCALE : params_.locale;
    params_.applicationName = defaultClientOptions.applicationName;
    params_.clientName = opcuaConfig.name;
    this.params = loMerge(defaultClientOptions, params_);
    this.srvCurrentState = null;
    this.currentState = {
      id: this.id,
      locale: this.locale,
      clientName: this.params.clientName,
      applicationUri: '',
      userIdentityInfo: { type: UserTokenType.Anonymous },
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
    params = params ? loMerge(this.params, params) : this.params;
    this.opcuaClient = OPCUAClient.create(params);
    // Retrying connection
    const endpointUrl = (this.srvCurrentState && this.srvCurrentState.endpointUrl) ? this.srvCurrentState.endpointUrl : '';
    this.opcuaClient.on('backoff', (retry) => console.log(chalk.yellow('Retrying to connect to:'), endpointUrl, ' attempt: ', retry));
    this.currentState.applicationUri = this.opcuaClient._applicationUri;
    this.currentState.isCreated = true;
    // console.log(chalk.yellow('OPCUAClient created ...'), 'opcuaClient.id:', chalk.cyan(this.id));
    logger.info('OPCUAClient created OK. id: %s', this.id);

    if (isDebug && this.opcuaClient) console.log('certificateFile = ', this.opcuaClient.certificateFile);
    if (isDebug && this.opcuaClient) console.log('privateKeyFile  = ', this.opcuaClient.privateKeyFile);
  }

  /**
   * @method opcuaClientConnect
   * @async
   * Connect opc-ua client to server
   * 
   * @param {Object} params
   */
  async opcuaClientConnect(params = {}) {
    this.opcuaClientNotCreated();
    await this.opcuaClient.connect(params.endpointUrl);
    if (!this.srvCurrentState) {
      this.srvCurrentState = params;
    }
    this.currentState.isConnect = true;
    this.currentState.endpointUrl = params.endpointUrl;
    this.currentState.port = params.endpointUrl.split(':')[2];
    // console.log(chalk.yellow('Client connected to:'), chalk.cyan(params.endpointUrl));
    // console.log(chalk.yellow('Client applicationUri:'), chalk.cyan(this.currentState.applicationUri));
    // console.log(chalk.yellow('Client securityMode:'), chalk.cyan(getSecurityMode(this.opcuaClient.securityMode)));
    // console.log(chalk.yellow('Client securityPolicy:'), chalk.cyan(getSecurityPolicy(this.opcuaClient.securityPolicy)));

    logger.info('Client connected to: %s', params.endpointUrl);
    logger.info('Client applicationUri: %s', this.currentState.applicationUri);
    logger.info('Client securityMode: %s', getSecurityMode(this.opcuaClient.securityMode));
    logger.info('Client securityPolicy: %s', getSecurityPolicy(this.opcuaClient.securityPolicy));
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
   * @method sessionCreate
   * Create session opc-ua client
   * @async
   * 
   * @param {AnonymousIdentity | UserIdentityInfoX509 | UserIdentityInfoUserName} userIdentityInfo
   * @example
   export interface UserIdentityInfoUserName {
        type: UserTokenType.UserName;
        userName: string;
        password: string;
    }
    export interface UserIdentityInfoX509 extends X509IdentityTokenOptions {
        type: UserTokenType.Certificate;
        certificateData: ByteString;
        privateKey: PrivateKeyPEM;
    }
    export interface AnonymousIdentity {
        type: UserTokenType.Anonymous;
    }
   */
  async sessionCreate(userIdentityInfo = { type: UserTokenType.Anonymous }) {
    try {
      this.opcuaClientNotCreated();
      this.session = await this.opcuaClient.createSession(userIdentityInfo);
      // Set this.currentState.userIdentityInfo
      if (userIdentityInfo.type === UserTokenType.Anonymous) {
        this.currentState.userIdentityInfo = userIdentityInfo;
      } else {
        this.currentState.userIdentityInfo.type = userIdentityInfo.type;
        if (userIdentityInfo.type === UserTokenType.UserName) {
          this.currentState.userIdentityInfo.userName = userIdentityInfo.userName;
        } else {
          this.currentState.userIdentityInfo.certificateData = userIdentityInfo.certificateData;
        }
      }
      this.currentState.isSessionCreated = true;
      const msg = userIdentityInfo.type === UserTokenType.UserName ? `user: "${userIdentityInfo.userName}" is authenticated` : '';
      // console.log(chalk.yellow('Client session is created.'), chalk.cyan(msg));
      logger.info('Client session is created. %s', msg);
      if (isDebug) inspector('opcua-client.class::sessionCreate.sessionToString:', this.sessionToString());
    } catch (error) {
      if (error.message.includes('End point must exist') && process.env.NODE_ENV === 'production') {
        // console.log(chalk.red('In production mode, the client must be authenticated, and must also encrypt and digitally sign the transmitted messages!'));
        logger.error('In production mode, the client must be authenticated, and must also encrypt and digitally sign the transmitted messages!');
      }
      throw error;
    }
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
 * Get server certificate
 * @returns {Buffer}
 */
  getServerCertificate() {
    this.sessionNotCreated();
    const sessionEndpoint = this.session && this.session.endpoint ? this.sessionEndpoint() : null;
    return sessionEndpoint.serverCertificate;
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
    if (isDebug) inspector('plugin.opcua-client.class::sessionReadNamespaceArray.result:', result);
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
    if (isDebug) inspector('plugins.opcua-client.class::sessionBrowse.result:', result);
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
    if (isDebug) inspector('plugins.opcua-client.class::sessionTranslateBrowsePath.result:', result);
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
    //--------------------------------------------------
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
    if (isDebug) inspector('plugins.opcua-client.class::sessionRead.result:', result);
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
    let itemNodeIds = [], result = [];
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
    if (isDebug) inspector('opcua-client.class::sessionReadVariableValue:', result);
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
   * @return {HistoryReadResult[]}
   */
  async sessionReadHistoryValues(nameNodeIds, start, end) {
    let result = [], itemNodeIds = [], dataValues;
    //---------------------------------------------
    this.sessionNotCreated();
    // Get nodeIds
    itemNodeIds = this.getNodeIds(nameNodeIds);

    if (itemNodeIds.length) {
      dataValues = await this.session.readHistoryValue(itemNodeIds, start, end);
      result = dataValues;
    }
    if (isDebug) inspector('opcua-client.class::sessionReadHistoryValue.result:', result);
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
   * @param {ReadValueIdLike|ReadValueIdLike[]} browseNames   the read value id
   * @param {String} start   the start time in UTC format
   * @param {String} end     the end time in UTC format
   * @return {HistoryReadResult[]}
   */
  async sessionReadHistoryValuesEx(browseNames, start, end) {
    let result = [], itemNodeIds = [], dataValues;
    //---------------------------------------------
    this.sessionNotCreated();
    // Get nodeIds
    itemNodeIds = this.getNodeIds(browseNames);

    if (itemNodeIds.length) {
      dataValues = await this.session.readHistoryValue(itemNodeIds, start, end);
      // inspector('plugins.opcua-client.class::sessionReadHistoryValuesEx.result:', dataValues);
      dataValues = formatHistoryResults(this.id, dataValues, itemNodeIds, this.locale);
      result = dataValues;
    }
    if (isDebug) inspector('plugins.opcua-client.class::sessionReadHistoryValuesEx.result:', result);
    // inspector('plugins.opcua-client.class::sessionReadHistoryValuesEx.result:', result);
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
    if (isDebug) inspector('plugins.opcua-client.class::subscriptionGetMonitoredItems.monitoredItems:', monitoredItems);
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
    let nodeId = this.getNodeIds(nameNodeId);
    if (isDebug && nodeId) console.log('sessionWriteSingleNode.nodeId:', nodeId);
    nodeId = nodeId[0];
    const statusCode = await this.session.writeSingleNode(nodeId, variantValue);
    if (isDebug) inspector('plugins.opcua-client.class::sessionWriteSingleNode.statusCode:', statusCode);
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
    //------------------------------------------
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
    if (isDebug) inspector('plugins.opcua-client.class::sessionWrite.statusCodes:', statusCodes);
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
    //---------------------------------------------
    this.sessionNotCreated();
    // Get nodeIds
    this.getNodeIds(nameNodeIds).forEach((itemNodeId, index) => {
      if (isString(itemNodeId)) {
        if (this.getItemNodeId(itemNodeId)) {
          const ownerName = this.getItemNodeId(itemNodeId).ownerName;
          const ownerNodeId = this.getItemNodeId(ownerName).nodeId;
          itemNodeIds.push({ objectId: ownerNodeId, methodId: itemNodeId, inputArguments: inputArguments[index] });
        }
      } else {
        if (itemNodeId.methodId && !itemNodeId.objectId && !itemNodeId.inputArguments) {
          if (this.getItemNodeId(itemNodeId)) {
            const ownerName = this.getItemNodeId(itemNodeId.methodId).ownerName;
            const ownerNodeId = this.getItemNodeId(ownerName).nodeId;
            itemNodeIds.push(Object.assign(itemNodeId, { objectId: ownerNodeId, inputArguments: inputArguments[index] }));
          }
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
      if (isDebug && itemNodeIds) inspector('sessionCallMethod.itemNodeIds:', itemNodeIds);
      result = await this.session.call(itemNodeIds);
    }
    if (isDebug) inspector('plugins.opcua-client.class::sessionCallMethod.result:', result);
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
    if (isDebug) inspector('plugins.opcua-client.class::sessionGetArgumentDefinition.argumentsDefinition:', argumentsDefinition);
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
      // .on('started', () => console.log(chalk.yellow('Client subscription started.'), `SubscriptionId = ${this.subscription.subscriptionId}`))
      // .on('terminated', () => console.log(chalk.yellow('Client subscription terminated')))
      .on('started', () => logger.info('Client subscription started. SubscriptionId = %s', this.subscription.subscriptionId))
      .on('terminated', () => logger.warn('Client subscription terminated'))
      .on('keepalive', () => {
        if (true && !isProd()) console.log(chalk.yellow('Client subscription keepalive'));
      });

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
    this.subscription = null;
    this.currentState.isSubscriptionCreated = false;
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
    let self = this, _itemToMonitor = {};
    //----------------------------------
    this.subscriptionNotCreated();
    const nodeId = itemToMonitor.nodeId;
    // Get itemNodeId
    const itemNodeId = this.getItemNodeId(nodeId);
    if (itemNodeId && cb) {
      // subscription.monitor
      const mergeItemToMonitor = loMerge({}, defaultItemToMonitor, itemToMonitor);
      const mergeRequestedParameters = loMerge({}, defaultRequestedParameters, requestedParameters);

      if (isDebug && mergeItemToMonitor) inspector('opcua-client.class::subscriptionMonitor.mergeItemToMonitor:', mergeItemToMonitor);
      if (isDebug && mergeRequestedParameters) inspector('opcua-client.class::subscriptionMonitor.mergeRequestedParameters:', mergeRequestedParameters);

      const monitoredItem = await this.subscription.monitor(
        mergeItemToMonitor,
        mergeRequestedParameters,
        timestampsToReturn
      );
      if (isDebug) inspector('opcua-client.class::subscriptionMonitor.monitoredItem:', `nodeId="${monitoredItem.itemToMonitor.nodeId.value}" statusCode="${monitoredItem.statusCode.name}"`);

      // Run subscriptionHandler
      monitoredItem.on('changed', (dataValue) => {
        if (isDebug && dataValue) inspector(`opcua-client.class::subscriptionMonitor.${nodeId}:`, dataValue);
        const value = dataValue.value.value;
        if (value === null) return;
        _itemToMonitor.id = this.id;
        _itemToMonitor.locale = this.locale;
        _itemToMonitor.addressSpaceOption = itemNodeId;
        _itemToMonitor.myOpcuaClient = self;
        dataValue.serverTimestamp = moment().format();
        cb(_itemToMonitor, dataValue);
      });
    }
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
   * Get nodeIds
   * 
   * @param {String|Object|String[]|Object[]} nameNodeIds 
   * @returns {String[]|Object[]}
   */
  getNodeIds(nameNodeIds) {
    let itemNodeId = null, itemNodeIds = [];
    //----------------------------------------
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
    if (isDebug) inspector('getNodeIds.result:', itemNodeIds);
    return itemNodeIds;
  }

  /**
   * Get item nodeId
   * @param {String} nameNodeId 
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
