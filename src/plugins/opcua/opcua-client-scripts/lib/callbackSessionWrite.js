/* eslint-disable no-unused-vars */
const loOmit = require('lodash/omit');

const {
  inspector,
  assert
} = require('../../../lib');

const {
  AttributeIds,
  DataType,
} = require('node-opcua');

const {
  formatSimpleDataValue,
} = require('../../../opcua/opcua-helper');

const callbackSessionRead = require('./callbackSessionRead');

const isDebug = false;

/**
 * @async
 * @name callbackSessionWrite
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
 * @param {Object} session 
 * @param {Object} params 
 * @returns {String}
 */
const callbackSessionWrite = async (session, params) => {
  let nodesToRead = [], result;
  //------------------------------
  if (isDebug && params) inspector('callbackSessionWrite.params:', loOmit(params, ['app']));
  let nodesToWrite =
    Array.isArray(params.sessWriteOpts.nodesToWrite) ?
      params.sessWriteOpts.nodesToWrite :
      Object.assign({}, params.sessWriteOpts.nodesToWrite);
  
  const showWriteValues = params.sessWriteOpts.showWriteValues;
  if(!Array.isArray(nodesToWrite)) nodesToWrite = [nodesToWrite];

  // Check nodesToWrite
  for (let index = 0; index < nodesToWrite.length; index++) {
    const nodeToWrite = nodesToWrite[index];
    assert(nodeToWrite.nodeId, 'The object "nodeToWrite" must have a "nodeId" field');
    if(nodeToWrite.attributeId === undefined) nodeToWrite.attributeId = AttributeIds.Value;
    assert(nodeToWrite.value, 'The object "nodeToWrite" must have a "value" field');
    assert(nodeToWrite.value.value, 'The object "nodeToWrite" must have a "value.value" field');
    assert(nodeToWrite.value.value.value !== undefined, 'The object "nodeToWrite" must have a "value.value.value" field');
    assert(nodeToWrite.value.value.dataType !== undefined, 'The object "nodeToWrite" must have a "value.value.dataType" field');
  }

  // Session write data
  const statusCodes = await session.write(nodesToWrite);
  if (isDebug && statusCodes.length) inspector('callbackSessionWrite.statusCodes:', statusCodes);
  // Get statusCode
  let statusCode = statusCodes.filter(v => v.name === 'Good').length === statusCodes.length;
  result = { statusCode: statusCode ? 'Good' : 'Bad', statusCodes };

  // Run callbackSessionRead
  if(showWriteValues && statusCode){
    for (let index = 0; index < nodesToWrite.length; index++) {
      const nodeToWrite = nodesToWrite[index];
      nodesToRead.push({ nodeId: nodeToWrite.nodeId, attributeId: AttributeIds.Value });
    }
    params.sessReadOpts.nodesToRead = nodesToRead;
    params.sessReadOpts.showReadValues = true;
    result = await callbackSessionRead(session, params);
    if (isDebug && result) inspector('callbackSessionWrite.result:', result);
    if(result.statusCode !== 'Good') return result;

    for (let index = 0; index < nodesToWrite.length; index++) {
      const nodeToWrite = nodesToWrite[index];
      const readValue = result.readValues[index];
      if(nodeToWrite.value.value.value !== readValue.value.value){
        throw new Error(`Write error. Written value "${nodeToWrite.value.value}" does not match read value "${readValue.value.value}"`);
      }
    }
  }
  return result;
};

module.exports = callbackSessionWrite;