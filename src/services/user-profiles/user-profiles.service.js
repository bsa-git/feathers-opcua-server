// Initializes the `messages` service on path `/messages`
const { UserProfiles } = require('./user-profiles.class');
const createModel = require('../../models/user-profiles.model');
const hooks = require('./user-profiles.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate,
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/user-profiles', new UserProfiles(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('user-profiles');

  service.hooks(hooks);
};
