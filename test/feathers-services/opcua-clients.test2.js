/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const {
  DataType,
  VariantArrayType
} = require('node-opcua');

const {
  getOpcuaConfigOptions,
  getServerService,
  getClientService,
  getTimestamp
} = require('../../src/plugins/opcua/opcua-helper');

const {
  methodAcmDayReportsDataGet
} = require('../../src/plugins/opcua/opcua-methods');

const {
  saveOpcuaTags,
  removeOpcuaGroupValues,
  removeOpcuaStoreValues,
  getStoreParams4Data,
  syncHistoryAtStartup,
  syncReportAtStartup
} = require('../../src/plugins/db-helpers');

const {
  appRoot,
  logger,
  inspector,
  pause,
  getTime,
  getGroupsFromArray,
  makeDirSync,
  removeFilesFromDirSync,
  getPathBasename,
  readJsonFileSync,
  getIntervalIds,
  clearIntervalIds
} = require('../../src/plugins/lib');

const {
  startListenPort,
  stopListenPort,
} = require('../../src/plugins/test-helpers');

const chalk = require('chalk');
const moment = require('moment');

const loForEach = require('lodash/forEach');
const loOmit = require('lodash/omit');
const loTemplate = require('lodash/template');


const debug = require('debug')('app:opcua-clients.test2');
const isDebug = false;

// Server options
const srvData = {
  params: {
    port: 26580, // default - 26543, 26540 (opcua-class.test), 26550 (opcua-class.test2), 26560 (opcua-clients.test), 26570 (opcua-servers.test), 26580 (opcua-clients.m5.test),
    serverInfo: { applicationName: 'ua-cherkassy-azot_test2' },
    locale: 'ru'
  }
};

// Client options
const clientData = {
  // userIdentityInfo,
  params: {
    applicationName: 'ua-cherkassy-azot_test2',
    locale: 'ru'
  }
};
// Get ID
const id = srvData.params.serverInfo.applicationName;
const testNumbers = ['all']; // e.g. ['all'] | ['#5',...,'#13.4']

describe('<<=== OPC-UA: (opcua-clients.test2) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
    // Make dirs
    makeDirSync([appRoot, 'test/data/tmp/ch-m51']);
    makeDirSync([appRoot, 'test/data/tmp/ch-m52']);
    makeDirSync([appRoot, 'test/data/tmp/ch-m5acm_1']);
    makeDirSync([appRoot, 'test/data/tmp/ch-m5acm_2']);
    makeDirSync([appRoot, 'test/data/tmp/ch-m5acm_3']);
    makeDirSync([appRoot, 'test/data/tmp/excel-helper']);
  });

  after(function (done) {
    stopListenPort(done);
    clearIntervalIds();
    // Remove files
    removeFilesFromDirSync([appRoot, 'test/data/tmp/ch-m51']);
    removeFilesFromDirSync([appRoot, 'test/data/tmp/ch-m52']);
    removeFilesFromDirSync([appRoot, 'test/data/tmp/ch-m5acm_1']);
    removeFilesFromDirSync([appRoot, 'test/data/tmp/ch-m5acm_2']);
    removeFilesFromDirSync([appRoot, 'test/data/tmp/ch-m5acm_3']);
    removeFilesFromDirSync([appRoot, 'test/data/tmp/excel-helper']);
  });

  it('#1: OPC-UA clients: registered the service', async () => {
    const service = await getClientService(app, id);
    assert.ok(service, 'OPC-UA clients: registered the service');
  });

  it('#2: OPC-UA servers: registered the service', async () => {
    const service = await getServerService(app, id);
    assert.ok(service, 'OPC-UA servers: registered the service');
  });

  //===== SERVER CREATE/CLIENT CREATE =======//
  it('#3: OPC-UA servers: created the service', async () => {
    const service = await getServerService(app, id);
    // Create opcua server
    const opcuaServer = await service.create(srvData);
    if (isDebug) inspector('created the service.opcuaServer:', opcuaServer.server.getCurrentState());
    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });

  it('#4: OPC-UA clients: created the service', async () => {
    const service = await getClientService(app, id);
    // Create opcua client
    const opcuaClient = await service.create(clientData);
    if (isDebug) inspector('created the service.opcuaClient:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: created the service');
  });

  //============== SESSION HISTORY VALUES ====================//

  it('#5: OPC-UA clients: session history values for "CH_M51"', async () => {
    let dataItems, readResult = null, accumulator = '', timestamp = '';
    //----------------------------------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#5')) return;
    const service = await getClientService(app, id);

    // service.getItemNodeId
    readResult = await service.getItemNodeId(id, 'CH_M51::ValueFromFile');
    if (isDebug && readResult) inspector('getItemNodeId.readResult:', readResult);

    if (readResult) {
      // Get start time
      let start = moment();
      debug('SessionHistoryValue_ForCH_M51.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('SessionHistoryValue_ForCH_M51.EndTime:', getTime(end, false));

      // service.sessionReadHistoryValues
      readResult = await service.sessionReadHistoryValues(id, 'CH_M51::ValueFromFile', start, end);
      if (isDebug && readResult.length) inspector('SessionHistoryValue_ForCH_M51.readResult:', readResult);
      if (readResult.length && readResult[0].statusCode.name === 'Good') {
        if (readResult[0].historyData.dataValues.length) {
          let dataValues = readResult[0].historyData.dataValues;
          dataValues.forEach(dataValue => {
            timestamp = getTimestamp(dataValue.sourceTimestamp);
            if (dataValue.statusCode.name === 'Good') {
              dataItems = JSON.parse(dataValue.value.value);
              accumulator = '';
              loForEach(dataItems, function (value, key) {
                accumulator = accumulator + `${key}=${value}; `;
              });
              console.log(chalk.green('SessionHistoryValue_ForCH_M51.ValueFromFile:'), chalk.cyan(`${accumulator} Timestamp=${timestamp}`));
              assert.ok(true, 'OPC-UA clients: session history value from file');
            } else {
              assert.ok(false, 'OPC-UA clients: session history value from file');
            }
          });
        }
      } else {
        assert.ok(false, 'OPC-UA clients: session history value from file');
      }
    } else {
      assert.ok(false, 'OPC-UA clients: session history value from file');
    }
  });

  it('#6: OPC-UA clients: session history values for "CH_M51" group', async () => {
    let dataItem, readResults = null;
    //---------------------------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#6')) return;
    const service = await getClientService(app, id);

    const srvCurrentState = await service.getSrvCurrentState(id);
    let variables = srvCurrentState.paramsAddressSpace.variables;
    variables = variables.filter(v => v.ownerGroup === 'CH_M51::ValueFromFile').map(v => v.browseName);
    if (variables.length) {
      // Get start time
      let start = moment();
      debug('OPC-UA clients: session history values for "CH_M51" group.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('OPC-UA clients: session history values for "CH_M51" group.EndTime:', getTime(end, false));
      readResults = await service.sessionReadHistoryValuesEx(id, variables, start, end);
      if (isDebug && readResults.length) inspector('OPC-UA clients: session history values for "CH_M51" group.readResults:', readResults);
      if (readResults.length) {
        readResults.forEach(readResult => {
          if (readResult.statusCode.name === 'Good') {
            if (readResult.historyData.dataValues.length) {
              readResult.historyData.dataValues.forEach(dataValue => {
                if (dataValue.statusCode.name === 'Good') {
                  dataItem = dataValue.value.value;
                  console.log(chalk.green(`historyValue(${readResult.browseName}):`), chalk.cyan(`${dataItem} (${readResult.valueParams.engineeringUnits}); Timestamp=${dataValue.sourceTimestamp}`));
                  assert.ok(true, 'OPC-UA clients: session history values for "CH_M51" group');
                } else {
                  assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
                }
              });
            }
          } else {
            assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
          }
        });
      } else {
        assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
      }
    } else {
      assert.ok(false, 'OPC-UA clients: session history values for "CH_M51" group');
    }
  });

  it('#7: OPC-UA clients: session history values for "CH_M52_ACM" group', async () => {
    let dataItem, readResults = null, engineeringUnits = '';
    //-------------------------------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#7')) return;
    const service = await getClientService(app, id);

    const srvCurrentState = await service.getSrvCurrentState(id);
    let variables = srvCurrentState.paramsAddressSpace.variables;
    variables = variables.filter(v => v.ownerGroup === 'CH_M52_ACM::ValueFromFile').map(v => v.browseName);
    if (variables.length) {
      // Get start time
      let start = moment();
      debug('OPC-UA clients: session history values for "CH_M52_ACM" group.StartTime:', getTime(start, false));
      // Pause
      await pause(1000);
      // Get end time
      let end = moment();
      debug('OPC-UA clients: session history values for "CH_M52_ACM" group.EndTime:', getTime(end, false));
      readResults = await service.sessionReadHistoryValuesEx(id, variables, start, end);
      if (isDebug && readResults.length) inspector('OPC-UA clients: session history values for "CH_M52_ACM" group.readResults:', readResults);
      if (readResults.length) {
        readResults.forEach(readResult => {
          if (readResult.statusCode.name === 'Good') {
            if (readResult.historyData.dataValues.length) {
              readResult.historyData.dataValues.forEach(dataValue => {
                if (dataValue.statusCode.name === 'Good') {
                  dataItem = dataValue.value.value;
                  engineeringUnits = readResult.valueParams.engineeringUnits ? `(${readResult.valueParams.engineeringUnits});` : '';
                  console.log(chalk.green(`historyValue(${readResult.browseName}):`), chalk.cyan(`[${dataItem}] ${engineeringUnits} Timestamp=${dataValue.sourceTimestamp}`));
                  assert.ok(true, 'OPC-UA clients: session history values for "CH_M52_ACM" group');
                } else {
                  assert.ok(false, 'OPC-UA clients: session history values for "CH_M52_ACM" group');
                }
              });
            }
          } else {
            assert.ok(false, 'OPC-UA clients: session history values for "CH_M52_ACM" group');
          }
        });
      } else {
        assert.ok(false, 'OPC-UA clients: session history values for "CH_M52_ACM" group');
      }
    } else {
      assert.ok(false, 'OPC-UA clients: session history values for "CH_M52_ACM" group');
    }
  });

  //============== START SUBSCRIPTION ====================//

  it('#9: OPC-UA clients: subscription create', async () => {
    const service = await getClientService(app, id);
    // service.subscriptionCreate
    const result = await service.subscriptionCreate(id);
    if (isDebug) inspector('OPC-UA clients: subscription create', result);

    assert.ok(true, 'OPC-UA clients: subscription create');
  });

  //============== SUBSCRIPTION MONITOR ====================//

  it('#10.1: OPC-UA clients: subscription monitor for "CH_M51::ValueFromFile" group', async () => {
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#10.1')) return;
    const service = await getClientService(app, id);
    const srvCurrentState = await service.getSrvCurrentState(id);
    // Start subscriptionMonitor
    let variables = srvCurrentState.paramsAddressSpace.variables;
    variables = variables.filter(v => v.ownerGroup === 'CH_M51::ValueFromFile').map(v => v.browseName);
    const groups = getGroupsFromArray(variables, 10);
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const nodeIds = await service.getNodeIds(id, group);
      for (let index2 = 0; index2 < nodeIds.length; index2++) {
        const nodeId = nodeIds[index2];
        await service.subscriptionMonitor(id, 'onChangedCH_M5Handler', { nodeId });
      }
    }
    assert.ok(true, 'OPC-UA client subscription monitor');
  });

  it('#10.2: OPC-UA clients: subscription monitor for "CH_M52_ACM::ValueFromFile" group', async () => {
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#10.2')) return;
    const service = await getClientService(app, id);
    const srvCurrentState = await service.getSrvCurrentState(id);
    // Start subscriptionMonitor
    let variables = srvCurrentState.paramsAddressSpace.variables;
    variables = variables.filter(v => v.ownerGroup === 'CH_M52_ACM::ValueFromFile').map(v => v.browseName);
    const groups = getGroupsFromArray(variables, 10);
    for (let index = 0; index < groups.length; index++) {
      const group = groups[index];
      const nodeIds = await service.getNodeIds(id, group);
      for (let index2 = 0; index2 < nodeIds.length; index2++) {
        const nodeId = nodeIds[index2];
        await service.subscriptionMonitor(id, 'onChangedCH_M5Handler', { nodeId });
      }
    }
    assert.ok(true, 'OPC-UA client subscription monitor');
  });

  it('#10.3: OPC-UA clients: subscription monitor for "CH_M5::RunCommandTest"', async () => {
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#10.3')) return;
    const service = await getClientService(app, id);
    const srvCurrentState = await service.getSrvCurrentState(id);
    // Start subscriptionMonitor
    let variables = srvCurrentState.paramsAddressSpace.variables;
    const variable = variables.find(v => v.browseName === 'CH_M5::RunCommandTest');
    if (isDebug && variable) inspector('subscription monitor for "CH_M5::RunCommandTest".variable:', variable);
    if (variable) {
      const nodeId = variable.nodeId;
      await service.subscriptionMonitor(id, 'onChangedRunCommandTest', { nodeId });
    }
    assert.ok(true, 'OPC-UA client subscription monitor');
  });

  it('#10.4: OPC-UA clients: subscription monitor for "CH_M5::RunCommand"', async () => {
    const service = await getClientService(app, id);
    const srvCurrentState = await service.getSrvCurrentState(id);
    // Start subscriptionMonitor
    let variables = srvCurrentState.paramsAddressSpace.variables;
    const variable = variables.find(v => v.browseName === 'CH_M5::RunCommand');
    if (isDebug && variable) inspector('subscription monitor for "CH_M5::RunCommand".variable:', variable);
    if (variable) {
      const nodeId = variable.nodeId;
      await service.subscriptionMonitor(id, 'onChangedRunCommand', { nodeId });
    }
    assert.ok(true, 'OPC-UA client subscription monitor');
  });

  //============== SESSION WRITE VALUE ====================//

  it('#11.1: OPC-UA clients: session write single node value', async () => {
    let readResult, statusCode = null;
    //------------------------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#11.1')) return;
    const service = await getClientService(app, id);

    const arrayOfvalues = new Uint16Array([2, 23, 23, 12, 24, 3, 25, 3, 26, 3, 27, 3, 28, 1, 43690, 1, 1261, 0, 0, 0, 0, 0, 0, 0]);

    // service.sessionWriteSingleNode
    const dataForWrite = {
      dataType: DataType.UInt16,
      arrayType: VariantArrayType.Array,
      value: arrayOfvalues,
    };
    statusCode = await service.sessionWriteSingleNode(id, 'CH_M5::VariableForWrite', dataForWrite);
    console.log(chalk.green('sessionWriteSingleNode(CH_M5::VariableForWrite).statusCode:'), chalk.cyan(statusCode.name));

    // service.sessionRead
    readResult = await service.sessionRead(id, 'CH_M5::VariableForWrite');
    readResult = readResult[0].value.value;
    console.log(chalk.green('sessionRead(CH_M5::VariableForWrite).readResult:'), chalk.cyan(`[${readResult}]`));

    assert.ok(readResult.length === arrayOfvalues.length, 'OPC-UA clients: session write single node value');
  });

  it('#11.2: OPC-UA clients: session write single node value', async () => {
    let readResult, statusCode = null;
    //-----------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#11.2')) return;
    const service = await getClientService(app, id);
    // service.sessionWriteSingleNode
    const dataForWrite = {
      dataType: DataType.String,
      value: 'StartScript',
    };
    statusCode = await service.sessionWriteSingleNode(id, 'CH_M5::RunCommandTest', dataForWrite);
    console.log(chalk.green('sessionWriteSingleNode(CH_M5::RunCommandTest).statusCode:'), chalk.cyan(statusCode.name));

    // service.sessionRead
    readResult = await service.sessionRead(id, 'CH_M5::RunCommandTest');
    readResult = readResult[0].value.value;
    console.log(chalk.green('sessionRead(CH_M5::RunCommandTest).readResult:'), chalk.cyan(`'${readResult}'`));

    assert.ok(readResult === dataForWrite.value, 'OPC-UA clients: session write single node value');
  });

  it('#11.3: OPC-UA clients: session write single node value', async () => {
    let readResult, statusCode = null;
    //-----------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#11.3')) return;
    const service = await getClientService(app, id);
    // service.sessionWriteSingleNode
    const dataForWrite = {
      dataType: DataType.String,
      value: 'StopScript',
    };
    statusCode = await service.sessionWriteSingleNode(id, 'CH_M5::RunCommandTest', dataForWrite);
    console.log(chalk.green('sessionWriteSingleNode(CH_M5::RunCommandTest).statusCode:'), chalk.cyan(statusCode.name));

    // service.sessionRead
    readResult = await service.sessionRead(id, 'CH_M5::RunCommandTest');
    readResult = readResult[0].value.value;
    console.log(chalk.green('sessionRead(CH_M5::RunCommandTest).readResult:'), chalk.cyan(`'${readResult}'`));

    assert.ok(readResult === dataForWrite.value, 'OPC-UA clients: session write single node value');
  });

  //============== SESSION CALL METHOD ====================//

  it('#12.0: Data base: Save opcua tags', async () => {
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#12.0')) return;
    // Get opcua tags 
    const opcuaTags = getOpcuaConfigOptions(id);
    // Save opcua tags to local DB
    let saveResult = await saveOpcuaTags(app, opcuaTags, false);
    if (isDebug && saveResult) inspector('Data base: Save opcua tags:', saveResult);
    assert.ok(saveResult.total, 'Data base: Save opcua tags');
    
    // Remove opcua store values
    let removeResult = await removeOpcuaGroupValues(app);
    if (isDebug && removeResult) inspector('removeOpcuaGroupValues.removeResult:', removeResult);
    // Remove opcua store values
    removeResult = await removeOpcuaStoreValues(app);
    if (isDebug && removeResult) inspector('removeOpcuaStoreValues.removeResult:', removeResult);
  });

  it('#12.1: OPC-UA clients: session call method "methodAcmYearTemplateCreate"', async () => {
    let statusCode = '', outputArguments;
    //------------------------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#12.1')) return;
    const service = await getClientService(app, id);
    // Set input argument
    const pointID = 2;
    const inputArgument = {
      isTest: true,
      pointID,
      namePointID: 'TB02',
      emissionPointID: 'TB17',
      pointDescription: 'Cherkassy "AZOT" workshop M5/2 ACM Agr(1..4)',
      qal2СoncentrationMultiplier: 0.9352,
      qal2VolumeMultiplier: 1.1951,
      qal2СoncentrationAdition: 0,
      qal2VolumeAdition: 0,
      period: [1, 'years'],
      startYear: 2022,
    };
    const inputArguments = [[
      {
        dataType: DataType.String,
        value: JSON.stringify(inputArgument),
      }
    ]];
    const callResults = await service.sessionCallMethod(id, 'CH_M5::YearTemplateCreate', inputArguments);
    if (isDebug && callResults.length) inspector('methodAcmYearTemplateCreate.callResults:', callResults);
    if (callResults.length) {
      statusCode = callResults[0].statusCode.name;
      outputArguments = JSON.parse(callResults[0].outputArguments[0].value);
      outputArguments = loOmit(outputArguments, ['params']);
      outputArguments.resultPath = getPathBasename(outputArguments.resultPath);
      if (isDebug && outputArguments) inspector('methodAcmYearTemplateCreate.outputArguments:', loOmit(outputArguments, ['params']));
      if (isDebug && outputArguments) console.log(
        chalk.green('RunMetod(methodAcmYearTemplateCreate): OK!'),
        `For pointID=${chalk.cyan(pointID)};`,
        `hours: ${chalk.cyan(outputArguments.hours)};`,
        `days: ${chalk.cyan(outputArguments.days)};`,
        `resultFile: '${chalk.cyan(outputArguments.resultPath)}';`
      );
    }
    assert.ok(statusCode === 'Good', 'OPC-UA clients: session call method "methodAcmYearTemplateCreate"');
  });
  
  it('#12.2: OPC-UA clients: session call method "methodAcmDayReportsDataGet"', async () => {
    let statusCode = '', outputArguments;
    //------------------------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#12.2')) return;
    const service = await getClientService(app, id);
    // Set input argument
    const pointID = 2;
    const inputArgument = {
      pointID,
      pattern: '/**/DayHist*.xls'
    };
    const inputArguments = [[
      {
        dataType: DataType.String,
        value: JSON.stringify(inputArgument),
      }
    ]];
    const callResults = await service.sessionCallMethod(id, 'CH_M5::AcmDayReportsDataGet', inputArguments);
    if (isDebug && callResults.length) inspector('methodAcmDayReportsDataGet.callResults:', callResults);
    if (callResults.length) {
      statusCode = callResults[0].statusCode.name;
      outputArguments = JSON.parse(callResults[0].outputArguments[0].value);
      outputArguments = loOmit(outputArguments, ['params']);
      outputArguments.resultPath = getPathBasename(outputArguments.resultPath);
      if (isDebug && outputArguments) inspector('methodAcmDayReportsDataGet.outputArguments:', outputArguments);
      if (isDebug && outputArguments) console.log(
        chalk.green('RunMetod(methodAcmDayReportsDataGet): OK!'),
        `For pointID=${chalk.cyan(pointID)};`,
        `resultFile: '${chalk.cyan(outputArguments.resultPath)}';`
      );
    }
    assert.ok(statusCode === 'Good', 'OPC-UA clients: run method "methodAcmDayReportsDataGet"');
  });

  it('#12.3: OPC-UA clients: run method "syncHistoryAtStartup"', async () => {
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#12.3')) return;

    // Remove opcua store values
    const removeResult = await removeOpcuaStoreValues(app);
    if (isDebug && removeResult) inspector('removeOpcuaStoreValues.removeResult:', removeResult);

    // Get opcua tags
    const opcuaTags = getOpcuaConfigOptions(id);
    const syncResult = await syncHistoryAtStartup(app, opcuaTags, 'methodAcmDayReportsDataGet');
    if(isDebug && syncResult) debug(`Run method "syncHistoryAtStartup".syncResult: {"saved": ${syncResult.savedValuesCount}, "removed": ${syncResult.removedValuesCount}}`);
    assert.ok(syncResult.statusCode === 'Good', 'OPC-UA clients: run method "syncHistoryAtStartup"');
  });

  it('#12.4: OPC-UA clients: run method "syncReportAtStartup"', async () => {
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#12.4')) return;
    // Get opcua tags
    const opcuaTags = getOpcuaConfigOptions(id);
    const syncResult = await syncReportAtStartup(app, opcuaTags, 'methodAcmYearReportUpdate');
    if(isDebug && syncResult) inspector('Run method "syncReportAtStartup".syncResult:', syncResult);
    assert.ok(syncResult.length, 'OPC-UA clients: run method "syncReportAtStartup"');
  });

  it('#12.5: OPC-UA clients: run method "methodAcmDayReportsDataGet" with clear store', async () => {
    let statusCode = '', dataItems;
    //------------------------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#12.5')) return;

    // Remove opcua store values
    const removeResult = await removeOpcuaStoreValues(app);
    if (isDebug && removeResult) inspector('removeOpcuaStoreValues.removeResult:', removeResult);

    // Get opcua tags
    const opcuaTags = getOpcuaConfigOptions(id);
    // Get opcua group store tags 
    const opcuaGroupTags = opcuaTags.filter(t => t.group && t.store);
    if (isDebug && opcuaGroupTags.length) inspector('opcuaBootstrap.opcuaGroupTags:', opcuaGroupTags);
    for (let index = 0; index < opcuaGroupTags.length; index++) {
      const opcuaGroupTag = opcuaGroupTags[index];
      const groupBrowseName = opcuaGroupTag.browseName;
      const pointID = opcuaGroupTag.getterParams.pointID;
      // Run metod
      const storeParams = await getStoreParams4Data(app, [groupBrowseName]);
      if (isDebug && storeParams) inspector('methodAcmDayReportsDataGet.storeParams:', storeParams);
      const params = { isSaveOutputFile: true };
      const methodResult = await methodAcmDayReportsDataGet([{ value: pointID }], { storeParams, params, test4Remove: true });
      const methodResultOutputPath = methodResult.params.outputPath;
      if (isDebug && methodResult) inspector('methodAcmDayReportsDataGet.methodResult:', methodResult);
      statusCode = methodResult.statusCode;
      if (statusCode === 'Good') {
        // Get dataItems
        if (methodResult.params.isSaveOutputFile) {
          let outputFile = methodResult.params.outputFile;
          const currentDate = moment().format('YYYYMMDD');
          outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
          dataItems = readJsonFileSync([appRoot, methodResultOutputPath, outputFile])['dataItems'];
        } else {
          dataItems = methodResult.dataItems;
        }
        if (isDebug && dataItems) inspector('methodAcmDayReportsDataGet.dataItems:', dataItems);
      }
      assert.ok(statusCode === 'Good', 'OPC-UA clients: run method "methodAcmDayReportsDataGet" with clear store');  
    }
  });

  it('#12.6: OPC-UA clients: run method "methodAcmDayReportsDataGet" with clear store', async () => {
    let statusCode = '', dataItems;
    //------------------------------------------------

    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#12.6')) return;
    // Remove opcua store values
    const removeResult = await removeOpcuaStoreValues(app);
    if (isDebug && removeResult) inspector('removeOpcuaStoreValues.removeResult:', removeResult);

    // Get opcua tags
    const opcuaTags = getOpcuaConfigOptions(id);
    // Get opcua group store tags 
    const opcuaGroupTags = opcuaTags.filter(t => t.group && t.store);
    if (isDebug && opcuaGroupTags.length) inspector('opcuaBootstrap.opcuaGroupTags:', opcuaGroupTags);
    for (let index = 0; index < opcuaGroupTags.length; index++) {
      const opcuaGroupTag = opcuaGroupTags[index];
      const groupBrowseName = opcuaGroupTag.browseName;
      const pointID = opcuaGroupTag.getterParams.pointID;
      // Run metod
      const storeParams = await getStoreParams4Data(app, [groupBrowseName]);
      if (isDebug && storeParams) inspector('methodAcmDayReportsDataGet.storeParams:', storeParams);
      const params = { isSaveOutputFile: false };
      const methodResult = await methodAcmDayReportsDataGet([{ value: pointID }], { storeParams, params });
      const methodResultOutputPath = methodResult.params.outputPath;
      if (isDebug && methodResult) inspector('methodAcmDayReportsDataGet.methodResult:', methodResult);
      statusCode = methodResult.statusCode;
      if (statusCode === 'Good') {
        // Get dataItems
        if (methodResult.params.isSaveOutputFile) {
          let outputFile = methodResult.params.outputFile;
          const currentDate = moment().format('YYYYMMDD');
          outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
          dataItems = readJsonFileSync([appRoot, methodResultOutputPath, outputFile])['dataItems'];
        } else {
          dataItems = methodResult.dataItems;
        }
        if (isDebug && dataItems) inspector('methodAcmDayReportsDataGet.dataItems:', dataItems);
      }
      assert.ok(statusCode === 'Good', 'OPC-UA clients: run method "methodAcmDayReportsDataGet" with clear store');  
    }
  });

  
  it('#12.7: OPC-UA clients: session call method "methodAcmYearReportUpdate"', async () => {
    let statusCode = '', inputArgument, inputArgument2, inputArguments, outputArguments;
    let callResults;
    //------------------------------------------------------------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#12.7')) return;
    const service = await getClientService(app, id);

    //--- Run 'methodAcmDayReportsDataGet' metod ---//

    // Set inputArguments
    inputArgument = { pointID: 2, pattern: '/**/DayHist*.xls' };
    inputArguments = [[
      {
        dataType: DataType.String,
        value: JSON.stringify(inputArgument),
      }
    ]];
    callResults = await service.sessionCallMethod(id, 'CH_M5::AcmDayReportsDataGet', inputArguments);
    statusCode = callResults[0].statusCode.name;
    assert.ok(statusCode === 'Good', 'OPC-UA clients: session call method "methodAcmDayReportsDataGet"');
    if (statusCode === 'Good') {
      statusCode = '';
      outputArguments = JSON.parse(callResults[0].outputArguments[0].value);
      // Get params
      const pointID = outputArguments.params.pointID;
      const syncResultOutputPath = outputArguments.params.outputPath;
      // Get data items
      let outputFile = outputArguments.params.outputFile;
      const currentDate = moment().format('YYYYMMDD');
      outputFile = loTemplate(outputFile)({ pointID, date: currentDate });
      const dataItems = readJsonFileSync([appRoot, syncResultOutputPath, outputFile])['dataItems'];
      if (isDebug && outputFile) inspector('methodAcmDayReportsDataGet.dataItems:', dataItems);

      if (!dataItems.length) {
        logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}! dataItems is empty!`);
      }

      //--- Run 'methodAcmYearReportUpdate' metod ---//

      // Set inputArguments
      inputArgument = { pointID: 2 };
      inputArgument = { dataType: DataType.String, value: JSON.stringify(inputArgument) };
      inputArgument2 = { dataType: DataType.String, value: JSON.stringify(dataItems) };
      inputArguments = [];
      inputArguments.push([inputArgument, inputArgument2]);
      if (isDebug && inputArguments.length) inspector('methodAcmYearReportUpdate.inputArguments:', inputArguments);

      callResults = await service.sessionCallMethod(id, 'CH_M5::YearReportUpdate', inputArguments);
      if (isDebug && callResults.length) inspector('methodAcmYearReportUpdate.callResults:', callResults);
      if (callResults.length) {
        statusCode = callResults[0].statusCode.name;
        outputArguments = JSON.parse(callResults[0].outputArguments[0].value);
        if (isDebug && outputArguments) inspector('methodAcmYearReportUpdate.outputArguments:', outputArguments);
      }
      assert.ok(statusCode === 'Good', 'OPC-UA clients: session call method "methodAcmDayReportsDataGet"');
    }
  });

  //============== RUN COMMAND ====================//

  it('#13.1: OPC-UA clients: RunCommand(ch_m5CreateAcmYearTemplate)', async () => {
    let statusCode = null;
    //-----------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#13.1')) return;
    const service = await getClientService(app, id);

    // Get data for run command
    const options = {
      command: 'ch_m5CreateAcmYearTemplate',
      opt: {
        points: [2],
        test: true,
        period: [1, 'years'],
        year: 2022
      }
    };
    const dataForRunCommand = {
      dataType: DataType.String,
      value: JSON.stringify(options),
    };
    statusCode = await service.sessionWriteSingleNode(id, 'CH_M5::RunCommand', dataForRunCommand);
    statusCode = statusCode.name;
    if (isDebug && statusCode) console.log(chalk.green('RunCommand(ch_m5CreateAcmYearTemplate).statusCode:'), chalk.cyan(statusCode));
    assert.ok(statusCode === 'Good', 'OPC-UA clients: RunCommand(ch_m5CreateAcmYearTemplate)');
    await pause(1000);
  });

  it('#13.2: OPC-UA clients: RunCommand(ch_m5SyncStoreAcmValues)', async () => {
    let statusCode = null;
    //-----------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#13.2')) return;
    const service = await getClientService(app, id);

    // Get data for run command
    const options = {
      command: 'ch_m5SyncStoreAcmValues',
      opt: {
        points: [2],
        pattern: '/**/DayHist*.xls'// e.g. '/**/DayHist*.xls'|'/**/2022-01/DayHist*.xls'|/**/DayHist01_14F120_01022022_0000.xls
      }
    };
    const dataForRunCommand = {
      dataType: DataType.String,
      value: JSON.stringify(options),
    };
    statusCode = await service.sessionWriteSingleNode(id, 'CH_M5::RunCommand', dataForRunCommand);
    statusCode = statusCode.name;
    if (isDebug && statusCode) console.log(chalk.green('RunCommand(ch_m5SyncStoreAcmValues).statusCode:'), chalk.cyan(statusCode));
    assert.ok(statusCode === 'Good', 'OPC-UA clients: RunCommand(ch_m5SyncStoreAcmValues)');
    await pause(1000);
  });

  it('#13.3: OPC-UA clients: RunCommand(ch_m5SyncAcmYearReport) get dataItems from store', async () => {
    let statusCode = null;
    //-----------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#13.3')) return;
    const service = await getClientService(app, id);

    // Get data for run command
    const options = {
      command: 'ch_m5SyncAcmYearReport',
      opt: {
        points: [2],
        pattern: '', // e.g. '/**/DayHist*.xls'|'/**/2022-01/DayHist*.xls'|/**/DayHist01_14F120_01022022_0000.xls
        syncYearReportFromStore: true
      }
    };
    const dataForRunCommand = {
      dataType: DataType.String,
      value: JSON.stringify(options),
    };
    statusCode = await service.sessionWriteSingleNode(id, 'CH_M5::RunCommand', dataForRunCommand);
    statusCode = statusCode.name;
    if (isDebug && statusCode) console.log(chalk.green('RunCommand(ch_m5SyncAcmYearReport).statusCode:'), chalk.cyan(statusCode));
    assert.ok(statusCode === 'Good', 'OPC-UA clients: RunCommand(ch_m5SyncAcmYearReport) get dataItems from store');
    await pause(2000);
  });

  it('#13.4: OPC-UA clients: RunCommand(ch_m5SyncAcmYearReport) get dataItems from day reports', async () => {
    let statusCode = null;
    //-----------------------------------
    
    // Select test
    if(!testNumbers.includes('all') && !testNumbers.includes('#13.4')) return;
    const service = await getClientService(app, id);

    // Get data for run command
    const options = {
      command: 'ch_m5SyncAcmYearReport',
      opt: {
        points: [2],
        pattern: '/**/DayHist*.xls', // e.g. '/**/DayHist*.xls'|'/**/2022-01/DayHist*.xls'|/**/DayHist01_14F120_01022022_0000.xls
        syncYearReportFromStore: false
      }
    };
    const dataForRunCommand = {
      dataType: DataType.String,
      value: JSON.stringify(options),
    };
    statusCode = await service.sessionWriteSingleNode(id, 'CH_M5::RunCommand', dataForRunCommand);
    statusCode = statusCode.name;
    if (isDebug && statusCode) console.log(chalk.green('RunCommand(ch_m5SyncAcmYearReport).statusCode:'), chalk.cyan(statusCode));
    assert.ok(statusCode === 'Good', 'OPC-UA clients: RunCommand(ch_m5SyncAcmYearReport) get dataItems from day reports');
    await pause(2000);
  });

  //============== SUBSCRIPTION TERMINATE ====================//

  it('#14: OPC-UA clients: subscription terminate', async () => {
    const service = await getClientService(app, id);
    await pause(1000);
    // service.subscriptionTerminate
    const result = await service.subscriptionTerminate(id);
    if (isDebug) inspector('OPC-UA clients: subscription terminate', result);
    assert.ok(true, 'OPC-UA clients: subscription terminate');
  });


  //===== SESSION CLOSE/CLIENT DISCONNECT/SERVER SHUTDOWN =====//

  it('#15: OPC-UA clients: session close the service', async () => {
    const service = await getClientService(app, id);
    await pause(1000);
    const opcuaClient = await service.sessionClose(id);
    if (isDebug) inspector('Session close the clients:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: session close the service');
  });

  it('#16: OPC-UA clients: disconnect the service', async () => {
    const service = await getClientService(app, id);
    const opcuaClient = await service.opcuaClientDisconnect(id);
    if (isDebug) inspector('Session close the clients:', opcuaClient);
    assert.ok(opcuaClient, 'OPC-UA clients: session close the service');
  });

  it('#17: OPC-UA servers: shutdown the service', async () => {
    const service = await getServerService(app, id);
    // const opcuaServer = await service.opcuaServerShutdown(id, 1500);
    const opcuaServer = await service.opcuaServerShutdown(id);
    if (isDebug) inspector('Shutdown the server:', opcuaServer);
    assert.ok(opcuaServer, 'OPC-UA servers: shutdown the service');
  });

});
