/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');

const {
  inspector,
  appRoot
} = require('../../plugins/lib');

const {
  getStoreSources4Data,
} = require('../../plugins/db-helpers');

const debug = require('debug')('app:opcua-values.mixins');
const isDebug = true;

module.exports = function opcuaValuesMixins(service, path) {

  /**
  * @method getStoreSources4Data
  * @async
  * 
  * @param {String[]} groupBrowseNames 
  * e.g. ['CH_M51_ACM::ValueFromFile', 'CH_M52_ACM::ValueFromFile', 'CH_M52_ACM2::ValueFromFile']
  * @param {Object[]} opcuaTags
  * @returns {Object[]}
  * e.g. [
  *  { fileName: 'DayHist01_23F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:42.827Z' },
  *  { fileName: 'DayHist01_14F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:50.727Z' },
  *  ...
  *  { fileName: 'DayHist01_57F120_02232022_0000.xls', updatedAt: '2022-07-26T05:46:55.927Z' }
  * ]
  */
  service.getStoreSources4Data = async function (groupBrowseNames, opcuaTags) {
    let storeSources = [];
    //-------------------------
    storeSources = await getStoreSources4Data(service.app, groupBrowseNames, opcuaTags);
    if(isDebug && storeSources.length) inspector('getStoreSources4Data.storeSources:', storeSources);
    return storeSources;
  };
};