/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;

const {
  startListenPort, 
  stopListenPort,
  dnsLookup
} = require('../../src/plugins');

const chalk = require('chalk');

const debug = require('debug')('app:net-operations.test');
const isDebug = false;
const isLog = false;

describe('<<=== NetOperations: (net-operations.test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('DNS - Operations', async () => {
    const dnsInfo = await dnsLookup('m5-0095488.ostchem.com.ua');
    debug('dnsInfo', dnsInfo);
  });
});
