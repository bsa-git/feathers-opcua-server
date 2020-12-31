/* eslint-disable no-unused-vars */
const fs = require('fs');
const { join } = require('path');

const debug = require('debug')('app:opcua-operations');
const isDebug = false;
const isLog = false;

/**
 * @method doesFileExist
 * @param {String|Array} path 
 * @returns {Boolean}
 */
const doesFileExist = function (path) {
  try {
    if (Array.isArray(path)) {
      path = join(...path);
    }
    return fs.statSync(path).isFile();
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return false;
  }
};


/**
 * @method fsAccess
 * @param {String|Array} path 
 * @param {Number} mode 
 * Default: fs.constants.F_OK e.g. -> fs.constants.R_OK | fs.constants.W_OK  
 * @returns {Boolean}
 */
const fsAccess = function (path, mode) {
  try {
    if (Array.isArray(path)) {
      path = join(...path);
    }
    fs.accessSync(path, mode);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * @method readOnlyNewFile
 * @param {String|Array} path 
 * @param {Function} cb 
 */
const readOnlyNewFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (eventType === 'rename' && filename) {
      let filePath = join(path, filename);
      console.log('path:', filePath);
      const isAccess = fsAccess(filePath, fs.constants.F_OK) && fsAccess(filePath, fs.constants.R_OK);
      if (isAccess) {
        const data = readFileSync(filePath);
        cb(filePath, data);
      }
    }
  });
};

/**
 * @method readOnlyModifiedFile
 * @param {String|Array} path 
 * @param {Function} cb 
 */
const readOnlyModifiedFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (eventType === 'change' && filename) {
      let filePath = join(path, filename);
      console.log('path:', filePath);
      const isAccess = fsAccess(filePath, fs.constants.F_OK) && fsAccess(filePath, fs.constants.R_OK);
      if (isAccess) {
        const data = readFileSync(filePath);
        cb(filePath, data);
      }
    }
  });
};


/**
 * @method readFileSync
 * @param {String|Array} path 
 * @param {String} encoding 
 * e.g. 'utf8'
 * @returns {String|Object}
 */
const readFileSync = function (path, encoding) {
  let result = null;
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const isAccess = fsAccess(path, fs.constants.F_OK) && fsAccess(path, fs.constants.R_OK);
  if (isAccess) {
    result = fs.readFileSync(path, encoding);
  }
  return result;
};

/**
 * @method writeFileSync
 * @param {String|Array} path
 * @param {String|Object|Buffer|TypeArray|DataView} data 
 * @param {Boolean} isJson 
 */
const writeFileSync = function (path, data, isJson = false) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  if (isJson) {
    data = JSON.stringify(data, null, 2);
  }
  fs.writeFileSync(path, data); // encoding <string> | <null> Default: 'utf8'
};

/**
 * @method removeFileSync
 * @param {String|Array} path 
 */
const removeFileSync = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.unlinkSync(path);
};

module.exports = {
  doesFileExist,
  fsAccess,
  readOnlyNewFile,
  readOnlyModifiedFile,
  readFileSync,
  writeFileSync,
  removeFileSync
};
