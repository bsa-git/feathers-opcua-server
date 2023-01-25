/* eslint-disable no-unused-vars */
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');
const loIsFinite = require('lodash/isFinite');
const loFindIndex = require('lodash/findIndex');
const loIsString = require('lodash/isString');
const loIsPlainObject = require('lodash/isPlainObject');
const loRange = require('lodash/range');
const loOrderBy = require('lodash/orderBy');

const {
  inspector,
} = require('./util');

const debug = require('debug')('app:array-operations');
const isDebug = false;

const excelColumns = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'AA', 'AB', 'AC', 'AD', 'AE', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AK', 'AL', 'AM', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AV', 'AW', 'AX', 'AY', 'AZ',
  'BA', 'BB', 'BC', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BK', 'BL', 'BM', 'BN', 'BO', 'BP', 'BQ', 'BR', 'BS', 'BT', 'BU', 'BV', 'BW', 'BX', 'BY', 'BZ',
  'CA', 'CB', 'CC', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ', 'CK', 'CL', 'CM', 'CN', 'CO', 'CP', 'CQ', 'CR', 'CS', 'CT', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
];

//---------------- SORT -------------//

/**
 * @method sortByStringField
 * sort array by string field
 * @param {Object[]} items
 * @param {String} name
 * @param {Boolean} isAscending
 * @returns {Object[]}
 */
const sortByStringField = function (items, name, isAscending = true) {
  if (Array.isArray(items) && items.length) {
    items.sort((x, y) => {
      if (x[name] !== undefined && loIsString(x[name]) && y[name] !== undefined && loIsString(y[name])) {
        let textA = x[name].toLocaleUpperCase();
        let textB = y[name].toLocaleUpperCase();
        if (isAscending) return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        if (!isAscending) return (textA < textB) ? 1 : (textA > textB) ? -1 : 0;
      } else {
        return 0;
      }
    });
  }
  return items;
};

/**
 * @method sortByNumberField
 * sort array by number field
 * @param {Object[]} items
 * @param {String} name
 * @param {Boolean} isAscending
 * @returns {Object[]}
 */
const sortByNumberField = function (items, name, isAscending = true) {
  if (Array.isArray(items) && items.length) {
    items.sort((x, y) => {
      if (isAscending) return x[name] - y[name];
      if (!isAscending) return y[name] - x[name];
    });
  }
  return items;
};

/**
 * @method sortByString
 * sort array by string
 * @param {String[]} items
 * @param {Boolean} isAscending
 * @returns {String[]}
 */
const sortByString = function (items, isAscending = true) {
  items.sort((x, y) => {
    let textA = x.toLocaleUpperCase();
    let textB = y.toLocaleUpperCase();
    if (isAscending) return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    if (!isAscending) return (textA < textB) ? 1 : (textA > textB) ? -1 : 0;
  });
  return items;
};

/**
 * @method sortByNumber
 * sort array by number field
 * @param {Number[]} items
 * @param {Boolean} isAscending
 * @returns {Number[]}
 */
const sortByNumber = function (items, isAscending = true) {
  items.sort((x, y) => {
    if (isAscending) return x - y;
    if (!isAscending) return y - x;
  });
  return items;
}; // loOrderBy

/**
 * This metod allows specifying the sort orders of the iteratees to sort by. 
 * If orders is unspecified, all values are sorted in ascending order. 
 * Otherwise, specify an order of "desc" for descending or "asc" for ascending sort order of corresponding values.
 * @method orderByItems
 * sort array by number field
 * @param {Array|Object} items // The collection to iterate over.
 * e.g var users = [
  { 'user': 'fred',   'age': 48 },
  { 'user': 'barney', 'age': 34 },
  { 'user': 'fred',   'age': 40 },
  { 'user': 'barney', 'age': 36 }
];
 * @param {Array[]|Function[]|Object[]|string[]} iteratees // The iteratees to sort by
 * e.g. ['user', 'age']
 * @param {String[]} orders // The sort orders of iteratees
 * e.g. ['asc', 'desc']
 * @returns {Array} // Returns the new sorted array.
 */
const orderByItems = function (items, iteratees, orders) {
  return loOrderBy(items, iteratees, orders);
};

//---------------- ARRAY -------------//

/**
 * @method getGroupsFromArray
 * @param {Array} array 
 * e.g. [1,2,3,4,5,6]
 * @param {Number} minCount 
 * e.g. 2
 * @returns {Array}
 * e.g. [[1,2], [3,4], [5,6]]
 */
const getGroupsFromArray = function (array = [], minCount = 10) {
  let grArray = [], start, end;
  const loDivide = require('lodash/divide'); // Divide two numbers
  const loCeil = require('lodash/ceil'); // Computes number rounded up to precision
  const loSlice = require('lodash/slice'); // Creates a slice of array from start up to, but not including, end
  const countOfGroups = loCeil(loDivide(array.length, minCount));

  for (let index = 0; index < countOfGroups; index++) {
    start = index * minCount;
    end = start + minCount;
    grArray.push(loSlice(array, start, end));
  }
  return grArray;
};

/**
 * @method convertArray2Object
 * @param {Object[]} array 
 * e.g. [{TagName: '12N2O', Value: 12.234},..,{TagName: '12HNO3', Value: 15.112345}]
 * @param {String} keyName 
 * e.g. keyName -> 'TagName'
 * @param {String} valueName
 * e.g. valueName -> 'Value' 
 * @returns {Object}
 * e.g. {'12N2O': 12.234, '12HNO3': 15.112}
 * 
 */
const convertArray2Object = function (array, keyName, valueName) {
  let rows = {};
  loForEach(array, row => {
    const value = row[valueName];
    rows[row[keyName]] = loIsFinite(value) ? loRound(row[valueName], 3) : value;
  });
  return rows;
};

/**
 * @method convertObject2Array
 * @param {Object[]} array 
 * e.g. [{'12N2O': 12.234, '12HNO3': 15.112},..,{'12N2O': 13.134, '12HNO3': 14.512}]
 * @returns {Object}
 * e.g. {'12N2O': [12.234, 13.134], '12HNO3': [15.112, 14.512]}
 * 
 */
const convertObject2Array = function (array) {
  let rows = {};
  loForEach(array, row => {
    loForEach(row, function (value, key) {
      if (!rows[key]) rows[key] = [];
      value = loIsFinite(value) ? loRound(value, 3) : value;
      rows[key].push(value);
    });
  });
  return rows;
};

/**
 * @method splitStr2StrNum
 * @param {String} str 
 * e.g. -> AB12345
 * @returns {Array}
 * e.g. -> ['AB', 12345]
 */
const splitStr2StrNum = function (str) {
  let result = [], _str = '', _num = '';
  for (let value of str) {
    if (Number.isNaN(Number.parseInt(value))) {
      _str = _str + value;
    } else {
      _num = _num + value;
    }
  }
  result.push(_str);
  result.push(Number.parseInt(_num));
  return result;
};

/**
 * @method getLetter4Index
 * @param {Number} index 
 * e.g. -> AB12345
 * @returns {String}
 * e.g. -> index = 1 -> 'A'....
 */
const getLetter4Index = function (index) {
  return excelColumns[index];
};

/**
 * @method getIndex4Letter
 * @param {String} letter 
 * e.g. -> 'AB'
 * @returns {String}
 * e.g. -> letter = 'AB' -> 28 ....
 */
const getIndex4Letter = function (letter) {
  return loFindIndex(excelColumns, item => item === letter);
};

/**
 * @method getIndex4Range
 * @param {String} range 
 * e.g. -> 'B11:C34'
 * @returns {Object}
 * e.g. -> range = 'B11:C34' -> { start: { col: 2, row: 11 }, end: { col: 3, row: 34 } }
 * e.g. -> range = 'B11' -> { start: { col: 2, row: 11 } }
 */
const getIndex4Range = function (range) {
  let ranges, start, end;
  //------------------
  // 'B11:C34'->['B11', 'C34']
  ranges = range.split(':');
  // 'B11'->['B', 11]
  start = splitStr2StrNum(ranges[0]);
  // 'B'-> 2
  start = { col: getIndex4Letter(start[0]), row: start[1] };
  if (ranges.length === 2) {
    // 'C34'->['C', 34]
    end = splitStr2StrNum(ranges[1]);
    // 'C'-> 3
    end = { col: getIndex4Letter(end[0]), row: end[1] };
  }
  return end ? { start, end } : { start };
};

/**
 * Creates an array of numbers (positive and/or negative) progressing from start up to, but not including, end
 * @method getRangeArray
 * @param {Number} end    // The end of the range
 * @param {Number} start  // The start of the range
 * @param {Number} step   // The value to increment or decrement by
 * @returns {Number[]}
 * e.g. _.range(4) => [0, 1, 2, 3]
 * e.g. _.range(-4) => [0, -1, -2, -3]
 * e.g. _.range(1, 5) => [1, 2, 3, 4]
 * e.g. _.range(0, 20, 5) => [0, 5, 10, 15]
 * e.g. _.range(0, -4, -1) => [0, -1, -2, -3]
 * e.g. _.range(1, 4, 0) => [1, 1, 1]
 */
const getRangeArray = function (end, start = 0, step = 1) {
  return loRange(start, end, step);
};

/**
 * @method removeEmptyValFromArray
 * @param {Array} initialArray 
 * e.g. -> [empty, 1, null, empty, 0]
 * @returns {Array}
 * e.g. -> [1, null, 0]
 */
const removeEmptyValFromArray = function (initialArray) {
  let newArray = [];
  //------------------------------
  for (let index = 0; index <= initialArray.length; index++) {
    const item = initialArray[index];
    if (item === undefined) continue;
    newArray.push(item);
  }
  return newArray;
};

/**
 * @method removeDuplicatedValFromArray
 * @param {Array} initialArray 
 * e.g. -> [{a:12, b:56}, {a:12, b:89}]
 * e.g. -> [1,2,3,1,5,3]
 * @param {String} itemProp 
 * e.g. -> 'a'
 * e.g. -> ''
 * @returns {Array}
 * e.g. -> [{a:12, b:56}]
 * e.g. -> [1,2,3,5]
 */
const removeDuplicatedValFromArray = function (initialArray, itemProp) {
  let newArray = [], items = [];
  //------------------------------
  if(!Array.isArray(initialArray)) return initialArray; 
  for (let index = 0; index <= initialArray.length; index++) {
    const item = initialArray[index];
    if(item === undefined) continue;
    if(!newArray.length) {
      newArray.push(item);
      continue;
    }
    if(itemProp && loIsPlainObject(item) && item[itemProp] !== undefined) {
      items = newArray.filter(v => v[itemProp] === item[itemProp]);
    } else {
      items = newArray.filter(v => v === item);
    }
    if (items.length) continue;
    newArray.push(item);
  }
  return newArray;
};

/**
 * @method convertRangeArray
 * @param {Array[]} initialArray
 * e.g. [empty, [empty, 1, 2]]
 * @param {String} targetStartRange 
 * e.g. initialStartRange -> 'A1'
 * e.g. targetStartRange -> 'B1'
 * @returns {Array[]}
 * e.g. targetArray -> [empty, [empty, empty, 1, 2]]
 */
const shiftRowRangeArray = function (initialArray, targetStartRange) {
  let newRangeArray = [], newColArray = [], countColArray = 0, startRow, startCol;
  //---------------------------------------
  // e.g. -> indexRange = 'B1' -> { start: { col: 2, row: 1 } }
  const indexRange = getIndex4Range(targetStartRange);
  startRow = indexRange.start.row;
  startCol = indexRange.start.col;
  if (isDebug && initialArray.length) inspector(`shiftRowRangeArray(${targetStartRange}).initialArray(${initialArray.length}):`, initialArray);
  initialArray = removeEmptyValFromArray(initialArray);
  for (let rowIndex = startRow; rowIndex < initialArray.length + startRow; rowIndex++) {
    let colArray = initialArray[rowIndex - startRow];
    newColArray = [];
    colArray = removeEmptyValFromArray(colArray);
    countColArray = colArray.length;
    for (let colIndex = startCol; colIndex < countColArray + startCol; colIndex++) {
      const valueCell = colArray[colIndex - startCol];
      newColArray[colIndex] = valueCell;
    }
    newRangeArray[rowIndex] = newColArray;
  }
  if (isDebug && newRangeArray.length) inspector(`shiftRowRangeArray(${targetStartRange}).newRangeArray(${newRangeArray.length}):`, newRangeArray);
  return newRangeArray;
};

/**
 * @method convertRowRangeArray
 * @param {Array[]} initialArray 
 * e.g. [empty, [empty, '1:0:0',..., true]]
 * @param {Array} columnsConfig
 * e.g. [{}, { header: 'Time', key: 'time', width: 20 },...,{ header: 'IsWorking', key: 'isWorking', width: 12 }] 
 * @returns {Array[]}
 * e.g. [empty, {time: '1:0:0',..., isWorking: true}]
 */
const convertRowRangeArray = function (initialArray = [], columnsConfig = []) {
  let newColObject, keyColumn, newRangeArray = [];
  //------------------------------------
  newRangeArray = newRangeArray.concat(initialArray);
  for (let rowIndex = 0; rowIndex < initialArray.length; rowIndex++) {
    let colArray = initialArray[rowIndex];
    if (colArray === undefined) continue;
    newColObject = {};
    for (let colIndex = 0; colIndex < colArray.length; colIndex++) {
      const valueCell = colArray[colIndex];
      if (valueCell === undefined) continue;
      const columnConfig = columnsConfig[colIndex - 1];
      if (columnConfig) {
        keyColumn = columnConfig.key;
        newColObject[keyColumn] = valueCell;
      }
    }
    newRangeArray[rowIndex] = newColObject;
  }
  return newRangeArray;
};

/**
 * @method shiftColRangeArray
 * @param {Array[]} initialArray
 * e.g. [empty, [empty, 1, 2]]
 * @param {String} targetStartRange 
 * e.g. initialStartRange -> 'A1'
 * e.g. targetStartRange -> 'B1'
 * @returns {Array[]}
 * e.g. targetArray -> [empty, empty, [empty, 1, 2]]
 */
const shiftColRangeArray = function (initialArray, targetStartRange) {
  let newRangeArray = [], newRowArray = [], countRowArray = 0, startRow, startCol;
  //---------------------------------------
  // e.g. -> indexRange = 'B1' -> { start: { col: 2, row: 1 } }
  const indexRange = getIndex4Range(targetStartRange);
  startRow = indexRange.start.row;
  startCol = indexRange.start.col;
  if (isDebug && initialArray.length) inspector(`shiftColRangeArray(${targetStartRange}).initialArray(${initialArray.length}):`, initialArray);
  initialArray = removeEmptyValFromArray(initialArray);
  for (let colIndex = startCol; colIndex < initialArray.length + startCol; colIndex++) {
    newRowArray = [];
    let rowArray = initialArray[colIndex - startCol];
    rowArray = removeEmptyValFromArray(rowArray);
    countRowArray = rowArray.length;
    for (let rowIndex = startRow; rowIndex < countRowArray + startRow; rowIndex++) {
      const valueCell = rowArray[rowIndex - startRow];
      newRowArray[rowIndex] = valueCell;
    }
    newRangeArray[colIndex] = newRowArray;
  }
  if (isDebug && newRangeArray.length) inspector(`shiftColRangeArray(${targetStartRange}).newRangeArray(${newRangeArray.length}):`, newRangeArray);
  return newRangeArray;
};


module.exports = {
  sortByStringField,
  sortByNumberField,
  sortByString,
  sortByNumber,
  orderByItems,
  getRangeArray,
  getGroupsFromArray,
  convertArray2Object,
  convertObject2Array,
  splitStr2StrNum,
  getLetter4Index,
  getIndex4Letter,
  getIndex4Range,
  removeEmptyValFromArray,
  removeDuplicatedValFromArray,
  shiftRowRangeArray,
  shiftColRangeArray,
  convertRowRangeArray
};
