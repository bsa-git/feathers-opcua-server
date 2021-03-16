/* eslint-disable no-unused-vars */
const { canServiceRun } = require('../plugins');
const debug = require('debug')('app:services.index');

const isDebug = false;

module.exports = async function (app) {
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
    if (await canServiceRun(serviceName)) {
      if(isDebug) debug(`canServiceRun.${serviceName}: OK`);
      const service = require(`./${serviceName}/${serviceName}.service.js`);
      app.configure(service);
    }
  }

};
