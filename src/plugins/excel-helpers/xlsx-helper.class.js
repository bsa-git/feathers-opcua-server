/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../lib');

const {
  xlsxCreateBook,
  xlsxReadFile,
  xlsxReadJsonFile,
  xlsxReadJsonData,
  xlsxWriteFile,
  xlsxGetCells,
  xlsxJsonToSheet,
  xlsxSheetAddJson,
  xlsxSheetToJson,
  xlsxBookAppendSheet,
  xlsxGetWorksheetRef
} = require('./xlsx-helper');

// const XLSX = require('xlsx');

const debug = require('debug')('app:xlsx-helper.class');
const isDebug = false;


class XlsxHelperClass {

  // Constructor
  constructor(params = {}) {
    this.workbook = null;
    this.worksheet = null;
    // Read excel file
    if (params.excelPath) {
      this.readFile(params.excelPath, params.sheetName);
    }

    // Read json file
    if (params.jsonPath) {
      this.readJsonFile(params.jsonPath, params.sheetName);
    }

    // Read json data
    if (params.jsonData) {
      this.readJsonData(params.jsonData, params.sheetName);
    }

    if (!this.workbook) {
      this.workbook = xlsxCreateBook();
    }
  }

  readFile(path, sheetName = '') {
    this.workbook = xlsxReadFile(path);
    this.worksheet = this.getSheet(sheetName);
    return this;
  }

  readJsonFile(path, sheetName) {
    this.workbook = xlsxReadJsonFile(path, sheetName);
    this.worksheet = this.getSheet(sheetName);
    return this;
  }

  readJsonData(jsonData, sheetName) {
    this.workbook = xlsxReadJsonData(jsonData, sheetName);
    this.worksheet = this.getSheet(sheetName);
    return this;
  }

  writeFile(path) {
    return xlsxWriteFile(this.workbook, path);
  }

  getSheets() {
    return this.workbook.Sheets;
  }

  getSheet(sheetName = '') {
    return sheetName ? this.workbook.Sheets[sheetName] : this.worksheet;
  }

  selectSheet(sheetName) {
    this.worksheet = this.getSheet(sheetName);
    return this;
  }

  // A-1 based range representing the sheet range. 
  // Functions that work with sheets should use this parameter to determine the range. 
  // Cells that are assigned outside of the range are not processed. 
  // In particular, when writing a sheet by hand, cells outside of the range are not included
  getSheetRef(sheetName) {
    const worksheet = this.getSheet(sheetName);
    return xlsxGetWorksheetRef(worksheet);
  }

  
  // Converts a worksheet object to an array of JSON objects.
  // XLSX.utils.sheet_to_json generates different types of JS objects. The function takes an options argument
  // e.g. XLSX.utils.sheet_to_json(ws); -> [{ S: 1, h: 2, e: 3, e_1: 4, t: 5, J: 6, S_1: 7 }, { S: 2, h: 3, e: 4, e_1: 5, t: 6, J: 7, S_1: 8 }]
  // e.g. XLSX.utils.sheet_to_json(ws, {header:'A', range: 'B11:C34'}); -> 
  //  [{ A: 'S', B: 'h', C: 'e', D: 'e', E: 't', F: 'J', G: 'S' },
  //  { A: '1', B: '2', C: '3', D: '4', E: '5', F: '6', G: '7' },
  //  { A: '2', B: '3', C: '4', D: '5', E: '6', F: '7', G: '8' }]
  // e.g. XLSX.utils.sheet_to_json(ws, {header:["A","E","I","O","U","6","9"]}); -> 
  // [{ '6': 'J', '9': 'S', A: 'S', E: 'h', I: 'e', O: 'e', U: 't' },
  //  { '6': '6', '9': '7', A: '1', E: '2', I: '3', O: '4', U: '5' },
  //  { '6': '7', '9': '8', A: '2', E: '3', I: '4', O: '5', U: '6' }] 
  // e.g. XLSX.utils.sheet_to_json(ws, {header:1}); -> 
  // [[ 'S', 'h', 'e', 'e', 't', 'J', 'S' ],
  //  [ '1', '2', '3', '4', '5', '6', '7' ],
  //  [ '2', '3', '4', '5', '6', '7', '8' ]]
  // Example showing the effect of raw
  // e.g. ws['A2'].w = "3";                          // set A2 formatted string value
  // e.g. XLSX.utils.sheet_to_json(ws, {header:1, raw:false}); -> 
  // [[ 'S', 'h', 'e', 'e', 't', 'J', 'S' ],
  //  [ '3', '2', '3', '4', '5', '6', '7' ],     // <-- A2 uses the formatted string
  //  [ '2', '3', '4', '5', '6', '7', '8' ]]
  // e.g. XLSX.utils.sheet_to_json(ws, {header:1}); -> 
  // [[ 'S', 'h', 'e', 'e', 't', 'J', 'S' ],
  //  [ 1, 2, 3, 4, 5, 6, 7 ],                   // <-- A2 uses the raw value
  //  [ 2, 3, 4, 5, 6, 7, 8 ]] 
  sheetToJson(sheetName = '', options = {}) {
    const defaultOpts = { header: 'A' };
    const opts = Object.assign(defaultOpts, options);
    const worksheet = this.getSheet(sheetName);
    return xlsxSheetToJson(worksheet, opts);
  }

  // Converts an array of JS objects to a worksheet
  // The json_to_sheet utility function walks an array of JS objects in order, generating a worksheet object. 
  // By default, it will generate a header row and one row per object in the array. 
  // The optional opts argument has settings to control the column order and header output
  // The original sheet cannot be reproduced using plain objects since JS object keys must be unique. 
  // After replacing the second e and S with e_1 and S_1
  // e.g var ws = XLSX.utils.json_to_sheet([
  //  { S:1, h:2, e:3, e_1:4, t:5, J:6, S_1:7 }, 
  //  { S:2, h:3, e:4, e_1:5, t:6, J:7, S_1:8 }], 
  //  {header:["S","h","e","e_1","t","J","S_1"]});
  // Alternatively, the header row can be skipped
  // e.g var ws = XLSX.utils.json_to_sheet([
  // { A:"S", B:"h", C:"e", D:"e", E:"t", F:"J", G:"S" }, 
  // { A: 1,  B: 2,  C: 3,  D: 4,  E: 5,  F: 6,  G: 7  }, 
  // { A: 2,  B: 3,  C: 4,  D: 5,  E: 6,  F: 7,  G: 8  }], 
  // {header:["A","B","C","D","E","F","G"], skipHeader:true});
  jsonToSheet(jsonData, sheetName, options = {}) {
    const defaultOpts = { skipHeader: true };
    const opts = Object.assign(defaultOpts, options);
    const worksheet = xlsxJsonToSheet(jsonData, opts);
    xlsxBookAppendSheet(this.workbook, worksheet, sheetName);
    this.worksheet = worksheet;
    return this;
  }

  // Adds an array of JS objects to an existing worksheet
  // Write data starting at A2
  // e.g. XLSX.utils.sheet_add_json(ws, [{ A: 1, B: 2 }, { A: 2, B: 3 }, { A: 3, B: 4 }], {skipHeader: true, origin: "A2"});
  // Write data starting at E2
  // e.g XLSX.utils.sheet_add_json(ws, [{ A: 5, B: 6, C: 7 }, { A: 6, B: 7, C: 8 }, { A: 7, B: 8, C: 9 }], {skipHeader: true, origin: { r: 1, c: 4 }, header: [ "A", "B", "C" ]});
  // Append row
  // e.g. XLSX.utils.sheet_add_json(ws, [{ A: 4, B: 5, C: 6, D: 7, E: 8, F: 9, G: 0 }], {header: ["A", "B", "C", "D", "E", "F", "G"], skipHeader: true, origin: -1});
  sheetAddJson(jsonData, sheetName = '', options = {}) {
    const defaultOpts = { skipHeader: true, origin: -1 };
    const opts = Object.assign(defaultOpts, options);
    const worksheet = this.getSheet(sheetName);
    xlsxSheetAddJson(worksheet, jsonData, opts);
    return this;
  }

  // Get cells from workbook
  // e.g. options -> { range: 'B11:C34' } | {}
  getCells(sheetName = '', options = {}) {
    return xlsxGetCells(this.workbook, sheetName, options);
  }
}



module.exports = XlsxHelperClass;
