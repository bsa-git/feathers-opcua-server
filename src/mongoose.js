const mongoose = require('mongoose');
const logger = require('./logger');

const {
  canDbClientRun,
  getPathBasename
} = require('./plugins');

module.exports = function (app) {

  const isDbClient =  canDbClientRun(getPathBasename(__filename));
  if(!isDbClient) return;

  mongoose.connect(
    app.get('mongodb'),
    { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true }
  )
    .then(({ connection }) => {
      console.log(`connected to "${connection.name}" database at ${connection.host}:${connection.port}`);
      return connection;
    })
    .catch(err => {
      logger.error(err);
      process.exit(1);
    });

  mongoose.Promise = global.Promise;

  app.set('mongooseClient', mongoose);
};
