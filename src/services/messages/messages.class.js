const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.Messages = class Messages extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.Messages = class Messages extends feathersMongoose.Service {
  };
}
