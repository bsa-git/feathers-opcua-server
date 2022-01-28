/* eslint-disable no-unused-vars */
const loRound = require('lodash/round');
const loForEach = require('lodash/forEach');
const loIsFinite = require('lodash/isFinite');

const debug = require('debug')('app:array-operations');


//---------------- SORT -------------//

/**
 * @method sortByStringField
 * sort array by string field
 * @param items {Array}
 * @param name {String}
 * @param isAscending {Boolean}
 * @returns {Array}
 */
const sortByStringField = function (items, name, isAscending = true) {
  items.sort((x, y) => {
    let textA = x[name].toLocaleUpperCase();
    let textB = y[name].toLocaleUpperCase();
    if (isAscending) return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    if (!isAscending) return (textA < textB) ? 1 : (textA > textB) ? -1 : 0;
  });
  return items;
};

/**
 * @method sortByNumberField
 * sort array by number field
 * @param items {Array}
 * @param name {String}
 * @param isAscending {Boolean}
 * @returns {Array}
 */
const sortByNumberField = function (items, name, isAscending = true) {
  items.sort((x, y) => {
    if (isAscending) return x[name] - y[name];
    if (!isAscending) return y[name] - x[name];
  });
  return items;
};

/**
 * @method sortByString
 * sort array by string
 * @param items {Array}
 * @param isAscending {Boolean}
 * @returns {Array}
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
 * @param items {Array}
 * @param isAscending {Boolean}
 * @returns {Array}
 */
const sortByNumber = function (items, isAscending = true) {
  items.sort((x, y) => {
    if (isAscending) return x - y;
    if (!isAscending) return y - x;
  });
  return items;
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
 * @param {String} keyName 
 * @param {String} valueName 
 * @returns {Object}
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
 * @method splitStr2StrNum
 * @param {String} str 
 * e.g. -> AB12345
 * @returns {Array}
 * e.g. -> ['AB', 12345]
 */
const splitStr2StrNum = function (str) {
  let result = [], _str = '', _num = '' ;
  for (let value of str) {
    if(Number.isNaN(Number.parseInt(value))) {
      _str = _str + value; 
    } else {
      _num = _num + value;
    }
  }
  result.push(_str);
  result.push(Number.parseInt(_num));
  return result;
};


module.exports = {
  sortByStringField,
  sortByNumberField,
  sortByString,
  sortByNumber,
  getGroupsFromArray,
  convertArray2Object,
  splitStr2StrNum
};
