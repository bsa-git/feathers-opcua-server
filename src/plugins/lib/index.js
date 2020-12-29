const fileOperations = require('./file-operations');
const util = require('./util');
const typeOf = require('./type-of');

module.exports = Object.assign({},
  fileOperations,
  util,
  typeOf,
);
