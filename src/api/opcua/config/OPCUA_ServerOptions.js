/* eslint-disable no-unused-vars */
const {
  appRoot
} = require('../../../plugins/lib');
const {
  isValidUser,
} = require('../../../plugins/opcua/opcua-user-manager');
const {
  SecurityPolicy,
  MessageSecurityMode,
  OPCUAServerEndpointOptions,
  ApplicationDescriptionOptions,
  UserManagerOptions,
  ServerCapabilitiesOptions,
  nodesets,
  RegisterServerMethod
} = require('node-opcua');

const loDrop = require('lodash/drop');

const fs = require('fs');
const packageFile = `${appRoot}/node_modules/node-opcua/package.json`;
const packageInfo = require(packageFile);
const default_build_info = {
  manufacturerName: 'Node-OPCUA : MIT Licence ( see http://node-opcua.github.io/)',
  productName: packageInfo.name,
  productUri: null, // << should be same as default_server_info.productUri?
  softwareVersion: packageInfo.version,
  buildDate: fs.statSync(packageFile).mtime
};


/**
    * the possible security policies that the server will expose
    Basic128 = "http://opcfoundation.org/UA/SecurityPolicy#Basic128",
    Basic192 = "http://opcfoundation.org/UA/SecurityPolicy#Basic192",
    Basic192Rsa15 = "http://opcfoundation.org/UA/SecurityPolicy#Basic192Rsa15",
    Basic256Rsa15 = "http://opcfoundation.org/UA/SecurityPolicy#Basic256Rsa15",
    Basic256Sha256 = "http://opcfoundation.org/UA/SecurityPolicy#Basic256Sha256",
    Aes128_Sha256_RsaOaep = "http://opcfoundation.org/UA/SecurityPolicy#Aes128_Sha256_RsaOaep",
    PubSub_Aes128_CTR = "http://opcfoundation.org/UA/SecurityPolicy#PubSub_Aes128_CTR",
    PubSub_Aes256_CTR = "http://opcfoundation.org/UA/SecurityPolicy#PubSub_Aes256_CTR",
    Basic128Rsa15 = "http://opcfoundation.org/UA/SecurityPolicy#Basic128Rsa15",
    Basic256
    * @type {Array<SecurityPolicy>}
    */
let securityPolicies = [
  SecurityPolicy.None,
  SecurityPolicy.Basic128,
  SecurityPolicy.Basic192,
  SecurityPolicy.Basic192Rsa15,
  SecurityPolicy.Basic256Rsa15,
  SecurityPolicy.Basic256Sha256,
  // New
  SecurityPolicy.Aes128_Sha256_RsaOaep,
  SecurityPolicy.PubSub_Aes128_CTR,
  SecurityPolicy.PubSub_Aes256_CTR,
  // Obsoletes
  SecurityPolicy.Basic128Rsa15,
  SecurityPolicy.Basic256
];

if (process.env.NODE_ENV === 'production') {
  securityPolicies = loDrop(securityPolicies);
}

/**
 * the possible security mode that the server will expose
 * @type {Array<MessageSecurityMode>}
 */
let securityModes = [MessageSecurityMode.None, MessageSecurityMode.Sign, MessageSecurityMode.SignAndEncrypt];
if (process.env.NODE_ENV === 'production') {
  securityModes = loDrop(securityModes);
}

/**
 * tells if the server default endpoints should allow anonymous connection.
 * @type {Boolean}
 */
let allowAnonymous = true;
if (process.env.NODE_ENV === 'production') {
  allowAnonymous = false;
}

module.exports = {
  /**
    * the TCP port to listen to.
    * @type {Number}
    * @default 26543|26540
    * e.g. 26540 is intended for unencrypted communication.
    * e.g. 26543 is intended for tls/ssl encryption.
    */
  port: (process.env.NODE_ENV === 'production')? 26543 : 26540,
  /**
    * the possible security policies that the server will expose
    Basic128 = "http://opcfoundation.org/UA/SecurityPolicy#Basic128",
    Basic192 = "http://opcfoundation.org/UA/SecurityPolicy#Basic192",
    Basic192Rsa15 = "http://opcfoundation.org/UA/SecurityPolicy#Basic192Rsa15",
    Basic256Rsa15 = "http://opcfoundation.org/UA/SecurityPolicy#Basic256Rsa15",
    Basic256Sha256 = "http://opcfoundation.org/UA/SecurityPolicy#Basic256Sha256",
    Aes128_Sha256_RsaOaep = "http://opcfoundation.org/UA/SecurityPolicy#Aes128_Sha256_RsaOaep",
    PubSub_Aes128_CTR = "http://opcfoundation.org/UA/SecurityPolicy#PubSub_Aes128_CTR",
    PubSub_Aes256_CTR = "http://opcfoundation.org/UA/SecurityPolicy#PubSub_Aes256_CTR",
    Basic128Rsa15 = "http://opcfoundation.org/UA/SecurityPolicy#Basic128Rsa15",
    Basic256
    * @type {Array<SecurityPolicy>}
    */
  securityPolicies,

  /**
    * the possible security mode that the server will expose
    * @type {Array<MessageSecurityMode>}
    */
  securityModes,
  /**
    * tells if the server default endpoints should allow anonymous connection.
    * @type {Boolean}
    */
  allowAnonymous,

  /** 
    * alternate hostname  or IP to use 
    * @type {String|Array<String>}
    */
  alternateHostname: '',

  /**
    *  true, if discovery service on unsecure channel shall be disabled
    * @type {Boolean}
    */
  disableDiscovery: false,

  /**
    *  alternate endpoints
    * @type {Array<OPCUAServerEndpointOptions>}
    */
  alternateEndpoints: [],

  /**
    * the server certificate full path filename
    * the certificate should be in PEM format
    * @type {String}
    * @example const certificateFile ="../packages/node-opcua-samples/certificates/client_selfsigned_cert_2048.pem";
    */
  certificateFile: '',
  /**
    * the server private key full path filename
    *
    * This file should contains the private key that has been used to generate
    * the server certificate file.
    *
    * the private key should be in PEM format
    *@type {String}
    *@example const privateKeyFile ="../packages/node-opcua-samples/certificates/client_key_2048.pem";
    */
  privateKeyFile: '',

  /**
    * the default secure token life time in ms.
    * @type {Number}
    */
  defaultSecureTokenLifetime: 600000,
  /**
    * the HEL/ACK transaction timeout in ms.
    *
    * Use a large value ( i.e 15000 ms) for slow connections or embedded devices.
    * @type {Number}
    */
  timeout: 240000,

  /**
    * the maximum number of simultaneous sessions allowed.
    * @type {Number}
    * @deprecated
    * [NODE-OPCUA-W21] maxAllowedSessionNumber property is now deprecated , please use serverCapabilities.maxSessions instead
    */
  // maxAllowedSessionNumber: 100,

  /**
    * the maximum number authorized simultaneous connections per endpoint
    * @type {Number}
    */
  maxConnectionsPerEndpoint: 100,

  /**
    * the nodeset.xml file(s) to load
    *
    * node-opcua comes with pre-installed node-set files that can be used
    * @type {String|Array<String>}
    */
  nodeset_filename: [nodesets.standard],

  /**
    * the server Info
    *
    * this object contains the value that will populate the
    * Root/ObjectS/Server/ServerInfo OPCUA object in the address space.
    * @type {ApplicationDescriptionOptions}
    *
    * serverInfo: {
         applicationUri: string;
         productUri: string;
         applicationName: LocalizedTextLike | string;
         gatewayServerUri: string | null;
         discoveryProfileUri: string | null;
         discoveryUrls: string[];
      };
   */
  serverInfo: null,
  /**
    * the build Info
    *
    * this object contains the value that will populate the
    * Root/ObjectS/Server/ServerInfo OPCUA object in the address space.
    * @type {ApplicationDescriptionOptions}
    *
    * buildInfo: {
         productName?: string;
         productUri?: string | null, // << should be same as default_server_info.productUri?
         manufacturerName?: string,
         softwareVersion?: string,
         buildNumber?: string;
         buildDate?: Date;
     };
    */
  buildInfo: default_build_info,

  /**
    *  an object that implements user authentication methods
    *  @type {UserManagerOptions}
    */
  userManager: { isValidUser },

  /** 
    * resource Path is a string added at the end of the url such as "/UA/Server" 
    * @type {String}
    * */
  resourcePath: '',

  /**
    * server capabilities
    * @type {ServerCapabilitiesOptions}
    */
  serverCapabilities: { maxSessions: 100 },
  // serverCapabilities.maxSessions

  /**
    * if server shall raise AuditingEvent
    * @type {Boolean}
    */
  isAuditing: true,

  /**
    * strategy used by the server to declare itself to a discovery server
    *
    * - HIDDEN: the server doesn't expose itself to the external world
    * - MDNS: the server publish itself to the mDNS Multicast network directly
    * - LDS: the server registers itself to the LDS or LDS-ME (Local Discovery Server)
    * @type {RegisterServerMethod}
    * @default  RegisterServerMethod.HIDDEN - by default the server will not register itself to the local discovery server
    *
    */
  registerServerMethod: RegisterServerMethod.HIDDEN,

  /**
    * discovery server endpoint url
    * @type {String}
    */
  discoveryServerEndpointUrl: 'opc.tcp://localhost:4840',

  /**
    *
    *  supported server capabilities for the Mutlicast (mDNS)
    *  @type {Array<String>}
    *  @default ["NA"]
    *  the possible values are any of node-opcua-discovery.serverCapabilities)
    *
    */
  capabilitiesForMDNS: ['NA'],

  /**
    * user Certificate Manager
    * this certificate manager holds the X509 certificates used
    * by client that uses X509 certificate token to impersonate a user
    * @type {OPCUACertificateManager}
    */
  userCertificateManager: null,

  /**
    * Server Certificate Manager
    *
    * this certificate manager will be used by the server to access
    * and store certificates from the connecting clients
    * @type {OPCUACertificateManager}
    */
  serverCertificateManager: null
};