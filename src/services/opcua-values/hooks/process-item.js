/* eslint-disable no-unused-vars */
const schema = require('../opcua-values.validate').schema;
const { inspector, objectHash } = require('../../../plugins');

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
    if (!data.values || data.values.length === 0) {
      throw new Error('A `opcua-value` must have a values');
    }

    // Update the original data (so that people can't submit additional stuff)
    Object.keys(schema.properties).forEach(key => {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    });

    if (!updateData.tagId) {
      const service = app.service('opcua-tags');
      const tags = await service.find({ query: { browseName: updateData.tagName } });
      if (tags.length) {
        const tag = tags[0];
        const idField = 'id' in tag ? 'id' : '_id';
        updateData.tagId = tag[idField].toString();
      } else {
        throw new Error(`A "opcua-tags" service must have a record with "browseName" = ${updateData.tagName}`);
      }
    }

    if (updateData.storeStart) {
      const valueHashes = [];
      for (let index = 0; index < updateData.values.length; index++) {
        const value = updateData.values[index];
        let valueHash = '';
        if (value.items && value.items.length) {
          valueHash = objectHash(value.items);
        } else {
          valueHash = objectHash(value.value);
        }
        if (value.hash && value.hash !== valueHash) {
          throw new Error(`A "opcua-values" service have not a record with updateData.values#value.hash === ${valueHash}`);
        } else {
          if (!value.hash) value.hash = valueHash;
          valueHashes.push(value.hash);
        }
      }

      if (updateData.store && updateData.store.hash !== objectHash(valueHashes)) {
        throw new Error(`A "opcua-values" service have not a record with updateData.store.hash === '${objectHash(valueHashes)}'`);
      } else {
        if (!updateData.store) {
          updateData.store = { count: valueHashes.length, hash: objectHash(valueHashes) };
        }
      }
      if(isDebug && updateData) inspector('app:hook.process-item.updateData:', updateData);
    }

    context.data = updateData;

    return context;
  };
};
