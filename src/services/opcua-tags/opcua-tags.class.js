/* eslint-disable no-unused-vars */
const feathersMongoose = require('feathers-mongoose');
const feathersNedb = require('feathers-nedb');
const { getEnvTypeDB } = require('../../plugins');

if (getEnvTypeDB() === 'nedb') {
  exports.OpcuaTags = class OpcuaTags extends feathersNedb.Service {
  };
}

if (getEnvTypeDB() === 'mongodb') {
  exports.OpcuaTags = class OpcuaTags extends feathersMongoose.Service {
  };
}  

