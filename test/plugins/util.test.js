/* eslint-disable no-unused-vars */
const assert = require('assert');
const moment = require('moment');


const {
  inspector,
  getStartOfPeriod,
  getEndOfPeriod,
  getStartEndOfPeriod,
  getRangeStartEndOfPeriod,
  isDeepEqual,
  isDeepStrictEqual,
  objectHash,
  objectHashKeys,
  objectHashMD5,
  objectHashKeysMD5,
  objectHashWriteToStream
} = require('../../src/plugins/lib');

const {
  getIdField
} = require('../../src/plugins/db-helpers');

const chalk = require('chalk');
const loOmit = require('lodash/omit');

const debug = require('debug')('app:util.test');
const isDebug = false;

const object1 = {
  'browseName': 'CH_M51_ACM::ValueFromFile',
  'displayName': 'Значения из файла для CH_M51_ACM',
  'ownerName': 'CH_M51_ACM',
  'type': 'variable.simple',
  'dataType': 'String',
  'hist': 1,
  'store': {
    'numberOfValuesInDoc': [1, 'years'],
    'numberOfDocsForTag': [5, 'years']
  },
  'group': true,
  'subscription': 'onChangedGroupHandlerForASM',
  'variableGetType': 'valueFromSource',
  'getter': 'getterAcmDayValueFromFile',
  'getterParams': {
    'isTest': true,
    'path': 'test/data/tmp/ch-m5acm_1',
    'toPath': 'test/data/tmp/excel-helper',
    'fromFile': 'test/data/excel/acm/acmDayReport.xls',
    'pointID': 1,
    'interval': 30000,
    'excelMappingFrom': {
      'rangeData': 'B6:F29',
      'rangeDate': 'A1:A1',
      'headerNames': ['23QN2O', '23QN2O_CORR', '23FVSG', '23FVSG_CORR', '23F105_IS']
    }
  }
};

const object2 = {
  '_id': { '$oid': '628cc6e4f048302428ce888b' },
  'browseName': 'CH_M51_ACM::ValueFromFile',
  'displayName': 'Значения из файла для CH_M51_ACM',
  'type': 'variable.simple',
  'ownerName': 'CH_M51_ACM',
  'dataType': 'String',
  'hist': 1,
  'store': {
    'numberOfValuesInDoc': [1, 'years'],
    'numberOfDocsForTag': [5, 'years']
  },
  'group': true,
  'subscription': 'onChangedGroupHandlerForASM',
  'variableGetType': 'valueFromSource',
  'getter': 'getterAcmDayValueFromFile',
  'getterParams': {
    'path': 'test/data/tmp/ch-m5acm_1',
    'isTest': true,
    'toPath': 'test/data/tmp/excel-helper',
    'fromFile': 'test/data/excel/acm/acmDayReport.xls',
    'pointID': 1,
    'interval': 30000,
    'excelMappingFrom': {
      'rangeData': 'B6:F29',
      'rangeDate': 'A1:A1',
      'headerNames': ['23QN2O', '23QN2O_CORR', '23FVSG', '23FVSG_CORR', '23F105_IS']
    }
  },
  'createdAt': {
    '$date': '2022-05-24T11:52:04.787Z'
  },
  'updatedAt': {
    '$date': '2022-05-24T11:52:04.787Z'
  },
  '__v': 0
};

describe('<<=== Util: (util.test) ===>>', () => {

  it('util.getStartOfPeriod', () => {
    const dateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss');
    const startOfPeriod = getStartOfPeriod(dateTime, [1, 'months']);
    if (isDebug && startOfPeriod) debug('startOfPeriod:', startOfPeriod, ' for dateTime:', dateTime);
    assert.ok(dateTime >= startOfPeriod, `util.getStartOfPeriod: '${startOfPeriod}' for dateTime: ${dateTime}`);
  });

  it('util.getEndOfPeriod', () => {
    const dateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss');
    const endOfPeriod = getEndOfPeriod(dateTime, [1, 'months']);
    if (isDebug && endOfPeriod) debug('endOfPeriod:', endOfPeriod, ' for dateTime:', dateTime);
    assert.ok(dateTime <= endOfPeriod, `util.getEndOfPeriod: '${endOfPeriod}' for dateTime: ${dateTime}`);
  });

  it('util.getStartEndOfPeriod to forward', () => {
    const dateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss');
    const startEndOfPeriod = getStartEndOfPeriod(dateTime, [5, 'years']);
    if (isDebug && startEndOfPeriod) debug('util.getStartEndOfPeriod to forward:', startEndOfPeriod, ' for dateTime:', dateTime);
    assert.ok(dateTime <= startEndOfPeriod[1], `util.getStartEndOfPeriod to forward: '${getStartEndOfPeriod}' for dateTime: ${dateTime}`);
  });

  it('util.getStartEndOfPeriod to back', () => {
    let dateTime = moment.utc().subtract(4, 'years').format('YYYY-MM-DDTHH:mm:ss');
    const startEndOfPeriod = getStartEndOfPeriod(dateTime, [5, 'years']);
    if (isDebug && startEndOfPeriod) debug('util.getStartEndOfPeriod to back:', startEndOfPeriod, ' for dateTime:', dateTime);
    assert.ok(dateTime <= startEndOfPeriod[1], `util.getStartEndOfPeriod to back: '${getStartEndOfPeriod}' for dateTime: ${dateTime}`);
  });

  it('util.getRangeStartEndOfPeriod to forward', () => {
    const dateTime = moment.utc().format('YYYY-MM-DDTHH:mm:ss');
    const range = getRangeStartEndOfPeriod(dateTime, [5, 'years'], 'year');
    if (true && range) debug('util.getRangeStartEndOfPeriod to forward:', range, ' for dateTime:', dateTime);
    assert.ok(range.length, `util.getRangeStartEndOfPeriod to forward: '${range}' for dateTime: ${dateTime}`);
  });

  it('util.getRangeStartEndOfPeriod to back', () => {
    const dateTime = moment.utc().subtract(4, 'years').format('YYYY-MM-DDTHH:mm:ss');
    const range = getRangeStartEndOfPeriod(dateTime, [5, 'years'], 'year');
    if (true && range) debug('util.getRangeStartEndOfPeriod to back:', range, ' for dateTime:', dateTime);
    assert.ok(range.length, `util.getRangeStartEndOfPeriod to back: '${range}' for dateTime: ${dateTime}`);
  });

  it('util.isDeepEqual', () => {
    const idField = getIdField(object2);
    const omit = [idField, 'createdAt', 'updatedAt', '__v'];
    let equalTags = isDeepEqual(object1, object2, omit);
    assert.ok(equalTags, 'util.isDeepEqual must be a "TRUE" when comparing two objects: "object1" and "object2"');
  });

  it('util.isDeepStrictEqual', () => {
    const idField = getIdField(object2);
    const omit = [idField, 'createdAt', 'updatedAt', '__v'];
    const result = isDeepStrictEqual(object1, object2, omit);
    assert.ok(result.isDeepStrictEqual && result.isDeepEqual, 'util.isDeepStrictEqual must be a "TRUE" when comparing two objects: "object1" and "object2"');
  });

  it('util.objectHash', () => {
    let result1 = objectHash({ foo: 'bar', a: 42 });
    let result2 = objectHash({ a: 42, foo: 'bar' });
    if (isDebug && result1 && result2) debug(`objectHash.result1: '${result1}'; objectHash.result2: '${result2}';`);
    result1 = objectHash(['5baf17d1c0d7beac7ceaabf49e67fd577c899e3c', 'b1df740247202296415822536e2aaab09cb56b26']);
    result2 = objectHash(['0e25850d69cec8081b89158d63c4c23b43ba6757', '9c154ec649afa2b0246162df485125d61019b2df']);
    if (isDebug && result1 && result2) debug(`objectHash.result1: '${result1}'; objectHash.result2: '${result2}';`);
    assert.ok(result1 && result2, 'util.objectHash must be a "TRUE" for two objects: "object1" and "object2"');
  });

  it('util.objectHash2', () => {
    const idField = getIdField(object2);
    const omits = [idField, 'createdAt', 'updatedAt', '__v'];
    const result1 = objectHash(object1);
    const result2 = objectHash(loOmit(object2, omits));
    if (isDebug && result1 && result2) debug(`objectHash.result1: '${result1}'; objectHash.result2: '${result2}';`);
    assert.ok(result1 === result2, 'util.objectHash must be a "TRUE" when comparing two objects: "object1" and "object2"');
  });

  it('util.objectHashKeys', () => {
    const idField = getIdField(object2);
    const omits = [idField, 'createdAt', 'updatedAt', '__v'];
    const result1 = objectHashKeys(object1);
    const result2 = objectHashKeys(loOmit(object2, omits));
    if (isDebug && result1 && result2) debug(`objectHashKeys.result1: '${result1}'; objectHashKeys.result2: '${result2}';`);
    assert.ok(result1 === result2, 'util.objectHashKeys must be a "TRUE" when comparing keys for two objects: "object1" and "object2"');
  });

  it('util.objectHashMD5', () => {
    const idField = getIdField(object2);
    const omits = [idField, 'createdAt', 'updatedAt', '__v'];
    const result1 = objectHashMD5(object1);
    const result2 = objectHashMD5(loOmit(object2, omits));
    if (isDebug && result1 && result2) debug(`objectHashMD5.result1: '${result1}'; objectHashMD5.result2: '${result2}';`);
    assert.ok(result1 === result2, 'util.objectHashMD5 must be a "TRUE" when comparing two objects: "object1" and "object2"');
  });

  it('util.objectHashKeysMD5', () => {
    const idField = getIdField(object2);
    const omits = [idField, 'createdAt', 'updatedAt', '__v'];
    const result1 = objectHashKeysMD5(object1);
    const result2 = objectHashKeysMD5(loOmit(object2, omits));
    if (isDebug && result1 && result2) debug(`objectHashKeysMD5.result1: '${result1}'; objectHashKeysMD5.result2: '${result2}';`);
    assert.ok(result1 === result2, 'util.objectHashKeysMD5 must be a "TRUE" when comparing keys for two objects: "object1" and "object2"');
  });

  it('util.objectHashWriteToStream', () => {
    objectHashWriteToStream({ foo: 'bar', a: 42 }, process.stdout, { respectType: false });
    assert.ok(true, 'util.objectHashWriteToStream');
  });
});
