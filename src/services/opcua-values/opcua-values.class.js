const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.OpcuaValues = class OpcuaValues extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.OpcuaValues = class OpcuaValues extends feathersMongoose.Service {
  };
}
