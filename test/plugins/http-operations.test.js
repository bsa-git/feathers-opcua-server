/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const host = app.get('host');
const port = app.get('port');
const fetch = require('node-fetch');
const { curly } = require('node-libcurl');
const axios = require('axios');

const {
  inspector,
  startListenPort,
  stopListenPort,
  getParseUrl,
} = require('../../src/plugins');

const {
  getProxy,
  getHttp,
  reqHttp,
  getHttps,
  reqHttps,
  isUrlExists
} = require('../../src/plugins/lib/http-operations');

const isDebug = false;


describe('<<=== HttpOperations: (http-operations.test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('#1: HttpOperations: getProxy', async () => {

    // Get env no_proxy value
    let envNoProxy = process.env.no_proxy;
    if (true && envNoProxy) console.log('envNoProxy:', envNoProxy);

    // Check proxy
    let hostname = getParseUrl('http://192.168.3.5:3030').hostname;
    let proxy = getProxy(`http://${hostname}`);
    console.log('proxy_url-1.1:', `"http://${hostname}"`, `(${!!proxy})`);
    hostname = getParseUrl(`http://${host}:${port}`).hostname;
    proxy = getProxy(`http://${hostname}/my/1234`);
    console.log('proxy_url-1.2:', `"http://${hostname}"`, `(${!!proxy})`);
    hostname = getParseUrl('http://zf2-asm.srv2').hostname;
    proxy = getProxy(`http://${hostname}`);
    console.log('proxy_url-1.3:', `"http://${hostname}"`, `(${!!proxy})`);
    hostname = getParseUrl('https://jsonplaceholder.typicode.com/posts/1').hostname;
    proxy = getProxy(`http://${hostname}`);
    console.log('proxy_url-2.1:', `"http://${hostname}"`, `(${!!proxy})`);
    hostname = getParseUrl('http://www.google.com').hostname;
    proxy = getProxy(`http://${hostname}`);
    console.log('proxy_url-2.2:', `"http://${hostname}"`, `(${!!proxy})`);

    assert.ok(true, 'HttpOperations: getProxy');
  });

  it('#2: HttpOperations: curly.get("http://${host}:${port}")', async () => {
    const url = `http://${host}:${port}`;
    if (! await isUrlExists(url)) return;

    const { statusCode, data, headers } = await curly.get(`http://${host}:${port}`);

    if (statusCode && isDebug) console.log(`curly.get(${url}).statusCode:`, statusCode);
    if (data && isDebug) inspector(`curly.get(${url})`, data);
    assert.ok(statusCode === 200, 'HttpOperations: curly.get("localhost")');
  });

  it('#3: HttpOperations: axios.get("http://${host}:${port}")', async () => {
    const url = `http://${host}:${port}`;
    if (! await isUrlExists(url)) return;

    const response = await axios.get(url);
    if (isDebug && response) console.log(`axios.get(${url}).statusText`, response.statusText);
    assert.ok(response, 'HttpOperations: axios.get');
  });


  it('#4: HttpOperations: https.get("https://nodejs.org/dist/index.json")', async () => {
    let response, url = 'https://nodejs.org/dist/index.json';
    //------------------------------------------------------

    // External address
    if (! await isUrlExists(url)) return;

    response = await getHttps(url);
    if (isDebug && response.data) console.log('getHttps.data:', JSON.parse(response.data));
    assert.ok(response.statusCode === 200, `HttpOperations: getHttps("${url}")`);
  });

  it('#5: HttpOperations: http.get("http://192.168.3.5/www_m5/m5_data/")', async () => {
    let response, url;
    //------------------------------------------------------

    // Local address
    url = 'http://192.168.3.5/www_m5/m5_data/';
    if (! await isUrlExists(url)) return;

    response = await getHttp(url);
    if (isDebug && response.data) console.log('getHttp.data:', response.data);
    assert.ok(response.statusCode === 200, `HttpOperations: getHttp("${url}")`);
  });


  it('#6: HttpOperations: https.request("https://jsonplaceholder.typicode.com/posts/2")', async () => {
    let response, data, url = 'https://jsonplaceholder.typicode.com/posts/2';
    //------------------------------------------------------------------------

    // External address
    if (! await isUrlExists(url)) return;

    response = await reqHttps(url);
    data = JSON.parse(response.data);
    if (isDebug && data) console.log('getHttps.data:', data);
    assert.ok(response.statusCode === 200 && data.userId, `HttpOperations: https.request("${url}")`);
  });

  it('#7: HttpOperations: http.request("http://192.168.3.5/www_m5/m5_data2/")', async () => {
    let response, data, url;
    //------------------------------------------------------------------------

    // Local address
    url = 'http://192.168.3.5/www_m5/m5_data2/';
    if (! await isUrlExists(url)) return;

    response = await reqHttp(url);
    if (isDebug && response.data) console.log('reqHttp.data:', response.data);
    assert.ok(response.statusCode === 200, `HttpOperations: reqHttp("${url}")`);
  });


  it('#8: HttpOperations: https.get("https://jsonplaceholder.typicode.com/posts/1")', async () => {
    let response, data, url = 'https://jsonplaceholder.typicode.com/posts/1';
    if (! await isUrlExists(url)) return;

    response = await getHttps(url);
    data = JSON.parse(response.data);
    if (isDebug && response.data) console.log('getHttps.data:', response.data);
    assert.ok(response.statusCode === 200 && data.userId, 'HttpOperations: https.get("https://jsonplaceholder.typicode.com/posts/1")');
  });


  it('#9: HttpOperations: fetch.get("https://jsonplaceholder.typicode.com/users")', async () => {

    const url = 'https://jsonplaceholder.typicode.com/users';
    if (! await isUrlExists(url, true)) return;

    const response = await fetch(url);
    let data = await response.json();
    data = data[0];
    if (isDebug && data) inspector(`fetch.get(${url}).data:`, data);
    assert.ok(data.id, `HttpOperations: fetch.get("${url}")`);
  });


  it('#10: HttpOperations: fetch("https://www.google.com")', async () => {
    const url = 'https://www.google.com';
    if (! await isUrlExists(url, true)) return;

    const response = await fetch(url);
    if (true && response) console.log(`fetch(${url}).ok:`, response.ok);
    if (true && response) console.log(`fetch(${url}).status:`, response.status);
    if (true && response) console.log(`fetch(${url}).statusText:`, response.statusText);
    if (true && response) console.log(`fetch(${url}).headers['content-type']:`, '"' + response.headers.get('content-type') + '"' );

    assert.ok(response.ok, `HttpOperations: fetch(${url})`);
  });
});
