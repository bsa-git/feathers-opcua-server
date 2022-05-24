/* eslint-disable no-unused-vars */
const assert = require('assert');
const moment = require('moment');

const {
  inspector,
  getStartOfPeriod,
  getEndOfPeriod
} = require('../../src/plugins/lib');

const chalk = require('chalk');

const debug = require('debug')('app:util.test');
const isDebug = false;

describe('<<=== Util: (util.test) ===>>', () => {

  it('util.getStartOfPeriod', () => {
    const dateTime = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    const startOfPeriod = getStartOfPeriod(dateTime, [1, 'months']);
    if(true && startOfPeriod) debug('startOfPeriod:', startOfPeriod, ' for dateTime:', dateTime);
    assert.ok(dateTime >= startOfPeriod, `util.getStartOfPeriod: '${startOfPeriod}' for dateTime: ${dateTime}`);
  });

  it('util.getEndOfPeriod', () => {
    const dateTime = moment().utc().format('YYYY-MM-DDTHH:mm:ss');
    const endOfPeriod = getEndOfPeriod(dateTime, [1, 'months']);
    if(true && endOfPeriod) debug('endOfPeriod:', endOfPeriod, ' for dateTime:', dateTime);
    assert.ok(dateTime <= endOfPeriod, `util.getEndOfPeriod: '${endOfPeriod}' for dateTime: ${dateTime}`);
  });
});
