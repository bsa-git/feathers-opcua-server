/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const {
  inspector,
  appRoot,
  readJsonFileSync,
  checkServicesRegistered,
  saveFakesToServices,
  removeDataFromServices,
  fakeNormalize,
} = require('../../src/plugins');

const {
  getOpcuaTags
} = require('../../src/plugins/opcua');

const {
  createItems,
  findItems,
  findAllItems,
  removeItems
} = require('../../src/plugins/db-helpers');

const {
  localStorage,
  loginLocal,
  feathersClient,
  AuthServer
} = require('../../src/plugins/auth');



// Get generated fake data
const fakes = fakeNormalize();
const fakeUsers = fakes['users'];
const fakeUser = fakeUsers[0];
const idField = AuthServer.getIdField(fakeUser);

const baseUrl = process.env.BASE_URL;

const debug = require('debug')('app:opcua-tags.test');

const isDebug = true;
const isLog = false;

describe('<<=== Opcua-Tags Service Test (opcua-tags.test.js) ===>>', () => {
  it('#1: Registered the service', () => {
    const errPath = checkServicesRegistered(app, 'opcua-tags');
    assert.ok(errPath === '', `Service '${errPath}' not registered`);
  });

  it('#2: Save fake data to \'opcua-tags\' service', async () => {
    const errPath = await saveFakesToServices(app, 'opcuaTags');
    const service = app.service('opcua-tags');
    const data = await service.find({});
    if (isLog) inspector('Save fake data to \'opcua-tags\' service.data[0]', data.data[0]);
    assert.ok(errPath === '' && data, `Not save fakes to services - '${errPath}'`);
  });

  it('#3: Error on unique `browseName`', async () => {
    let fake;
    try {
      fake = fakes['opcuaTags'][0];
      const service = app.service('opcua-tags');
      await service.create({
        'browseName': fake.browseName,
        'displayName': fake.displayName,
        'type': fake.type
      });
      assert.ok(false, 'Error on unique `browseName`');
    } catch (error) {
      if (isLog) inspector('Error on unique `browseName`.error', error.message);
      assert.ok(true, 'Error on unique `browseName`');
    }
  });

  it('#4: Save tags and find tags', async () => {

    // Get opcua tags 
    const opcuaTags = getOpcuaTags();
    if (isLog) inspector('Save tags to \'opcua-tags\' service', opcuaTags);

    if (!opcuaTags.length) return;

    // Remove data from 'opcua-tags' services 
    const removedItems = await removeItems(app, 'opcua-tags');
    assert.ok(removedItems.length, 'Not remove data from services \'opcua-tags\'');

    // Add tags
    const createdItems = await createItems(app, 'opcua-tags', opcuaTags);
    // Find all tags
    const findedItems = await findAllItems(app, 'opcua-tags');
    if (isLog) inspector('Find tags from \'opcua-tags\' service', findedItems);

    assert.ok(findedItems.length === opcuaTags.length, 'Error for test: `Save tags and find tags`');
  });

  describe('<<--- Opcua tags operations for appRestClient --->>', () => {
    let appRestClient, server;
    //----------------------------------------------

    before(function (done) {
      // this.timeout(30000);
      server = app.listen(port);
      server.once('listening', () => {
        setTimeout(async () => {
          localStorage.clear();
          await saveFakesToServices(app, 'users');
          appRestClient = await feathersClient({ transport: 'rest', serverUrl: baseUrl });
          if (isDebug) debug('Done before StartTest!');
          done();
        }, 500);
      });
    });

    after(function (done) {
      // this.timeout(30000);
      server.close();
      setTimeout(() => {
        if (isDebug) debug('Done after EndTest!');
        done();
      }, 500);
    });

    it('#5: Registered the authentication service', () => {
      assert.ok(app.service('authentication'));
    });

    it('#6: Authenticates and find tags from `opcua-tags` service', async () => {
      // Login
      const { accessToken } = await loginLocal(appRestClient, fakeUser.email, fakeUser.password);
      assert.ok(accessToken, 'Created access token for user');

      // Get opcua tags 
      const opcuaTags = getOpcuaTags();
      if (isLog) inspector('Save tags to \'opcua-tags\' service', opcuaTags);

      if (opcuaTags.length) {
        // Remove data from 'opcua-tags' services 
        let removedItems = await removeItems(appRestClient, 'opcua-tags');
        assert.ok(removedItems.length, 'Not remove data from services \'opcua-tags\'');

        // Add tags
        const createdItems = await createItems(appRestClient, 'opcua-tags', opcuaTags);
        // Find all tags
        const findedItems = await findAllItems(appRestClient, 'opcua-tags');
        if (isLog) inspector('Find tags from \'opcua-tags\' service', findedItems);
        assert.ok(findedItems.length === opcuaTags.length, 'Error for test: `Save tags and find tags`');

        // Remove data from 'opcua-tags' services 
        removedItems = await removeItems(appRestClient, 'opcua-tags');
        assert.ok(removedItems.length, 'Not remove data from services \'opcua-tags\'');
      }

      // Logout
      await appRestClient.logout();
    });

  });

});
