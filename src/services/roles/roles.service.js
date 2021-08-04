// Initializes the `messages` service on path `/messages`
const { Roles } = require('./roles.class');
const createModel = require('../../models/roles.model');
const hooks = require('./roles.hooks');
const { getEnvTypeDB } = require('../../plugins');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate,
    multi: true 
  };

  if (getEnvTypeDB() === 'nedb') {
    options.whitelist = ['$not', '$and'];
  }

  if (getEnvTypeDB() === 'mongodb') {
    options.whitelist = ['$nor'];
  }

  // Initialize our service with any options it requires
  app.use('/roles', new Roles(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('roles');

  service.hooks(hooks);
};
