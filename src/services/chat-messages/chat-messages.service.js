// Initializes the `messages` service on path `/messages`
const { ChatMessages } = require('./chat-messages.class');
const createModel = require('../../models/chat-messages.model');
const hooks = require('./chat-messages.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    Model,
    paginate,
    multi: true 
  };

  // Initialize our service with any options it requires
  app.use('/chat-messages', new ChatMessages(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('chat-messages');

  service.hooks(hooks);
};
