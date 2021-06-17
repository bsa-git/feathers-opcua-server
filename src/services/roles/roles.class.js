const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.Roles = class Roles extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.Roles = class Roles extends feathersMongoose.Service {
  };
}
