/* eslint-disable no-unused-vars */
const {
  UserTokenType,
  TimestampsToReturn,
  AttributeIds,
  DataType
} = require('node-opcua');

module.exports = {
  command: '',
  method: '',
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
    // nodesToRead: 'ns=1;s=tag1'|['ns=1;s=tag1',..., 'ns=1;s=tag2']|{nodeId: 'ns=1;s=tag1'}|[{nodeId: 'ns=1;s=tag1'},..., {nodeId: 'ns=1;s=tag2'}]
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
    // nodesToWrite: {...}|[{...}, {...}]
    nodesToWrite: {
      nodeId: '',
      attributeId: AttributeIds.Value,
      value: {
        statusCode: 'Good',
        value: {
          dataType: DataType.String,
          value: ''
        }
      }
    }
  },
  // Session call method options
  sessCallMethodOpts: {
    showCallMethod: true,
    // nodesToCallMethod: {...}|[{...}, {...}]
    nodesToCallMethod: {
      objectId: '',
      methodId: '',
      // inputArguments: [new Variant({...}),..., new Variant({...})]|
      // [{dataType: DataType.String, value: 'qwerty'},..., {dataType: DataType.String, value: 'qwerty'}]
      inputArguments: []
    }
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
