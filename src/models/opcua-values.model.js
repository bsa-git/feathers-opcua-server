const NeDB = require('nedb');
const path = require('path');
const mongoose = require('mongoose');
const { getEnvTypeDB } = require('../plugins');

module.exports = function (app) {

  // A nedb model
  if (getEnvTypeDB() === 'nedb') {
    const dbPath = app.get('nedb');
    const Model = new NeDB({
      filename: path.join(dbPath, 'opcua-values.db'),
      autoload: true
    });
    return Model;
  }

  // A mongoose model
  // 
  // See http://mongoosejs.com/docs/models.html
  // for more of what you can do here.
  if (getEnvTypeDB() === 'mongodb') {
    const modelName = 'opcuaValues';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
      // tagId: { type: mongoose.ObjectId, required: true },
      tagId: { type: mongoose.ObjectId },
      tagName: { type: String, required: true },
      storeStart: String,
      storeEnd: String,
      store: Schema.Types.Mixed,
      opcuaData: [{
        key: String,
        hash: String,
        value: Schema.Types.Mixed,
        values: [Schema.Types.Mixed],
        params: Schema.Types.Mixed
      }]
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
