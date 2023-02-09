/* eslint-disable no-unused-vars */
const logger = require('./logger');
const chalk = require('chalk');
const app = require('./app');
const seedData = require('./seed-data');

const {
  opcuaBootstrap,
} = require('./plugins/opcua');

const port = app.get('port');
const server = app.listen(port);
process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise %s, %s', reason, p);
  console.log(chalk.red(reason), p);
});

server.on('listening', async () => {
  logger.info('===================================================================');
  logger.info('Feathers application started at on http://%s:%d', app.get('host'), port);
  logger.info('Feathers application started on env=%s', app.get('env'));

  // Start seed data
  await seedData(app);
  // Start opcua bootstrap
  await opcuaBootstrap(app);
});