const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.UserProfiles = class UserProfiles extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.UserProfiles = class UserProfiles extends feathersMongoose.Service {
  };
}
