const { validateSchema } = require('feathers-hooks-common');
const merge = require('lodash/merge');
const ajv = require('ajv');

const ID = 'string';

let base = merge({},
  {
    title: 'OpcuaTags',
    description: 'OpcuaTags database.',
    fakeRecords: 3,
    required: [],
    uniqueItemProperties: [
      'browseName'
    ],
    properties: {
      id: {
        type: ID
      },
      _id: {
        type: ID
      },
      isEnable: {
        type: 'boolean'
      },
      browseName: {
        type: 'string'
      },
      displayName: {
        type: 'string',
      },
      aliasName: {
        type: 'string',
      },
      description: {
        type: 'string'
      },
      type: {
        type: 'string'
      },
      ownerName: {
        type: 'string'
      },
      dataType: {
        type: 'string'
      },
      hist: {
        type: 'boolean'
      },
      group: {
        type: 'boolean'
      },
      ownerGroup: {
        type: 'string'
      },
      variableGetType: {
        type: 'string'
      },
      getter: {
        type: 'string'
      },
      getterParams: {
        type: 'object',
        properties: {
          path: {type: 'string'},
          fromFile: {type: 'string'},
          interval: {type: 'number'},
          dbEnv: {type: 'string'},
          queryFunc: {type: 'string'},
          queryParams: {
            properties: {
              scanerName: {type: 'string'}
            }
          }
        }
      },
      valueParams: {
        type: 'object',
        properties: {
          engineeringUnits: {type: 'string'},
          engineeringUnitsRange: {
            properties: {
              low: {type: 'number'},
              high: {type: 'number'}
            }
          }
        }
      }
    }
  }
);

let create = merge({},
  base,
);

let update = merge({},
  base,
);

let patch = merge({},
  base,
);
delete patch.required;

let validateCreate = options => {
  return validateSchema(create, ajv, options);
};

let validateUpdate = options => {
  return validateSchema(update, ajv, options);
};

let validatePatch = options => {
  return validateSchema(patch, ajv, options);
};

let quickValidate = (method, data, options) => {
  try {
    if (method === 'create') { validateCreate(options)({ type: 'before', method: 'create', data }); }
    if (method === 'update') { validateCreate(options)({ type: 'before', method: 'update', data }); }
    if (method === 'patch') { validateCreate(options)({ type: 'before', method: 'patch', data }); }
  } catch (err) {
    return err;
  }
};

let moduleExports = {
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch,
  quickValidate,
};

moduleExports.schema = base;
module.exports = moduleExports;
