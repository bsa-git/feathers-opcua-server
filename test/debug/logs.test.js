/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

const {
  inspector,
  getPathBasename
} = require('../../src/plugins');

const debug = require('debug')('app:logs.test');
const isDebug = false;
const isLog = false;

describe('<<=== Logs Service Test (logs.test.js) ===>>', () => {
  
  it('registered the service', () => {
    const service = app.service('logs');
    assert.ok(service, 'Registered the service');
  });

  it('Add  log-message to service', async () => {
    const service = app.service('logs');
    const result = await service.create({text: 'Test log-message'});
    console.log('result', result);
    assert.ok(result, 'Added  log-message to service');
  });
});
