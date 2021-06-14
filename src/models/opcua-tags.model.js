/* eslint-disable no-unused-vars */
// opcua-tags-model.js - A mongoose model
// 
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
const NeDB = require('nedb');
const path = require('path');
const { getEnvTypeDB } = require('../plugins');

module.exports = function (app) {

  if (getEnvTypeDB() === 'nedb') {
    const dbPath = app.get('nedb');
    const Model = new NeDB({
      filename: path.join(dbPath, 'opcua-tags.db'),
      autoload: true
    });

    Model.ensureIndex({ fieldName: 'name', unique: true });

    return Model;
  }

  if (getEnvTypeDB() === 'mongodb') {
    const modelName = 'opcuaTags';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
      text: { type: String, required: true }
    }, {
      timestamps: true
    });

    // This is necessary to avoid model compilation errors in watch mode
    // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
    if (mongooseClient.modelNames().includes(modelName)) {
      mongooseClient.deleteModel(modelName);
    }
    return mongooseClient.model(modelName, schema);
  }
};
