// Initializes the `user-teams` service on path `/user-teams`
const { UserTeams } = require('./user-teams.class');
const createModel = require('../../models/user-teams.model');
const hooks = require('./user-teams.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/user-teams', new UserTeams(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('user-teams');

  service.hooks(hooks);
};
