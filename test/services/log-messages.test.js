const assert = require('assert');
const app = require('../../src/app');

describe('\'log-messages\' service', () => {
  it('registered the service', () => {
    const service = app.service('log-messages');

    assert.ok(service, 'Registered the service');
  });
});
