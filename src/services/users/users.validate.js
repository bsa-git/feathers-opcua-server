// Validation definitions for validateSchema hook for service `users`. (Can be re-generated.)
const { validateSchema } = require('feathers-hooks-common');
const merge = require('lodash/merge');
const ajv = require('ajv');
const {isTrue} = require('../../plugins/lib');

const ID = 'string';

let base = merge({},
  {
    title: 'Users',
    description: 'Users database.',
    required: ['email'],
    uniqueItemProperties: ['email', 'profileId'],
    properties: {
      id: {
        type: ID
      },
      _id: {
        type: ID
      },
      email: {
        type: 'string',
        format: 'email',
        minLength: 8,
        maxLength: 40
      },
      password: {
        type: 'string'
      },
      firstName: {
        type: 'string',
        minLength: 2,
        maxLength: 20
      },
      lastName: {
        type: 'string',
        minLength: 2,
        maxLength: 40
      },
      avatar: {
        type: 'string'
      },
      roleId: {
        type: ID
      },
      profileId: {
        type: ID
      },
      active: {
        type: 'boolean',
        setDefault: isTrue(process.env.SET_USER_ACTIVE) 
      },
      isVerified: {
        type: 'boolean',
        setDefault: !isTrue(process.env.IS_AUTH_MANAGER) 
      },
      googleId: {
        type: 'string'
      },
      githubId: {
        type: 'string'
      },
      loginAt: {
        type: 'string',
        format: 'date-time'
      }
    }
  },
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
