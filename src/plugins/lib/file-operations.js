/* eslint-disable no-unused-vars */
const fs = require('fs');
const os = require('os');
const Path = require('path');
const join = Path.join;
const moment = require('moment');
const { getDate, getTime, strReplace } = require('../lib/util');

const loEndsWith = require('lodash/endsWith');

const debug = require('debug')('app:opcua-operations');
const isDebug = false;
const isLog = false;


/**
 * @method getFileName
 * @param {String} prefix
 * @param {String} ex
 * @param {Boolean} isMsec
 * @returns {String} e.g. data-20210105_153826.123.json
 */
const getFileName = function (prefix = '', ex = 'json', isMsec = false) {
  const dt = moment();
  const d = strReplace(getDate(dt, false), '-');
  const tList = strReplace(getTime(dt, false), ':').split('.');
  const t = isMsec ? `${tList[0]}.${tList[1]}` : `${tList[0]}`;
  const fileName = `${prefix}${d}_${t}.${ex}`;
  return fileName;
};


/**
 * @method getPathBasename
 * @param {String|Array} path
 * @returns {String} 
 */
const getPathBasename = function (path) {
  let basename = '';
  const platform = os.platform();
  if (Array.isArray(path)) {
    path = join(...path);
  }
  if (platform === 'win32') {
    basename = Path.win32.basename(path);
  } else {
    basename = Path.posix.basename(path);
  }
  return basename;
};

/**
 * @method getPathExtname
 * @param {String|Array} path
 * @returns {String} 
 */
const getPathExtname = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  return Path.extname(path);
};

/**
 * @method getPathDirname
 * @param {String|Array} path
 * @returns {String} 
 */
const getPathDirname = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  return Path.dirname(path);
};

/**
 * @method getPathParse
 * @param {String|Array} path
 * @returns {Object} 
 * 
 * @example C:\path\dir\file.txt
┌─────────────────────┬────────────┐
│          dir        │    base    │
├──────┬──────────────├──────┬─────┤
│ root │              │ name │ ext │
│ C:\  │    path\dir  │ file │.txt │
└──────┴──────────────┴──────┴─────┘
 */
const getPathParse = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  return Path.parse(path);
};

/**
 * @method getPathToArray
 * @param {String|Array} path
 * @returns {Array} 
 */
const getPathToArray = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  return path.split(Path.sep);
};

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
 * @method doesDirExist
 * @param {String|Array} path 
 * @returns {Boolean}
 */
const doesDirExist = function (path) {
  try {
    if (Array.isArray(path)) {
      path = join(...path);
    }
    return fs.statSync(path).isDirectory();
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
const fsAccess = function (path, mode = fs.constants.F_OK) {
  try {
    if (Array.isArray(path)) {
      path = join(...path);
    }
    fs.accessSync(path, mode);
    return true;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    return false;
  }
};

/**
 * @method makeDirSync
 * @param {String|Array} path 
 */
const makeDirSync = function (path) {
  let isExist = false, joinPath = '', arrPath = [];
  if (Array.isArray(path)) {
    path.forEach(item => {
      joinPath = join(joinPath, item);
      isExist = doesDirExist(joinPath);
      if (isDebug) debug('makeDirSync.path:', joinPath, '; isExist:', isExist);
      if (!isExist) {
        arrPath = getPathToArray(joinPath);
        joinPath = '';
        arrPath.forEach((item2, index) => {
          if (!joinPath && loEndsWith(item2, ':')) {
            item2 += Path.sep;
          }
          joinPath = join(joinPath, item2);
          if (index > 0) {
            isExist = doesDirExist(joinPath);
            if (!isExist) {
              fs.mkdirSync(joinPath);
              if (isDebug) debug('Make dir for path:', joinPath);
              debug('Make dir for path:', joinPath);
            }
          }
        });
      }
    });
    return joinPath;
  } else {
    isExist = doesDirExist(path);
    if (isDebug) debug('makeDirSync.path:', path, '; isExist:', isExist);
    if (!isExist) {
      arrPath = getPathToArray(path);
      arrPath.forEach((item, index) => {
        if (!joinPath && loEndsWith(item, ':')) {
          item += Path.sep;
        }
        joinPath = join(joinPath, item);
        if (index > 0) {
          isExist = doesDirExist(joinPath);
          if (!isExist) {
            fs.mkdirSync(joinPath);
            if (isDebug) debug('Make dir for path:', joinPath);
            debug('Make dir for path:', joinPath);
          }
        }
      });
    }
    return path;
  }
};


/**
 * @method removeFilesFromDirSync
 * @param {String|Array} path 
 */
const removeFilesFromDirSync = function (path) {
  let fileObjs = [], newPath = '';
  if (Array.isArray(path)) {
    path = join(...path);
  }
  let isExist = doesDirExist(path);
  // let isExist = fsAccess(path);
  if (isExist) {
    if (isDebug) debug('removeFilesFromDirSync.path:', path);
    fileObjs = readDirSync(path, true);
    if (isDebug) debug('removeFilesFromDirSync.fileObjs:', fileObjs);
    if (fileObjs.length) {
      fileObjs.forEach(fileObj => {
        newPath = join(path, fileObj.name);
        if (fileObj.isFile()) {
          removeFileSync(newPath);
          if (isDebug) debug('Removed file for path:', newPath);
        }
        if (fileObj.isDirectory()) {
          if (isDebug) debug('Run recursion for path:', newPath);
          removeFilesFromDirSync(newPath);
        }
      });
    }
  }
  return path;
};

/**
 * @method removeDirFromDirSync
 * @param {String|Array} path 
 */
const removeDirFromDirSync = function (path) {
  let fileObjs = [], newPath = '';
  if (Array.isArray(path)) {
    path = join(...path);
  }
  let isExist = doesDirExist(path);
  // let isExist = fsAccess(path);
  if (isExist) {
    if (isDebug) debug('removeDirFromDirSync.path:', path);
    fileObjs = readDirSync(path, true);
    if (isDebug) debug('removeDirFromDirSync.fileObjs:', fileObjs);
    if (fileObjs.length) {
      fileObjs.forEach(fileObj => {
        newPath = join(path, fileObj.name);
        if (fileObj.isDirectory()) {
          if (isDebug) debug('Run recursion for path:', newPath);
          removeDirFromDirSync(newPath);
        }
      });
      fileObjs = readDirSync(path, true);
      if (!fileObjs.length) {
        fs.rmdirSync(path);
        if (isDebug) debug('Removed dir for path:', path);
      }
    } else {
      fs.rmdirSync(path);
      if (isDebug) debug('Removed dir for path:', path);
    }
  }
  return path;
};

/**
 * @method clearDirSync
 * @param {String|Array} path 
 */
const clearDirSync = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const isExist = doesDirExist(path);
  // const isExist = fsAccess(path);
  if (isExist) {
    if (isDebug) debug('clearDirSync.path:', path);
    removeFilesFromDirSync(path);
    removeDirFromDirSync(path);
    if (isDebug) debug('Directory has been cleared for path:', path);
  }
  return path;
};


/**
 * @method readDirSync
 * @param {String|Array} path 
 * @param {Boolean} withFileTypes 
 */
const readDirSync = function (path, withFileTypes = false) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  if (isDebug) debug('readDirSync.path:', path);
  const isAccess = fsAccess(path);
  if (isAccess) {
    if (withFileTypes) {
      let fileObjs = fs.readdirSync(path, { withFileTypes: true });
      if (isDebug) debug('readDirSync.fileObjs:', fileObjs);
      return fileObjs;
    } else {
      const filenames = fs.readdirSync(path);
      if (isDebug) debug('readDirSync.filenames:', filenames);
      return filenames;
    }
  }
};


/**
 * @method watchDirOrFile
 * Watch for changes on filename, where filename is either a file or a directory.
 * @param {String|Array} path 
 * @param {Function} cb 
 * @returns {String}
 * The listener callback gets two arguments (eventType, filename). 
 * eventType is either 'rename' or 'change', and filename is the name of the file which triggered the event
 * @example
 * fs.watch('somedir', (eventType, filename) => {
    console.log(`event type is: ${eventType}`);
    if (filename) {
      console.log(`filename provided: ${filename}`);
    } else {
      console.log('filename not provided');
    }
  });
 */
const watchDirOrFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (filename) {
      const filePath = join(path, filename);
      cb(eventType, filePath);
    } else {
      cb(eventType, path);
    }
  });
  return path;
};

/**
 * @method watchFile
 * Watch for changes on filename. The callback listener will be called each time the file is accessed.
 * @param {String|Array} path 
 * @param {Function} cb
 * @param {Object} options
 * The options argument may be omitted. If provided, it should be an object. 
 * The options object may contain a boolean named persistent that indicates whether the process 
 * should continue to run as long as files are being watched. 
 * The options object may specify an interval property indicating how often the target should be polled in milliseconds.
 * @returns {String}
 * The listener gets two arguments the current stat object and the previous stat object
 * @example
 * fs.watchFile('message.text', (curr, prev) => {
    console.log(`the current mtime is: ${curr.mtime}`);
    console.log(`the previous mtime was: ${prev.mtime}`);
  }); 
 */
const watchFile = function (path, cb, options) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watchFile(path, options, (current, previous) => {
    if (isDebug) debug('watchFile.path:', path, '; current:', current, '; previous:', previous);
    // debug('watchFile.path:', path, '; current:', current, '; previous:', previous);
    cb(path, current, previous);
  });
  return path;
};

/**
 * @method unwatchFile
 * Stop watching for changes on filename. If listener is specified, only that particular listener is removed. 
 * Otherwise, all listeners are removed, effectively stopping watching of filename.
 * @param {String|Array} path 
 * @returns {String}
 */
const unwatchFile = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.unwatchFile(path);
  return path;
};

/**
 * @method watchNewFile
 * @param {String|Array} path 
 * @param {Function} cb 
 * @returns {String}
 */
const watchNewFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (isDebug) debug('readOnlyNewFile.eventType:', eventType, '; filename:', filename);
    if (eventType === 'rename' && filename) {
      let filePath = join(path, filename);

      const isAccess = fsAccess(filePath, fs.constants.F_OK) && fsAccess(filePath, fs.constants.R_OK);
      if (isDebug) debug('readOnlyNewFile.filePath:', filePath, '; isAccess:', isAccess);

      if (isAccess) cb(filePath);
    }
  });
  return path;
};

/**
 * @method readOnlyModifiedFile
 * @param {String|Array} path 
 * @param {Function} cb 
 * @returns {String}
 */
const watchModifiedFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (isDebug) debug('readOnlyModifiedFile.eventType:', eventType, '; filename:', filename);
    if (eventType === 'change' && filename) {
      let filePath = join(path, filename);

      const isAccess = fsAccess(filePath, fs.constants.F_OK) && fsAccess(filePath, fs.constants.R_OK);
      if (isDebug) debug('readOnlyModifiedFile.filePath:', filePath, '; isAccess:', isAccess);

      if (isAccess) cb(filePath);
    }
  });
  return path;
};

/**
 * @method readOnlyNewFile
 * @param {String|Array} path 
 * @param {Function} cb 
 * @returns {String}
 */
const readOnlyNewFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (isDebug) debug('readOnlyNewFile.eventType:', eventType, '; filename:', filename);
    if (eventType === 'rename' && filename) {
      let filePath = join(path, filename);

      const isAccess = fsAccess(filePath, fs.constants.F_OK) && fsAccess(filePath, fs.constants.R_OK);
      if (isDebug) debug('readOnlyNewFile.filePath:', filePath, '; isAccess:', isAccess);

      if (isAccess) {
        const data = readFileSync(filePath);
        if (isDebug) debug('readOnlyNewFile.filePath:', filePath, '; data:', data);
        cb(filePath, data);
      }
    }
  });
  return path;
};

/**
 * @method readOnlyModifiedFile
 * @param {String|Array} path 
 * @param {Function} cb 
 * @returns {String}
 */
const readOnlyModifiedFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (isDebug) debug('readOnlyModifiedFile.eventType:', eventType, '; filename:', filename);
    if (eventType === 'change' && filename) {
      let filePath = join(path, filename);

      const isAccess = fsAccess(filePath, fs.constants.F_OK) && fsAccess(filePath, fs.constants.R_OK);
      if (isDebug) debug('readOnlyModifiedFile.filePath:', filePath, '; isAccess:', isAccess);

      if (isAccess) {
        const data = readFileSync(filePath);
        if (isDebug) debug('readOnlyModifiedFile.filePath:', filePath, '; data:', data);
        cb(filePath, data);
      }
    }
  });
  return path;
};


/**
 * @method readFileSync
 * @param {String|Array} path 
 * @param {String} encoding 
 * e.g. 'utf8'
 * @returns {String|Object}
 */
const readFileSync = function (path, encoding = 'utf8') {
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
 * @returns {String}
 */
const writeFileSync = function (path, data, isJson = false) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  if (isJson) {
    data = JSON.stringify(data, null, 2);
    if (isDebug) debug('writeFileSync.jsonData:', data);
  }

  const dir = getPathParse(path).dir;

  const isAccess = fsAccess(dir, fs.constants.F_OK) && fsAccess(dir, fs.constants.W_OK);
  if (isAccess) {
    fs.writeFileSync(path, data); // encoding <string> | <null> Default: 'utf8'
    if (isDebug) debug('File was written for path:', path);
  } else {
    throw new Error(`Access error for path: ${dir}; fs.F_OK: ${fsAccess(dir, fs.constants.F_OK)}; fs.W_OK: ${fsAccess(dir, fs.constants.W_OK)};`);
  }
  return path;
};

/**
 * @method removeFileSync
 * @param {String|Array} path 
 * @returns {String}
 */
const removeFileSync = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.unlinkSync(path);
  return path;
};


module.exports = {
  getFileName,
  getPathBasename,
  getPathExtname,
  getPathDirname,
  getPathParse,
  getPathToArray,
  doesFileExist,
  doesDirExist,
  fsAccess,
  watchDirOrFile,
  watchFile,
  unwatchFile,
  watchNewFile,
  watchModifiedFile,
  makeDirSync,
  removeFilesFromDirSync,
  removeDirFromDirSync,
  clearDirSync,
  readDirSync,
  readOnlyNewFile,
  readOnlyModifiedFile,
  readFileSync,
  writeFileSync,
  removeFileSync
};
