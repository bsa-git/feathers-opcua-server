/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const loMerge = require('lodash/merge');

const { 
  MssqlTedious
} = require('../../plugins/db-helpers');

const mssqlDatasetMixins = require('./mssql-dataset.mixins');

const loRemove = require('lodash/remove');
const loAt = require('lodash/at');

const debug = require('debug')('app:mssql-datasets.class');
const isDebug = false;

//===============================================================

class MssqlDatasets {

  setup(app, path) {
    this.app = app;
    this.mssqlDatasets = [];
  }

  // Create mssqlDataset
  async create(data, params) {
    let result;
    // Execute an DB action through a service method (create)
    if(data.id && data.action){
      mssqlDatasetMixins(this);
      const path = this.getPathForMixins(data.action);
      if(path === null){
        throw new errors.BadRequest(`There is no path for the corresponding action - "${data.action}"`);  
      }
      const args = loAt(data, path);
      result = await this[data.action](...args);
      return result;
    }

    // Create DB
    const db = new MssqlTedious(data.config);
    if (db.isDatasetInList(this)) {
      throw new errors.BadRequest(`The mssql dataset already exists for this id = '${db.id}' in the service list`);
    }
    // DB connect
    await db.connect();
    // Add mssqlDataset to service list
    const mssqlDataset = {
      id: db.id,
      db,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
    this.mssqlDatasets.push(mssqlDataset);
    // Get result
    result = params.provider ? Object.assign({}, mssqlDataset, db.getDatasetForProvider()) : mssqlDataset;
    return result;
  }

  // Get mssqlDataset for id
  async get(id, params) {
    let mssqlDataset = null;
    mssqlDataset = this.mssqlDatasets.find(obj => obj.id === id);
    if (!mssqlDataset) {
      throw new errors.BadRequest(`No mssqlDataset found for this id = '${id}' in the service list`);
    }
    if (params.provider) {
      mssqlDataset = {
        id: mssqlDataset.id,
        db: { currentState: mssqlDataset.db.getCurrentState() },
        createdAt: mssqlDataset.createdAt,
        updatedAt: mssqlDataset.updatedAt
      };
    }
    return mssqlDataset;
  }

  // Get all mssqlDataset
  async find(params) {
    let mssqlDatasets, mssqlDataset;
    // Just return all our mssqlDataset
    mssqlDatasets = this.mssqlDatasets.map(obj => {
      if (params.provider) {
        mssqlDataset = {
          id: obj.id,
          db: { currentState: obj.db.getCurrentState() },
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt
        };
      } else {
        mssqlDataset = obj;
      }
      return mssqlDataset;
    });
    return mssqlDatasets;
  }

  // mssqlDataset update
  async update(id, data, params) {
    await this.remove(id);
    data.id = id;
    data.action = 'createMssqlDataset';
    const result = await this.create(data);
    const mssqlDataset = await this.get(result.id);
    return params.provider ? result : mssqlDataset;
  }

  // mssqlDataset patch
  async patch(id, data, params) {
    let mssqlDataset;
    //---------------------------
    // Get mssqlDataset and disconnect
    mssqlDataset = await this.get(id);
    await mssqlDataset.db.disconnect();
    // Set patchConfig for mssqlDataset
    const patchConfig = loMerge({}, mssqlDataset.db.config, data.config);
    mssqlDataset.db.config = patchConfig;
    mssqlDataset.db.currentState.connectionConfig = mssqlDataset.db.getConnConfigForCurrentState();
    // Connect with patchConfig   
    const result = await mssqlDataset.db.connect();
    return params.provider ? result : mssqlDataset;
  }

  // mssqlDataset remove
  async remove(id, params) {
    let mssqlDataset;
    mssqlDataset = await this.get(id);
    await mssqlDataset.db.disconnect();
    mssqlDataset = Object.assign({}, {
      id: mssqlDataset.id,
      db: { currentState: mssqlDataset.db.getCurrentState() },
      createdAt: mssqlDataset.createdAt,
      updatedAt: mssqlDataset.updatedAt
    });

    loRemove(this.mssqlDatasets, obj => obj.id === id);
    return mssqlDataset;
  }
}

exports.MssqlDatasets = MssqlDatasets;
