// Validation definitions for validateSchema hook for service `users`. (Can be re-generated.)
const { validateSchema } = require('feathers-hooks-common');
const merge = require('lodash/merge');
const ajv = require('ajv')({allErrors: true});
const { getRegex } = require('../../plugins');

// Add JSON Schema format
ajv.addFormat('phone', getRegex('phone'));
ajv.addFormat('zip_code', getRegex('zip_code'));
ajv.addFormat('lat', getRegex('lat'));
ajv.addFormat('long', getRegex('long'));

const ID = 'string';

let base = merge({},
  {
    title: 'UserProfiles',
    description: 'UserProfiles database.',
    required: [],
    uniqueItemProperties: [],
    properties: {
      id: {
        type: ID
      },
      _id: {
        type: ID
      },
      personalPhone: {
        type: 'string',
        format: 'phone'
      },
      personalWebSite: {
        type: 'string',
        format: 'uri'
      },
      addressSuite: {
        type: 'string'
      },
      addressStreet: {
        type: 'string'
      },
      addressCity: {
        type: 'string'
      },
      addressState: {
        type: 'string'
      },
      addressStateAbbr: {
        type: 'string'
      },
      addressCountry: {
        type: 'string'
      },
      addressCountryCode: {
        type: 'string'
      },
      addressZipCode: {
        type: 'string',
        format: 'zip_code'
      },
      addressLatitude: {
        type: 'string',
        format: 'lat'
      },
      addressLongitude: {
        type: 'string',
        format: 'long'
      },
      jobCompanyName: {
        type: 'string'
      },
      jobTitle: {
        type: 'string'
      },
      jobType: {
        type: 'string'
      },
      jobPhone: {
        type: 'string',
        format: 'phone'
      },
      jobWebSite: {
        type: 'string',
        format: 'uri'
      },
      jobEmail: {
        type: 'string',
        format: 'email',
        minLength: 8,
        maxLength: 40
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
