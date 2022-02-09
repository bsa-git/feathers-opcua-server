/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../lib');

const {
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
    // Read excel file
    if (params.excelPath) {
      this.workbook = xlsxReadFile(params.excelPath);
      this.worksheet = this.workbook.Sheets[params.sheetName];
    }

    // Read json file
    if (params.jsonPath) {
      this.workbook = xlsxReadJsonFile(params.jsonPath, params.sheetName);
      this.worksheet = this.workbook.Sheets[params.sheetName];
    }

    // Read json data
    if (params.jsonData) {
      this.workbook = xlsxReadJsonData(params.jsonData, params.sheetName);
      this.worksheet = this.workbook.Sheets[params.sheetName];
    }
  }

  readFile(path, sheetName = '') {
    this.workbook = xlsxReadFile(path);
    if (sheetName) {
      this.worksheet = this.workbook.Sheets[sheetName];
    } else {
      this.worksheet = null;
    }
    return this.workbook;
  }

  readJsonFile(path, sheetName) {
    this.workbook = xlsxReadJsonFile(path);
    this.worksheet = this.workbook.Sheets[sheetName];
    return this.workbook;
  }

  readJsonData(jsonData, sheetName) {
    this.workbook = xlsxReadJsonData(jsonData, sheetName);
    this.worksheet = this.workbook.Sheets[sheetName];
    return this.workbook;
  }

  writeFile(path) {
    return xlsxWriteFile(this.workbook, path);
  }

  getCells(sheetName = '') {
    return xlsxGetCells(this.workbook, sheetName);
  }

  sheetToJson(options = { header: 'A' }) {
    return xlsxSheetToJson(this.worksheet, options);
  }

  jsonToSheet(jsonData, sheetName, options = { skipHeader: true }) {
    const worksheet = xlsxJsonToSheet(jsonData, options);
    xlsxBookAppendSheet(this.workbook, worksheet, sheetName);
    this.worksheet = worksheet;
    return this.worksheet;
  }

  sheetAddJson(jsonData, options = {}) {
    this.worksheet = xlsxSheetAddJson(this.worksheet, jsonData, options);
    return this.worksheet;
  }
}



module.exports = XlsxHelperClass;
