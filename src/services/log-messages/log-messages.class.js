const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.LogMessages = class LogMessages extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.LogMessages = class LogMessages extends feathersMongoose.Service {
  };
}
