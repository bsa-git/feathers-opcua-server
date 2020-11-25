const assert = require('assert');
const app = require('../../src/app');

describe('\'opcua-servers\' service', () => {
  it('registered the service', () => {
    const service = app.service('opcua-servers');

    assert.ok(service, 'Registered the service');
  });
});
