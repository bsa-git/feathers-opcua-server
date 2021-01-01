/* eslint-disable no-unused-vars */
const os = require('os');
const {
  Variant,
  DataType,
  StatusCodes,
  VariantArrayType,
  standardUnits,
  makeAccessLevelFlag,
} = require('node-opcua');

const { getTime } = require('../../plugins');

const loRound = require('lodash/round');
const moment = require('moment');

const debug = require('debug')('app:opcua-addressspace-getters');
const isDebug = false;
// const isLog = false;

/**
 * Simulate for value
 * @param {Object} params 
 * @returns {Variant}
 */
function valueSimulate1(params = {}) {
  const t = new Date() / 10000;
  let value = params.value ? params.value : 10;
  value = value + 10 * Math.sin(t);
  return new Variant({ dataType: DataType.Double, value: value });
}

/**
 * Get value from source1
 * @param {Object} params 
 * @returns {Object}
 */
function valueFromSource1(params = {}) {
  const defValue = 'https://leanpub.com/node-opcuabyexample';
  const value = `Learn Node-OPCUA ! Read ${params.value ? params.value : defValue}`;
  return value;
}

/**
 * Get value from source2
 * @param {Object} params 
 * @returns {Object}
 */
function valueFromSource2(params = {}) {
  const defValue = [1.0, 2.0, 3.0];
  const value = params.value ? params.value : defValue;
  return value;
}

/**
 * Get hist value from source
 * @param {Object} params 
 * @param {Object} addedValue 
 */
function histValueFromSource(params = {}, addedValue) {
  // simulate pressure change
  const _t = 0;
  const _interval = 200;
  let t = params.t ? params.t : _t;
  let interval = params.interval ? params.interval :_interval;
  setInterval(function () {
    let value = (Math.sin(t / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
    if(isDebug) debug('histValueFromSource.value:', loRound(value, 3), '; time:', getTime());
    // debug('histValueFromSource.value:', loRound(value, 3), '; time:', getTime()); 
    addedValue.setValueFromSource({ dataType: DataType.Double, value: value });
    t = t + 1;
  }, interval);
}

function histValueFromFile(params = {}, addedValue) {
  // simulate pressure change
  const _t = 0;
  const _interval = 200;
  let t = params.t ? params.t : _t;
  let interval = params.interval ? params.interval :_interval;
  setInterval(function () {
    let value = (Math.sin(t / 50) * 0.70 + Math.random() * 0.20) * 5.0 + 5.0;
    if(isDebug) debug('histValueFromSource.value:', loRound(value, 3), '; time:', getTime());
    // debug('histValueFromSource.value:', loRound(value, 3), '; time:', getTime()); 
    addedValue.setValueFromSource({ dataType: DataType.Double, value: value });
    t = t + 1;
  }, interval);

}

/**
 * Get percentage memory used
 * @returns {Variant}
 */
function percentageMemUsed() {
  const percentageMemUsed = 1.0 - (os.freemem() / os.totalmem());
  const value = percentageMemUsed * 100;
  return new Variant({ dataType: DataType.Double, value: value });
}

module.exports = {
  valueSimulate1,
  valueFromSource1,
  valueFromSource2,
  histValueFromSource,
  histValueFromFile,
  percentageMemUsed
};
