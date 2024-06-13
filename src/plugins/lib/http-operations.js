/* eslint-disable no-unused-vars */
const axios = require('axios');
const http = require('http');
const https = require('https');
const logger = require('../../logger');
const shouldProxy = require('should-proxy');
const { getParseUrl } = require('./net-operations');

const loIsObject = require('lodash/isPlainObject');

const {
  inspector,
  strReplaceEx
} = require('./util');

const debug = require('debug')('app:http-operations');
const isDebug = false;


//=============================================================================

/**
 * @constant defaultEnvNoProxy  // local addresses
 */
const defaultEnvNoProxy = 'localhost,127.0.0.0/8,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12';

/**
 * @constant defaultBrowserHeaders  // Standard browser headers
 */
const defaultBrowserHeaders = {
  // 'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  // 'cache-control': 'no-cache',
  // 'pragma': 'no-cache',
  // 'sec-ch-ua': '\'Chromium\';v=\'109\', \'Not_A Brand\';v=\'99\'',
  // 'sec-ch-ua-mobile': '?0',
  // 'sec-ch-ua-platform': '\'macOS\'',
  // 'sec-fetch-dest': 'document',
  // 'sec-fetch-mode': 'navigate',
  // 'sec-fetch-site': 'none',
  // 'sec-fetch-user': '?1',
  // 'upgrade-insecure-requests': '1',
  // 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15'
};

/**
 * @method getProxy
 * e.g. no_proxy: localhost,127.0.0.0/8,10.0.0.0/8,192.168.0.0/16,172.16.0.0/12,.azot.local,.azot.rv.ua,.ostchem.com.ua,
 * .tio2.com.ua,.microsoft.com,office.net,live.com,office365.com,office.com,outlook.com,*office365.fun,.srv,.srv2
 * @param {String} url
 * @returns {Object|false}
 * e.g. proxy.hash
        proxy.host
        proxy.hostname
        proxy.href
        proxy.origin
        proxy.password
        proxy.pathname
        proxy.path (pathname + search)
        proxy.port
        proxy.protocol (Special schemes)
        proxy.search
        proxy.searchParams
        proxy.username
        proxy.toString()
        proxy.toJSON()
 */
const getProxy = (url) => {
  let proxy = false, isProxy = false;
  if (!loIsObject(url)) url = getParseUrl(url);
  const envHttpProxy = process.env.http_proxy;
  const envHttpsProxy = process.env.https_proxy;
  const envNoProxy = process.env.no_proxy;
  isProxy = shouldProxy(url.href, { no_proxy: envNoProxy });

  if (isProxy) {
    proxy = (url.protocol == 'http:') ? envHttpProxy : envHttpsProxy;
    if (proxy) {
      proxy = getParseUrl(proxy);
    } else {
      proxy = false;
    }
  } else {
    proxy = false;
  }
  return proxy;
};


/**
 * @method connectToProxy
 * @async
 * @param {Object|String} url 
 * @returns {Object|Error}
 */
const connectToProxy = async (url) => {
  let proxy, res = {}, result;
  //-------------------------------------

  if (!loIsObject(url)) url = getParseUrl(url);
  // Get proxy
  proxy = getProxy(url);
  // The request was sent to the wrong server (You don't need a proxy for this address)
  if (!proxy) {
    res.statusCode = 421;
    res.statusMessage = 'Misdirected Request';
    return { res, socket: null };
  }
  if (isDebug && url) inspector('connectToProxy.url:', url);
  if (isDebug && proxy) inspector('connectToProxy.proxy:', proxy);

  if (proxy.protocol === 'https:') {
    result = await connectToHttps(url, proxy);
  } else {
    result = await connectToHttp(url, proxy);
  }
  return result;
};

/**
 * @method connectToHttp
 * @param {Object|String} url 
 * @param {Object|String} proxy 
 * @returns {Object|Error}
 */
const connectToHttp = (url, proxy) => {
  let path = '', headers = {};
  //-------------------------------------
  // Connect to proxy
  return new Promise((resolve, reject) => {
    if (!loIsObject(url)) url = getParseUrl(url);
    if (!loIsObject(proxy)) proxy = getParseUrl(proxy);

    if (isDebug && url) inspector('connectToHttp.url:', url);
    if (isDebug && proxy) inspector('connectToHttp.proxy:', proxy);
    // Get auth for Header = 'Proxy-Authorization'
    const password = strReplaceEx(proxy.password, '%40', '@');
    const auth = 'Basic ' + Buffer.from(proxy.username + ':' + password).toString('base64');
    headers['Proxy-Authorization'] = auth;
    path = (url.protocol === 'https:') ? `${url.hostname}:443` : url.hostname;
    // HTTP request
    http.request({
      host: proxy.hostname, // IP address of proxy server
      port: proxy.port, // port of proxy server
      method: 'CONNECT',
      path, // some destination, add 443 port for https! e.g. 'kinopoisk.ru:443'
      headers,
      timeout: 2000
    }).on('connect', (res, socket) => {
      if (isDebug && res) console.info('connectToHttp.statusCode:', res.statusCode);
      if (isDebug && res) inspector('connectToHttp.statusMessage:', res.statusMessage);
      resolve({ res, socket });
    }).on('error', (err) => {
      if (isDebug && err) console.error('connectToHttp.error:', err);
      reject(`connectToHttp.error: ${err.message}`);
    }).end();
  });
};

/**
 * @method connectToHttps
 * @param {Object|String} url 
 * @param {Object|String} proxy 
 * @returns {Object|Error}
 */
const connectToHttps = (url, proxy) => {
  let path = '', headers = {};
  //-------------------------------------
  // Connect to proxy
  return new Promise((resolve, reject) => {
    if (!loIsObject(url)) url = getParseUrl(url);
    if (!loIsObject(proxy)) proxy = getParseUrl(proxy);

    if (isDebug && url) inspector('connectToHttps.url:', url);
    if (isDebug && proxy) inspector('connectToHttps.proxy:', proxy);
    // Get auth for Header = 'Proxy-Authorization'
    const password = strReplaceEx(proxy.password, '%40', '@');
    const auth = 'Basic ' + Buffer.from(proxy.username + ':' + password).toString('base64');
    headers['Proxy-Authorization'] = auth;
    path = (url.protocol === 'https:') ? `${url.hostname}:443` : url.hostname;
    // HTTP request
    https.request({
      host: proxy.hostname, // IP address of proxy server
      port: proxy.port, // port of proxy server
      method: 'CONNECT',
      path, // some destination, add 443 port for https! e.g. 'kinopoisk.ru:443'
      headers,
      timeout: 2000
    }).on('connect', (res, socket) => {
      if (isDebug && res) console.info('connectToHttps.statusCode:', res.statusCode);
      if (isDebug && res) inspector('connectToHttps.statusMessage:', res.statusMessage);
      resolve({ res, socket });
    }).on('error', (err) => {
      if (isDebug && err) console.error('connectToHttps.error:', err);
      reject(`connectToHttps.error: ${err.message}`);
    }).end();
  });
};


/**
 * @method getHttp // Get HTTP request
 * @param {Object|String} url 
 * @returns {any}
 */
const getHttp = (url) => {
  return new Promise((resolve, reject) => {
    if (!loIsObject(url)) url = getParseUrl(url);
    // HTTPS get request
    const options = {
      timeout: 2000
    };
    http.get(url, options, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf8');
        if (isDebug && chunks.length) console.log('getHttp.data:', data);
        const response = {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data
        };
        resolve(response);
      });
    }).on('error', (err) => {
      if (isDebug && err) console.error('getHttp.error:', err);
      reject(`getHttp.error: ${err.message}`);
    });
  });
};

/**
 * @method getHttps // Get HTTPS request
 * @param {Object|String} url 
 * @param {Object|undefined} socket 
 * @returns {any}
 */
const getHttps = (url, socket) => {
  return new Promise((resolve, reject) => {
    if (!loIsObject(url)) url = getParseUrl(url);
    // HTTPS get request
    const options = {
      timeout: 2000
    };
    if (socket) {
      options.socket = socket;
      options.agent = false;
    }
    https.get(url, options, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf8');
        if (isDebug && chunks.length) console.log('DONE', data);
        const response = {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data
        };
        resolve(response);
      });
    }).on('error', (err) => {
      if (isDebug && err) console.error('getHttps.error:', err);
      reject(`getHttps.error: ${err.message}`);
    });
  });
};

/**
 * @method reqHttp // http.request(url[, options][, callback])
 * @param {String|Object} url 
 * @param {String|Buffer|Uint8Array.} reqData 
 * e.g. {'msg': 'Hello World!'}
 * @param {Object} options 
 * e.g. {method: 'POST', headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(JSON.stringify(reqData))
    }}
 */
const reqHttp = (url, reqData = '', options = {}) => {
  return new Promise((resolve, reject) => {
    if (!loIsObject(url)) url = getParseUrl(url);
    options.hostname = url.hostname;
    options.path = `${url.pathname}${url.search}`;
    options.port = url.port;
    options.timeout = 2000;

    // HTTPS request
    const req = http.request(options, (res) => {
      let chunks = [];
      //--------------
      if (isDebug && res.statusCode) console.log(`reqHttp.statusCode: ${res.statusCode}`);
      if (isDebug && res.headers) inspector('reqHttp.headers:', res.headers);
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const resData = Buffer.concat(chunks).toString('utf8');
        if (isDebug && chunks.length) console.log('getHttp.resData:', resData);
        const response = {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: resData
        };
        resolve(response);
      });
    });
    req.on('error', (err) => {
      if (isDebug && err) console.error(`Problem with request: ${err.message}`);
      reject(`reqHttp.error: ${err.message}`);
    });

    if (reqData) req.write(reqData);
    req.end();
  });
};

/**
 * @method reqHttps // https.request(url[, options][, callback])
 * @param {String|Object} url 
 * @param {String|Buffer|Uint8Array.} reqData 
 * e.g. {'msg': 'Hello World!'}
 * @param {Object} options 
 * e.g. {method: 'POST', headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(JSON.stringify(reqData))
    }}
    e.g. Example using options from tls.connect():
    const options = {
                      hostname: 'encrypted.google.com',
                      port: 443,
                      path: '/',
                      method: 'GET',
                      key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
                      cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
                    };
    options.agent = new https.Agent(options);
    const req = https.request(options, (res) => {
      // ...
    });
    e.g. Alternatively, opt out of connection pooling by not using an Agent.
    const options = {
                      hostname: 'encrypted.google.com',
                      port: 443,
                      path: '/',
                      method: 'GET',
                      key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
                      cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem'),
                      agent: false
                    };

    const req = https.request(options, (res) => {
  // ...
});
 */
const reqHttps = (url, reqData = '', options = {}) => {
  return new Promise((resolve, reject) => {
    if (!loIsObject(url)) url = getParseUrl(url);
    options.hostname = url.hostname;
    options.path = `${url.pathname}${url.search}`;
    options.port = url.port;
    options.timeout = 2000;

    // HTTPS request
    const req = https.request(options, (res) => {
      let chunks = [];
      //--------------
      if (isDebug && res.statusCode) console.log(`reqHttp.statusCode: ${res.statusCode}`);
      if (isDebug && res.headers) inspector('reqHttp.headers:', res.headers);
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const resData = Buffer.concat(chunks).toString('utf8');
        if (isDebug && chunks.length) console.log('getHttp.resData:', resData);
        const response = {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          data: resData
        };
        resolve(response);
      });
    });
    req.on('error', (err) => {
      if (isDebug && err) console.error(`Problem with request: ${err.message}`);
      reject(`reqHttp.error: ${err.message}`);
    });

    if (reqData) req.write(reqData);
    req.end();
  });
};

/**
 * @method urlExists
 * @async
 * @param {String} target 
 * @returns {Boolean|Error}
 */
const urlExists = async function (target) {
  let url, proxy;
  //----------------
  // Check target
  try {
    url = getParseUrl(target);
  } catch (error) {
    logger.error(`Invalid url ${target}`);
    throw new Error(`Invalid url ${target}`);
  }

  try {
    proxy = getProxy(target);
    if (proxy) {
      const result = await connectToProxy(url);
      await getHttps(url, result.socket);
    } else {
      await axios({ url: url.href, timeout: 2000 });
    }
    return true;
  } catch (error) {
    logger.error(`This URL "${target}" does not exist`);
    throw error;
  }
};


/**
 * @method isUrlExists
 * @async
 * 
 * @param {String} url 
 * @returns {Boolean}
 */
const isUrlExists = async function (url) {
  try {
    await urlExists(url);
    return true;
  } catch (error) {
    return false;
  }
};


module.exports = {
  getProxy,
  connectToProxy,
  connectToHttp,
  connectToHttps,
  getHttp,
  reqHttp,
  getHttps,
  reqHttps,
  urlExists,
  isUrlExists,
};
