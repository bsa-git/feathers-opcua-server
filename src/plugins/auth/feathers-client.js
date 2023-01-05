/* eslint-disable no-unused-vars */
const axios = require('axios');
const io = require('socket.io-client');
const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const rest = require('@feathersjs/rest-client');
const auth = require('@feathersjs/authentication-client');
const localStorage = require('./local-storage');

const chalk = require('chalk');

const {
  inspector,
  urlExists
} = require('../lib');

const debug = require('debug')('app:feathers-client');

const isDebug = false;
const isLog = false;

module.exports = async function feathersClient(options) {
  let { transport, timeout, serverUrl, ioOptions, storage, ifNoAuth } = options;
  transport = transport || 'socketio';
  timeout = timeout || 50000;
  serverUrl = serverUrl || 'http://localhost:3030';
  ioOptions = ioOptions || {};
  storage = storage ? storage : localStorage;
  let socket, restClient, appClient = null;

  try {
    await urlExists(serverUrl);
    appClient = feathers();
    switch (transport) {
    case 'socketio':
      socket = io(serverUrl, ioOptions);
      appClient.configure(socketio(socket, { timeout }));
      break;
    case 'rest':
      restClient = rest(serverUrl);
      appClient.configure(restClient.axios(axios));
      break;
    default:
      throw new Error(`Invalid transport ${transport}. (makeServerClient`);
    }

    if (!ifNoAuth) {
      appClient.configure(auth({ timeout, storage }));
    }
    if (isDebug) debug('makeFeathersClient: OK');
  } catch (error) {
    console.log(chalk.red('error:'), 'feathers-client.serverUrl:', chalk.cyan(`${error.message}!`));
    throw new Error(`Error: "${error.message}" while creating the FeathersClient for transport: ${transport}.`);
  }
  return appClient;
};
