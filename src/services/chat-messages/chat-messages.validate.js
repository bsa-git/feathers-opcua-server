// Validation definitions for validateSchema hook for service `users`. (Can be re-generated.)
const { validateSchema } = require('feathers-hooks-common');
const merge = require('lodash/merge');
const ajv = require('ajv');
const { dbNullIdValue } = require('../../plugins');


const ID = 'string';

let base = merge({},
  {
    title: 'ChatMessages',
    description: 'ChatMessages database.',
    fakeRecords: 3,
    required: [],
    uniqueItemProperties: [],
    properties: {
      id: {
        type: ID
      },
      _id: {
        type: ID
      },
      ownerId: {
        type: ID,
        faker: {
          fk: 'users:random'
        }
      },
      userId: {
        type: ID,
        faker: {
          fk: 'users:random'
        },
        default: dbNullIdValue()
      },
      teamId: {
        type: ID,
        faker: {
          fk: 'teams:random'
        },
        default: dbNullIdValue()
      },
      roleId: {
        type: ID,
        faker: {
          fk: 'roles:random'
        },
        default: dbNullIdValue()
      },
      msg: {
        type: 'string',
        faker: 'lorem.sentence',
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
