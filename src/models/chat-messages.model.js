/* eslint-disable no-unused-vars */
const NeDB = require('nedb');
const path = require('path');
const mongoose = require('mongoose');
const { getEnvTypeDB } = require('../plugins');

module.exports = function (app) {

  // A nedb model
  if (getEnvTypeDB() === 'nedb') {
    const dbPath = app.get('nedb');
    const Model = new NeDB({
      filename: path.join(dbPath, 'chat-messages.db'),
      autoload: true,
      timestampData: true
    });
    return Model;
  }

  // A mongoose model
  // 
  // See http://mongoosejs.com/docs/models.html
  // for more of what you can do here.
  if (getEnvTypeDB() === 'mongodb') {
    const modelName = 'chatMessages';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
      ownerId: { type: mongoose.ObjectId },
      userId: { type: mongoose.ObjectId },
      teamId: { type: mongoose.ObjectId },
      roleId: { type: mongoose.ObjectId },
      msg: { type: String, required: true }
    }, {
      timestamps: true
    });

    //   // This is necessary to avoid model compilation errors in watch mode
    //   // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
    if (mongooseClient.modelNames().includes(modelName)) {
      mongooseClient.deleteModel(modelName);
    }
    return mongooseClient.model(modelName, schema);
  }
};
