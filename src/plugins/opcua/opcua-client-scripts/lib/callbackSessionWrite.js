/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  formatSimpleDataValue,
} = require('../../../opcua/opcua-helper');

const isDebug = false;

/**
 * @async
 * @name callbackSessionWrite
 * @param {Object} session 
 * @param {Object} params 
 * @returns {String}
 */
 const callbackSessionWrite = async (session, params) => {

  const nodeToWrite = {
    nodeId: params.nodeId,
    attributeId: AttributeIds.Value,
    value: {
      value: {
        dataType: DataType.String,
        value: JSON.stringify(params),
      }
    }
  };

  const nodeToRead = {
    nodeId: params.nodeId,
    attributeId: AttributeIds.Value,
  };
  // Session write data
  const statusCode = await session.write(nodeToWrite);
  // Session read data
  let readValue = await session.read(nodeToRead);
  // Format simple DataValue
  readValue = formatSimpleDataValue(readValue);
  if (isDebug && readValue) inspector('sessionWrite.readValue:', readValue);
  if(nodeToWrite.value.value.value !== readValue.value.value){
    throw new Error(`Write error. Written value "${nodeToWrite.value.value}" does not match read value "${readValue.value.value}"`);
  }
  return statusCode.name;
};

module.exports = callbackSessionWrite;