const fileOperations = require('./file-operations');
const netOperations = require('./net-operations');
const arrayOperations = require('./array-operations');
const httpOperations = require('./http-operations');
const httpHelpers = require('./http-helpers');
const langHelpers = require('./lang-helpers');
const util = require('./util');
const typeOf = require('./type-of');
const colors = require('./colors');
const Queue = require('./queue.class');

module.exports = Object.assign({},
  fileOperations,
  netOperations,
  arrayOperations,
  httpOperations,
  httpHelpers,
  langHelpers,
  util,
  typeOf,
  colors,
  { Queue }
);
