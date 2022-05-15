/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const loOmit = require('lodash/omit');

const {
  inspector,
} = require('../../../lib');

const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  formatSimpleDataValue,
} = require('../../opcua-helper');

const isDebug = false;

/**
 * @async
 * @name sessionWrite
 * @param {Object} params
 * @param {any} value  
 * @returns {Object}
 */
const sessionWrite = async (params, value) => {

  if (isDebug && params) inspector('sessionWrite.params:', loOmit(params, ['myOpcuaClient', 'app']));
  if (isDebug && value) inspector('sessionWrite.value:', value);

  // Get arguments for function
  const client = params.myOpcuaClient;
  const browseName = params.addressSpaceOption.browseName;
  const dataType = (params.opcua && params.opcua.dataType) ? params.opcua.dataType : DataType.String;
  const attributeIds = (params.opcua && params.opcua.attributeIds) ? params.opcua.attributeIds : AttributeIds.Value;

  const nodeToWrite = [{
    nodeId: params.nodeId,
    attributeId: attributeIds,
    value: {
      value: {
        dataType,
        value
      }
    }
  }];

  // Session write data
  const statusCode = await client.sessionWrite(browseName, nodeToWrite);
  if (isDebug && statusCode) console.log('sessionWrite.statusCode:', chalk.greenBright(statusCode));
  // Session read data
  let readValue = await client.sessionRead(browseName, attributeIds);
  // Format simple DataValue
  readValue = formatSimpleDataValue(readValue);
  if (isDebug && readValue.length) inspector('sessionWrite.formatSimpleDataValue.readValue:', readValue);
  if (nodeToWrite[0].value.value.value !== readValue[0].value.value) {
    throw new Error(`Write error. Written value "${nodeToWrite.value.value}" does not match read value "${readValue[0].value.value}"`);
  }
  return readValue;
};

module.exports = sessionWrite;