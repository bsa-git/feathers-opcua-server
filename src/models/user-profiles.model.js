const NeDB = require('nedb');
const path = require('path');
const { getEnvTypeDB } = require('../plugins');

module.exports = function (app) {

  // A nedb model
  if (getEnvTypeDB() === 'nedb') {
    const dbPath = app.get('nedb');
    const Model = new NeDB({
      filename: path.join(dbPath, 'user-profiles.db'),
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
    const modelName = 'userProfiles';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
      personalPhone: { type: String },
      personalWebSite: { type: String },
      addressSuite: { type: String },
      addressStreet: { type: String },
      addressCity: { type: String },
      addressState: { type: String },
      addressStateAbbr: { type: String },
      addressCountry: { type: String },
      addressCountryCode: { type: String },
      addressZipCode: { type: String },
      addressLatitude: { type: String },
      addressLongitude: { type: String },
      jobCompanyName: { type: String },
      jobTitle: { type: String },
      jobType: { type: String },
      jobPhone: { type: String },
      jobWebSite: { type: String },
      jobEmail: { type: String },
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