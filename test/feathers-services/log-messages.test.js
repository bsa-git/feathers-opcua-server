/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const {
  inspector,
  canTestRun,
  getPathBasename
} = require('../../src/plugins');

const debug = require('debug')('app:log-messages.test');
const isDebug = false;
const isLog = false;

describe('<<=== Log-Messages Service Test (log-messages.test.js) ===>>', () => {

  const isTest =  canTestRun(getPathBasename(__filename));
  if(!isTest) return;

  it('registered the service', () => {
    const service = app.service('log-messages');

    assert.ok(service, 'Registered the service');
  });

  it('Add  log-message to service', async () => {
    const service = app.service('log-messages');
    const result = await service.create({text: 'Test log-message'});
    console.log('result', result);
    assert.ok(result, 'Add  log-message to service');
  });
});
