
/* eslint-disable no-unused-vars */
const { readFileSync, appRoot } = require('../../plugins/lib');
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

const fs = require('fs');
const packageFile = `${appRoot}/node_modules/node-opcua-server/package.json`;
const packageInfo = require(packageFile); 
const default_build_info = {
  manufacturerName: 'Node-OPCUA : MIT Licence ( see http://node-opcua.github.io/)',
  productName: packageInfo.name,
  productUri: null, // << should be same as default_server_info.productUri?
  softwareVersion: packageInfo.version,
  buildDate: fs.statSync(packageFile).mtime
};

// const packageFile = `${appRoot}/package.json`;
// const packageInfo = require(packageFile); 
// const default_build_info = {
//   manufacturerName: 'Feathers-OPCUA-Server : MIT Licence ( see https://github.com/bsa-git/feathers-opcua-server)',
//   productName: packageInfo.name,
//   productUri: null, // << should be same as default_server_info.productUri?
//   softwareVersion: packageInfo.version,
//   buildDate: fs.statSync(packageFile).mtime
// };

module.exports = {
  /**
    * the TCP port to listen to.
    * @type {Number}
    * @default 26543
    */
  port: 26543,
  /**
    * the possible security policies that the server will expose
    * @type {Array<SecurityPolicy>}
    */
  securityPolicies: [SecurityPolicy.None, SecurityPolicy.Basic128Rsa15, SecurityPolicy.Basic256Sha256],
  /**
    * the possible security mode that the server will expose
    * @type {Array<MessageSecurityMode>}
    */
  securityModes: [MessageSecurityMode.None, MessageSecurityMode.Sign, MessageSecurityMode.SignAndEncrypt],
  /**
    * tells if the server default endpoints should allow anonymous connection.
    * @type {Boolean}
    */
  allowAnonymous: true,

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
  timeout: 10000,

  /**
    * the maximum number of simultaneous sessions allowed.
    * @type {Number}
    */
  maxAllowedSessionNumber: 10,

  /**
    * the maximum number authorized simultaneous connections per endpoint
    * @type {Number}
    */
  maxConnectionsPerEndpoint: 10,

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
  userManager: null,

  /** 
    * resource Path is a string added at the end of the url such as "/UA/Server" 
    * @type {String}
    * */
  resourcePath: '',

  /**
    * server capabilities
    * @type {ServerCapabilitiesOptions}
    */
  serverCapabilities: null,

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