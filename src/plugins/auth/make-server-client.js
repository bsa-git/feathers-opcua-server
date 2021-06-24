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
const { Console } = require('winston/lib/winston/transports');

const defaultIoOptions = {
  transports: ['websocket'],
  // forceNew: true,
  // reconnection: false,
  // extraHeaders: {}
};

module.exports = function makeServerClient (options) {
  let { transport, timeout, serverUrl, ioOptions, ifNoAuth } = options;
  transport = transport || 'socketio';
  timeout = timeout || 5000;
  serverUrl = serverUrl || 'http://localhost:3030';
  ioOptions = ioOptions || {};
  let socket, restClient;

  const appClient = feathersClient();

  switch (transport) {
  case 'socketio':
    socket = io(serverUrl, ioOptions);
    // socket = io(serverUrl);
    // appClient.configure(feathersClient.socketio(socket, { timeout }));
    appClient.configure(socketio(socket, { timeout }));
    // appClient.configure(socketio(socket));
    break;
  case 'rest':
    restClient = rest(serverUrl);
    // appClient.configure(feathersClient.rest(serverUrl).axios(axios));
    appClient.configure(restClient.axios(axios));
    break;
  default:
    throw new Error(`Invalid transport ${transport}. (makeServerClient`);
  }

  if (!ifNoAuth) {
    appClient.configure(auth({
      storage: localStorage
    }));
  }
  console.log('makeServerClient: OK');
  return appClient;
};
