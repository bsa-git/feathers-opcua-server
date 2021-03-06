const fileOperations = require('./file-operations');
const netOperations = require('./net-operations');
const arrayOperations = require('./array-operations');
const httpOperations = require('./http-operations');
const util = require('./util');
const typeOf = require('./type-of');

module.exports = Object.assign({},
  fileOperations,
  netOperations,
  arrayOperations,
  httpOperations,
  util,
  typeOf,
);
