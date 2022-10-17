/* eslint-disable no-unused-vars */
const axios = require('axios');
const feathersClient = require('@feathersjs/client');
const io = require('socket.io-client');
const localStorage = require('./local-storage');
const chalk = require('chalk');

const {
  urlExists
} = require('../lib');

const defaultIoOptions = {
  transports: ['websocket'],
  forceNew: true,
  reconnection: false,
  extraHeaders: {}
};

module.exports = async function makeClient(options) {
  let { transport, timeout, serverUrl, ioOptions, storage, ifNoAuth } = options;
  transport = transport || 'socketio';
  timeout = timeout || 5000;
  serverUrl = serverUrl || 'http://localhost:3030';
  storage = storage ? storage : localStorage;
  ioOptions = ioOptions || defaultIoOptions;
  let socket;

  try {

    await urlExists(serverUrl);

    const appClient = feathersClient();
    switch (transport) {
    case 'socketio':
      socket = io(serverUrl, ioOptions);
      appClient.configure(feathersClient.socketio(socket, { timeout }));
      break;
    case 'rest':
      appClient.configure(feathersClient.rest(serverUrl).axios(axios));
      break;
    default:
      throw new Error(`Invalid transport ${transport}. (makeClient)`);
    }

    if (!ifNoAuth) {
      appClient.configure(feathersClient.authentication({ storage }));
    }
    return appClient;
  } catch (error) {
    throw new Error(`Error while creating client (makeClient): ${error.message}.`);
  }


};