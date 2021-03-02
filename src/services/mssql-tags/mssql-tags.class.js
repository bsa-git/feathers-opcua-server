const { Service } = require('feathers-knex');

exports.MssqlTags = class MssqlTags extends Service {
  constructor(options) {
    super({
      ...options,
      name: 'mssql_tags'
    });
  }
};
