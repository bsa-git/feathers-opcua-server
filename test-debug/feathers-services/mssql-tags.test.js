const assert = require('assert');
const app = require('../../src/app');
const { isMyIp } = require('../../src/plugins');
const isTest = isMyIp(['10.60.1.220']) ;

describe('\'mssql-tags\' service', async () => {
  if (!isTest) {
    return;
  }
  // if(isTest){
  it('registered the service', async () => {
    const service = app.service('mssql-tags');

    await service.create({text: 'Привет!'});

    assert.ok(service, 'Registered the service');
  });
  // }
});
