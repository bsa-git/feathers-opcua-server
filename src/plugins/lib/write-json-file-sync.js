const fs = require('fs');
const { join } = require('path');

module.exports = function writeJsonFileSync(path, obj) {
  if (Array.isArray(path)) {
    path = join(...path);
  }
  const jsonString = JSON.stringify(obj, null, 2);
  fs.writeFileSync(path, jsonString);
};
