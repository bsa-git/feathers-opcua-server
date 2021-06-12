const mongoose = require('mongoose');
const logger = require('./logger');
const { canDbClientRun } = require('./plugins');

module.exports = function (app) {
  
  mongoose.connect(
    app.get('mongodb'),
    { useCreateIndex: true, useNewUrlParser: true }
  ).catch(err => {
    logger.error(err);
    process.exit(1);
  });

  app.set('mongooseClient', mongoose);
};
