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
  let isAccess = false, _path = '';
  if (Array.isArray(path)) {
    path.forEach(item => {
      _path = join(_path, item);
      isAccess = fsAccess(_path);
      if (isDebug) debug('makeDirSync.path:', _path, '; isAccess:', isAccess);
      debug('mkdirSync.path:', _path, '; isAccess:', isAccess);
      if (!isAccess) {
        fs.mkdirSync(_path);
        debug('makeDirSync.path:', _path);
      }
    });
  }
};

/**
 * @method removeDirSync
 * @param {String|Array} path 
 */
const removeDirSync = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const isAccess = fsAccess(path);
  if (isAccess) {
    fs.rmdirSync(path);
    debug('removeDirSync.path:', path);
  }
};

// const rmDirFiles = dir => {
//   const dirPath = fs.readdirSync(dir);
//   dirPath.map(item => {
//     const currentPath = path.join(dir, item);
//     console.log(`rmove ${currentPath}`);
//     fileTool.removeSync(currentPath);
//   });
// }

// const availableActions = templates => {
//   const generators = fs.readdirSync(templates).filter(_ => fs.lstatSync(path.join(templates, _)).isDirectory());
//   return generators.reduce((acc, generator) => {
//    const actions = fs.readdirSync(path.join(templates, generator));
//    acc[generator] = actions;
//    return acc;
//   }, {});
//  }

// function run(gen) {
//   var iter = gen((err, data) => {
//     if (err) { iter.throw(err); }

//     return iter.next(data);
//   });

//   iter.next();
// }

// const dirPath = '/usr/local/bin';

// // Execute the generator function
// run(function* (resume) {
//   // Emit the list of files in the directory from the generator
//   var contents = yield fs.readdir(dirPath, resume);
//   console.log(contents);
// });

const readDirSync = function (path, withFileTypes = false) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  debug('readDirSync.path:', path);
  const isAccess = fsAccess(path);
  if (isAccess) {
    if(withFileTypes){
      const fileObjs = fs.readdirSync(path, { withFileTypes: true }); 

    }else{
      const filenames  = fs.readdirSync(path);
      if(isDebug) debug('readDirSync.filenames:', filenames);
      return  filenames;
    }
    
    
  }
};



/**
 * @method watchDirOrFile
 * Watch for changes on filename, where filename is either a file or a directory.
 * @param {String|Array} path 
 * @param {Function} cb 
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
}

/**
 * @method watchFile
 * Watch for changes on filename. The callback listener will be called each time the file is accessed.
 * @param {String|Array} path 
 * @param {Function} cb
 * The listener gets two arguments the current stat object and the previous stat object
 * @example
 * fs.watchFile('message.text', (curr, prev) => {
    console.log(`the current mtime is: ${curr.mtime}`);
    console.log(`the previous mtime was: ${prev.mtime}`);
  }); 
 */
const watchFile = function (path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watchFile(path, (current, previous) => {
    cb(current, previous);
  });
}

/**
 * @method unwatchFile
 * Stop watching for changes on filename. If listener is specified, only that particular listener is removed. 
 * Otherwise, all listeners are removed, effectively stopping watching of filename.
 * @param {String|Array} path 
 */
const unwatchFile = function (path) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.unwatchFile(path);
}

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
      if (isDebug) debug('readOnlyNewFile.path:', filePath);
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
      if (isDebug) debug('readOnlyModifiedFile.path:', filePath);
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
  watchDirOrFile,
  watchFile,
  unwatchFile,
  makeDirSync,
  removeDirSync,
  readOnlyNewFile,
  readOnlyModifiedFile,
  readFileSync,
  writeFileSync,
  removeFileSync
};
