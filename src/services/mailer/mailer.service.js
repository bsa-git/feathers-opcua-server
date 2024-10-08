// Initializes the `auth-management` service on path `/auth-management`
const { Mailer } = require('./mailer.class');
// const Mailer = require('./mailer.class');
const hooks = require('./mailer.hooks');

const debug = require('debug')('app:service.mailer.service');
const isDebug = false;

module.exports = function (app) {

  let options = {
    paginate: app.get('paginate'),
    mailer: {
      service: 'gmail',
      auth: {
        user: process.env.GMAIL,
        pass: process.env.GMAIL_PASSWORD
      }
    }
    // !end
  };

  // Initialize our service with any options it requires
  app.use('/mailer', new Mailer(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('mailer');

  if(isDebug) debug('Registered mailer service:', !!service);

  service.hooks(hooks);
};
