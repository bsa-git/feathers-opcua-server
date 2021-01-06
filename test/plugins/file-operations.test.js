/* eslint-disable no-unused-vars */
const assert = require('assert');
const {
  appRoot,
  inspector,
  pause,
  doesDirExist,
  makeDirSync,
  clearDirSync,
  writeFileSync,
  readFileSync,
  readDirSync,
  readOnlyNewFile,
  readOnlyModifiedFile,
  watchFile,
  unwatchFile,
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
}

/**
 * Call back for event readOnlyModifiedFile 
 * @param {String} filePath 
 * @param {*} data 
 */
function cbReadOnlyModifiedFile(filePath, data) {
  console.log(chalk.green('cbReadOnlyModifiedFile.filePath:'), chalk.cyan(filePath));
  console.log(chalk.green('cbReadOnlyModifiedFile.data:'), chalk.cyan(data));
}

/**
 * @method cbWatchFile
 * @param {String} filePath 
 * @param {Object} current // stat object
 * @param {Object} previous // stat object
 */
function cbWatchFile(filePath, current, previous) {
  console.log(chalk.green('cbWatchFile.filePath:'), chalk.cyan(filePath));
  inspector('cbWatchFile.current:', current);
  inspector('cbWatchFile.previous:', previous);
  // UnWatch File
  unwatchFile(filePath);
}

describe('<<=== FileOperations: (file-operations.test) ===>>', () => {

  before(async () => {
    makeDirSync([appRoot, 'test/data/tmp']);
  });

  after(async () => {
    const path = [appRoot, 'test/data/tmp'];
    clearDirSync(path);
  });

  it('FileOperations: writeFileSync/readFileSync', () => {
    const data = { value: '12345-ABC' };
    let path = writeFileSync([appRoot, 'test/data/tmp/1.json'], data, true);

    let result = readFileSync(path);
    result = JSON.parse(result);
    if (isDebug) debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    // debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    assert.ok(result.value === data.value, 'FileOperations: writeFileSync/readFileSync');
  });

  it('FileOperations: makeDirSync', () => {
    let path = makeDirSync([appRoot, 'test/data/tmp/tmp2']);
    const isExist = doesDirExist(path);
    assert.ok(isExist === true, 'FileOperations: makeDirSync');
  });

  it('FileOperations: writeFileSync/readFileSync', () => {
    const data = { value: '67890-ABC' };
    let path = writeFileSync([appRoot, 'test/data/tmp/tmp2/2.json'], data, true);

    let result = readFileSync(path);
    result = JSON.parse(result);
    if (isDebug) debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    // debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    assert.ok(result.value === data.value, 'FileOperations: writeFileSync/readFileSync');
  });

  it('FileOperations: readDirSync', () => {
    const filenames = readDirSync([appRoot, 'test/data/tmp']);
    inspector('FileOperations: readDirSync.filenames:', filenames);
    const fileObjs = readDirSync([appRoot, 'test/data/tmp'], true);
    inspector('FileOperations: readDirSync.fileObjs:', fileObjs);
    assert.ok(true, 'FileOperations: readDirSync');
  });

  it('FileOperations: readOnlyNewFile', () => {
    let path = readOnlyNewFile([appRoot, 'test/data/tmp/tmp2'], cbReadOnlyNewFile);

    const data = { value: '12345-NewFile' };
    writeFileSync([path, 'new.json'], data, true);

    assert.ok(true, 'FileOperations: readOnlyNewFile');
  });

  it('FileOperations: readOnlyModifiedFile', () => {
    let path = readOnlyModifiedFile([appRoot, 'test/data/tmp/tmp2'], cbReadOnlyModifiedFile);

    const data = { value: '12345-ModifiedFile' };
    writeFileSync([path, '2.json'], data, true);

    assert.ok(true, 'FileOperations: readOnlyModifiedFile');
  });

  it('FileOperations: makeDirSync/writeFileSync/readFileSync', () => {
    // Make dir
    let path = makeDirSync([appRoot, 'test/data/tmp/tmp3']);

    // Write file
    const data = { value: '12345-ABC' };
    path = writeFileSync([path, '3.json'], data, true);

    // Read file
    let result = readFileSync(path);
    result = JSON.parse(result);
    assert.ok(result.value === data.value, 'FileOperations: makeDirSync/writeFileSync/readFileSync');
  });

  it('FileOperations: watchFile', async () => {
    // Watch file
    let path = watchFile([appRoot, 'test/data/tmp/tmp3/3.json'], cbWatchFile, {interval: 100});
    if (isDebug) debug('FileOperations: watchFile.path:', path);
    // Write file
    const data = { value: '12345-ModifiedFile' };
    writeFileSync(path, data, true);
    // Pause 300Ms
    await pause(300);

    assert.ok(true, 'FileOperations: watchFile');
  });



  // it('FileOperations: removeFileSync', async () => {
  //   removeFileSync([appRoot, 'test/data/tmp/1.json']);
  //   const isExist = doesFileExist([appRoot, 'test/data/tmp/1.json']);
  //   assert.ok(isExist === false, 'FileOperations: removeFileSync');
  // });

});
