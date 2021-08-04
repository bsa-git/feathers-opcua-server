// Initializes the `user-teams` service on path `/user-teams`
const { UserTeams } = require('./user-teams.class');
const createModel = require('../../models/user-teams.model');
const hooks = require('./user-teams.hooks');
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
  app.use('/user-teams', new UserTeams(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('user-teams');

  service.hooks(hooks);
};
