// Initializes the `messages` service on path `/messages`
const { LogMessages } = require('./log-messages.class');
const createModel = require('../../models/log-messages.model');
const hooks = require('./log-messages.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate,
    multi: true 
  };

  // Initialize our service with any options it requires
  app.use('/log-messages', new LogMessages(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('log-messages');

  service.hooks(hooks);
};
