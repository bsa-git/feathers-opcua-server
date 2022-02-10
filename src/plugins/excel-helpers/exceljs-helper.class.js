/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../lib');

const {
  exeljsReadFile,
  exeljsWriteFile,
  exeljsCreateBook,
  exeljsBookAppendSheet,
  exeljsBookRemoveSheet,
  exeljsGetSheet,
  exeljsGetCells,
} = require('./exceljs-helper');

// const XLSX = require('xlsx');

const debug = require('debug')('app:xlsx-helper.class');
const isDebug = false;


class ExceljsHelperClass {

  // Constructor
  constructor(params = {}) {
    // Read excel file
    if (params.excelPath) {
      this.readFile(params.excelPath);
    }

    // Read json file
    // if (params.jsonPath) {
    //   this.workbook = xlsxReadJsonFile(params.jsonPath, params.sheetName);
    //   this.worksheet = this.workbook.Sheets[params.sheetName];
    // }

    // Read json data
    // if (params.jsonData) {
    //   this.workbook = xlsxReadJsonData(params.jsonData, params.sheetName);
    //   this.worksheet = this.workbook.Sheets[params.sheetName];
    // }

    if (!this.workbook) {
      this.workbook = exeljsCreateBook();
    }
  }

  readFile(path, sheetName = '') {
    this.workbook = exeljsReadFile(path);
    if (sheetName) {
      this.worksheet = this.workbook.getWorksheet(sheetName);
    } else {
      this.worksheet = null;
    }
    return this.workbook;
  }

  // readJsonFile(path, sheetName) {
  //   this.workbook = xlsxReadJsonFile(path);
  //   this.worksheet = this.workbook.Sheets[sheetName];
  //   return this.workbook;
  // }

  // readJsonData(jsonData, sheetName) {
  //   this.workbook = xlsxReadJsonData(jsonData, sheetName);
  //   this.worksheet = this.workbook.Sheets[sheetName];
  //   return this.workbook;
  // }

  writeFile(path) {
    return exeljsWriteFile(this.workbook, path);
  }

  addSheet(sheetName, options) {
    return exeljsBookAppendSheet(this.workbook, sheetName, options);
  }

  removeSheet(shIdentifier) {
    const worksheet = this.getSheet(shIdentifier)
    exeljsBookRemoveSheet(this.workbook, worksheet.id);
  }

  getSheet(shIdentifier) {
    return shIdentifier ? exeljsGetSheet(this.workbook, shIdentifier) : this.worksheet;
  }

  getSheetName(id) {
    return this.getSheet(id).name;
  }

  getSheetId(sheetName) {
    return this.getSheet(sheetName).id;
  }

  getSheetState(shIdentifier) {
    return this.getSheet(shIdentifier).state;
  }

  getSheetProperties(shIdentifier) {
    return this.getSheet(shIdentifier).properties;
  }

  getSheetMetrics(shIdentifier) {
    const worksheet = this.getSheet(shIdentifier);
    return {
      rowCount: worksheet.rowCount,
      actualRowCount: worksheet.actualRowCount,
      columnCount: worksheet.columnCount,
      actualColumnCount: worksheet.actualColumnCount
    };
  }

  getSheetPageSetup(shIdentifier) {
    return this.getSheet(shIdentifier).pageSetup;
  }

  getSheetHeaderFooter(shIdentifier) {
    return this.getSheet(shIdentifier).headerFooter;
  }

  getSheetViews(shIdentifier) {
    return this.getSheet(shIdentifier).views;
  }

  getSheetAutoFilter(shIdentifier) {
    return this.getSheet(shIdentifier).autoFilter;
  }

  getColumns(shIdentifier) {
    return this.getSheet(shIdentifier).columns;
  }

  getColumn(colIdentifier, shIdentifier) {
    return this.getSheet(shIdentifier).getColumn(colIdentifier);
  }

  // Iterate over all current cells in this column
  // e.g. callback(cell, rowNumber) { console.log('Cell ' + rowNumber + ' = ' + JSON.stringify(cell.value)); }
  // e.g. options -> { includeEmpty: true }
  columnEachCell(column, callback, options) {
    if (options) {
      column.eachCell(options, callback);
    } else {
      column.eachCell(callback);
    }
  }

  // cut one or more columns (columns to the right are shifted left)
  // If column properties have been defined, they will be cut or moved accordingly
  // Known Issue: If a splice causes any merged cells to move, the results may be unpredictable 
  // e.g. worksheet.spliceColumns(3,2);
  // e.g. worksheet.spliceColumns(3, 1, newCol3Values, newCol4Values);
  sheetSpliceColumns(args = [], shIdentifier) {
    return this.getSheet(shIdentifier).spliceColumns(...args);
  }

  // Get multiple row objects. If it doesn't already exist, new empty ones will be returned
  // e.g. const rows = worksheet.getRows(5, 2); // start, length (>0, else undefined is returned)
  // e.g. args = [5, 2]
  getRows(args = [], shIdentifier) {
    return this.getSheet(shIdentifier).getRows(...args);
  }

  // Get a row object. If it doesn't already exist, a new empty one will be returned
  // e.g. const row = worksheet.getRow(5);
  getRow(rowIndex, shIdentifier) {
    return this.getSheet(shIdentifier).getRow(rowIndex);
  }

  // Get the last editable row in a worksheet (or undefined if there are none)
  // e.g. const row = worksheet.lastRow;
  getLastRow(shIdentifier) {
    return this.getSheet(shIdentifier).lastRow;
  }

  // Iterate over all rows that have values in a worksheet
  // e.g. callback(row, rowNumber) { console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values)); }
  sheetEachRow(callback, shIdentifier) {
    return this.getSheet(shIdentifier).eachRow(callback);
  }

  // Iterate over all non-null cells in a row
  // e.g. callback(cell, colNumber) { console.log('Cell ' + colNumber + ' = ' + cell.value); }
  // e.g. options -> { includeEmpty: true }
  rowEachCell(row, callback, options) {
    if (options) {
      row.eachCell(options, callback);
    } else {
      row.eachCell(callback);
    }
  }

  // Get row metrics
  getRowMetric(row) {
    return {
      cellCount: row.cellCount,
      actualCellCount: row.actualCellCount
    };
  }

  // Add a couple of Rows by key-value, after the last current row, using the column keys
  // e.g. worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
  // Add a row by contiguous Array (assign to columns A, B & C)
  // e.g. worksheet.addRow([3, 'Sam', new Date()]);
  // Add a row by sparse Array (assign to columns A, E & I)
  // e.g. const rowValues = []; rowValues[1] = 4; rowValues[5] = 'Kyle'; rowValues[9] = new Date(); worksheet.addRow(rowValues);
  addRow(rowValues, shIdentifier) {
    this.getSheet(shIdentifier).addRow(rowValues);
  }

  // Add a row with inherited style
  // This new row will have same style as last row
  // And return as row object
  // e.g. const newRow = worksheet.addRow(rowValues, 'i');
  addInheritedRow(rowValues, shIdentifier) {
    return this.getSheet(shIdentifier).addRow(rowValues, 'i');
  }

  // Add new rows and return them as array of row objects
  // e.g. const rows = [[5,'Bob',new Date()], {id:6, name: 'Barbara', dob: new Date()}];
  // e.g. const newRows = worksheet.addRows(rows);
  addRows(rowValues, shIdentifier) {
    return this.getSheet(shIdentifier).addRow(rowValues);
  }

  // Add an array of rows with inherited style
  // These new rows will have same styles as last row
  // and return them as array of row objects
  // e.g. const newRowsStyled = worksheet.addRows(rows, 'i');
  addInheritedRows(rowValues, shIdentifier) {
    return this.getSheet(shIdentifier).addRow(rowValues, 'i');
  }

  // Insert a couple of Rows by key-value, shifting down rows every time
  // e.g. worksheet.insertRow(1, {id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
  // e.g. worksheet.insertRow(1, {id: 2, name: 'Jane Doe', dob: new Date(1965,1,7)});
  // Insert a row by contiguous Array (assign to columns A, B & C)
  // e.g. worksheet.insertRow(1, [3, 'Sam', new Date()]);
  // Insert a row by sparse Array (assign to columns A, E & I)
  // e.g. var rowValues = []; rowValues[1] = 4; rowValues[5] = 'Kyle'; rowValues[9] = new Date();
  // Insert new row and return as row object
  // e.g. const insertedRow = worksheet.insertRow(1, rowValues);
  insertRow(pos, rowValues, shIdentifier) {
    return this.getSheet(shIdentifier).insertRow(pos, rowValues);
  }

  // Insert a row, with inherited style
  // This new row will have same style as row on top of it
  // And return as row object
  // e.g. const insertedRowInherited = worksheet.insertRow(1, rowValues, 'i');
  // Insert a row, keeping original style
  // This new row will have same style as it was previously
  // And return as row object
  // e.g. const insertedRowOriginal = worksheet.insertRow(1, rowValues, 'o');
  insertInheritedRow(pos, rowValues, style, shIdentifier) {
    return this.getSheet(shIdentifier).insertRow(pos, rowValues, style);
  }

  // Insert an array of rows, in position 1, shifting down current position 1 and later rows by 2 rows
  // e.g. var rows = [[5,'Bob',new Date()], {id:6, name: 'Barbara', dob: new Date()}];
  // insert new rows and return them as array of row objects
  // e.g. const insertedRows = worksheet.insertRows(1, rows);
  insertRows(pos, rowValues, shIdentifier) {
    return this.getSheet(shIdentifier).insertRows(pos, rowValues);
  }

  // Insert an array of rows, with inherited style
  // These new rows will have same style as row on top of it
  // And return them as array of row objects
  // e.g. const insertedRowsInherited = worksheet.insertRows(1, rows, 'i');
  // Insert an array of rows, keeping original style
  // These new rows will have same style as it was previously in 'pos' position
  // e.g. const insertedRowsOriginal = worksheet.insertRows(1, rows, 'o');
  insertInheritedRows(pos, rowValues, style, shIdentifier) {
    return this.getSheet(shIdentifier).insertRows(pos, rowValues, style);
  }

  // Get cell
  // e.g. const cell = worksheet.getCell('C3');
  // Query a cell's type
  // expect(cell.type).toEqual(Excel.ValueType.Date);
  // Use string value of cell
  // e.g. myInput.value = cell.text;
  // Use html-safe string for rendering...
  // e.g. const html = '<div>' + cell.html + '</div>';
  getCell(address, shIdentifier) {
    return this.getSheet(shIdentifier).getCell(address);
  }

  // Merge a range of cells
  // e.g. worksheet.mergeCells('A4:B5');
  // ... merged cells are linked
  // e.g. worksheet.getCell('B5').value = 'Hello, World!';
  // e.g. expect(worksheet.getCell('B5').value).toBe(worksheet.getCell('A4').value);
  // e.g. expect(worksheet.getCell('B5').master).toBe(worksheet.getCell('A4'));
  // ... merged cells share the same style object
  // e.g. expect(worksheet.getCell('B5').style).toBe(worksheet.getCell('A4').style);
  // e.g. worksheet.getCell('B5').style.font = myFonts.arial;
  // e.g. expect(worksheet.getCell('A4').style.font).toBe(myFonts.arial);
  // Merge by top-left, bottom-right
  // e.g. worksheet.mergeCells('K10', 'M12');
  // Merge by start row, start column, end row, end column (equivalent to K10:M12)
  // e.g. worksheet.mergeCells(10,11,12,13);
  mergeCells(addressRange, shIdentifier) {
    if(Array.isArray(addressRange)) {
      this.getSheet(shIdentifier).mergeCells(...addressRange);
    } else {
      this.getSheet(shIdentifier).mergeCells(addressRange);
    }
  }

  // Unmerging the cells breaks the style links
  // e.g. worksheet.unMergeCells('A4');
  // e.g. expect(worksheet.getCell('B5').style).not.toBe(worksheet.getCell('A4').style);
  // e.g. expect(worksheet.getCell('B5').style.font).not.toBe(myFonts.arial);
  unMergeCells(address, shIdentifier) {
    return this.getSheet(shIdentifier).unMergeCells(address);
  }

  getCells(sheetName = '') {
    return exeljsGetCells(this.workbook, sheetName);
  }

  // sheetToJson(options = { header: 'A' }) {
  //   return xlsxSheetToJson(this.worksheet, options);
  // }

  // jsonToSheet(jsonData, sheetName, options = { skipHeader: true }) {
  //   const worksheet = xlsxJsonToSheet(jsonData, options);
  //   xlsxBookAppendSheet(this.workbook, worksheet, sheetName);
  //   this.worksheet = worksheet;
  //   return this.worksheet;
  // }

  // sheetAddJson(jsonData, options = {}) {
  //   this.worksheet = xlsxSheetAddJson(this.worksheet, jsonData, options);
  //   return this.worksheet;
  // }
}



module.exports = ExceljsHelperClass;
