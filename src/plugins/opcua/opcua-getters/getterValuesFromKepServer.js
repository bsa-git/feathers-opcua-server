/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const moment = require('moment');

const {
  logger,
  inspector,
  addIntervalId,
  getDateTime,
  objectHash
} = require('../../lib');

const loForEach = require('lodash/forEach');
const loOmit = require('lodash/omit');

const {
  formatUAVariable,
  getParamsAddressSpace,
  getClientService,
  formatDataValue,
  setValueFromSourceForGroup,
  // setValueFromSourceForGroup
} = require('../opcua-helper');

const debug = require('debug')('app:getterAcmDayValueFromFile');
const isDebug = false;

let prevDailyData = '';
// e.g. -> prevDailyData = '2023-01-26';
let prevDataItemsHash = ''; // e.g. -> '5baf17d1c0d7beac7ceaabf49e67fd577c899e3c'

//=============================================================================

/** 
 * @method getterValuesFromKepServer
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const getterValuesFromKepServer = function (params = {}, addedValue) {
  let service, readResults, dataItems = {}, dataValues = [], dataType, dateTime;
  const id = params.myOpcuaServer.id;
  const app = params.myOpcuaServer.app;
  const clientId = params.clientId;
  const getterType = params.type; // e.g. -> 'daily'
  //------------------------------------

  if (isDebug && params) inspector('getterValuesFromKepServer.params:', loOmit(params, ['myOpcuaServer']));

  // const browseName = formatUAVariable(addedValue).browseName;
  const ownerGroupBrowseName = formatUAVariable(addedValue).browseName;
  dataType = formatUAVariable(addedValue).dataType[1];
  let configOptions = getParamsAddressSpace(id).variables;
  if (isDebug && configOptions) inspector('getterValuesFromKepServer.configOptions:', configOptions);
  const groupTags = configOptions.filter(opt => opt.ownerGroup === ownerGroupBrowseName);
  const groupTagNodeIds = groupTags.map(t => t.nodeId);
  if (isDebug && groupTagNodeIds) inspector('getterValuesFromKepServer.groupTagNodeIds:', groupTagNodeIds);


  // Get values from KepServer
  const getValuesFromKepServer = async function (clientId, nodeIds) {
    // Show filePath, data
    if (isDebug && clientId) console.log('getterValuesFromKepServer.clientId:', clientId);
    if (isDebug && nodeIds) console.log('getterValuesFromKepServer.nodeIds:', nodeIds);

    // service.sessionRead
    readResults = await service.sessionRead(clientId, nodeIds);
    // Get dataItems
    dataValues = [];
    for (let index = 0; index < readResults.length; index++) {
      const readResult = readResults[index];
      const browseName = groupTags[index].browseName;
      const formatValue = formatDataValue(id, readResult, browseName, 'ru');
      if (isDebug && formatValue) inspector('getterValuesFromKepServer.formatValue:', formatValue);
      // Get dateTime
      dateTime = formatValue.serverTimestamp;
      if (getterType === 'daily') {
        dateTime = moment(dateTime).format('YYYY-MM-DD');
        // dateTime = moment(dateTime).format('YYYY-MM-DDTHH:mm:ss');
      } else {
        dateTime = moment(dateTime).format('YYYY-MM-DDTHH:mm:ss');
      }

      dataItems['!value'] = { dateTime };
      if (isDebug && dateTime) console.log('getterValuesFromKepServer.dateTime: ', dateTime);
      dataItems[browseName] = formatValue.value.value;
      
      // Add value to dataValues
      dataValues.push({
        statusCode: formatValue.statusCode.name,
        browseName,
        value: formatValue.value.value
      });
    }
    if (isDebug && dataItems) inspector('getterValuesFromKepServer.dataItems:', dataItems);

    // Show logger.warn
    const badDataValues = dataValues.filter(item => item.statusCode !== 'Good');
    if(badDataValues.length && (dataValues.length > badDataValues.length)){
      for (let index = 0; index < badDataValues.length; index++) {
        const badItem = badDataValues[index];
        if (true && badItem) logger.warn(`For browseName: "${badItem.browseName}", statusCode = "${badItem.statusCode}", value = ${badItem.value}`);
      }
    }
    if(badDataValues.length && (dataValues.length === badDataValues.length)){
      if (true && badDataValues.length) logger.warn(`For browseName: "${ownerGroupBrowseName}", statusCode = "Bad"`);
    }

    if (getterType === 'daily') {
      dateTime = dataItems['!value']['dateTime'];
      // Get current dataItems hash 
      const omits = ['!value'];
      const currentDataItemsHash = objectHash(loOmit(dataItems, omits));
      if ((dateTime === prevDailyData) && (prevDataItemsHash === currentDataItemsHash)) return;

      if (isDebug && dataItems) inspector('getterValuesFromKepServer.forDailyType:', {
        dateTime,
        prevDailyData,
        currentDataItemsHash,
        prevDataItemsHash,
        dataItems
      });

      prevDailyData = dateTime;
      prevDataItemsHash = currentDataItemsHash;
    }

    // Set value for owner group
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
  };

  // Set interval
  const intervalId = setInterval(async function () {
    try {
      if (!service) {
        service = await getClientService(app, clientId);
      }
      await getValuesFromKepServer(clientId, groupTagNodeIds);
    } catch (error) {
      const errorMessage = error.message? error.message : error;
      logger.error(`getterValuesFromKepServer.Error: ${errorMessage}`);
    }
  }, params.interval);

  // Add interval Id to list
  addIntervalId(intervalId);
};


module.exports = getterValuesFromKepServer;
