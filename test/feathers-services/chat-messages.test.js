const assert = require('assert');
const app = require('../../src/app');
const {inspector, checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

const isLog = false;

describe('<<=== Chat-Messages Service Test (chat-messages.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'chat-messages');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'chat-messages\' service', async () => {
    const errPath = await saveFakesToServices(app, 'chatMessages');
    const service = app.service('chat-messages');
    const data = await service.find({});
    if(isLog) inspector('Save fake data to \'chat-messages\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });
});
