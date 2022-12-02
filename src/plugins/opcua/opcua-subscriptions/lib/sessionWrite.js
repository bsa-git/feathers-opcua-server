/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const loOmit = require('lodash/omit');

const {
  inspector,
  assert,
  isObject
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
 * 
 * @example :
 *
 *     const nodesToWrite = [
 *     {
 *          nodeId: "ns=1;s=SetPoint1",
 *          attributeId: opcua.AttributeIds.Value,
 *          value: {
 *             statusCode: Good,
 *             value: {
 *               dataType: opcua.DataType.Double,
 *               value: 100.0
 *             }
 *          }
 *     },
 *     {
 *          nodeId: "ns=1;s=SetPoint2",
 *          attributeId opcua.AttributeIds.Value,
 *          value: {
 *             statusCode: Good,
 *             value: {
 *               dataType: opcua.DataType.Double,
 *               value: 45.0
 *             }
 *          }
 *     }
 *     ];
 * 
 *     const statusCodes = await session.write(nodesToWrite);  
 * 
 * @param {Object} params
 * @param {any} value  
 * e.g. value - { 
      attributeId: AttributeIds.Value,
      dataType: DataType.String, 
      value: 'myValue' 
    }|{dataType: DataType.String, value: 'myValue' }|{value: 'myValue'}|'myValue'
 * @returns {Object}
 */
const sessionWrite = async (params, value) => {

  if (isDebug && params) inspector('sessionWrite.params:', loOmit(params, ['myOpcuaClient']));
  if (isDebug && value) inspector('sessionWrite.value:', value);

  // Get arguments for function
  const client = params.myOpcuaClient;
  const browseName = params.addressSpaceOption.browseName;
  const dataType = value.dataType ? value.dataType : DataType.String;
  const attributeId = value.attributeId ? value.attributeId : AttributeIds.Value;
  const _value = isObject(value) ? value.value : value;
  assert(_value !== undefined, 'Must have value');

  const nodeToWrite = [{
    nodeId: params.nodeId,
    attributeId,
    value: {
      value: {
        dataType,
        value: _value
      }
    }
  }];

  // Session write data
  const statusCodes = await client.sessionWrite(browseName, nodeToWrite);
  if (isDebug && statusCodes.length) console.log('sessionWrite.statusCode:', chalk.greenBright(statusCodes[0]['name']));
  return statusCodes;
};

module.exports = sessionWrite;