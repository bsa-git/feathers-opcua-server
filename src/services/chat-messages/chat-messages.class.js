const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.ChatMessages = class ChatMessages extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.ChatMessages = class ChatMessages extends feathersMongoose.Service {
  };
}  
