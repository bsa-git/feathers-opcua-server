// Validation definitions for validateSchema hook for service `users`. (Can be re-generated.)
const { validateSchema } = require('feathers-hooks-common');
const merge = require('lodash/merge');
const ajv = require('ajv');

const ID = 'string';

let base = merge({},
  {
    title: 'OpcuaValues',
    description: 'OpcuaValues database.',
    fakeRecords: 3,
    required: [],
    uniqueItemProperties: [],
    properties: {
      id: { type: ID  },
      _id: { type: ID },
      tagId: { type: ID },
      tagName: { type: 'string' },
      storeStart: { type: 'string' },
      storeEnd: { type: 'string' },
      store: { type: 'object' },
      opcuaData: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: {type: 'string'},
            hash: {type: 'string'},
            value: {type: ['string', 'number', 'integer', 'boolean', 'object']},
            values: { type: 'array', items: { type: ['string', 'number', 'integer', 'boolean', 'object', 'array'] } },
            params: { type: 'object' }
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
