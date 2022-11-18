/* eslint-disable no-unused-vars */
const {
  UserTokenType,
  TimestampsToReturn,
  AttributeIds
} = require('node-opcua');

module.exports = {
  opt: {
    url: 'opc.tcp://localhost:26570',
  },
  userIdentityInfo: {
    type: UserTokenType.Anonymous, // UserTokenType.Anonymous, UserTokenType.UserName
    userName: '', 
    password: '' 
  },
  clientParams: {},
  // Session read options
  sessReadOpts: {
    showReadValues: true,
    nodesToRead: [{
      nodeId: '',
      attributeId: AttributeIds.Value
    }],
    startTime: '', 
    endTime: ''
  },
  // Subscription options
  subscriptionOptions: {},
  // Subscription monitor options
  subscrMonOpts: {
    itemToMonitor: {
      nodeId: '',
      attributeId: AttributeIds.Value
    },
    requestedParameters: {},
    timestampsToReturn: TimestampsToReturn.Neither,
    callBack: null
  }
};
