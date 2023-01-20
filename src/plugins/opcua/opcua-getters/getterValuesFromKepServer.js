/* eslint-disable no-unused-vars */
const chalk = require('chalk');
const moment = require('moment');

const {
  logger,
  inspector,
  addIntervalId
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

//=============================================================================

/**
 * @method getterValuesFromKepServer
 * @param {Object} params 
 * @param {Object} addedValue 
 * @returns {void}
 */
const getterValuesFromKepServer = function (params = {}, addedValue) {
  let service, readResults, dataItems = {}, dataType, dateTime;
  const id = params.myOpcuaServer.id;
  const app = params.myOpcuaServer.app;
  const clientId = params.clientId;
  //------------------------------------

  if (isDebug && params) inspector('getterValuesFromKepServer.params:', loOmit(params, ['myOpcuaServer']));

  const browseName = formatUAVariable(addedValue).browseName;
  dataType = formatUAVariable(addedValue).dataType[1];
  let configOptions = getParamsAddressSpace(id).variables;
  if (isDebug && configOptions) inspector('getterValuesFromKepServer.configOptions:', configOptions);
  const groupTags = configOptions.filter(opt => opt.ownerGroup === browseName);
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
    for (let index = 0; index < readResults.length; index++) {
      const readResult = readResults[index];
      const browseName = groupTags[index].browseName;
      const formatValue = formatDataValue(id, readResult, browseName, 'ru');
      if (isDebug && formatValue) inspector('getterValuesFromKepServer.formatValue:', formatValue);
      // Get dateTime
      dateTime = formatValue.serverTimestamp;
      // dateTime = moment.utc(dateTime).format('YYYY-MM-DDTHH:mm:ss');
      dateTime = moment(dateTime).format('YYYY-MM-DDTHH:mm:ss');
      dataItems['!value'] = { dateTime };
      if (isDebug && dateTime) console.log('getterValuesFromKepServer.dateTime: ', dateTime);
      dataItems[browseName] = formatValue.value.value;
      if (isDebug && formatValue.statusCode.name !== 'Good') logger.info(`For browseName: "${chalk.yellowBright(browseName)}" statusCode = "${chalk.redBright(formatValue.statusCode.name)}", value = ${formatValue.value.value}`);
    }
    if (isDebug && dataItems) inspector('getterValuesFromKepServer.dataItems:', dataItems);

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
      logger.error('getterValuesFromKepServer.Error:', error.message);
    }
  }, params.interval);

  // Add interval Id to list
  addIntervalId(intervalId);
};


module.exports = getterValuesFromKepServer;