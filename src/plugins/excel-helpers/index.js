const xlsxHelper = require('./xlsx-helper');
const XlsxHelperClass = require('./xlsx-helper.class');
const exceljsHelper = require('./exceljs-helper');
const ExceljsHelperClass = require('./exceljs-helper.class');

module.exports = Object.assign({},
  xlsxHelper,
  exceljsHelper,
  { 
    XlsxHelperClass,
    ExceljsHelperClass
  }
);