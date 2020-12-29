const fs = require('fs');
// const { statSync } = require('fs');
const { join } = require('path');

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
 * @method readOnlyNewFile
 * @param {String|Array} path 
 * @param {Function} cb 
 */
const readOnlyNewFile = function(path, cb) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  fs.watch(path, (eventType, filename) => {
    if (eventType === 'rename' && filename) {
      let filePath = join(path, filename);
      console.log('path:', filePath);
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if(!err){
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) throw err;
            cb(err, data);
          });
        }
      });
    }
  });
};


/**
 * @method readJsonFileSync
 * @param {String|Array} path 
 * @returns {String}
 */
const readJsonFileSync = function(path) {
  let result = null;
  if (Array.isArray(path)) {
    path = join(...path);
  }
  if(doesFileExist(path)){
    result = fs.readFileSync(path);
    // Define to JSON type
    result = JSON.parse(result);
  }
  return result;
};

const writeJsonFileSync = function(path, obj) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const jsonString = JSON.stringify(obj, null, 2);
  fs.writeFileSync(path, jsonString);
};

module.exports = {
  doesFileExist,
  readOnlyNewFile,
  readJsonFileSync,
  writeJsonFileSync
}
