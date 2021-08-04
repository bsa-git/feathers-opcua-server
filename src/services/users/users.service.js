// Initializes the `users` service on path `/users`
const { Users } = require('./users.class');
const createModel = require('../../models/users.model');
const hooks = require('./users.hooks');
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
  app.use('/users', new Users(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('users');

  service.hooks(hooks);
};
