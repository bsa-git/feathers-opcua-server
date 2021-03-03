const assert = require('assert');
const app = require('../../src/app');

describe('\'mssql-tags\' service', () => {
  it('registered the service', () => {
    const service = app.service('mssql-tags');

    service.create({text: 'Привет!'});

    assert.ok(service, 'Registered the service');
  });
});
