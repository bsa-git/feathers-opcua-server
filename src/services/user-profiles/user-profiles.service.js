// Initializes the `messages` service on path `/messages`
const { UserProfiles } = require('./user-profiles.class');
const createModel = require('../../models/user-profiles.model');
const hooks = require('./user-profiles.hooks');
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
  app.use('/user-profiles', new UserProfiles(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('user-profiles');

  service.hooks(hooks);
};
