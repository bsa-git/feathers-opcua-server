/* eslint-disable no-unused-vars */
// const fs = require('fs');
const assert = require('assert');
const {
  appRoot,
  inspector,
  pause,
} = require('../../src/plugins/lib/util');

const {
  fsAccess,
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
  removeFileSync,
  getOsPlatform,
  winPathToUncPath,
  getFileListFromDir,
  toPathWithSep,
  toPathWithPosixSep,
} = require('../../src/plugins/lib/file-operations');

const chalk = require('chalk');
const papa = require('papaparse');

const debug = require('debug')('app:file-operations.test');
const isDebug = false;

/**
 * Call back for event readOnlyNewFile 
 * @param {String} filePath 
 * @param {*} data 
 */
function cbReadOnlyNewFile(filePath, data) {
  console.log(chalk.green('cbReadOnlyNewFile.filePath:'), chalk.cyan(filePath));
  console.log(chalk.green('cbReadOnlyNewFile.data:'), chalk.cyan(data));
}

function cbReadOnlyNewFile2(filePath, data) {
  console.log(chalk.green('cbReadOnlyNewFile2.filePath:'), chalk.cyan(filePath));
  console.log(chalk.green('cbReadOnlyNewFile2.data:'), chalk.cyan(data));
  // Remove file 
  removeFileSync(filePath);
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
    makeDirSync([appRoot, 'test/data/tmp/fo']);
  });

  after(async () => {
  });

  it('#1: FileOperations: writeFileSync/readFileSync', () => {
    const data = { value: '12345-ABC' };
    let path = writeFileSync([appRoot, 'test/data/tmp/fo/1.json'], data, true);

    let result = readFileSync(path);
    result = JSON.parse(result);
    if (isDebug) debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    // debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    removeFileSync(path);
    assert.ok(result.value === data.value, 'FileOperations: writeFileSync/readFileSync');
  });

  it('#2: FileOperations: makeDirSync', () => {
    let path = makeDirSync([appRoot, 'test/data/tmp/fo/tmp2']);
    const isExist = doesDirExist(path);
    assert.ok(isExist === true, 'FileOperations: makeDirSync');
  });

  it('#3: FileOperations: writeFileSync/readFileSync', () => {
    const data = { value: '67890-ABC' };
    let path = writeFileSync([appRoot, 'test/data/tmp/fo/tmp2/2.json'], data, true);

    let result = readFileSync(path);
    result = JSON.parse(result);
    if (isDebug) debug('FileOperations: writeFileSync/readFileSync.jsonData:', result);
    clearDirSync([appRoot, 'test/data/tmp/fo/tmp2']);
    assert.ok(result.value === data.value, 'FileOperations: writeFileSync/readFileSync');
  });

  it('#4: FileOperations: UNC directory operations', () => {

    if (getOsPlatform() === 'win32') {

      let path = winPathToUncPath([appRoot, 'src/api/opcua']);
      let fileName = 'UNECE_to_OPCUA.csv';
      // Does UNC dir exist
      let isExist = doesDirExist(path);

      // Read file from UNC dir
      let data = readFileSync([path, fileName]);
      data = papa.parse(data, { delimiter: ';', header: true });
      data = data.data[0];
      if (isDebug) debug('FileOperations: UNC directory operations.fileName:', fileName);
      // debug('FileOperations: UNC directory operations.fileName:', fileName);
      if (isDebug) debug('FileOperations: UNC directory operations.jsonData:', data);
      // debug('FileOperations: UNC directory operations.jsonData:', data);

      // Convert win path to unc path
      path = winPathToUncPath([appRoot, 'test/data/tmp/fo']);
      // Make 'share' dir
      path = makeDirSync([path, 'share']);
      // Write file to UNC dir
      fileName = 'UNECE_to_OPCUA.json';
      isExist = doesDirExist(path);
      if (isExist) writeFileSync([path, fileName], data, true);
      // Clear dir
      clearDirSync(path);

      assert.ok(isExist, 'FileOperations: UNC directory operations');
    } else {
      assert.ok(true, 'FileOperations: UNC directory operations');
    }

  });

  it('#5: FileOperations: readDirSync', () => {
    const filenames = readDirSync([appRoot, 'test/data/tmp']);
    inspector('FileOperations: readDirSync.filenames:', filenames);
    const fileObjs = readDirSync([appRoot, 'test/data/tmp'], true);
    inspector('FileOperations: readDirSync.fileObjs:', fileObjs);
    assert.ok(true, 'FileOperations: readDirSync');
  });

  it('#6: FileOperations: readOnlyNewFile', () => {
    let path = readOnlyNewFile([appRoot, 'test/data/tmp/fo'], cbReadOnlyNewFile);

    const data = { value: '12345-NewFile' };
    writeFileSync([path, 'new.json'], data, true);

    assert.ok(true, 'FileOperations: readOnlyNewFile');
  });

  it('#7: FileOperations: readOnlyModifiedFile', () => {
    let path = readOnlyModifiedFile([appRoot, 'test/data/tmp/fo'], cbReadOnlyModifiedFile);

    const data = { value: '12345-ModifiedFile' };
    writeFileSync([path, 'new.json'], data, true);

    assert.ok(true, 'FileOperations: readOnlyModifiedFile');
  });

  it('#8: FileOperations: watchFile', async () => {
    // Watch file
    let path = watchFile([appRoot, 'test/data/tmp/fo/new.json'], cbWatchFile, { interval: 100 });
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

  it('#9: FileOperations: Get file list from dir', () => {
    let fileNames = [], filterFileNames = [];
    //---------------------------------------------------------------
    const testPath = 'test/data/excel/acm';
    // Get file names without pattern filter
    fileNames = getFileListFromDir([appRoot, testPath]);
    if (isDebug && fileNames.length) inspector(`FileOperations: Get file list from dir (${testPath}):`, fileNames);
    // Get posix path for pattern  filter
    const posixPath = toPathWithPosixSep([appRoot, testPath]);
    if(isDebug && posixPath) console.log('toPathWithPosixSep.posixPath:', posixPath);
    // Get file names with pattern filter
    filterFileNames = getFileListFromDir([appRoot, testPath], [], `${posixPath}/**/2022/**/*.xls`, { matchBase: true });
    if (isDebug && filterFileNames.length) inspector(`FileOperations: Get file list from dir (${posixPath}):`, filterFileNames);
    assert.ok(filterFileNames.length && fileNames.length >= filterFileNames.length, 'FileOperations: Get file list from dir');
  });

  it('#10: FileOperations: Get file list from unc dir', () => {
    let fileNames = [], filterFileNames = [];
    //---------------------------------------------------------------
    const testPath = 'test/data/excel/acm';
    // Get unc path 
    const uncPath = winPathToUncPath([appRoot, testPath]);
    if (isDebug && uncPath) console.log('FileOperations: Get file list from unc dir.uncPath:', uncPath);
    // Get file names without pattern filter
    fileNames = getFileListFromDir(uncPath);
    if (isDebug && fileNames.length) inspector(`FileOperations: Get file list from unc dir (${uncPath}):`, fileNames);
    // Get file names with pattern filter
    filterFileNames = getFileListFromDir(uncPath, [], `${uncPath}/**/2022/**/*.xls`, { matchBase: true });
    if (isDebug && filterFileNames.length) inspector(`FileOperations: Get file list from unc dir (${uncPath}):`, filterFileNames);
    assert.ok(filterFileNames.length && fileNames.length >= filterFileNames.length, 'FileOperations: Get file list from unc dir');
  });
});
