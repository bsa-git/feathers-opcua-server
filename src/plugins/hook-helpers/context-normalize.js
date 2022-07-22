/* eslint-disable no-unused-vars */
const moment = require('moment');
const { inspector } = require('../lib');
const HookHelper = require('./hook-helper.class');
const loToPlainObject = require('lodash/toPlainObject');
const loAssign = require('lodash/assign');

const isDebug = false;


/**
 * Base normalize
 * @param record
 */
const baseNormalize = async (record) => {
  if (!record) return;
  record = loToPlainObject(record);
  if (isDebug) inspector('plugins.contextNormalize::record:', record);
};

/**
 * Created at normalize
 * @param {Object} record
 */
const createdAtNormalize = (record) => {
  if (!record) return;
  record.createdAt = moment().utc().valueOf();
  record.updatedAt = record.createdAt;
};

/**
 * Updated at normalize
 * @param {Object} record
 */
const updatedAtNormalize = (record) => {
  if (!record) return;
  record.updatedAt = moment().utc().valueOf();
};

/**
 * Context normalize
 * @param context
 * @return {Promise<HookHelper>}
 */
module.exports = async function contextNormalize(context) {
  // Create HookHelper object
  const hh = new HookHelper(context);
  if (hh.contextType === 'before' || hh.contextType === 'after') {
    await hh.forEachRecords(baseNormalize);
  }

  // Run normalize createdAt/updatedAt
  switch (`${hh.contextMethod}.${hh.contextType}`) {
  case 'create.before':
    await hh.forEachRecords(createdAtNormalize);
    break;
  case 'update.before':
  case 'patch.before':  
    await hh.forEachRecords(updatedAtNormalize);
    break;
  default:
    break;
  }
  return hh.contextRecords;
};
