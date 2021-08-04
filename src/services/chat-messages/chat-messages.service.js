// Initializes the `messages` service on path `/messages`
const { ChatMessages } = require('./chat-messages.class');
const createModel = require('../../models/chat-messages.model');
const hooks = require('./chat-messages.hooks');
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
  app.use('/chat-messages', new ChatMessages(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('chat-messages');

  service.hooks(hooks);
};
