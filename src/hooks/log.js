
// A hook that logs service method before, after and error
// See https://github.com/winstonjs/winston for documentation
// about the logger.
const { inspector } = require('../plugins');
const logger = require('../logger');

const isLog = false;

// To see more detailed messages, uncomment the following line:
// logger.level = 'debug';

module.exports = function () {
  return context => {
    // This debugs the service call and a stringified version of the hook context
    // You can customize the message (and logger) to your needs
    logger.debug(`${context.type} app.service('${context.path}').${context.method}()`);

    if (isLog) {
      logger.debug('Hook Context', inspector('hook::log. context:', context));
    }

    if (context.error) {
      logger.error(context.error.stack);
    }
  };
};
