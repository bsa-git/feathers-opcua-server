const assert = require('assert');
const app = require('../../src/app');
const { inspector, checkServicesRegistered, saveFakesToServices } = require('../../src/plugins');

const isLog = false;

describe('<<=== Roles Service Test (roles.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'roles');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'roles\' service', async () => {
    const errPath = await saveFakesToServices(app, 'roles');
    const service = app.service('roles');
    const data = await service.find({});
    if (isLog) inspector('Save fake data to \'roles\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });

  it('#3: Error on unique `name`', async () => {
    try {
      const service = app.service('roles');
      await service.create({
        'name': 'Administrator',
        'alias': 'isAdministrator',
        'description': 'Sed sint ea doloribus id quibusdam numquam quaerat.'
      });
      assert.ok(false, 'Error on unique `name`');
    } catch (error) {
      if (isLog) inspector('Error on unique `name`.error', error.message);
      assert.ok(error.message === 'name: Administrator already exists.', 'Error on unique `name`');
      // assert.ok(error.code === 400, 'Error on unique `name`');
      assert.ok(error.name === 'Conflict', 'Error on unique `name`');
    }
  });
});
