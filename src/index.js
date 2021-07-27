/* eslint-disable no-unused-vars */
const logger = require('./logger');
const chalk = require('chalk');
const app = require('./app');
const seedData = require('./seed-data');
const {
  opcuaBootstrap,
} = require('./plugins/opcua');

// const { localStorage, loginLocal, feathersClient, AuthServer } = require('./plugins/auth');
// const { fakeNormalize } = require('./plugins/test-helpers');

// Get generated fake data
// const fakes = fakeNormalize();
// const fakeUsers = fakes['users'];
// const fakeMessages = fakes['messages'];
// // const idField = AuthServer.getIdField(fakeUsers);
// const AdminFakeUser = fakeUsers[0];
// const guestFakeUser = fakeUsers[1];
// const fakeMessage = fakeMessages[0];


const port = app.get('port');
const server = app.listen(port);
process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise ', p, reason);
  console.log(chalk.red(reason), p);
});

server.on('listening', async () => {
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port);
  logger.info('Feathers application started on env="%s"', app.get('env'));

  // Start seed data
  await seedData(app);
  // Start opcua bootstrap
  await opcuaBootstrap(app);

  // localStorage.clear();
  // let appRestClient = feathersClient({ transport: 'rest', serverUrl: process.env.BASE_URL });
  // // Login
  // await loginLocal(appRestClient, guestFakeUser.email, guestFakeUser.password);
  // let service = appRestClient.service('messages');
  // const msg = await service.create({text: 'Новое сообщение!'});
  // // Logout
  // await appRestClient.logout();

});