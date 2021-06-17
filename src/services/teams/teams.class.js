const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.Teams = class Teams extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.Teams = class Teams extends feathersMongoose.Service {
  };
}
