/* eslint-disable no-unused-vars */
const { canServiceRun } = require('../plugins');
const debug = require('debug')('app:services.index');

const isDebug = false;

// const logMessages = require('./log-messages/log-messages.service.js');

module.exports = function (app) {
  const dirTree = require('directory-tree');
  const treeList = dirTree(__dirname).children.filter(child => child.type === 'directory').map(child => child.name);
  if(isDebug) debug('serviceDirTree:', treeList);

  // treeList.forEach(serviceName => {
  //   if (canServiceRun(serviceName)) {
  //     if(isDebug) debug(`canServiceRun.${serviceName}: OK`);
  //     const service = require(`./${serviceName}/${serviceName}.service.js`);
  //     app.configure(service);
  //   }
  // });

  for (let index = 0; index < treeList.length; index++) {
    const serviceName = treeList[index];
    if (canServiceRun(serviceName)) {
      if(isDebug) debug(`canServiceRun.${serviceName}: OK`);
      const service = require(`./${serviceName}/${serviceName}.service.js`);
      app.configure(service);
      // app.configure(logMessages);
    }
    // app.configure(logMessages);
  }

  // app.configure(logMessages);
};
