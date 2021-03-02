const knex = require('knex');

module.exports = function (app) {
  const { client, connection } = app.get('mssql');
  const db = knex({ client, connection });

  app.set('knexClient', db);
};
