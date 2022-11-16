/* eslint-disable no-unused-vars */
const {
  appRoot,
  inspector,
  assert,
  isString,
} = require('../../../lib');

const {
  isNodeId,
  formatSimpleHistoryResults,
} = require('../../../opcua/opcua-helper');

const {
  showInfoForHandler2,
} = require('../../../opcua/opcua-subscriptions/lib');

const loOmit = require('lodash/omit');

const defaultReadValueIdOptions = require(`${appRoot}/src/api/opcua/config/ReadValueIdOptions`);

const isDebug = false;

/**
 * @async
 * @example
   *
   *   ```javascript
   * //  es6
   * const dataValues = await session.readHistoryValue(
   *   [{
   *  nodeId: "ns=0;i=2258",
   *  attributeId: AttributeIds.Value,
   *  indexRange: null,
   *  dataEncoding: { namespaceIndex: 0, name: null }
   *}],
   *   "2015-06-10T09:00:00.000Z",
   *   "2015-06-10T09:01:00.000Z");
   * ```
 * @name callbackSessionReadHistory
 * @param {Object} session 
 * @param {Object} params 
 * @returns {String}
 */
const callbackSessionReadHistory = async (session, params) => {
  let itemNodeIds = [], itemNodeId;
  //-------------------------
  if (isDebug && params) inspector('callbackSessionReadHistory.params:', loOmit(params, ['app']));
  
  const showReadValues = params.sessReadOpts.showReadValues;
  const startTime = params.sessReadOpts.startTime; 
  const endTime = params.sessReadOpts.endTime;
  const nodesToRead = params.sessReadOpts.nodesToRead;
  if (Array.isArray(nodesToRead)) {
    for (let index = 0; index < nodesToRead.length; index++) {
      const nodeToRead = nodesToRead[index];
      if (isString(nodeToRead)) {
        assert(isNodeId(nodeToRead), `Wrong format - nodeId: ${nodeToRead}`);
        itemNodeId = Object.assign({}, defaultReadValueIdOptions, { nodeId: nodeToRead });
        itemNodeIds.push(itemNodeId);
      } else {
        itemNodeId = Object.assign({}, defaultReadValueIdOptions, nodeToRead);
        itemNodeIds.push(itemNodeId);
      }
    }
  } else {
    if (isString(nodesToRead)) {
      assert(isNodeId(nodesToRead), `Wrong format - nodeId: ${nodesToRead}`);
      itemNodeId = Object.assign({}, defaultReadValueIdOptions, { nodeId: nodesToRead });
      itemNodeIds.push(itemNodeId);
    } else {
      itemNodeId = Object.assign({}, defaultReadValueIdOptions, nodesToRead);
      itemNodeIds.push(itemNodeId);
    }
  }

  if (isDebug && itemNodeIds.length) inspector(`callbackSessionReadHistory.itemNodeIds(${startTime}, ${endTime}):`, itemNodeIds);
  // Session read data
  let readValues = await session.readHistoryValue(itemNodeIds, startTime, endTime );
  // Format simple DataValue
  readValues = formatSimpleHistoryResults(readValues, itemNodeIds);
  if (isDebug && readValues.length) inspector('callbackSessionReadHistory.readValues:', readValues);
  // Get statusCode
  let statusCode = readValues.filter(v => v.statusCode.name === 'Good').length === readValues.length;
  // let statusCode = 'Good';
  if (true && showReadValues) {
    console.log('<-------------------------------------------------------------------------------------->');
    for (let index = 0; index < itemNodeIds.length; index++) {
      const nodeId = itemNodeIds[index].nodeId;
      const dataValues = readValues[index]['historyData']['dataValues'];
      for (let index2 = 0; index2 < dataValues.length; index2++) {
        const dataValue = dataValues[index2];
        showInfoForHandler2({ addressSpaceOption: nodeId }, dataValue);        
      }
    }
    console.log('<-------------------------------------------------------------------------------------->');
  }

  return { statusCode: statusCode ? 'Good' : 'Bad', readValues };
};

module.exports = callbackSessionReadHistory;