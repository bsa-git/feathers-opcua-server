/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { inspector, appRoot } = require('../lib');
const { getSrvCurrentState, getClientForProvider, getSubscriptionHandler } = require('./opcua-helper');

const {
  Variant,
  DataType,
  VariantArrayType,
  AttributeIds,
  StatusCodes,
  makeBrowsePath
} = require('node-opcua');

const debug = require('debug')('app:opcua-server-mixins');
const isLog = true;
const isDebug = false;

let result;



module.exports = function opcuaServerMixins(service, path) {

  /**
   * @method connect
   * @async
   * 
   * @param {String} id 
   * @returns {Object}
   */
  service.connect = async function (id) {
    const srvCurrentState = await getSrvCurrentState(service.app, id);
    const opcuaClient = await service.get(id);
    await opcuaClient.client.connect(srvCurrentState);
    result = Object.assign({}, opcuaClient, getClientForProvider(opcuaClient.client));
    return result;
  };
};
