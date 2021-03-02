/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;

const {
  inspector,
  pause
} = require('../../src/plugins/lib');

const {
  urlExists,
  checkStatusFetch
} = require('../../src/plugins/lib/http-operations');

const chalk = require('chalk');

const debug = require('debug')('app:http-operations.test');
const isDebug = false;
const isLog = false;

describe('<<=== HttpOperations: (http-operations.test) ===>>', () => {
  let server;

  before(function (done) {
    if (isDebug) debug('before Start!');
    server = app.listen(port);
    server.once('listening', () => {
      setTimeout(() => done(), 500);
    });
  });

  after(function (done) {
    if (isDebug) debug('after Start!');
    server.close();
    setTimeout(() => done(), 500);
  });


  it('HttpOperations: https.get', async () => {
    const https = require('https');
    const url = 'https://jsonplaceholder.typicode.com/posts/1';
    try {
      await urlExists(url);
      https.get(url, res => {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', data => {
          body += data;
        });
        res.on('end', () => {
          body = JSON.parse(body);
          console.log(body);
        });
      });
      assert.ok(true, 'HttpOperations: https.get');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(true, 'HttpOperations: https.get');
    }
  });

  it('HttpOperations: axios.get', async () => {
    const axios = require('axios');
    const url = 'https://jsonplaceholder.typicode.com/posts/2';
    try {
      await urlExists(url);
      const getData = async url => {
        try {
          const response = await axios.get(url);
          const data = response.data;
          console.log(data);
        } catch (error) {
          console.log(error);
        }
      };

      await getData(url);
      assert.ok(true, 'HttpOperations: axios.get');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(true, 'HttpOperations: axios.get');
    }
  });

  it('HttpOperations: fetch.get', async () => {
    const fetch = require('node-fetch');
    const url = 'https://jsonplaceholder.typicode.com/users';
    try {
      await urlExists(url);
      fetch(url)
        .then(res => res.json())
        .then(json => {
          console.log('First user in the array:');
          console.log(json[0]);
          console.log('Name of the first user in the array:');
          console.log(json[0].name);
        });
      assert.ok(true, 'HttpOperations: fetch.get');
    } catch (err) {
      debug('ERROR:', err.message);
      assert.ok(true, 'HttpOperations: fetch.get');
    }
  });
});
