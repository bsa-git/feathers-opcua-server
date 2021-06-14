/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const logger = require('./logger');
const { getEnvTypeDB } = require('./plugins');

module.exports = function (app) {

  if (getEnvTypeDB() === 'mongodb') {
    mongoose.connect(
      app.get('mongodb'),
      { 
        useCreateIndex: true, 
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    ).catch(err => {
      logger.error(err);
      process.exit(1);
    });

    app.set('mongooseClient', mongoose);
  }
};
