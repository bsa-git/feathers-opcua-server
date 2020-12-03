/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../src/app');
const port = app.get('port') || 3030;
const host = app.get('host') || 'localhost';
const { inspector } = require('../src/plugins');

const io = require('socket.io-client');
const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const socket = io(`http://${host}:${port}`);
const client = feathers();

client.configure(socketio(socket));

const debug = require('debug')('app:test.feathers-client');
const isDebug = false;
const isLog = false;

// Options
let options = {
  action: 'create',
  params: {
    port: 26543, // default - 26543, 26544 (opcua.test), 26545 (opcua.test2)
    serverInfo: { applicationName: 'UA-CHERKASSY-AZOT-M5' },
    buildInfo: { productName: '380-472-00203826-M5' }
  },
  paths: {
    options: '/src/plugins/test-helpers/AddressSpaceTestOptions.json',
    getters: '/src/plugins/test-helpers/opcua-addressspace-getters',
    methods: '/src/plugins/test-helpers/opcua-addressspace-methods',
  }
};

const userInfo = {
  email: 'feathers-client@example.com',
  password: 'supersecret'
};

describe('<<=== Feathers client ===>>', () => {
  let server;

  before(function (done) {
    if (isDebug) debug('before Start!');
    // debug('before Start!');
    server = app.listen(port);
    server.once('listening', () => {
      setTimeout(() => done(), 500);
    });
  });

  after(function (done) {
    if (isDebug) debug('after Start!');
    // debug('after Start!');
    server.close();
    setTimeout(() => done(), 500);
  });

  it('registered the authentication service', () => {
    assert.ok(app.service('authentication'));
  });

  it('registered the users service', () => {
    assert.ok(app.service('users'));
  });

  it('New user: created the service', async () => {
    try {
      const service = client.service('users');
      // inspector('User service:', service);
      assert.ok(service, 'Users: registered the service');

      service.on('created', user => console.log('Created a user', user));

      // service create
      // const newUser = await service.create(userInfo);
      // const newUser = service.create(userInfo);
      // if (isLog) inspector('Created User service:', newUser);
      // inspector('Created User service:', newUser);
      // assert.ok(newUser, 'newUser: created the service');
    } catch (error) {
      assert.ok(false, 'New user: created the service');
    }
  });

  /*
  it('OPC-UA servers: registered the service', () => {
    const opcuaService = client.service('opcua-servers');
    opcuaService.on('created', data => debug('Created a opcuaService', data));
    assert.ok(opcuaService, 'OPC-UA servers: registered the service');
  });

  it('OPC-UA servers: created the service', async () => {
    // const service = client.service('opcua-servers');
    const service = client.service('messages');
    // service create
    // const params = { user: opcuaUser, provider: 'rest', authenticated: true };
    // const opcuaServer = await service.create(options, params);

    // const opcuaServer = await service.create(options);
    const opcuaServer = await service.create({ text: 'werwerwerwe' });
    if (isLog) inspector('created the service:', opcuaServer);
    inspector('created the service:', opcuaServer);

    assert.ok(opcuaServer, 'OPC-UA servers: created the service');
  });
  */

});
