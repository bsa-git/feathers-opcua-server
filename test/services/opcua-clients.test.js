const assert = require('assert');
const app = require('../../src/app');

describe('\'opcua-clients\' service', () => {
  it('registered the service', () => {
    const service = app.service('opcua-clients');

    assert.ok(service, 'Registered the service');
  });
});
