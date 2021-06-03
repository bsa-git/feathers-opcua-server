/* eslint-disable no-unused-vars */
const { inspector, dbNullIdValue } = require('../../../plugins/lib');
const debug = require('debug')('app:hook.process-log');

const isLog = false;
const isDebug = false;

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    const { data } = context;

    // Throw an error if we didn't get a text
    if(!data.msg) {
      throw new Error('A log message must have a msg');
    }

    // The logged in user
    const { user } = context.params;
    
    // Update the original data (so that people can't submit additional stuff)
    const updateData = {
      gr: data.gr,
      pr: data.pr,
      name: data.name,
      msg: data.msg,
      // Set the user id
      ownerId: user._id,
      userId: data.userId? data.userId : dbNullIdValue(),
      createdAt: context.data.createdAt,
      updatedAt: context.data.updatedAt
    };

    /*
    id: {type: 'ID'},
    _id: {type: 'ID'},
    gr: {faker: 'name.title'},
    pr: {type: 'integer'},
    name: {faker: 'name.title'},
    ownerId: {type: 'ID', faker: {fk: 'users:random'}},
    userId: {type: 'ID', faker: {fk: 'users:random'}},
    msg: {faker: 'lorem.sentence'}
    */

    context.data = updateData;

    return context;
  };
};
