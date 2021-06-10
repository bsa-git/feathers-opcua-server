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
      personalPhone: {
        type: 'string',
        format: 'phone',
        faker: 'phone.phoneNumberFormat'
      },
      personalWebSite: {
        type: 'string',
        format: 'uri',
        faker: 'internet.url'
      },
      addressSuite: {
        type: 'string',
        faker: 'address.secondaryAddress'
      },
      addressStreet: {
        type: 'string',
        faker: 'address.streetAddress'
      },
      addressCity: {
        type: 'string',
        faker: 'address.city'
      },
      addressState: {
        type: 'string',
        faker: 'address.state'
      },
      addressStateAbbr: {
        type: 'string',
        faker: 'address.stateAbbr'
      },
      addressCountry: {
        type: 'string',
        faker: 'address.country'
      },
      addressCountryCode: {
        type: 'string',
        faker: 'address.countryCode'
      },
      addressZipCode: {
        type: 'string',
        format: 'zip_code',
        faker: 'address.zipCode'
      },
      addressLatitude: {
        type: 'string',
        format: 'lat',
        faker: 'address.latitude'
      },
      addressLongitude: {
        type: 'string',
        format: 'long',
        faker: 'address.longitude'
      },
      jobCompanyName: {
        type: 'string',
        faker: 'company.companyName'
      },
      jobTitle: {
        type: 'string',
        faker: 'name.jobTitle'
      },
      jobType: {
        type: 'string',
        faker: 'name.jobType'
      },
      jobPhone: {
        type: 'string',
        format: 'phone',
        faker: 'phone.phoneNumberFormat'
      },
      jobWebSite: {
        type: 'string',
        format: 'uri',
        faker: 'internet.url'
      },
      jobEmail: {
        type: 'string',
        format: 'email',
        minLength: 8,
        maxLength: 40,
        faker: 'internet.exampleEmail'
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
