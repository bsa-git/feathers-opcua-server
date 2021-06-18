const NeDB = require('nedb');
const path = require('path');
const { getEnvTypeDB } = require('../plugins');

module.exports = function (app) {
  // A nedb model
  if (getEnvTypeDB() === 'nedb') {
    const dbPath = app.get('nedb');
    const Model = new NeDB({
      filename: path.join(dbPath, 'teams.db'),
      autoload: true,
      timestampData: true
    });

    Model.ensureIndex({ fieldName: 'name', unique: true });

    return Model;
  }

  // A mongoose model
  // 
  // See http://mongoosejs.com/docs/models.html
  // for more of what you can do here.
  if (getEnvTypeDB() === 'mongodb') {
    const modelName = 'teams';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
      name: { type: String, required: true, unique: true },
      alias: { type: String, required: true },
      description: { type: String },
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

