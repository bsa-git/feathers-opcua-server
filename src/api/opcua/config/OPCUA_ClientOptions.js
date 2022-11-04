/* eslint-disable no-unused-vars */
const {
  MessageSecurityMode,
  SecurityPolicy
} = require('node-opcua');

const defaultConnectionStrategy = require('./ClientConnectionStrategy.json');

module.exports = {
  /**
   * the client application name
   */
  applicationName: 'NodeOPCUA-Client',

  /**
   *  connection strategy
   */
  connectionStrategy: defaultConnectionStrategy,

  /**
   * if not specify or set to 0 , token  renewal will happen
   * around 75% of the defaultSecureTokenLifetime
   */
  tokenRenewalInterval: 0,

  /**
   * if set to true, pending session will not be automatically closed when disconnect is called
   */
  keepPendingSessionsOnDisconnect: false,

  /**
   * the server certificate.
   */
  serverCertificate: undefined,

  /**
   * default secure token lifetime in ms
   */
  defaultSecureTokenLifetime: 60000,

  /**
   * the security mode
   */
  securityMode: MessageSecurityMode.None,

  /**
   * the security policy
   */
  securityPolicy: SecurityPolicy.None,

  /**
   * can be set when the client doesn't create subscription. In this case,
   * the client will send a dummy request on a regular basis to keep the
   * connection active.
   */
  keepSessionAlive: false,

  /**
   * client certificate pem file.
   * @default 'certificates/client_selfsigned_cert_2048.pem'
   */
  certificateFile: '',
  /**
   * client private key pem file.
   * @default "certificates/client_key_2048.pem"
   */
  privateKeyFile: '',
  /**
   * a client name string that will be used to generate session names.
   */
  clientName: '',

  /**
   * discovery url:
   */
  discoveryUrl: '',

  /**
   * the requested session timeout in CreateSession (ms)
   */
  requestedSessionTimeout: 60000,

  /**
   * set to false if the client should accept server endpoint mismatch
   * @default false
   */
  endpointMustExist: false
};
