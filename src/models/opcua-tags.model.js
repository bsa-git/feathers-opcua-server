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
      isEnable: { type: Boolean },
      browseName: { type: String, required: true, unique: true },
      displayName: { type: String, required: true },
      aliasName: { type: String },
      type: { type: String, required: true },
      description: { type: String },
      ownerName: { type: String },
      dataType: { type: String },
      hist: { type: Number },
      store: Schema.Types.Mixed,
      group: { type: Boolean },
      subscription: { type: String },
      ownerGroup: { type: String },
      bindMethod: { type: String },
      inputArguments: Schema.Types.Mixed,
      outputArguments: Schema.Types.Mixed,
      userAccessLevel: Schema.Types.Mixed,
      variableGetType: { type: String },
      getter: { type: String },
      getterParams: Schema.Types.Mixed,
      valueParams: {
        type: {
          arrayDimensions: [Number],
          engineeringUnits: { type: String },
          engineeringUnitsRange: {
            type: {
              low: { type: Number },
              high: { type: Number },
            }
          }
        }
      },
      valueFromSourceParams: {
        type: {
          dataType: { type: String },
          arrayType: { type: String }
        }
      },
      view: Schema.Types.Mixed,
      histParams: {
        opcuaId: { type: String },
        opcuaUrl: { type: String },
        savingValuesMode: { type: String }// add|update
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
