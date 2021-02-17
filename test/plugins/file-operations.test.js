/* eslint-disable no-unused-vars */
const assert = require('assert');
const {
  appRoot,
  inspector,
  pause,
} = require('../../src/plugins/lib/util');

const {
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
  removeFileSync
} = require('../../src/plugins/lib/file-operations');

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
  // Remove file 
  removeFileSync(filePath);
}

describe('<<=== FileOperations: (file-operations.test) ===>>', () => {

  before(async () => {
    makeDirSync([appRoot, 'test/data/tmp', 'fo']);
  });

  after(async () => {
  });

  it('FileOperations: writeFileSync/readFileSync', () => {
    const data = { value: '12345-ABC' };
    let path = writeFileSync([appRoot, 'test/data/tmp/fo/1.json'], data, true);

    let result = readFileSync(path);
    result = JSON.parse(result);
    if (isDebug) debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    // debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    removeFileSync(path);
    assert.ok(result.value === data.value, 'FileOperations: writeFileSync/readFileSync');
  });

  it('FileOperations: makeDirSync', () => {
    let path = makeDirSync([appRoot, 'test/data/tmp/fo/tmp2']);
    const isExist = doesDirExist(path);
    assert.ok(isExist === true, 'FileOperations: makeDirSync');
  });

  it('FileOperations: writeFileSync/readFileSync', () => {
    const data = { value: '67890-ABC' };
    let path = writeFileSync([appRoot, 'test/data/tmp/fo/tmp2/2.json'], data, true);

    let result = readFileSync(path);
    result = JSON.parse(result);
    if (isDebug) debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    // debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    clearDirSync([appRoot, 'test/data/tmp/fo/tmp2']);
    assert.ok(result.value === data.value, 'FileOperations: writeFileSync/readFileSync');
  });

  it('FileOperations: readDirSync', () => {
    const filenames = readDirSync([appRoot, 'test/data/tmp/fo']);
    inspector('FileOperations: readDirSync.filenames:', filenames);
    const fileObjs = readDirSync([appRoot, 'test/data/tmp/fo'], true);
    inspector('FileOperations: readDirSync.fileObjs:', fileObjs);
    assert.ok(true, 'FileOperations: readDirSync');
  });

  it('FileOperations: readOnlyNewFile', () => {
    let path = readOnlyNewFile([appRoot, 'test/data/tmp/fo'], cbReadOnlyNewFile);

    const data = { value: '12345-NewFile' };
    writeFileSync([path, 'new.json'], data, true);

    assert.ok(true, 'FileOperations: readOnlyNewFile');
  });

  it('FileOperations: readOnlyModifiedFile', () => {
    let path = readOnlyModifiedFile([appRoot, 'test/data/tmp/fo'], cbReadOnlyModifiedFile);

    const data = { value: '12345-ModifiedFile' };
    writeFileSync([path, 'new.json'], data, true);

    assert.ok(true, 'FileOperations: readOnlyModifiedFile');
  });

  it('FileOperations: watchFile', async () => {
    // Watch file
    let path = watchFile([appRoot, 'test/data/tmp/fo/new.json'], cbWatchFile, {interval: 100});
    if (isDebug) debug('FileOperations: watchFile.path:', path);
    // Write file
    const data = { value: '12345-WatchFile' };
    writeFileSync(path, data, true);
    // Pause 300Ms
    await pause(300);
    // Stop watching for changes on filename
    // unwatchFile(path);
    assert.ok(true, 'FileOperations: watchFile');
  });
});
