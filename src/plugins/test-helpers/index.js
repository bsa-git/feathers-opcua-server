const seedService = require('./seed-service');
const serviceHelper = require('./service-helper');
const testHelper = require('./test-helper');

module.exports = Object.assign({},
  seedService,
  serviceHelper,
  testHelper,
);
