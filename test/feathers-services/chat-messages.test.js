const assert = require('assert');
const app = require('../../src/app');
const {checkServicesRegistered, saveFakesToServices} = require('../../src/plugins');

describe('<<=== Chat-Messages Service Test (chat-messages.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'chat-messages');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'chat-messages\' service', async () => {
    const errPath = await saveFakesToServices(app, 'chatMessages');
    assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
  });
});
