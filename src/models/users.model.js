/* eslint-disable no-unused-vars */
const NeDB = require('nedb');
const path = require('path');
const mongoose = require('mongoose');
const { getEnvTypeDB, dbNullIdValue } = require('../plugins');

module.exports = function (app) {

  // A nedb model
  if (getEnvTypeDB() === 'nedb') {
    const dbPath = app.get('nedb');
    const Model = new NeDB({
      filename: path.join(dbPath, 'users.db'),
      autoload: true,
      timestampData: true
    });

    Model.ensureIndex({ fieldName: 'email', unique: true });
    Model.ensureIndex({ fieldName: 'profileId', unique: true, sparse: true });

    return Model;
  }

  // A mongoose model
  // 
  // See http://mongoosejs.com/docs/models.html
  // for more of what you can do here.
  if (getEnvTypeDB() === 'mongodb') {
    const modelName = 'users';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      roleId: { type: mongoose.ObjectId },
      profileId: { type: mongoose.ObjectId, unique: true, sparse: true  },
      active: { type: Boolean },
      isVerified: { type: Boolean },
      googleId:  { type: String },
      githubId:  { type: String },
      loginAt:  { type: Date },
      avatar:  { type: String },
    }, {
      timestamps: true
    });

    // schema.path('profileId').index({ sparse: true });

    //   // This is necessary to avoid model compilation errors in watch mode
    //   // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
    if (mongooseClient.modelNames().includes(modelName)) {
      mongooseClient.deleteModel(modelName);
    }
    return mongooseClient.model(modelName, schema);
  }

};
