const assert = require('assert');
const app = require('../../src/app');
const { 
  inspector, 
  appRoot, 
  readJsonFileSync, 
  checkServicesRegistered, 
  saveFakesToServices 
} = require('../../src/plugins');

const isLog = false;

// Get generated fake data
const fakes = readJsonFileSync(`${appRoot}/seeds/fake-data.json`) || {};

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
    let fake;
    try {
      fake = fakes['roles'][0];
      const service = app.service('roles');
      await service.create({
        'name': fake.name,
        'alias': fake.alias,
        'description': fake.description
      });
      assert.ok(false, 'Error on unique `name`');
    } catch (error) {
      if (isLog) inspector('Error on unique `name`.error', error.message);
      assert.ok(true, 'Error on unique `name`');
    }
  });
});
