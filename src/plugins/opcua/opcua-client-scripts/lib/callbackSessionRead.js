/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../../lib');

const {
  formatSimpleDataValue,
} = require('../../../opcua/opcua-helper');

const loOmit = require('lodash/omit');

const isDebug = false;

/**
 * @async
 * @example
   *
   *   ``` javascript
   *   const nodesToRead = [{
   *          nodeId: "ns=2;s=Furnace_1.Temperature",
   *          attributeId: AttributeIds.BrowseName
   *        }];
   *   await session.read(nodesToRead) {
   *     ...
   *   });
   *   ```
 * @name callbackSessionRead
 * @param {Object} session 
 * @param {Object} params 
 * @returns {String}
 */
const callbackSessionRead = async (session, params) => {

  if (isDebug && params) inspector('callbackSessionRead.params:', loOmit(params, ['app']));
  const nodesToRead = params.sessReadOpts.nodesToRead;

  // Session read data
  let readValues = await session.read(nodesToRead);
  // Format simple DataValue
  readValues = formatSimpleDataValue(readValues);
  if (isDebug && readValues.length) inspector('callbackSessionRead.readValues:', readValues);
  // Get statusCode
  let statusCode = readValues.filter(v => v.statusCode.name === 'Good').length === readValues.length;
  return { statusCode: statusCode ? 'Good' : 'Bad', readValues };
};

module.exports = callbackSessionRead;