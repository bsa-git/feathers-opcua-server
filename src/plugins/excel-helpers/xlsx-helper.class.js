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

    if(!this.workbook){
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
    return sheetName? this.workbook.Sheets[sheetName] : this.worksheet;
  }

  selectSheet(sheetName) {
    this.worksheet = this.getSheet(sheetName);
    return this;
  }

  getCells(sheetName = '') {
    return xlsxGetCells(this.workbook, sheetName);
  }

  sheetToJson(options = { header: 'A' }, sheetName = '') {
    const worksheet = this.getSheet(sheetName);
    return xlsxSheetToJson(worksheet, options);
  }

  jsonToSheet(jsonData, sheetName, options = { skipHeader: true }) {
    const worksheet = xlsxJsonToSheet(jsonData, options);
    xlsxBookAppendSheet(this.workbook, worksheet, sheetName);
    this.worksheet = worksheet;
    return this;
  }

  sheetAddJson(jsonData, options = {}, sheetName = '') {
    const worksheet = this.getSheet(sheetName);
    xlsxSheetAddJson(worksheet, jsonData, options);
    return this;
  }
}



module.exports = XlsxHelperClass;
