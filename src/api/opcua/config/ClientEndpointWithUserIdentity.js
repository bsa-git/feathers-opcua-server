/* eslint-disable no-unused-vars */
const {
  UserTokenType
} = require('node-opcua');

module.exports = {
  endpointUrl: '',
  userIdentity: { type: UserTokenType.Anonymous }
};
