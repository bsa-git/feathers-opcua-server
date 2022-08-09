/* eslint-disable no-unused-vars */
const schema = require('../opcua-values.validate').schema;
const { inspector, objectHash, getStartEndOfPeriod } = require('../../../plugins');

const debug = require('debug')('app:hook.process-item');
const isDebug = false;

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    let updateData = {};
    //-------------------------
    const { app, data } = context;

    // Throw an error if we didn't get a tagName
    if (!data.tagName) {
      throw new Error('A `opcua-value` must have a tagName');
    }

    // Throw an error if we didn't get a value
    if (!data.opcuaData || data.opcuaData.length === 0) {
      throw new Error('A `opcua-value` must have a opcuaData');
    }

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    });

    context.data = updateData;
    return context;
  };
};
