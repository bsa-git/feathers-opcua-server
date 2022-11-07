/* eslint-disable no-unused-vars */
const {
  inspector,
  assert
} = require('../../../lib');

const {
  getSecurityMode,
  getSecurityPolicy
} = require('../../../opcua');

const debug = require('debug')('app:callbackSubscriptionMonitor');
const isDebug = false;

/**
 * @name callbackSessionEndpoint
 * @param {Object} session 
 * @param {Object} params 
 * @returns {Object}
 */
const callbackSessionEndpoint = async (session, params) => {
  let result = null;
  //--------------------------------------------------------------
  assert(session, 'Session must be created');
  const endpoint = (session && session.endpoint) ? session.endpoint : null;
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
      securityMode: getSecurityMode(endpoint.securityMode),
      securityPolicyUri: endpoint.securityPolicyUri,
      userIdentityTokens: endpoint.userIdentityTokens,
      transportProfileUri: endpoint.transportProfileUri,
      securityLevel: endpoint.securityLevel
    };
    return { 
      statusCode: 'Good', 
      endpointUrl: result.endpointUrl,
      serverCertificate: result.serverCertificate,
      securityMode: result.securityMode,
      securityPolicyUri: result.securityPolicyUri,
      userIdentityTokens: result.userIdentityTokens,
      transportProfileUri: result.transportProfileUri,
      securityLevel: result.securityLevel,
      server: result.server,
    };
  }
  return { statusCode: 'NoEndpoint' };
};

module.exports = callbackSessionEndpoint;