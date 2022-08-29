/* eslint-disable no-unused-vars */
const fs = require('fs');
const os = require('os');
const Path = require('path');
const join = Path.join;
const moment = require('moment');
const minimatch = require('minimatch');
const Minimatch = require('minimatch').Minimatch;
const dirTree = require('directory-tree');
const del = require('del');
const chalk = require('chalk');

const {
  appRoot,
  inspector,
  logger,
  getDate,
  getTime,
  strReplace,
  strReplaceEx,
  cloneObject
} = require('./util');

const loEndsWith = require('lodash/endsWith');
const loStartsWith = require('lodash/startsWith');
const loTemplate = require('lodash/template');
const loIsString = require('lodash/isString');
const loReplace = require('lodash/replace');

const debug = require('debug')('app:file-operations');
const isDebug = false;
//===========================================================


/**
 * @method getOsPlatform
 * @returns {String}
 * e.g. 'aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', and 'win32'
 */
const getOsPlatform = function () {
  return os.platform();
};

/**
 * @method getOsArchitecture
 * @returns {String}
 * e.g. 'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', and 'x64'
 */
const getOsArchitecture = function () {
  return os.arch();
};

/**
 * @method getBitDepthOS
 * @returns {Number}
 * e.g. for 'x32' -> 32, 'x64' -> 64
 * e.g. 'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', and 'x64'
 */
const getBitDepthOS = function () {
  let result = 32;
  //--------------------
  switch (getOsArchitecture()) {
  case 'arm':
    result = 32;
    break;
  case 'arm64':
    result = 64;
    break;
  case 'ia32':
    result = 32;
    break;
  case 'mips':
    result = 32;
    break;
  case 'mipsel':
    result = 64;
    break;
  case 'ppc':
    result = 32;
    break;
  case 'ppc64':
    result = 64;
    break;
  case 's390':
    result = 32;
    break;
  case 's390x':
    result = 64;
    break;
  case 'x32':
    result = 32;
    break;
  case 'x64':
    result = 64;
    break;
  default:
    break;
  }
  return result;
};

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
 * @method getDateTimeFromFileName
 * @param {String} filePath 
 * @param {Array} slice 
 * @param {String} template 
 * @returns {String}
 * e.g. filePath='//192.168.3.5/www_m5/m5_data2/data-20220518_075752.txt', slice=[5], template='YYYYMMDD_HHmmss' -> '2022-05-18T07:57:52'
 */
const getDateTimeFromFileName = function (filePath, slice = [0], template = 'YYYYMMDD_HHmmss') {
  let fileName = getPathBasename(filePath);
  fileName = fileName.split('.')[0].slice(...slice);
  const dateTime = moment.utc(fileName, template).format('YYYY-MM-DDTHH:mm:ss');
  if (isDebug && dateTime) inspector('getDateTimeFromFileName.dateTime:', dateTime);
  return dateTime;
};


/**
 * @method getPathBasename
 * @param {String|Array} path
 * @param {String} ext
 * @returns {String} 
 * e.g. path.basename('/foo/bar/baz/asdf/quux.html') -> 'quux.html'
 * e.g. path.basename('/foo/bar/baz/asdf/quux.html', '.html') -> 'quux'
 */
const getPathBasename = function (path, ext) {
  let basename = '';
  const platform = os.platform();
  if (Array.isArray(path)) {
    path = join(...path);
  }
  if (platform === 'win32') {
    basename = Path.win32.basename(path, ext);
  } else {
    basename = Path.posix.basename(path, ext);
  }
  return basename;
};

/**
 * @method getPathExtname
 * @param {String|Array} path
 * @returns {String} 
 * e.g. path.extname('index.html') -> '.html'
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
 * @method getDirectoryList
 * @param {String|Array} path
 * @returns {String[]} 
 */
const getDirectoryList = function (path) {

  if (Array.isArray(path)) {
    path = join(...path);
  }
  const dirList = dirTree(path).children.filter(child => child.type === 'directory').map(child => child.name);
  return dirList;
};

/**
 * @method toPathWithSep
 * @param {Array|String} path 
 * @returns {String}
 * e.g. sep depends on operating system 
 * e.g os -> win32 -> sep = \\
 * e.g os -> unix -> sep = /
 */
const toPathWithSep = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  } else {
    path = join('', path);
  }
  return path;
};// path.posix.join()

/**
 * @method toPathWithPosixSep
 * @param {Array|String} path 
 * @returns {String}
 * e.g. sep only -> /
 * e.g.'C:/NodeServer/feathers-opcua-server/test/data/excel/acm'
 */
const toPathWithPosixSep = function (path) {
  if (Array.isArray(path)) {
    path = path.map(p => strReplaceEx(p, /\\/gi, '/'));
    path = Path.posix.join(...path);
  } else {
    path = strReplaceEx(path, /\\/gi, '/');
  }
  return path;
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
    return false;
  }
};

/**
 * @method makeDirSync
 * @param {String|Array} path 
 */
const makeDirSync = function (path) {
  let isExist = false, joinPath = '', existingPath = '', arrPath = [];
  //--------------------------------------------------------------------
  if (Array.isArray(path)) {
    path.forEach(item => {
      joinPath = join(joinPath, item);
      isExist = doesDirExist(joinPath);
      if (isDebug) debug('makeDirSync.path:', joinPath, '; isExist:', isExist);
      if (isExist) {
        existingPath = joinPath;
      } else {
        item = toPathWithSep(item);
        arrPath = getPathToArray(item);
        arrPath.forEach(item2 => {
          if (!existingPath && loEndsWith(item2, ':')) {
            item2 += Path.sep;
          }
          joinPath = join(existingPath, item2);
          isExist = doesDirExist(joinPath);
          if (!isExist) {
            fs.mkdirSync(joinPath);
            if (isDebug) debug('Make dir for path:', joinPath);
            debug('Make dir for path:', joinPath);
          }
          existingPath = joinPath;
        });
      }
    });
    return existingPath;
  } else {
    path = toPathWithSep(path);
    isExist = doesDirExist(path);
    if (isDebug) debug('makeDirSync.path:', path, '; isExist:', isExist);
    if (!isExist) {
      arrPath = getPathToArray(path);
      if (isDebug) debug('makeDirSync.arrPath:', arrPath);
      let index = isUncPath(path) ? 2 : 0;
      for (index; index < arrPath.length; index++) {
        let item = arrPath[index];
        if (loEndsWith(item, ':') && !joinPath) {
          item += Path.sep;
        }
        if (isUncPath(path) && joinPath) {
          joinPath = `${joinPath}${Path.sep}${item}`;
        }
        if (isUncPath(path) && !joinPath) {
          joinPath = `${Path.sep}${Path.sep}${item}`;
        }
        if (!isUncPath(path)) {
          joinPath = join(joinPath, item);
        }
        isExist = doesDirExist(joinPath);
        if (isDebug) debug('makeDirSync.joinPath:', joinPath, '; isExist:', isExist);
        if (!isExist) {
          fs.mkdirSync(joinPath);
          if (isDebug) debug('Make dir for path:', joinPath);
        }
      }
    }
    return path;
  }
};

/**
 * @method createPath
 * @param {String} path 
 * @returns {String}
 */
const createPath = function (path) {
  if (Array.isArray(path)) return makeDirSync(path);
  // Make dir
  if (isUncPath(path)) {
    path = makeDirSync(path);
  } else {
    path = toPathWithSep(path);
    path = loStartsWith(path, Path.sep) ? makeDirSync([appRoot, path]) : makeDirSync(path);
  }
  return path;
};

/**
 * @method isUncPath
 * @param {String} path 
 * @returns {Boolean}
 */
const isUncPath = function (path) {
  const isUncPath = require('is-unc-path');
  return isUncPath(path);
};

/**
 * @method winPathToUncPath
 * @param {String} path 
 * e.g. 'C:\NodeServer\feathers-opcua-server\'
 * @param {String} host 
 * @param {String} share 
 * @returns {String}
 * e.g. '\\localhost\c$\NodeServer\feathers-opcua-server'
 */
const winPathToUncPath = function (path, host = 'localhost', share = 'drv') {
  let joinPath = '', isExist = false, arrPath = [], drv = '';
  if (Array.isArray(path)) {
    path.forEach(item => {
      joinPath = join(joinPath, item);
    });
    path = joinPath;
  }
  path = toPathWithSep(path);
  isExist = doesDirExist(path);
  if (isExist) {
    if (isUncPath(path)) {
      return path;
    }
    arrPath = getPathToArray(path);
    drv = arrPath[0];
    if (loEndsWith(drv, ':')) {
      share = (share === 'drv') ? `${Path.sep}${strReplace(drv, ':', '').toLowerCase()}$` : '';
      path = strReplace(path, drv, `${Path.sep}${Path.sep}${host}${share}`);
      if (isDebug) debug('winPathToUncPath.path:', path);
      // debug('winPathToUncPath.path:', path);
      return path;
    } else {
      return path;
    }
  } else {
    return path;
  }
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

/**
 * @method removeFilesFromDirSync
 * @param {String|Array} path 
 */
const removeFilesFromDirSync = function (path) {
  let fileObjs = [], newPath = '';
  //--------------------------------
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
  if (isExist) {
    if (isDebug) debug('clearDirSync.path:', path);
    removeFilesFromDirSync(path);
    removeDirFromDirSync(path);
    if (isDebug) debug('Directory has been cleared for path:', path);
  }
  return path;
};

/**
 * @method removeItemsSync
 * 
 * @param {String | String[]} patterns 
 * The glob pattern ** matches all children and the parent.
 * e.g. So this won't work: deleteSync(['public/assets/**', '!public/assets/goat.png']);
 * e.g. You have to explicitly ignore the parent directories too: deleteSync(['public/assets/**', '!public/assets', '!public/assets/goat.png']);
 * @param {Object} options
 * e.g. { force: false, dryRun: false, concurrency: Infinity, onProgress: progress => { ... } }
 * where: 
 *  - force -> Allow deleting the current working directory and outside.
 *  - dryRun -> See what would be deleted.
 *  - concurrency -> Concurrency limit. (1...Infinity)
 *  - onProgress -> Called after each file or directory is deleted. e.g. Type: (progress: ProgressData) => void 
 *  ProgressData {totalCount: number, deletedCount: number,	percent: number}
 * @returns {String[]} 
 * e.g. del.sync(['public/assets/**', '!public/assets', '!public/assets/goat.png']);
 */
// e.g. To delete all subdirectories inside public/, you can do: deleteSync(['public/*/']);
const removeItemsSync = function (patterns, options = {}) {
  const deletedItems = del.sync(patterns, options);
  if (isDebug && deletedItems.length) inspector('removeItemsSync.deletedItems:', deletedItems);
  if (options.dryRun) {
    if (isDebug && deletedItems.length) inspector('removeItemsSync.Files and directories that would be deleted:', deletedItems);
  }
  
  return deletedItems;
};

/**
 * @method removeItems
 * @async
 * 
 * @param {String | String[]} patterns 
 * The glob pattern ** matches all children and the parent.
 * e.g. So this won't work: deleteSync(['public/assets/**', '!public/assets/goat.png']);
 * e.g. You have to explicitly ignore the parent directories too: deleteSync(['public/assets/**', '!public/assets', '!public/assets/goat.png']);
 * @param {Object} options
 * e.g. { force: false, dryRun: false, concurrency: Infinity, onProgress: progress => { ... } }
 * where: 
 *  - force -> Allow deleting the current working directory and outside.
 *  - dryRun -> See what would be deleted.
 *  - concurrency -> Concurrency limit. (1...Infinity)
 *  - onProgress -> Called after each file or directory is deleted. e.g. Type: (progress: ProgressData) => void 
 *  ProgressData {totalCount: number, deletedCount: number,	percent: number}
 * @returns {Promise<String[]>} 
 * e.g. const deletedFilePaths = await del(['temp/*.js', '!temp/unicorn.js']);
   e.g. const deletedDirectoryPaths = await del(['temp', 'public']);
 */
// e.g. To delete all subdirectories inside public/, you can do: await del(['public/*/']);
const removeItems = async function (patterns, options) {
  const deletedItems = await del(patterns, options);
  if (isDebug && deletedItems.length) inspector('removeItems.deletedItems:', deletedItems);
  if (options.dryRun) {
    if (isDebug && deletedItems.length) inspector('removeItems.Files and directories that would be deleted:', deletedItems);
  }
  return deletedItems;
};

/**
 * @method readDirSync
 * @param {String|Array} path 
 * @param {Boolean} withFileTypes 
 */
const readDirSync = function (path, withFileTypes = false) {
  let result = null;
  //------------------------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  if (isDebug) debug('readDirSync.path:', path);
  const isAccess = fsAccess(path);
  if (isAccess) {
    if (withFileTypes) {
      let fileObjs = fs.readdirSync(path, { withFileTypes: true });
      if (isDebug) debug('readDirSync.fileObjs:', fileObjs);
      result = fileObjs;
    } else {
      const filenames = fs.readdirSync(path);
      if (isDebug) debug('readDirSync.filenames:', filenames);
      result = filenames;
    }
  } else {
    logger.error(`readDirSync: Access ERROR for file path - '${path}'.`);
  }
  return result;
};

/**
 * @method getFileListFromDir
 * @param {String|Array} path 
 * @param {String} pattern 
 * e.g. '*.xls'
 * @param {Object} options
 * e.g. { matchBase: true }
 * @param {String[]} fileList 
 * @returns {String[]}
 * e.g. [
  'c:/reports/acm/23agr/2022/2022-01/DayHist01_23F120_01022022_0000.xls',
  'c:/reports/acm/23agr/DayHist01_23F120_02232022_0000.xls',
  'c:/reports/acm/23agr/DayHist01_23F120_02242022_0000.xls'
]
 */
// e.g. pattern -> '*.xls'|'/**/2022/**/*.xls'
const getFileListFromDir = function (path, pattern = '', options = {}, fileList = []) {
  let filenames = [];
  //--------------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  path = toPathWithSep(path);
  filenames = readDirSync(path);
  if (isDebug && filenames && filenames.length) inspector('getFileListFromDir.filenames:', filenames);
  if (filenames && filenames.length) {
    for (let index = 0; index < filenames.length; index++) {
      const item = filenames[index];
      const extname = getPathExtname(item);
      if (extname) {
        fileList.push(`${path}${Path.sep}${item}`);
        if (isDebug && fileList.length) inspector('getFileListFromDir.fileList:', fileList);
      } else {
        getFileListFromDir(`${path}${Path.sep}${item}`, pattern, options, fileList);
      }
    }
  }
  if (isDebug && fileList.length) inspector('getFileListFromDir.fileList:', fileList);
  if (pattern) {
    fileList = minimatch.match(fileList, pattern, options);
    if (isDebug && fileList.length) inspector('getFileListFromDir.minimatch.fileList:', fileList);
  }
  return fileList;
};

/**
 * @method getFileStatList
 * @param {String[]} fileList 
 * @returns {Object[]}
 * e.g. [{ 
 *  filePath: 'c:/tmp/test.txt',
 *  stat: {
 *    fileSize: stat.size,
      accessedAt: stat.atime, // Time when file data last accessed.
      updatedAt: stat.mtime, // Time when file data last modified.
      changedStatAt: stat.ctime, // Time when file status was last changed (inode data modification).
      createdAt: stat.birthtime // Time of file creation. Set once when the file is created.
 *  }
 * }...]
 */
const getFileStatList = function (fileList = []) {
  const _fileList = cloneObject(fileList);
  return _fileList.map(f => {
    return { filePath: f, fileStat: getFileStatSync(f) };
  });
};

/**
 * Creates the function which checks whether a file path is matched with the given pattern or not.
 * @method createMatch
 * @param {string[]} includePatterns - The glob patterns to include files.
 * @param {string[]} excludePatterns - The glob patterns to exclude files.
 * @returns {function} Created predicate function.
 */
const createMatch = function (includePatterns = [], excludePatterns = []) {
  const include = includePatterns.map(pattern => new Minimatch(pattern));
  const exclude = excludePatterns.map(pattern => new Minimatch(pattern));

  return filePath =>
    include.some(m => m.match(filePath)) &&
    !exclude.some(m => m.match(filePath));
};

/**
 * @method makeRulesFromGlobPatterns
 * @param {*} patterns 
 * @param {*} dirRules 
 * @param {*} fileRules 
 */
const makeRulesFromGlobPatterns = function (patterns, dirRules = [], fileRules = []) {
  const rDir = /\/$/;
  const toRe = pattern => minimatch.makeRe(pattern);
  patterns && patterns.forEach(pattern => {
    if (rDir.test(pattern)) {
      pattern = pattern.replace(rDir, '');
      dirRules.push(toRe(pattern));
    } else {
      fileRules.push(toRe(pattern));
    }
  });
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
    if (isDebug && path) debug('watchFile.path:', path, '; current:', current, '; previous:', previous);
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
 * @method watchRemovedFile
 * @param {String|Array} path 
 * @param {Function} cb 
 * @returns {String}
 */
const watchRemovedFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (isDebug) debug('watchRemovedFile.eventType:', eventType, '; filename:', filename);
    if (eventType === 'rename' && filename) {
      let filePath = join(path, filename);

      const isAccess = fsAccess(filePath, fs.constants.F_OK);
      if (isDebug) debug('watchRemovedFile.filePath:', filePath, '; isAccess:', isAccess);

      if (!isAccess) cb(filePath);
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
  let currentTime = '', currentFilename = '';
  //----------------------------------------
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
        const getCurrentTime = getTime('', false).split('.')[0];
        if (filename !== currentFilename || getCurrentTime > currentTime) {
          currentFilename = filename;
          currentTime = getCurrentTime;
          const data = readFileSync(filePath);
          if (isDebug) debug('readOnlyModifiedFile.filePath:', filePath, '; data:', data);
          cb(filePath, data);
        }
      }
    }
  });
  return path;
};

/**
 * @method getFileState
 * @param {String|Array} path 
 * @returns {Object}
 * e.g. {
 *    fileSize: stat.size,
      accessedAt: stat.atime, // Time when file data last accessed.
      updatedAt: stat.mtime, // Time when file data last modified.
      changedStatAt: stat.ctime, // Time when file status was last changed (inode data modification).
      createdAt: stat.birthtime // Time of file creation. Set once when the file is created.
 *  }
 */
const getFileStatSync = function (path) {
  let result = null;
  //-----------------
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const isFileExist = doesFileExist(path);
  if (isFileExist) {
    const stat = fs.statSync(path);
    result = {
      fileSize: stat.size,
      accessedAt: moment.utc(stat.atime).format(), // Time when file data last accessed.
      updatedAt: moment.utc(stat.mtime).format(), // Time when file data last modified.
      changedStatAt: moment.utc(stat.ctime).format(), // Time when file status was last changed (inode data modification).
      createdAt: moment.utc(stat.birthtime).format() // Time of file creation. Set once when the file is created.
    };
  } else {
    logger.error(`getFileStatSync: Access ERROR for file path - '${path}'.`);
  }
  return result;
};

/**
 * @method readFileSync
 * @param {String|Array} path 
 * @param {String} encoding 
 * e.g. 'utf8'
 * @returns {String|Buffer}
 */
const readFileSync = function (path, encoding = 'utf8') {
  let result = null;
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const isAccess = fsAccess(path, fs.constants.F_OK) && fsAccess(path, fs.constants.R_OK);
  if (isAccess) {
    result = fs.readFileSync(path, encoding);
  } else {
    logger.error(`readFileSync: Access ERROR for file path - '${path}'.`);
  }
  return result;
};

/**
 * @method readJsonFileSync
 * @param {String|Array} path 
 * @param {String} encoding 
 * e.g. 'utf8'
 * @returns {Object}
 */
const readJsonFileSync = function (path, encoding = 'utf8') {
  let result = null;
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const isAccess = fsAccess(path, fs.constants.F_OK) && fsAccess(path, fs.constants.R_OK);
  if (isAccess) {
    result = fs.readFileSync(path, encoding);
  } else {
    logger.error(`readJsonFileSync: Access ERROR for file path - '${path}'.`);
  }
  return JSON.parse(result);
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
    logger.error(`writeFileSync: Access ERROR for file path - '${dir}'.`);
    throw new Error(`Access error for path: ${dir}; fs.F_OK: ${fsAccess(dir, fs.constants.F_OK)}; fs.W_OK: ${fsAccess(dir, fs.constants.W_OK)};`);
  }
  return path;
};

/**
 * @method writeFileSync
 * @param {String|Array} path
 * @param {String|Object|Buffer|TypeArray|DataView} data 
 * @returns {String}
 */
const writeJsonFileSync = function (path, data) {
  return writeFileSync(path, data, true);
};

/**
 * @method writeFileStream
 * @param {String|Array} path
 * @param {String|Object|Buffer|TypeArray|DataView} data 
 * @param {Boolean} isJson 
 * @returns {String}
 */
const writeFileStream = function (path, data) {
  if (Array.isArray(path)) {
    path = join(...path);
  }

  const dir = getPathParse(path).dir;

  const isAccess = fsAccess(dir, fs.constants.F_OK) && fsAccess(dir, fs.constants.W_OK);
  if (isAccess) {
    data.pipe(fs.createWriteStream(path));
    if (isDebug && path) debug('File was written for path:', path);
  } else {
    logger.error(`writeFileStream: Access ERROR for file path - '${dir}'.`);
    throw new Error(`Access error for path: ${dir}; fs.F_OK: ${fsAccess(dir, fs.constants.F_OK)}; fs.W_OK: ${fsAccess(dir, fs.constants.W_OK)};`);
  }
  return path;
};

/**
 * @method getParams4PointID
 * @param {Number} pointID 
 * e.g. pointID -> 1..3
 * @param {String} tmplFileName 
 * e.g. tmplFileName -> 'acmDayReport_${ pointID }.json'
 * @param {String} paramsPath 
 * e.g. paramsPath -> '/src/api/app/opcua-methods/acm-reports'
 * @param {Object} argParams 
 * @returns {Object}
 */
const getParams4PointID = function (pointID, tmplFileName, paramsPath, argParams) {
  let paramsFile, baseParamsFile, params = null, paramFullsPath;
  //---------------------------------
  // Get params data
  if (argParams) params = cloneObject(argParams);
  paramsFile = loTemplate(tmplFileName)({ pointID });
  paramFullsPath = [appRoot, paramsPath, paramsFile];
  if (!doesFileExist(paramFullsPath)) {
    logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}. File with name "${chalk.cyan(paramsFile)}" not found.`);
    throw new Error(`RunMetod(methodAcmDayReportsDataGet): ERROR. File with name "${paramsFile}" not found.`);
  }

  const _params = require(join(...paramFullsPath));

  if (params) {
    params = Object.assign({}, _params, params);
  } else {
    params = Object.assign({}, _params);
  }

  if (params.baseParams) {
    // Get base params file 
    baseParamsFile = loTemplate(tmplFileName)({ pointID: params.baseParams });
    if (baseParamsFile !== paramsFile) {
      paramFullsPath = [appRoot, paramsPath, baseParamsFile];
      if (!doesFileExist(paramFullsPath)) {
        logger.error(`RunMetod(methodAcmDayReportsDataGet): ${chalk.red('ERROR')}. File with name "${chalk.cyan(baseParamsFile)}" not found.`);
        throw new Error(`RunMetod(methodAcmDayReportsDataGet): ERROR. File with name "${baseParamsFile}" not found.`);
      }
      const baseParams = require(join(...paramFullsPath));
      params = Object.assign({}, baseParams, params);
    }
  }
  return params;
};

module.exports = {
  getOsPlatform,
  getOsArchitecture,
  getBitDepthOS,
  getFileName,
  getDateTimeFromFileName,
  getPathBasename,
  getPathExtname,
  getPathDirname,
  getPathParse,
  getPathToArray,
  getDirectoryList,
  toPathWithSep,
  toPathWithPosixSep,
  doesFileExist,
  doesDirExist,
  fsAccess,
  watchDirOrFile,
  watchFile,
  unwatchFile,
  watchNewFile,
  watchRemovedFile,
  watchModifiedFile,
  makeDirSync,
  createPath,
  isUncPath,
  winPathToUncPath,
  getFileStatSync,
  getFileStatList,
  readDirSync,
  getFileListFromDir,
  createMatch,
  makeRulesFromGlobPatterns,
  readOnlyNewFile,
  readOnlyModifiedFile,
  readFileSync,
  readJsonFileSync,
  writeFileSync,
  writeJsonFileSync,
  writeFileStream,
  removeFileSync,
  removeFilesFromDirSync,
  removeDirFromDirSync,
  clearDirSync,
  removeItemsSync,
  removeItems,
  getParams4PointID
};
