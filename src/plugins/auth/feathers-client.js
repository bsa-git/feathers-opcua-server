/* eslint-disable no-unused-vars */
const axios = require('axios');
// const feathersClient = require('@feathersjs/client');
// const io = require('socket.io-client');

const io = require('socket.io-client');
const feathersClient = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const rest = require('@feathersjs/rest-client');
const auth = require('@feathersjs/authentication-client');
const localStorage = require('./local-storage');

const debug = require('debug')('app:feathers-client');

const isDebug = true;
const isLog = true;

module.exports = function makeServerClient (options) {
  let { transport, timeout, serverUrl, ioOptions, storage, ifNoAuth } = options;
  transport = transport || 'socketio';
  timeout = timeout || 5000;
  serverUrl = serverUrl || 'http://localhost:3030';
  ioOptions = ioOptions || {};
  storage = storage? storage : localStorage;
  let socket, restClient;

  const appClient = feathersClient();

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
    appClient.configure(auth({
      storage
    }));
  }
  if(isDebug) debug('makeFeathersClient: OK');
  return appClient;
};
