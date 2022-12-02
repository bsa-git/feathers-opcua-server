/* eslint-disable no-unused-vars */
const chalk = require('chalk');

const {
  appRoot,
  inspector,
  addIntervalId
} = require('../../lib');

const loForEach = require('lodash/forEach');
const loOmit = require('lodash/omit');

const {
  formatUAVariable,
  getParamsAddressSpace,
  getClientService,
  setValueFromSourceForGroup,
  convertAliasListToBrowseNameList
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
  let dataItems, dataType, results;
  const id = params.myOpcuaServer.id;
  const app = params.myOpcuaServer.app;
  //------------------------------------
  
  if (isDebug && params) inspector('getterValuesFromKepServer.params:', loOmit(params, ['myOpcuaServer']));
  
  const  browseName = formatUAVariable(addedValue).browseName;
  let configOptions = getParamsAddressSpace(id).variables;
  if (isDebug && configOptions) inspector('getterValuesFromKepServer.groupTags:', configOptions);
  // const groupTagNodeIds = configOptions.filter(opt => opt.ownerGroup && opt.ownerGroup === browseName).map(t => t.nodeId);
  const groupTagNodeIds = configOptions.filter(opt => opt.ownerGroup === browseName).map(t => t.nodeId);
  if (isDebug && groupTagNodeIds) inspector('getterValuesFromKepServer.groupTagNodeIds:', groupTagNodeIds);


  // Watch read only new file
  const getValuesFromKepServer = async function(clientId, nodeIds) {
    // Show filePath, data
    if (isDebug && clientId) console.log('getterValuesFromKepServer.clientId:', clientId);
    if (true && nodeIds) console.log('getterValuesFromKepServer.nodeIds:', nodeIds);

    /** 
    // Set value from source
    dataType = formatUAVariable(addedValue).dataType[1];
    results = papa.parse(data, { delimiter: ';', header: true });
    dataItems = results.data[0];
    dataItems = convertAliasListToBrowseNameList(params.addedVariableList, dataItems);
    
    // Get dateTime from fileName
    // e.g. data-20220518_075752.txt -> 2022-05-18T07:57:52
    const dateTime = getDateTimeFromFileName(filePath, [5], 'YYYYMMDD_HHmmss');
    if(isDebug && dateTime) inspector('getterHistValueFromFile.dateTime:', dateTime);

    // Add prop "!value": { dateTime: ''2022-05-17T13:22:56' } to dataItems
    dataItems['!value'] = { dateTime };
    if(isDebug && dataItems) inspector('getterHistValueFromFile.dataItems:', dataItems);
    
    addedValue.setValueFromSource({ dataType, value: JSON.stringify(dataItems) });

    // Remove file 
    removeFileSync(filePath);

    // Set value from source for group 
    if (params.addedVariableList) {
      setValueFromSourceForGroup(params, dataItems);
    }
    */
  };
 
  // Set interval
  const intervalId = setInterval(async function () {
    // let csv = readFileSync([appRoot, params.fromFile]);
    const clientId = params.clientId;
    const service = await getClientService(app, clientId);
    if(service){
      await getValuesFromKepServer(clientId, groupTagNodeIds);
    }
  }, params.interval);

  // Add interval Id to list
  addIntervalId(intervalId);
};


module.exports = getterValuesFromKepServer;
