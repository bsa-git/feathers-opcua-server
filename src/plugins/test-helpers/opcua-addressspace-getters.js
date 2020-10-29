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
  const value = `Learn Node-OPCUA ! Read ${params.value ? params.value : defValue}`
  return {
    dataType: DataType.String,
    value
  }
}

/**
 * Get value from source2
 * @param {Object} params 
 * @returns {Object}
 */
function valueFromSource2(params = {}) {
  const defValue = [1.0, 2.0, 3.0];
  const value = params.value ? params.value : defValue
  return {
    dataType: DataType.Double,
    arrayType: VariantArrayType.Array,
    value
  }
};

/**
 * Get percentage memory used
 * @returns {Variant}
 */
function percentageMemUsed() {
  const percentageMemUsed = 1.0 - (os.freemem() / os.totalmem());
  const value = percentageMemUsed * 100;
  return new Variant({ dataType: DataType.Double, value: value });
};


module.exports = {
  valueSimulate1,
  valueFromSource1,
  valueFromSource2,
  percentageMemUsed
};
