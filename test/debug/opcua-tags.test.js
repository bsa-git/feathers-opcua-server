/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');

describe('\'opcua-tags\' service', () => {
  it('registered the service', () => {
    const service = app.service('opcua-tags');

    assert.ok(service, 'Registered the service');
  });
});
