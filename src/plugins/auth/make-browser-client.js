
const axios = require('axios');
const feathersClient = require('@feathersjs/client');
const io = require('socket.io-client');
const primus = require('@feathersjs/primus');
const localStorage = require('./local-storage');

const defaultIoOptions = {
  transports: ['websocket'],
  forceNew: true,
  reconnection: false,
  extraHeaders: {}
};

const defaultPrimusOptions = {
  transformer: 'ws'
};

module.exports = function makeClient (options) {
  let { transport, timeout, serverUrl, ioOptions, primusOptions, ifNoAuth } = options;
  transport = transport || 'socketio';
  timeout = timeout || 45000;
  serverUrl = serverUrl || 'http://localhost:3030';
  ioOptions = ioOptions || defaultIoOptions;
  primusOptions = primusOptions || defaultPrimusOptions;
  let socket;

  const appClient = feathersClient();

  switch (transport) {
  case 'socketio':
    socket = io(serverUrl, ioOptions);
    appClient.configure(feathersClient.socketio(socket, { timeout }));
    break;
  case 'primus':
    appClient.configure(primus(primusOptions ));
    break;
  case 'rest':
    appClient.configure(feathersClient.rest(serverUrl).axios(axios));
    break;
  default:
    throw new Error(`Invalid transport ${transport}. (makeClient`);
  }

  if (!ifNoAuth) {
    appClient.configure(feathersClient.authentication({
      storage: localStorage
    }));
  }

  return appClient;
};
