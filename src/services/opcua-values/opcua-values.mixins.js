/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');

const {
  inspector,
  appRoot
} = require('../../plugins/lib');

const {
  getStoreParams4Data,
} = require('../../plugins/db-helpers');

const debug = require('debug')('app:opcua-values.mixins');
const isDebug = false;

module.exports = function opcuaValuesMixins(service, path) {

  /**
  * @method getStoreParams4Data
  * @async
  * 
  * @param {String[]} groupBrowseNames 
  * e.g. ['CH_M51_ACM::ValueFromFile', 'CH_M52_ACM::ValueFromFile', 'CH_M52_ACM2::ValueFromFile']
  * @returns {Object[]}
  * e.g. [
  *  { dateTime: '2022-02-22', fileName: 'DayHist01_23F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:42.827Z' },
  *  { dateTime: '2022-02-22', fileName: 'DayHist01_14F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:50.727Z' },
  *  ...
  *  { dateTime: '2022-02-22', fileName: 'DayHist01_57F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:55.927Z' }
  * ]
  */
  service.getStoreParams4Data = async function (groupBrowseNames) {
    const storeParams = await getStoreParams4Data(service.app, groupBrowseNames);
    if(isDebug && storeParams.length) inspector('service.mixin.getStoreParams4Data.storeParams:', storeParams);
    return storeParams;
  };
};