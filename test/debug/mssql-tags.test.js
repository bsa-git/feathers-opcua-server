/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const { startListenPort, stopListenPort, getPathBasename, canTestRun } = require('../../src/plugins');
const debug = require('debug')('app:mssql-tags.test');

const isDebug = false;

const fileName = getPathBasename(__filename);
const isTest = canTestRun(fileName);

describe('\'mssql-tags\' service', async () => {

  if (!isTest) {
    return;
  }

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done, 3000);
  });

  it('registered the service', async () => {
    const service = app.service('mssql-tags');

    // await service.create({text: 'Привет!'});

    assert.ok(service, 'Registered the service');
  });
});
