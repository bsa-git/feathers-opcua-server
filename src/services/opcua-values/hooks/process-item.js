/* eslint-disable no-unused-vars */
const schema = require('../opcua-values.validate').schema;
const { HookHelper } = require('../../../plugins');

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return async context => {
    let updateData = {};
    //-------------------------
    const { app, data } = context;

    // Throw an error if we didn't get a tagId
    if (!data.tagId) {
      throw new Error('A `opcua-value` must have a tagId');
    }
    
    // Throw an error if we didn't get a value
    if (!data.values || data.values.length === 0) {
      throw new Error('A `opcua-value` must have a values');
    }

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if(data[key] !== undefined){
        updateData[key] = data[key];
      }
    });

    if(!updateData.tagName){
      const service = app.service('opcua-tags');
      const tag = await service.get(updateData.tagId);
      updateData.tagName = tag.browseName;
    }

    context.data = updateData;

    return context;
  };
};
