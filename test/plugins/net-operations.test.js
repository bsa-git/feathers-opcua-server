/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;

const {
  startListenPort, 
  stopListenPort,
  getHostname,
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
    const hostName = getHostname();
    const dnsInfo = await dnsLookup(hostName);
    debug('dnsInfo', dnsInfo);
  });
});
