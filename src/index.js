/* eslint-disable no-console */
const logger = require('./logger');
const chalk = require('chalk');
const app = require('./app');
const { opcuaBootstrap, isTrue } = require('./plugins');

const port = app.get('port');
const server = app.listen(port);
process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise ', p, reason);
  console.log(chalk.red(reason), p);
});

server.on('listening', () => {
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port);
  logger.info('Feathers application started on env="%s"', app.get('env'));
});

// Run opcuaBootstrap
if (isTrue(process.env.OPCUA_BOOTSTRAP_ENABLE)) {
  Promise.resolve(opcuaBootstrap(app));
}