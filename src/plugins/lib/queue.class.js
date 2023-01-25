/* eslint-disable no-unused-vars */
const moment = require('moment');
const chalk = require('chalk');
const {
  inspector,
  logger,
  pause,
  getShortToken,
  getTimeDuration
} = require('./util');

const loHead = require('lodash/head');
const loDrop = require('lodash/drop');

const debug = require('debug')('app:queue.class');
const isDebug = false;

// Queues of items
const listQueueOfItems = {};

class Queue {
  /**
  * Constructor
  * @param {String} itemName
  * @param {String} queueName
  */
  constructor(itemName, queueName = 'default-list') {
    if (!listQueueOfItems[queueName]) {
      listQueueOfItems[queueName] = [];
    }
    this.queueName = queueName;
    this.itemName = itemName;
    // this.args = args;
    this.startTime = moment.utc();
    this.token = this.createToken();
    this.addItemToQueue();
    if (isDebug && listQueueOfItems[this.queueName]) inspector('Queue.constructor.queueOfItems:', listQueueOfItems[this.queueName]);
  }

  /**
  * @async
  * @method createToken
  * @return {String}
  */
  createToken() {
    // Get token
    const token = getShortToken(8);
    this.token = `${this.itemName}(${token})`;
    if (isDebug && this.startTime) console.log('Queue.createToken.startTime:', this.startTime, 'token:', this.token);
    return this.token;
  }

  /**
  * @async
  * @method getToken
  * @return {Object}
  */
  addItemToQueue() {
    if (!this.token) {
      logger.error('Token must not be empty.');
      throw new Error('Token must not be empty.');
    }
    // Add item to queue
    const item = { token: this.token };
    listQueueOfItems[this.queueName].push(item);

    if (isDebug && listQueueOfItems[this.queueName].length) logger.info(`Queue.addItemToQueue.item.token: "${item.token}"`);
    return item;
  }

  /**
  * @method doWhile
  * @param {Boolean} isDrop
  */
  async doWhile(isDrop = false) {
    let result = false;
    do {
      result = this.isTokenInQueue(this.token);
      if (result) await pause(100, false);
    } while (result);
    if (isDrop) this.dropCurrentItem();
    this.endTime = moment.utc();
    this.timeDuration = getTimeDuration(this.startTime, this.endTime);
  }

  /**
  * @method isTokenInQueue
  * @param {String} token 
  * @returns {Boolean}
  */
  isTokenInQueue(token) {
    let isBusy = false;
    //---------------------------
    const item = loHead(listQueueOfItems[this.queueName]);
    if (item) {
      isBusy = item.token !== token;
      if (isDebug && isBusy) console.log(`'${token}'`, chalk.cyan(' wait '), `'${item.token}'`);
    }
    return isBusy;
  }

  /**
  * Drop item from the beginning of array
  * @method dropCurrentItem
  * @return {Object[]}
  */
  dropCurrentItem() {
    if (listQueueOfItems[this.queueName].length) {
      const currentItem = this.getCurrentItem();
      listQueueOfItems[this.queueName] = loDrop(listQueueOfItems[this.queueName]);
      if (isDebug && listQueueOfItems[this.queueName]) inspector(`Queue.dropCurrentItem("${currentItem.token}").queueOfItems:`, listQueueOfItems[this.queueName].map(item => item.token));
    }
    return listQueueOfItems[this.queueName];
  }

  /**
  * @method getQueueOfItems
  * @return {Object[]}
  */
  getQueueOfItems() {
    return listQueueOfItems[this.queueName];
  }


  /**
  * @method getCurrentItem
  * @return {Object}
  */
  getCurrentItem() {
    const item = loHead(listQueueOfItems[this.queueName]);
    return item;
  }

  /**
  * @method getTimeDuration
  * @param {Number|String} endTime
  * @return {Number}
  */
  getTimeDuration(endTime, unit) {
    if (!endTime) endTime = moment.utc(endTime);
    this.timeDuration = getTimeDuration(this.startTime, endTime, unit);
    return this.timeDuration;
  }

  /**
   * @method clearQueue
   * @param {String} queueName 
   */
  static clearQueue(queueName) {
    if(queueName && listQueueOfItems[queueName]){
      listQueueOfItems[queueName] = [];
      return;
    }
    const keys = Object.keys(listQueueOfItems);
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      listQueueOfItems[key] = [];
    }
  }
}

module.exports = Queue;
