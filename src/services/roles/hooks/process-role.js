/* eslint-disable no-unused-vars */
const { inspector, dbNullIdValue } = require('../../../plugins');
const debug = require('debug')('app:hook.process-log');

const isLog = false;
const isDebug = false;

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    const { data } = context;

    // Throw an error if we didn't get a name
    if(!data.name) {
      throw new Error('A role must have a name');
    }
    // Throw an error if we didn't get a alias
    if(!data.alias) {
      throw new Error('A role must have a alias');
    }

    // Update the original data (so that people can't submit additional stuff)
    const updateData = {
      name: data.name,
      alias: data.alias,
      description: data.description? data.description : '',
      createdAt: context.data.createdAt,
      updatedAt: context.data.updatedAt
    };

    context.data = updateData;

    return context;
  };
};
