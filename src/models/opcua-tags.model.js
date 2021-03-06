/* eslint-disable no-unused-vars */
const NeDB = require('nedb');
const path = require('path');
const { getEnvTypeDB } = require('../plugins');

module.exports = function (app) {

  // A nedb model
  if (getEnvTypeDB() === 'nedb') {
    const dbPath = app.get('nedb');
    const Model = new NeDB({
      filename: path.join(dbPath, 'opcua-tags.db'),
      autoload: true,
      timestampData: true
    });
    Model.ensureIndex({ fieldName: 'browseName', unique: true });
    return Model;
  }

  // A mongoose model
  // 
  // See http://mongoosejs.com/docs/models.html
  // for more of what you can do here.
  if (getEnvTypeDB() === 'mongodb') {
    const modelName = 'opcuaTags';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
      isDisable: { type: Boolean },
      browseName: { type: String, required: true, unique: true },
      displayName: { type: String, required: true },
      aliasName: { type: String },
      type: { type: String, required: true },
      description: { type: String },
      ownerName: { type: String },
      dataType: { type: String },
      hist: { type: Boolean },
      group: { type: Boolean },
      ownerGroup: { type: String },
      variableGetType: { type: String },
      getter: { type: String },
      getterParams: {
        type: {
          path: { type: String },
          fromFile: { type: String },
          interval: { type: Number },
          dbEnv: { type: String },
          queryFunc: { type: String },
          queryParams: {
            type: {
              scanerName: { type: String },
            }
          }
        }
      },
      valueParams: {
        type: {
          engineeringUnits: { type: String },
          engineeringUnitsRange: {
            type: {
              low: { type: Number },
              high: { type: Number },
            }
          }
        }
      }
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
