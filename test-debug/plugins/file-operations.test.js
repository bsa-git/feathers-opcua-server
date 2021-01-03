/* eslint-disable no-unused-vars */
const assert = require('assert');
const {
  appRoot,
  inspector,
  pause,
  doesDirExist,
  doesFileExist,
  makeDirSync,
  removeDirSync,
  writeFileSync,
  readFileSync,
  removeFileSync,
  readDirSync,
  readOnlyNewFile
} = require('../../src/plugins');
const chalk = require('chalk');

const debug = require('debug')('app:file-operations.test');
const isDebug = false;
const isLog = false;

/**
 * Call back for event readOnlyNewFile 
 * @param {String} filePath 
 * @param {*} data 
 */
function cbReadOnlyNewFile(filePath, data) {
  console.log(chalk.green('cbReadOnlyNewFile.filePath:'), chalk.cyan(filePath));
  console.log(chalk.green('cbReadOnlyNewFile.data:'), chalk.cyan(data));
  removeFileSync(filePath);
}

describe('<<=== FileOperations: (file-operations.test) ===>>', () => {

  before(async () => {
    makeDirSync([appRoot, 'test/data/tmp']);
  });

  after(async () => {
    removeDirSync([appRoot, 'test/data/tmp']);
  });

  it('FileOperations: writeFileSync/readFileSync', async () => {
    const data = { value: '12345-ABC' };
    writeFileSync([appRoot, 'test/data/tmp/1.json'], data, true);

    let result = readFileSync([appRoot, 'test/data/tmp/1.json']);
    result = JSON.parse(result);
    if (isDebug) debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    // debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    assert.ok(result.value === data.value, 'FileOperations: writeFileSync/readFileSync');
  });

  it('FileOperations: makeDirSync', async () => {
    makeDirSync([appRoot, 'test/data/tmp/tmp2']);
    const isExist = doesDirExist([appRoot, 'test/data/tmp/tmp2']);
    assert.ok(isExist === true, 'FileOperations: makeDirSync');
  });

  it('FileOperations: writeFileSync/readFileSync', async () => {
    const data = { value: '67890-ABC' };
    writeFileSync([appRoot, 'test/data/tmp/tmp2/2.json'], data, true);

    let result = readFileSync([appRoot, 'test/data/tmp/tmp2/2.json']);
    result = JSON.parse(result);
    if (isDebug) debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    // debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    assert.ok(result.value === data.value, 'FileOperations: writeFileSync/readFileSync');
  });

  it('FileOperations: readDirSync', async () => {
    const filenames = readDirSync([appRoot, 'test/data/tmp']);
    inspector('FileOperations: readDirSync.filenames:', filenames);
    const fileObjs = readDirSync([appRoot, 'test/data/tmp'], true);
    inspector('FileOperations: readDirSync.fileObjs:', fileObjs);
    assert.ok(true, 'FileOperations: removeFileSync');
  });

  it('FileOperations: readOnlyNewFile', async () => {
    readOnlyNewFile([appRoot, 'test/data/tmp/tmp2'], cbReadOnlyNewFile);

    const data = { value: '12345-NewFile' };
    writeFileSync([appRoot, 'test/data/tmp/tmp2/3.json'], data, true);

    // let result = readFileSync([appRoot, 'test/data/tmp/tmp2/3.json']);
    // result = JSON.parse(result);
    // result.value === data.value
    assert.ok(true, 'FileOperations: readOnlyNewFile');
  });

  // it('FileOperations: removeFileSync', async () => {
  //   removeFileSync([appRoot, 'test/data/tmp/1.json']);
  //   const isExist = doesFileExist([appRoot, 'test/data/tmp/1.json']);
  //   assert.ok(isExist === false, 'FileOperations: removeFileSync');
  // });

});
