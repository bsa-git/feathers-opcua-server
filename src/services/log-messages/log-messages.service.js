// Initializes the `log-messages` service on path `/log-messages`
const { LogMessages } = require('./log-messages.class');
const createModel = require('../../models/log-messages.model');
const hooks = require('./log-messages.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/log-messages', new LogMessages(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('log-messages');

  service.hooks(hooks);
};
