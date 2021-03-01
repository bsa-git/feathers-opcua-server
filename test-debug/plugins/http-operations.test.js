/* eslint-disable no-unused-vars */
// const fs = require('fs');
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;

const {
  appRoot,
  inspector,
  pause,
} = require('../../src/plugins/lib/util');

// const {

// } = require('../../src/plugins/lib/file-operations');

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


  it('HttpOperations: https.get', () => {
    const https = require('https');
    const url = 'https://jsonplaceholder.typicode.com/posts/1';

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

  // it('HttpOperations: fetch.get', () => {
  //   const fetch = require('node-fetch');
  //   // Example POST method implementation:
  //   async function postData(url = '', data = {}) {
  //     // Default options are marked with *
  //     const response = await fetch(url, {
  //       method: 'POST', // *GET, POST, PUT, DELETE, etc.
  //       mode: 'cors', // no-cors, *cors, same-origin
  //       cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
  //       credentials: 'same-origin', // include, *same-origin, omit
  //       headers: {
  //         'Content-Type': 'application/json'
  //         // 'Content-Type': 'application/x-www-form-urlencoded',
  //       },
  //       redirect: 'follow', // manual, *follow, error
  //       referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  //       body: JSON.stringify(data) // body data type must match "Content-Type" header
  //     });
  //     return response.json(); // parses JSON response into native JavaScript objects
  //   }

  //   postData('https://jsonplaceholder.typicode.com/posts/1', { answer: 42 })
  //     .then(data => {
  //       console.log(data); // JSON data parsed by `data.json()` call
  //     });

  //   assert.ok(true, 'HttpOperations: fetch.get');
  // });
  
});
