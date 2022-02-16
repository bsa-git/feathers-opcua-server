/* eslint-disable no-unused-vars */
const {
  inspector,
} = require('../lib');

const {
  exeljsReadFile,
  exeljsReadJsonFile,
  exeljsReadCsvFile,
  exeljsReadJsonData,
  exeljsWriteFile,
  exeljsWriteCsvFile,
  exeljsCreateBook,
  exeljsSetBookProperties,
  exeljsBookAppendSheet,
  exeljsBookRemoveSheet,
  exeljsGetSheet,
  exeljsGetCells,
  exeljsGetRowCells,
  exeljsGetRowValues,
  exeljsGetColumnCells,
  exeljsGetColumnValues
} = require('./exceljs-helper');

// const XLSX = require('xlsx');

const debug = require('debug')('app:xlsx-helper.class');
const isDebug = false;


class ExceljsHelperClass {

  // Constructor
  constructor(params = {}) {
    this.params = Object.assign({}, params);
    this.workbook = null;
    this.worksheet = null;
  }

  async init() {
    // Read excel file
    if (this.params.excelPath) {
      await this.readFile(this.params.excelPath, this.params.sheetName);
      if(this.params.bookOptions){
        this.setBookProperties(this.params.bookOptions);
      }
    }

    // Read csv file
    if (this.params.csvPath) {
      const csvOptions = this.params.csvOptions ? this.params.csvOptions : {};
      await this.readCsvFile(this.params.csvPath, csvOptions);
      if(this.params.bookOptions){
        this.setBookProperties(this.params.bookOptions);
      }
    }

    if (!this.workbook) {
      this.createBook(this.params.bookOptions);
      if (this.params.sheetName) {
        this.addSheet(this.params.sheetName, this.params.sheetOptions);
      }
    }
  }

  //================= FILE =================//

  // Read from "xlsx" file
  // e.g. const workbook = new Excel.Workbook();
  // e.g. await workbook.xlsx.readFile(filename);
  async readFile(path, sheetName = '') {
    this.workbook = await exeljsReadFile(path);
    this.worksheet = this.getSheet(sheetName);
    return this;
  }

  // Read from "json" file
  // e.g. const workbook = new Excel.Workbook();
  // e.g. await workbook.xlsx.load(data);
  async readJsonFile(path, sheetName = '') {
    this.workbook = await exeljsReadJsonFile(path);
    this.worksheet = this.getSheet(sheetName);
    return this;
  }

  // Read from "json" data
  // e.g. const workbook = new Excel.Workbook();
  // e.g. await workbook.xlsx.load(data);
  async readJsonData(jsonData, sheetName = '') {
    this.workbook = await exeljsReadJsonData(jsonData, sheetName);
    this.worksheet = this.getSheet(sheetName);
    return this;
  }

  // Read from "csv" file
  // e.g. const workbook = new Excel.Workbook();
  // e.g. const worksheet = await workbook.csv.readFile(filename);
  // Read from a file with European Dates
  // e.g. const options = { dateFormats: ['DD/MM/YYYY'], sheetName: 'mySheet' };
  //      const worksheet = await workbook.csv.readFile(filename, options);
  async readCsvFile(path, options = {}) {
    this.workbook = await exeljsReadCsvFile(path, options);
    this.worksheet = this.getSheet();
    return this;
  }

  // Write to "xlsx" file
  // e.g. const workbook = createAndFillWorkbook();
  // e.g. await workbook.xlsx.writeFile(filename);
  async writeFile(path) {
    return await exeljsWriteFile(this.workbook, path);
  }

  // Write to "csv" file
  // e.g. const workbook = createAndFillWorkbook();
  // e.g. await workbook.csv.writeFile(filename);
  // Write to a file with European Date-Times
  // e.g. const workbook = new Excel.Workbook();
  //      const options = { dateFormat: 'DD/MM/YYYY HH:mm:ss', dateUTC: true, // use utc when rendering dates};
  //      await workbook.csv.writeFile(filename, options);
  async writeCsvFile(path, options) {
    return await exeljsWriteCsvFile(this.workbook, path, options);
  }

  //================= WORKBOOK =================//

  // Create a Workbook
  // e.g. const workbook = new ExcelJS.Workbook();
  // Set Workbook Properties
  // e.g. workbook.creator = 'Me';
  //      workbook.lastModifiedBy = 'Her';
  //      workbook.created = new Date(1985, 8, 30);
  //      workbook.modified = new Date();
  //      workbook.lastPrinted = new Date(2016, 9, 27);
  createBook(options) {
    this.workbook = exeljsCreateBook(options);
    if(options){
      this.setBookProperties(options);
    }
  }

  // Set book properties
  // Set Workbook Properties
  // e.g. workbook.creator = 'Me';
  //      workbook.lastModifiedBy = 'Her';
  //      workbook.created = new Date(1985, 8, 30);
  //      workbook.modified = new Date();
  //      workbook.lastPrinted = new Date(2016, 9, 27);
  setBookProperties(options) {
    exeljsSetBookProperties(this.workbook, options);
  }


  //================= SHEET =================//

  // Add a Worksheet
  // e.g. const sheet = workbook.addWorksheet('My Sheet');
  // Create a sheet with red tab colour
  // e.g. const sheet = workbook.addWorksheet('My Sheet', {properties:{tabColor:{argb:'FFC0000'}}});
  // Create a sheet where the grid lines are hidden
  // e.g. const sheet = workbook.addWorksheet('My Sheet', {views: [{showGridLines: false}]});
  // Create a sheet with the first row and column frozen
  // e.g. const sheet = workbook.addWorksheet('My Sheet', {views:[{state: 'frozen', xSplit: 1, ySplit:1}]});
  // Create worksheets with headers and footers
  // e.g. const sheet = workbook.addWorksheet('My Sheet', { headerFooter:{firstHeader: "Hello Exceljs", firstFooter: "Hello World"}});
  // Create new sheet with pageSetup settings for A4 - landscape
  // e.g. const worksheet =  workbook.addWorksheet('My Sheet', { pageSetup:{paperSize: 9, orientation:'landscape'}});
  addSheet(sheetName, options) {
    return exeljsBookAppendSheet(this.workbook, sheetName, options);
  }

  // Use the worksheet id to remove the sheet from workbook.
  // e.g. workbook.removeWorksheet(sheet.id)
  removeSheet(shIdentifier) {
    const worksheet = this.getSheet(shIdentifier);
    exeljsBookRemoveSheet(this.workbook, worksheet.id);
    return this;
  }

  // Access by `worksheets` array
  getSheets() {
    return this.workbook.worksheets;
  }

  // Fetch sheet by name
  // e.g. const worksheet = workbook.getWorksheet('My Sheet');
  // Fetch sheet by id
  // INFO: Be careful when using it!
  // It tries to access to `worksheet.id` field. Sometimes (really very often) workbook has worksheets with id not starting from 1.
  // For instance It happens when any worksheet has been deleted.
  // It's much more safety when you assume that ids are random. And stop to use this function.
  // If you need to access all worksheets in a loop please look to the next example.
  // e.g. const worksheet = workbook.getWorksheet(1);
  // It's important to know that workbook.getWorksheet(1) != Workbook.worksheets[0] and workbook.getWorksheet(1) != Workbook.worksheets[1], 
  // becouse workbook.worksheets[0].id may have any value.
  getSheet(shIdentifier) {
    let sheet = shIdentifier ? exeljsGetSheet(this.workbook, shIdentifier) : this.worksheet;
    if (!sheet) {
      sheet = this.getSheets()[0];
    }
    return sheet;
  }

  // Iterate over all sheets
  // Note: workbook.worksheets.forEach will still work but this is better
  // e.g. workbook.eachSheet(function(worksheet, sheetId) { // ... });
  workbookEachSheet(callback) {
    this.workbook.eachSheet(callback);
  }

  // Select worksheet
  // e.g. this.worksheet = this.getSheet(shIdentifier);
  selectSheet(shIdentifier) {
    this.worksheet = this.getSheet(shIdentifier);
    return this.worksheet;
  }

  // Get worksheet name
  getSheetName(id) {
    return this.getSheet(id).name;
  }

  // Get worksheet Id
  getSheetId(sheetName) {
    return this.getSheet(sheetName).id;
  }

  // Get worksheet state
  getSheetState(shIdentifier) {
    return this.getSheet(shIdentifier).state;
  }

  // Get worksheet properties
  // Worksheets support a property bucket to allow control over some features of the worksheet
  getSheetProperties(shIdentifier) {
    return this.getSheet(shIdentifier).properties;
  }

  // Get worksheet metrics
  getSheetMetrics(shIdentifier) {
    const worksheet = this.getSheet(shIdentifier);
    return {
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount,
      actualRowCount: worksheet.actualRowCount,
      actualColumnCount: worksheet.actualColumnCount
    };
  }

  // Get worksheet page setup
  // All properties that can affect the printing of a sheet are held in a pageSetup object on the sheet.
  getSheetPageSetup(shIdentifier) {
    return this.getSheet(shIdentifier).pageSetup;
  }

  // Get worksheet HeaderFooter
  // Here's how to add headers and footers. The added content is mainly text, such as time, introduction, file information, etc., 
  // and you can set the style of the text. In addition, you can set different texts for the first page and even page.
  getSheetHeaderFooter(shIdentifier) {
    return this.getSheet(shIdentifier).headerFooter;
  }

  // Get worksheet views
  // Worksheets now support a list of views, that control how Excel presents the sheet:
  // - frozen - where a number of rows and columns to the top and left are frozen in place. Only the bottom right section will scroll
  // - split - where the view is split into 4 sections, each semi-independently scrollable.
  getSheetViews(shIdentifier) {
    return this.getSheet(shIdentifier).views;
  }

  // Get worksheet auto filter
  // It is possible to apply an auto filter to your worksheet.
  getSheetAutoFilter(shIdentifier) {
    return this.getSheet(shIdentifier).autoFilter;
  }

  // Conditional formatting allows a sheet to show specific styles, icons, etc depending on cell values or any arbitrary formula
  // Add a checkerboard pattern to A1:E7 based on row + col being even or odd
  // e.g. worksheet.addConditionalFormatting({
  //ref: 'A1:E7',
  //rules: [
  //  {
  //    type: 'expression',
  //    formulae: ['MOD(ROW()+COLUMN(),2)=0'],
  //    style: {fill: {type: 'pattern', pattern: 'solid', bgColor: {argb: 'FF00FF00'}}},
  //  }
  //]
  //})
  addSheetConditionalFormatting(options, shIdentifier) {
    this.getSheet(shIdentifier).addConditionalFormatting(options);
    return this;
  }

  // Worksheets can be protected from modification by adding a password
  // e.g. await worksheet.protect('the-password', options);
  async sheetProtect(password, options, shIdentifier) {
    await this.getSheet(shIdentifier).protect(password, options);
    return this;
  }

  // Worksheet protection can also be removed
  // e.g. worksheet.unprotect();
  sheetUnprotect(shIdentifier) {
    this.getSheet(shIdentifier).unprotect();
    return this;
  }


  //================= COLUMS =================//

  // Add column headers and define column keys and widths
  // Note: these column structures are a workbook-building convenience only,
  // apart from the column width, they will not be fully persisted.
  // e.g. worksheet.columns = [{ header: 'Id', key: 'id', width: 10 }, { header: 'Name', key: 'name', width: 32 }, { header: 'D.O.B.', key: 'DOB', width: 10, outlineLevel: 1 }];
  addColumns(colValues, shIdentifier) {
    this.getSheet(shIdentifier).columns = colValues;
    return this;
  }

  // Add a column of new values
  // e.g. worksheet.getColumn(6).values = [1,2,3,4,5];
  // Add a sparse column of values
  // e.g. worksheet.getColumn(7).values = [,,2,3,,5,,7,,,,11];
  addColumnValues(colValues, colIdentifier, shIdentifier) {
    this.getSheet(shIdentifier).getColumn(colIdentifier).values = colValues;
    return this;
  }

  // Access an individual columns by key, letter and 1-based column number
  // e.g. const idCol = worksheet.getColumn('id');
  // e.g. const nameCol = worksheet.getColumn('B');
  // e.g. const dobCol = worksheet.getColumn(3);
  getColumn(colIdentifier, shIdentifier) {
    return this.getSheet(shIdentifier).getColumn(colIdentifier);
  }

  // Cut one or more columns (columns to the right are shifted left)
  // If column properties have been defined, they will be cut or moved accordingly
  // Known Issue: If a splice causes any merged cells to move, the results may be unpredictable 
  // e.g. worksheet.spliceColumns(3,2);
  // e.g. worksheet.spliceColumns(3, 1, newCol3Values, newCol4Values);
  spliceColumns(args = [], shIdentifier) {
    this.getSheet(shIdentifier).spliceColumns(...args);
    return this;
  }

  //================== ROWS =================//

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
    this.getSheet(shIdentifier).eachRow(callback);
    return this;
  }

  // Get row metrics
  getRowMetric(row) {
    return {
      cellCount: row.cellCount,
      actualCellCount: row.actualCellCount
    };
  }

  // Insert a page break below the row
  addPageBreak(row) {
    row.addPageBreak();
    return this;
  }

  // Commit a completed row to stream
  rowCommit(row) {
    row.commit();
    return this;
  }

  // Add a couple of Rows by key-value, after the last current row, using the column keys
  // e.g. worksheet.addRow({id: 1, name: 'John Doe', dob: new Date(1970,1,1)});
  // Add a row by contiguous Array (assign to columns A, B & C)
  // e.g. worksheet.addRow([3, 'Sam', new Date()]);
  // Add a row by sparse Array (assign to columns A, E & I)
  // e.g. const rowValues = []; rowValues[1] = 4; rowValues[5] = 'Kyle'; rowValues[9] = new Date(); worksheet.addRow(rowValues);
  addRow(rowValues, shIdentifier) {
    this.getSheet(shIdentifier).addRow(rowValues);
    return this;
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

  //================= CELLS =================//

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
    if (Array.isArray(addressRange)) {
      this.getSheet(shIdentifier).mergeCells(...addressRange);
    } else {
      this.getSheet(shIdentifier).mergeCells(addressRange);
    }
    return this;
  }

  // Unmerging the cells breaks the style links
  // e.g. worksheet.unMergeCells('A4');
  // e.g. expect(worksheet.getCell('B5').style).not.toBe(worksheet.getCell('A4').style);
  // e.g. expect(worksheet.getCell('B5').style.font).not.toBe(myFonts.arial);
  unMergeCells(address, shIdentifier) {
    this.getSheet(shIdentifier).unMergeCells(address);
    return this;
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
    return this;
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
    return this;
  }

  // Get cells from all worksheets or from one worksheet
  // [{ worksheetName: 'Report1', address: 'A5', address2: { col: 'A', row: 5 }, value: 1234, 
  // valueType: 'Number', cellType: 'Number', formula: 'C5 + B5', cell: Object, column: Object ... } ... {}]
  // e.g. options -> { includeEmpty: true } | {}
  getCells(sheetName = '', options) {
    return exeljsGetCells(this.workbook, sheetName, options);
  }

  /**
   * Get row cells from all worksheets or from one worksheet
   * e.g. options -> { includeEmpty: true } | { header:'A' } | { header:1 } | {}
   *  e.g. for {header: 'A'}
   * [{ A: '1', B: '2', C: '3', D: '4', E: '5', F: '6', G: '7' },
   *  { A: '2', B: '3', C: '4', D: '5', E: '6', F: '7', G: '8' }]
   * e.g. for {header: 1}
   * [['1', '2', '3', '4', '5', '6', '7'],
   *  ['2', '3', '4', '5', '6', '7', '8' ]]
   * e.g. for {} key1...keyN is column keys
   * [{ key1: 1, key2: 2, key3: 3, key4: 4, key5: 5, key6: 6, key7: 7 },
   *  { key1: 2, key2: 3, key3: 4, key4: 5, key5: 6, key6: 7, key7: 8 } ]
  */
  getRowCells(sheetName = '', options) {
    return exeljsGetRowCells(this.workbook, sheetName, options);
  }

  /**
   * Get row cell values from all worksheets or from one worksheet
   * e.g. options -> { includeEmpty: true } | { header:'A' } | { header:1 } | {}
   *  e.g. for {header: 'A'}
   * [{ A: '1', B: '2', C: '3', D: '4', E: '5', F: '6', G: '7' },
   *  { A: '2', B: '3', C: '4', D: '5', E: '6', F: '7', G: '8' }]
   * e.g. for {header: 1}
   * [['1', '2', '3', '4', '5', '6', '7'],
   *  ['2', '3', '4', '5', '6', '7', '8' ]]
   * e.g. for {} key1...keyN is column keys
   * [{ key1: 1, key2: 2, key3: 3, key4: 4, key5: 5, key6: 6, key7: 7 },
   *  { key1: 2, key2: 3, key3: 4, key4: 5, key5: 6, key6: 7, key7: 8 } ]
  */
  getRowValues(sheetName = '', options) {
    return exeljsGetRowValues(this.workbook, sheetName, options);
  }

  /**
   * Get row cells from all worksheets or from one worksheet
   * e.g. options -> { includeEmpty: true } | { header:'A' } | { header:1 } | {}
   *  e.g. for {header: 'A'}
   * [{ rowIndex1: '11', rowIndex2: '22', rowIndex3: '33', rowIndex4: '44', rowIndex5: '55', rowIndex6: '66', rowIndex7: '77' },
 *  { rowIndex1: '22', rowIndex2: '33', rowIndex3: '44', rowIndex4: '55', rowIndex5: '66', rowIndex6: '77', rowIndex7: '88' }]
 * e.g. for {header: 1}
 * [['11', '22', '33', '44', '55', '66', '77'],
 *  ['22', '33', '44', '55', '66', '77', '88' ]]
 * e.g. for {} key1...keyN is column keys
 * [{ rowIndex1: 11, rowIndex2: 22, rowIndex3: 33, rowIndex4: 44, rowIndex5: 55, rowIndex6: 66, rowIndex7: 77 },
 * { rowIndex1: 22, rowIndex2: 33, rowIndex3: 44, rowIndex4: 55, rowIndex5: 66, rowIndex6: 77, rowIndex7: 88 } ]
  */
  getColumnCells(sheetName = '', options) {
    return exeljsGetColumnCells(this.workbook, sheetName, options);
  }

  /**
   * Get row cell values from all worksheets or from one worksheet
   * e.g. options -> { includeEmpty: true } | { header:'A' } | { header:1 } | {}
   *  e.g. for {header: 'A'}
   * [{ rowIndex1: '11', rowIndex2: '22', rowIndex3: '33', rowIndex4: '44', rowIndex5: '55', rowIndex6: '66', rowIndex7: '77' },
 *  { rowIndex1: '22', rowIndex2: '33', rowIndex3: '44', rowIndex4: '55', rowIndex5: '66', rowIndex6: '77', rowIndex7: '88' }]
 * e.g. for {header: 1}
 * [['11', '22', '33', '44', '55', '66', '77'],
 *  ['22', '33', '44', '55', '66', '77', '88' ]]
 * e.g. for {} key1...keyN is column keys
 * [{ rowIndex1: 11, rowIndex2: 22, rowIndex3: 33, rowIndex4: 44, rowIndex5: 55, rowIndex6: 66, rowIndex7: 77 },
 * { rowIndex1: 22, rowIndex2: 33, rowIndex3: 44, rowIndex4: 55, rowIndex5: 66, rowIndex6: 77, rowIndex7: 88 } ]
  */
  getColumnValues(sheetName = '', options) {
    return exeljsGetColumnValues(this.workbook, sheetName, options);
  }

  //================= TABLE =================//

  // Tables allow for in-sheet manipulation of tabular data.
  // To add a table to a worksheet, define a table model and call addTable:
  // Add a table to a sheet
  // e.g. 
  // ws.addTable({
  // name: 'MyTable',
  // ref: 'A1',
  // headerRow: true,
  // totalsRow: true,
  // style: {
  //  theme: 'TableStyleDark3',
  //  showRowStripes: true,
  // },
  //columns: [
  //  {name: 'Date', totalsRowLabel: 'Totals:', filterButton: true},
  //  {name: 'Amount', totalsRowFunction: 'sum', filterButton: false},
  //],
  //rows: [
  //  [new Date('2019-07-20'), 70.10],
  //  [new Date('2019-07-21'), 70.60],
  //  [new Date('2019-07-22'), 70.10],
  //],
  //});
  addTable(model, shIdentifier) {
    this.getSheet(shIdentifier).addTable(model);
    return this;
  }

  // Get table
  // e.g. const table = ws.getTable('MyTable');
  // Tables support a set of manipulation functions that allow data to be added or removed and some properties to be changed. 
  // Since many of these operations may have on-sheet effects, the changes must be committed once complete.
  // All index values in the table are zero based, so the first row number and first column number is 0.
  getTable(tableName, shIdentifier) {
    return this.getSheet(shIdentifier).getTable(tableName);
  }

  // Commit the table changes into the sheet
  tableCommit(table) {
    table.commit();
    return this;
  }

  // Append new row to bottom of table
  // e.g. table.addRow([new Date('2019-08-10'), 10, 'End']);
  addTableRow(table, rowValues) {
    table.addRow(rowValues);
    return this;
  }

  // Insert new rows at index 5
  // e.g. table.addRow([new Date('2019-08-05'), 5, 'Mid'], 5);
  insertTableRow(table, rowValues, pos) {
    table.addRow(rowValues, pos);
    return this;
  }

  // Remove first two rows
  // e.g. table.removeRows(0, 2);
  removeTableRows(table, startPos, endPos) {
    table.removeRows(startPos, endPos);
    return this;
  }

  // Insert new column (with data) at index 1
  // e.g. table.addColumn({name: 'Letter', totalsRowFunction: 'custom', totalsRowFormula: 'ROW()', totalsRowResult: 6, filterButton: true}, ['a', 'b', 'c', 'd'],  2);
  insertTableColumn(table, colOption, colValues, pos) {
    table.addColumn(colOption, colValues, pos);
    return this;
  }

  // Remove second column
  // e.g. table.removeColumns(1, 1);
  removeTableColumns(table, startPos, endPos) {
    table.removeColumns(startPos, endPos);
    return this;
  }

  // Get Column Wrapper for second column
  // e.g. const column = table.getColumn(1);
  getTableColumn(table, pos) {
    return table.getColumn(pos);
  }

  //================= IMAGE =================//

  // Adding images to a worksheet is a two-step process. First, the image is added to the workbook via the addImage() function which will also return an imageId value. 
  // Then, using the imageId, the image can be added to the worksheet either as a tiled background or covering a cell range.
  // Note: As of this version, adjusting or transforming the image is not supported and images are not supported in streaming mode.

  // Add image to workbook by filename
  // e.g. const imageId1 = workbook.addImage({ filename: 'path/to/image.jpg',  extension: 'jpeg',});
  // Add image to workbook by buffer
  // e.g. const imageId2 = workbook.addImage({ buffer: fs.readFileSync('path/to.image.png'), extension: 'png',});
  // Add image to workbook by base64
  // e.g. const myBase64Image = "data:image/png;base64,iVBORw0KG...";
  //      const imageId2 = workbook.addImage({ base64: myBase64Image, extension: 'png',});
  workbookAddImage(options) {
    return this.workbook.addImage(options);
  }

  // Add image background to worksheet
  // e.g. worksheet.addBackgroundImage(imageId1);
  worksheetAddBackgroundImage(imageId, shIdentifier) {
    this.getSheet(shIdentifier).addBackgroundImage(imageId);
    return this;
  }

  // Add image over a range
  // Using the image id from Workbook.addImage, an image can be embedded within the worksheet to cover a range. 
  // The coordinates calculated from the range will cover from the top-left of the first cell to the bottom right of the second.
  // Insert an image over B2:D6
  // e.g. worksheet.addImage(imageId2, 'B2:D6'); 
  // Using a structure instead of a range string, it is possible to partially cover cells
  // Note that the coordinate system used for this is zero based, so the top-left of A1 will be { col: 0, row: 0 }. 
  // Fractions of cells can be specified by using floating point numbers, e.g. the midpoint of A1 is { col: 0.5, row: 0.5 }
  // Insert an image over part of B2:D6
  // e.g. worksheet.addImage(imageId2, { tl: { col: 1.5, row: 1.5 }, br: { col: 3.5, row: 5.5 }});
  // The cell range can also have the property 'editAs' which will control how the image is anchored to the cell(s) It can have one of the following values
  // e.g. ws.addImage(imageId, { tl: { col: 0.1125, row: 0.4 }, br: { col: 2.101046875, row: 3.4 }, editAs: 'oneCell'});
  // You can add an image to a cell and then define its width and height in pixels at 96dpi
  // e.g. worksheet.addImage(imageId2, { tl: { col: 0, row: 0 }, ext: { width: 500, height: 200 }});
  // You can add an image with hyperlinks to a cell, and defines the hyperlinks in image range.
  // e.g. worksheet.addImage(imageId2, { tl: { col: 0, row: 0 }, ext: { width: 500, height: 200 }, hyperlinks: { hyperlink: 'http://www.somewhere.com', tooltip: 'http://www.somewhere.com' }});
  worksheetAddImage(imageId, addressRange, shIdentifier) {
    this.getSheet(shIdentifier).addImage(imageId, addressRange);
    return this;
  }
}

module.exports = ExceljsHelperClass;
