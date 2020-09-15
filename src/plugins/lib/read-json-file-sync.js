const fs = require('fs');

const { join } = require('path');
const doesFileExist = require('./does-file-exist');

module.exports = function readJsonFileSync(path) {
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
