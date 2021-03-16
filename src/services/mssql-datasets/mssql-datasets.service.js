// Initializes the `opcua-servers` service on path `/opcua-servers`
const { MssqlDatasets } = require('./mssql-datasets.class');
const mssqlDatasetMixins = require('./mssql-dataset.mixins');
const hooks = require('./mssql-datasets.hooks');

module.exports = function (app) {

  const options = {
    paginate: app.get('paginate')
  };

  // Mixins have to be added before registering any services
  app.mixins.push(mssqlDatasetMixins);

  // Initialize our service with any options it requires
  app.use('/mssql-datasets', new MssqlDatasets(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('mssql-datasets');

  service.hooks(hooks);
};
