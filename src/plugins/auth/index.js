const AuthServer = require('./auth-server.class');
const Channel = require('./channel.class');
const localStorage = require('./local-storage');
const loginJwt = require('./login-jwt');
const loginLocal = require('./login-local');
const feathersClient = require('./feathers-client');
const { defineRulesFor, defineAbilitiesFor } = require('./auth-abilities');
module.exports = {
  AuthServer,
  Channel,
  localStorage,
  loginJwt,
  loginLocal,
  feathersClient,
  defineRulesFor,
  defineAbilitiesFor
};
