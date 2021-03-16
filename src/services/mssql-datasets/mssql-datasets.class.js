/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const { 
  MssqlTedious, 
  getIdFromMssqlConfig,
  isMssqlDatasetInList,
  getMssqlDatasetForProvider 
} = require('../../plugins/db-helpers');

const mssqlDatasetMixins = require('./mssql-dataset.mixins');

const loRemove = require('lodash/remove');
const loAt = require('lodash/at');

const debug = require('debug')('app:mssql-datasets.class');
const isDebug = false;
const isLog = false;

class MssqlDatasets {

  setup(app, path) {
    this.app = app;
    this.mssqlDatasets = [];
  }

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

    // Get id
    const id = getIdFromMssqlConfig(data.params.config);
    if (isMssqlDatasetInList(this, id)) {
      throw new errors.BadRequest(`The opcua server already exists for this id = '${id}' in the server list`);
    }
    // Create DB
    const db = new MssqlTedious(data.params.config);
    // DB connect
    await db.connect();
    // Add mssqlDataset to service list
    const mssqlDataset = {
      id,
      db,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
    this.mssqlDatasets.push(mssqlDataset);
    // Get result
    result = params.provider ? Object.assign({}, mssqlDataset, getMssqlDatasetForProvider(mssqlDataset.db)) : mssqlDataset;
    return result;
  }

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

  async update(id, data, params) {
    await this.remove(id);
    data.action = 'create';
    const result = await this.create(data);
    return result;
  }

  async patch(id, data, params) {
    await this.remove(id);
    data.action = 'create';
    const result = await this.create(data);
    return result;
  }

  // mssqlDataset remove
  async remove(id, params) {
    let mssqlDataset;
    mssqlDataset = await this.get(id);
    await mssqlDataset.db.diconnect();
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
