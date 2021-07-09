/* eslint-disable no-unused-vars */
const { readJsonFileSync, inspector, appRoot } = require('../lib');
const { getIdField } = require('../db-helpers');
const fakeNormalize = require('../test-helpers/fake-normalize');
const chalk = require('chalk');

const isDebug = false;
const isLog = false;

// Get generated fake data
let fakeData = fakeNormalize();
// Get feathers-specs data
const feathersSpecs = readJsonFileSync(`${appRoot}/config/feathers-specs.json`) || {};

// Get generated services
const services = feathersSpecs.services;

module.exports = async function (app, aServiceName, aAddFakeData = true) {
  let created = [], deleted = [], finded = [];
  let idField = '';
  //------------------------
  // Determine if environment allows test to mutate existing DB data.
  const isDbChangesAllowed = feathersSpecs.app.envAllowingSeedData.find(item => item === app.get('env'));
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
      const { name, adapter, path } = services[serviceName];
      const doSeed = adapter !== 'generic';
      const result = false;
      if (doSeed) {
        if (fakeData[name] && fakeData[name].length) {
          try {
            created = []; deleted = []; finded = [];
            const service = app.service(path);
            // Delete items from service
            deleted = await service.remove(null);
            if (aAddFakeData) {
              // Add items to service
              for (let index = 0; index < fakeData[name].length; index++) {
                const createdItem = await service.create(fakeData[name][index]);
                created.push(createdItem);
              }
            }
            return aAddFakeData ? created : deleted;
          } catch (err) {
            console.log(chalk.red(`Error on seeding service ${name} on path ${path}`), chalk.red(err.message));
            return result;
          }
        } else {
          console.log(chalk.red(`Not seeding service ${name} on path ${path}. No seed data.`));
          return result;
        }
      } else {
        console.log(chalk.red(`Not seeding generic service ${name} on path ${path}.`));
        return result;
      }
    }
  }
};

