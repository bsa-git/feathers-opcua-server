/* eslint-disable no-unused-vars */
const {
  inspector,
  readJsonFileSync,
  appRoot,
  getEnvTypeDB,
  getIdField
} = require('./plugins');

// Get generated fake data
let fakeData = readJsonFileSync(`${appRoot}/seeds/fake-data.json`) || {};

// Get feathers-specs data
const feathersSpecs = readJsonFileSync(`${appRoot}/config/feathers-specs.json`) || {};

// Get generated services
let services = feathersSpecs.services;

module.exports = async function (app) {
  let created = [], deleted = [], finded = [];
  let idField = '';
  //------------------------
  // Determine if command line argument exists for seeding data
  const isSeedServices = ['--seed', '-s'].some(str => process.argv.slice(2).includes(str));
  if (!isSeedServices) return;
  // Determine if 'env' === envAllowingSeedData
  const isDbChangesAllowed = feathersSpecs.app.envAllowingSeedData.find(item => item === app.get('env'));
  if (!isDbChangesAllowed) return;

  if (!Object.keys(fakeData).length) {
    console.log('Cannot seed services as seed/fake-data.json doesn\'t have seed data.');
    return;
  }
  if (!services || !Object.keys(services).length) {
    console.log('Cannot seed services as feathers-gen-specs.json has no services.');
    return;
  }

  for (const serviceName in services) {
    if (services[serviceName]) {
      const { name, adapter, path } = services[serviceName];
      const doSeed = adapter !== 'generic';
      if (doSeed) {
        if (fakeData[name] && fakeData[name].length) {
          try {
            created = []; deleted = []; finded = [];
            const service = app.service(path);
            // Delete items from service
            finded = await service.find({ query: {} });
            finded = finded.data;
            if (finded.length) {
              idField = getIdField(finded);
              for (let index = 0; index < finded.length; index++) {
                const item = finded[index];
                deleted.push(await service.remove(item[idField]));
              }
            }
            // Add items to service
            for (let index = 0; index < fakeData[name].length; index++) {
              created.push(await service.create(fakeData[name][index]));
            }

            console.log(`Seeded service ${name} on path ${path} deleting ${deleted.length} records, adding ${created.length}.`);
          } catch (err) {
            console.log(`Error on seeding service ${name} on path ${path}`, err.message);
          }
        } else {
          console.log(`Not seeding service ${name} on path ${path}. No seed data.`);
        }
      } else {
        console.log(`Not seeding generic service ${name} on path ${path}.`);
      }
    }
  }
};