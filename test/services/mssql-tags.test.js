const assert = require('assert');
const app = require('../../src/app');

describe('\'mssql-tags\' service', () => {
  it('registered the service', () => {
    const service = app.service('mssql-tags');

    assert.ok(service, 'Registered the service');
  });
});
