/* eslint-disable no-unused-vars */
const {
  appRoot,
} = require('../../../lib');

const chalk = require('chalk');
const loMerge = require('lodash/merge');

const {
  ClientSubscription
} = require('node-opcua');

// const {
//   formatSimpleDataValue,
// } = require('../../../opcua/opcua-helper');

const defaultSubscriptionOptions = require(`${appRoot}/src/api/opcua/config/ClientSubscriptionOptions.json`);

const isDebug = false;

/**
 * @name callbackSubscriptionCreate
 * @param {Object} session 
 * @param {Object} params 
 * @returns {Object}
 */
const callbackSubscriptionCreate = (session, params) => {
  let subscriptionId;
  //-------------------------------
  const mergeOptions = loMerge({}, defaultSubscriptionOptions, params.opt.subscriptionOptions);
  const subscription = ClientSubscription.create(session, mergeOptions);

  subscription
    .on('started', () => {
      subscriptionId = subscription.subscriptionId;
      console.log(chalk.yellow('Client subscription started.'), 'SubscriptionId =', subscription.subscriptionId);
    })
    .on('keepalive', () => console.log(chalk.yellow('Client subscription keepalive')))
    .on('terminated', () => console.log(chalk.yellow('Client subscription terminated')));

  return { statusCode: 'Good', subscriptionId, subscription };
};

module.exports = callbackSubscriptionCreate;