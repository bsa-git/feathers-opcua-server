/* eslint-disable no-unused-vars */
const {inspector} = require('../lib');
const HookHelper = require('./hook-helper.class');

const isLog = false;


/**
 * Base normalize
 * @param record
 */
const baseNormalize = async (record) => {
  if (!record) return;
  let _cloneObject = JSON.parse(JSON.stringify(record));
  Object.assign(record, _cloneObject);
  if (isLog) inspector('plugins.contextNormalize::record:', record);
};

/**
 * Context normalize
 * @param context
 * @return {Promise<HookHelper>}
 */
module.exports = async function contextNormalize(context) {
  // Create HookHelper object
  const hh = new HookHelper(context);
  // Run base normalize
  if (hh.contextType === 'before' || hh.contextType === 'after') {
    await hh.forEachRecords(baseNormalize);
  }
  return hh.contextRecords;
};
