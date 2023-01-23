/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');
const { 
  inspector, 
  logger, 
  pause,
  getShortToken 
} = require('./util');
// const AuthServer = require('../auth/auth-server.class');


const loHead = require('lodash/head');
const loDrop = require('lodash/drop');

const debug = require('debug')('app:queue.class');
const isDebug = false;

// Queues of items
const listQueueOfItems = [];

class Queue {
  /**
  * Constructor
  * @param {String} itemName
  * @param {Array} args
  */
  constructor(indexOfQueue, itemName, args) {
    this.queueOfItems = listQueueOfItems[indexOfQueue];
    this.itemName = itemName;
    this.args = args;
    this.startTime = moment.utc().format();
    this.token = '';
  }

  /**
  * @method addQueueOfItems
  * @return {Number}
  */
  static addQueueOfItems() {
    const count = listQueueOfItems.push([]);
    return count - 1;
  }

  /**
  * @async
  * @method getToken
  * @return {String}
  */
  async getToken() {
    // Get token
    const token = await getShortToken(8);
    this.token = `${this.itemName}(${token})`;
    if (isDebug && this.token) console.log('Queue.getToken.token:', this.token);
    if (isDebug && this.startTime) console.log('Queue.getToken.startTime:', this.startTime, 'token:', this.token);
    return this.token;
  }

  /**
  * @method getQueueOfItems
  * @return {Object[]}
  */
  getQueueOfItems() {
    return this.queueOfItems;
  }

    
  /**
  * @method getCurrentItem
  * @return {Object}
  */
  getCurrentItemFromQueue() {
    const item = loHead(this.queueOfItems);
    return item;
  }

  /**
  * Drop item from the beginning of array
  * @method dropCurrentItemFromQueue
  * @return {Object[]}
  */
  dropCurrentItemFromQueue() {
    if(this.queueOfItems.length) {
      this.queueOfItems = loDrop(this.queueOfItems);
    }
    return this.queueOfItems;
  }

  /**
  * @async
  * @method getToken
  * @return {Object}
  */
  addItemToQueue() {
    if(!this.token) {
      logger.error('Token must not be empty.');
      throw new Error('Token must not be empty.');
    }
    // Add item to queue
    const item = {
      token: this.token,
      itemName: this.itemName,
      args: this.args
    };
    this.queueOfItems.push(item);

    if (isDebug && this.queueOfItems.length) inspector('Queue.queueOfItems:', this.queueOfItems.map(item => item.token));
    return item;
  }

  /**
  * @method doWhile
  * @param {Boolean} isShow
  */
  async doWhile(isShow = false) {
    let result = false;
    do {
      result = this.isTokenInQueue(this.token, isShow);
      if (result) await pause(1000, false);
    } while (result);
  }

  /**
  * @method isTokenInQueue
  * @param {String} token 
  * @param {Boolean} isShow
  * @returns {Boolean}
  */
  isTokenInQueue(token, isShow = false) {
    let isBusy = false;
    //---------------------------
    const item = loHead(this.queueOfItems);
    if (item) {
      isBusy = item.token !== token;
      if (isShow && isBusy) console.log(`'${token}'`, chalk.cyan(' wait '), `'${item.token}'`);
    }
    return isBusy;
  }
}

module.exports = Queue;
