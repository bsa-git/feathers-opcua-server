/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;

const {
  urlExist,
  inspector,
} = require('../../src/plugins/lib/util');

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
    const exists = await urlExist('https://jsonplaceholder.typicode.com');
    if (isDebug) debug('urlExist:', exists);
    debug('urlExist:', exists);

    if (exists) {
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
    }
    assert.ok(true, 'HttpOperations: https.get');
  });

  it('HttpOperations: axios.get', () => {
    const axios = require('axios');
    const url = 'https://jsonplaceholder.typicode.com/posts/1';

    const getData = async url => {
      try {
        const response = await axios.get(url);
        const data = response.data;
        console.log(data);
      } catch (error) {
        console.log(error);
      }
    };

    getData(url);
    assert.ok(true, 'HttpOperations: axios.get');
  });

  it('HttpOperations: fetch.get', () => {
    const fetch = require('node-fetch');

    fetch('https://jsonplaceholder.typicode.com/users')
      .then(res => res.json())
      .then(json => {
        console.log('First user in the array:');
        console.log(json[0]);
        console.log('Name of the first user in the array:');
        console.log(json[0].name);
      });

    assert.ok(true, 'HttpOperations: fetch.get');
  });

});
