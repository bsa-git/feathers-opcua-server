// Initializes the `mssql-tags` service on path `/mssql-tags`
const { MssqlTags } = require('./mssql-tags.class');
const createModel = require('../../models/mssql-tags.model');
const hooks = require('./mssql-tags.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/mssql-tags', new MssqlTags(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('mssql-tags');

  service.hooks(hooks);
};
