const seedService = require('./seed-service');
const serviceHelper = require('./service-helper');
const testHelper = require('./test-helper');
const fakeNormalize = require('./fake-normalize');

module.exports = Object.assign({},
  { 
    fakeNormalize,
    seedService,
  },
  serviceHelper,
  testHelper,
);
