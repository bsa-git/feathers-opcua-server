const xlsxHelper = require('./xlsx-helper');
const XlsxHelperClass = require('./xlsx-helper.class');
const exceljsHelper = require('./exceljs-helper');

module.exports = Object.assign({},
  xlsxHelper,
  exceljsHelper,
  { XlsxHelperClass }
);