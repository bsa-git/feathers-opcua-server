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
      id: { type: ID },
      _id: { type: ID },
      isEnable: { type: 'boolean' },
      browseName: { type: 'string' },
      displayName: { type: 'string' },
      aliasName: { type: 'string' },
      description: { type: 'string' },
      type: { type: 'string' },
      ownerName: { type: 'string' },
      dataType: { type: 'string' },
      hist: { type: 'integer' },
      store: { type: 'object' },
      group: { type: 'boolean' },
      subscription: { type: 'string' },
      ownerGroup: { type: 'string' },
      bindMethod: { type: 'string' },
      inputArguments: { type: 'array', items: { type: 'object' } },
      outputArguments: { type: 'array', items: { type: 'object' } },
      userAccessLevel: {
        type: 'object',
        properties: {
          inputArguments: { type: 'string' },
          outputArguments: { type: 'string' }
        }
      },
      variableGetType: { type: 'string' },
      getter: { type: 'string' },
      getterParams: { type: 'object' },
      valueParams: {
        type: 'object',
        properties: {
          arrayDimensions: { type: 'array', items: { type: 'integer' } },
          engineeringUnits: { type: 'string' },
          engineeringUnitsRange: {
            properties: {
              low: { type: 'number' },
              high: { type: 'number' }
            }
          }
        }
      },
      valueFromSourceParams: {
        type: 'object',
        properties: {
          dataType: { type: 'string' },
          arrayType: { type: 'string' }
        }
      },
      view: { type: 'object' },
      histParams: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: {
            type: 'string',
            format: 'uri',
            faker: 'internet.url'
          },
          savingValuesMode: { type: 'string' }// add|update
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
