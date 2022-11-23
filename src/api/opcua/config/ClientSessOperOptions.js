/* eslint-disable no-unused-vars */
const {
  UserTokenType,
  TimestampsToReturn,
  AttributeIds,
  DataType
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
  // Session write options
  sessWriteOpts: {
    showWriteValues: true,
    nodesToWrite: [
      {
        nodeId: '',
        attributeId: AttributeIds.Value,
        value: {
          statusCode: 'Good',
          value: {
            dataType: DataType.Double,
            value: 100.0
          }
        }
      }
    ]
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
