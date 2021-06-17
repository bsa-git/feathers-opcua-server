const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.UserTeams = class UserTeams extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.UserTeams = class UserTeams extends feathersMongoose.Service {
  };
}
