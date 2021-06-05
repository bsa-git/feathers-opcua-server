/* eslint-disable no-unused-vars */
const {readJsonFileSync, inspector, appRoot} = require('../lib');
const chalk = require('chalk');

const isDebug = false;
const isLog = false;

// Get generated fake data
let fakeData = readJsonFileSync(`${appRoot}/seeds/fake-data.json`) || {};

// Get feathers-specs data
const feathersSpecs = readJsonFileSync(`${appRoot}/config/feathers-specs.json`) || {};

// Get generated services
const services = feathersSpecs.services;

module.exports = async function (app, aServiceName, aAddFakeData = true) {
  
  // Determine if environment allows test to mutate existing DB data.
  const isDbChangesAllowed = app.get('env') === feathersSpecs.app.envAllowingSeedData;
  if (!isDbChangesAllowed) return;

  if (!Object.keys(fakeData).length) {
    console.error(chalk.red('Cannot seed services as seed/fake-data.json doesn\'t have seed data.'));
    return;
  }

  if (!services || !Object.keys(services).length) {
    console.error(chalk.red('Cannot seed services as feathers-gen-specs.json has no services.'));
    return;
  }

  for (const serviceName in services) {
    if (services[serviceName] && (serviceName === aServiceName)) {
      const {name, adapter, path} = services[serviceName];
      const doSeed = adapter !== 'generic';
      let result = [];

      if (doSeed) {
        if (fakeData[name] && fakeData[name].length) {
          try {
            const service = app.service(path);
            const deleted = await service.remove(null);
            if(aAddFakeData) result = await service.create(fakeData[name]);
            if(isDebug) console.log(chalk.green(`Seeded service ${name} on path ${path} deleting ${deleted.length} records, adding ${result.length}.`));
            if (isLog) inspector(`Seeded '${name}' service for fakeData:`, result);
            return aAddFakeData? result : deleted;
          } catch (err) {
            console.log(chalk.red(`Error on seeding service ${name} on path ${path}`), chalk.red(err.message));
          }
        } else {
          console.log(chalk.red(`Not seeding service ${name} on path ${path}. No seed data.`));
        }
      } else {
        console.log(chalk.red(`Not seeding generic service ${name} on path ${path}.`));
      }
    }
  }
};

