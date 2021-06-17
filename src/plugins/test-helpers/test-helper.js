/* eslint-disable no-unused-vars */
const debug = require('debug')('app:test-helper');
const isDebug = false;
let server;

/**
 * @method startListenPort
 * @param {Object} app 
 * @param {Function} done 
 * @param {Number} timeout 
 */
const startListenPort = function (app, done, timeout = 100) {
  if (isDebug) debug('before Start!');
  const port = app.get('port') || 3030;
  server = app.listen(port);
  process.on('unhandledRejection', (reason, p) =>
    console.error('Unhandled Rejection at: Promise ', p, reason)
  );
  server.once('listening', () => {
    setTimeout(() => done(), timeout);
  });
};

/**
 * @method stopListenPort
 * @param {Object} app 
 * @param {Function} done 
 * @param {Number} timeout 
 */
const stopListenPort = function (done, timeout = 100) {
  if (isDebug) debug('after Start!');
  server.close();
  setTimeout(() => done(), timeout);
};

module.exports = {
  startListenPort,
  stopListenPort
};
