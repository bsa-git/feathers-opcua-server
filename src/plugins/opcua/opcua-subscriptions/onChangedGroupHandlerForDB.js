/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../../lib');

const {
  findItems,
  createItem
} = require('../../db-helpers');

const {
  getValueFromNodeId,
  formatDataValue
} = require('../opcua-helper');

const chalk = require('chalk');
const loRound = require('lodash/round');

const debug = require('debug')('app:opcua-subscriptions/onChangedGroupHandlerForDB');
const isDebug = false;
const isLog = false;

/**
 * @method onChangedCH_M5Handler
 * @param {Object} params 
 * @param {Object} dataValue
 * @returns {void}
 */
async function onChangedGroupHandlerForDB(params, dataValue) {
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.params:', params);
  // inspector('subscriptions.onChangedCH_M5Handler.params:', params);
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.dataValue:', dataValue);
  const browseName = getValueFromNodeId(params.nodeId);
  const addressSpaceOption = params.addressSpaceOption;
  dataValue = formatDataValue(params.id, dataValue, browseName, params.locale);
  let value = dataValue.value.value;
  if (isLog) inspector('subscriptions.onChangedCH_M5Handler.formatDataValue:', dataValue);
  value = (addressSpaceOption.dataType === 'Double') ? loRound(value, 3) : value;
  let engineeringUnits = (dataValue.valueParams && dataValue.valueParams.engineeringUnits) ? dataValue.valueParams.engineeringUnits : '';
  const timestamp = dataValue.serverTimestamp;
  engineeringUnits = engineeringUnits ? `(${engineeringUnits})` : '';

  if (addressSpaceOption.group) {
    value = JSON.parse(value);
    const valueKeys = Object.keys(value).length;
    console.log('<<===', chalk.magentaBright(`ID="${params.id}"; `), chalk.greenBright(`Name="${browseName}"; `), chalk.whiteBright(`Number of values=(${valueKeys});`), chalk.cyanBright(`Timestamp=${timestamp}`), '===>>');

    // Save data to DB
    const app = params.app;
    let tags = await findItems(app, 'opcua-tags', { browseName });
    // tags = tags.data;
    if (tags.length) {
      const tag = tags[0];
      const idField = 'id' in tag ? 'id' : '_id';
      const tagId = tag[idField].toString();
      const data = {
        tagId,
        tagName: tag.browseName,
        values: [{
          key: tag.browseName,
          value: JSON.stringify(value)
        }]
      };
      await createItem(app, 'opcua-values', data);
    }
    // inspector('onChangedGroupHandlerForDB.opcuaValue:', opcuaValue);
  }
}

module.exports = onChangedGroupHandlerForDB;
