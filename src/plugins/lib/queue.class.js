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
const listQueueOfItems = [];

class Queue {
  /**
  * Constructor
  * @param {String} itemName
  * @param {Array} args
  */
  constructor(itemName, args = [], indexOfQueue = 0) {
    if (!listQueueOfItems[indexOfQueue]) {
      listQueueOfItems[indexOfQueue] = [];
    }
    this.indexOfQueue = indexOfQueue;
    // this.queueOfItems = listQueueOfItems[this.indexOfQueue];
    this.itemName = itemName;
    this.args = args;
    this.startTime = moment.utc();
    this.token = this.getToken();
    this.addItemToQueue();
    if(true && listQueueOfItems[this.indexOfQueue]) inspector('Queue.constructor.queueOfItems:', listQueueOfItems[this.indexOfQueue]);
  }

  /**
  * @async
  * @method getToken
  * @return {String}
  */
  getToken() {
    // Get token
    const token = getShortToken(8);
    this.token = `${this.itemName}(${token})`;
    if (isDebug && this.token) console.log('Queue.getToken.token:', this.token);
    if (isDebug && this.startTime) console.log('Queue.getToken.startTime:', this.startTime, 'token:', this.token);
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
    if(this.args.length) item.args = this.args;
    listQueueOfItems[this.indexOfQueue].push(item);

    if (true && listQueueOfItems[this.indexOfQueue].length) logger.info(`Queue.addItemToQueue.item.token: "${item.token}"`);
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
      if (result) await pause(1000, false);
    } while (result);
    if(isDrop) this.dropCurrentItem();
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
    const item = loHead(listQueueOfItems[this.indexOfQueue]);
    if (item) {
      isBusy = item.token !== token;
      if (true && isBusy) console.log(`'${token}'`, chalk.cyan(' wait '), `'${item.token}'`);
    }
    return isBusy;
  }

  /**
  * Drop item from the beginning of array
  * @method dropCurrentItem
  * @return {Object[]}
  */
  dropCurrentItem() {
    if (listQueueOfItems[this.indexOfQueue].length) {
      const currentItem = this.getCurrentItem();
      listQueueOfItems[this.indexOfQueue] = loDrop(listQueueOfItems[this.indexOfQueue]);
      if (true && listQueueOfItems[this.indexOfQueue]) inspector(`Queue.dropCurrentItem("${currentItem.token}").queueOfItems:`, listQueueOfItems[this.indexOfQueue].map(item => item.token));
    }
    return listQueueOfItems[this.indexOfQueue];
  }

  /**
  * @method getQueueOfItems
  * @return {Object[]}
  */
  getQueueOfItems() {
    return listQueueOfItems[this.indexOfQueue];
  }


  /**
  * @method getCurrentItem
  * @return {Object}
  */
  getCurrentItem() {
    const item = loHead(listQueueOfItems[this.indexOfQueue]);
    return item;
  }

  /**
  * @method getTimeDuration
  * @param {Number|String} endTime
  * @return {Number}
  */
  getTimeDuration(endTime, unit) {
    if(!endTime) endTime = moment.utc(endTime);
    this.timeDuration = getTimeDuration(this.startTime, endTime, unit);
    return this.timeDuration;
  }

  /**
  * @method addQueueOfItems
  * @return {Number}
  */
  static addQueueOfItems() {
    const count = listQueueOfItems.push([]);
    return count - 1;
  }

}

module.exports = Queue;
