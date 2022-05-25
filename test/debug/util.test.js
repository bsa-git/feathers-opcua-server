/* eslint-disable no-unused-vars */
const assert = require('assert');
const moment = require('moment');

const {
  inspector,
  getStartOfPeriod,
  getEndOfPeriod,
  isDeepEqual,
  isDeepStrictEqual
} = require('../../src/plugins/lib');

const {
  getIdField
} = require('../../src/plugins/db-helpers');

const chalk = require('chalk');

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
  'getter': 'acmDayValueFromFile',
  'getterParams': {
    'isTest': true,
    'path': 'test/data/tmp/ch-m5acm_1',
    'toPath': 'test/data/tmp/excel-helper',
    'fromFile': 'test/data/excel/asmDayReport.xls',
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
  'getter': 'acmDayValueFromFile',
  'getterParams': {
    'path': 'test/data/tmp/ch-m5acm_1',
    'isTest': true,
    'toPath': 'test/data/tmp/excel-helper',
    'fromFile': 'test/data/excel/asmDayReport.xls',
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
    const dateTime = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    const startOfPeriod = getStartOfPeriod(dateTime, [1, 'months']);
    if (true && startOfPeriod) debug('startOfPeriod:', startOfPeriod, ' for dateTime:', dateTime);
    assert.ok(dateTime >= startOfPeriod, `util.getStartOfPeriod: '${startOfPeriod}' for dateTime: ${dateTime}`);
  });

  it('util.getEndOfPeriod', () => {
    const dateTime = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    const endOfPeriod = getEndOfPeriod(dateTime, [1, 'months']);
    if (true && endOfPeriod) debug('endOfPeriod:', endOfPeriod, ' for dateTime:', dateTime);
    assert.ok(dateTime <= endOfPeriod, `util.getEndOfPeriod: '${endOfPeriod}' for dateTime: ${dateTime}`);
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
});
