/* eslint-disable no-unused-vars */
const axios = require('axios');
const { curly } = require('node-libcurl');
const http = require('http');
const https = require('https');
const cheerio = require('cheerio');
var minimatch = require('minimatch');
const logger = require('../../logger');
const shouldProxy = require('should-proxy');
const { getParseUrl } = require('./net-operations');

const loIsObject = require('lodash/isPlainObject');

const {
  inspector,
  stripSlashes,
  stripSpecific,
  isTrue,
  strReplaceEx
} = require('./util');

const {
  sortByString,
} = require('./array-operations');

const {
  getPathExtname,
} = require('./file-operations');

const chalk = require('chalk');

const debug = require('debug')('app:http-operations');
const isDebug = false;


//=============================================================================

/**
 * @constant defaultBrowserHeaders  // Standard browser headers
 */
const defaultBrowserHeaders = {
  'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'sec-ch-ua': '\'Chromium\';v=\'109\', \'Not_A Brand\';v=\'99\'',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '\'macOS\'',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15'
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
  let proxy;
  if (!loIsObject(url)) url = getParseUrl(url);
  const isProxy = shouldProxy(url.href, { no_proxy: process.env.no_proxy });

  if (isProxy) {
    proxy = (url.protocol == 'http:') ? process.env.http_proxy : process.env.https_proxy;
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
 * @param {Object} url 
 * @param {Object} proxy 
 */
const connectToProxy = (url) => {
  let proxy, path = '', res = {};
  //-------------------------------------
  // Connect to proxy
  return new Promise((resolve, reject) => {
    if (!loIsObject(url)) url = getParseUrl(url);
    // Get proxy
    proxy = getProxy(url);
    // The request was sent to the wrong server (You don't need a proxy for this address)
    if (!proxy) {
      res.statusCode = 421;
      res.statusMessage = 'Misdirected Request';
      resolve({ res, socket: null });
    }
    if (isDebug && url) inspector('connectToProxy.url:', url);
    if (isDebug && proxy) inspector('connectToProxy.proxy:', proxy);
    // Get auth for Header = 'Proxy-Authorization'
    const password = strReplaceEx(proxy.password, '%40', '@');
    const auth = 'Basic ' + Buffer.from(proxy.username + ':' + password).toString('base64');
    defaultBrowserHeaders['Proxy-Authorization'] = auth;
    path = (url.protocol === 'https:') ? `${url.hostname}:443` : url.hostname;
    // HTTP request
    http.request({
      host: proxy.hostname, // IP address of proxy server
      port: proxy.port, // port of proxy server
      method: 'CONNECT',
      path, // some destination, add 443 port for https! e.g. 'kinopoisk.ru:443'
      headers: defaultBrowserHeaders,
    }).on('connect', (res, socket) => {
      if (isDebug && res) console.info('connectToProxy.statusCode:', res.statusCode);
      if (isDebug && res) inspector('connectToProxy.statusMessage:', res.statusMessage);
      // resolve({ statusCode: res.statusCode, statusMessage: res.statusMessage, socket });
      resolve({ res, socket });
    }).on('error', (err) => {
      console.error('connectToProxy.error:', err);
      reject(`connectToProxy.error: ${err.message}`);
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
    // HTTPS get request
    http.get(url, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf8');
        if (isDebug && chunks.length) console.log('getHttp.data:', data);
        resolve(data);
      });
    }).on('error', (err) => {
      console.error('getHttp.error:', err);
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
      host: url.hostname,
      path: `${url.pathname}${url.search}`  // specify path to get from server
    };
    if (socket) {
      options.socket = socket;
      options.agent = false;
    }
    https.get(options, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf8');
        if (isDebug && chunks.length) console.log('DONE', data);
        resolve(data);
      });
    }).on('error', (err) => {
      console.error('getHttps.error:', err);
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

    // HTTPS request
    const req = http.request(options, (res) => {
      let chunks = [];
      //--------------
      if(isDebug && res.statusCode) console.log(`reqHttp.statusCode: ${res.statusCode}`);
      if(isDebug && res.headers) inspector('reqHttp.headers:', res.headers);
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const resData = Buffer.concat(chunks).toString('utf8');
        if (isDebug && chunks.length) console.log('getHttp.resData:', resData);
        resolve(resData);
      });
    });
    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(`reqHttp.error: ${e.message}`);
    });

    if(reqData) req.write(reqData);
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
    
    // HTTPS request
    const req = https.request(options, (res) => {
      let chunks = [];
      //--------------
      if(isDebug && res.statusCode) console.log(`reqHttp.statusCode: ${res.statusCode}`);
      if(isDebug && res.headers) inspector('reqHttp.headers:', res.headers);
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const resData = Buffer.concat(chunks).toString('utf8');
        if (isDebug && chunks.length) console.log('getHttp.resData:', resData);
        resolve(resData);
      });
    });
    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(`reqHttp.error: ${e.message}`);
    });
    
    if(reqData) req.write(reqData);
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
      await getHttp(url);
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


/**
 * @method httpGetNewFileFromDir
 * @param {String} url 
 * @returns {Object}
 */
const httpGetNewFileFromDir = async function (url) {
  let result = null;
  //-----------------------
  // Get fileNames from target 
  url = stripSlashes(url);
  try {
    await urlExists(url);
    let response = await axios.get(url);
    let data = response.data;
    const $ = cheerio.load(data);
    let filenames = [];
    $('pre a').each(function () {
      filenames.push($(this).text());
    });
    filenames = filenames.filter(item => !(item.includes('[') && item.includes(']')));
    filenames = sortByString(filenames, false);
    if (isDebug && filenames.length) inspector('httpGetLastFileFromDir.filenames:', filenames);
    // Get content from last file
    if (filenames.length) {
      url = `${url}/${filenames[0]}`;
      response = await axios.get(url);
      data = response.data;
      if (isDebug && data) inspector(`httpGetLastFileFromDir (${filenames[0]}):`, data);
      result = { name: filenames[0], data };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('error:'), 'http-operations.httpGetNewFileFromDir.url:', chalk.cyan(`Url "${url}" does not exist!`));
    } else {
      console.log(chalk.red('error:'), 'http-operations.httpGetNewFileFromDir.url:', chalk.cyan(`${error.message}!`));
    }
  }
  return result;
};

/**
 * @method httpGetFileNamesFromDir
 * @param {String} url 
 * @param {String} pattern 
 * e.g. '*.xls'
 * @param {Object} options
 * e.g. { matchBase: true }
 * @param {String[]} fileList 
 * @returns {String[]}
 * e.g. [
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/2022/2022-01/DayHist01_23F120_01022022_0000.xls',
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/DayHist01_23F120_02232022_0000.xls',
  'http://192.168.3.5/www_m5/day_reports/m5-1/ACM/23AGR/DayHist01_23F120_02242022_0000.xls'
]
 */
const httpGetFileNamesFromDir = async function (url, pattern = '', options = {}, fileList = []) {
  let result = null;
  //-----------------------
  // Get fileNames from url 
  url = stripSlashes(url);
  try {
    await urlExists(url);
    let response = await axios.get(url);
    let data = response.data;
    const $ = cheerio.load(data);
    let filenames = [];
    $('pre a').each(function () {
      filenames.push($(this).text());
    });
    if (isDebug && filenames.length) inspector('httpGetFileNamesFromDir.filenames:', filenames);
    filenames = filenames.filter(item => !(item.includes('[') && item.includes(']')));
    filenames = sortByString(filenames, true);
    if (isDebug && filenames.length) inspector('httpGetFileNamesFromDir.filter.filenames:', filenames);

    for (let index = 0; index < filenames.length; index++) {
      const item = filenames[index];
      const extname = getPathExtname(item);
      if (extname) {
        fileList.push(`${url}/${item}`);
      } else {
        await httpGetFileNamesFromDir(`${url}/${item}`, pattern, options, fileList);
      }
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('error:'), 'http-operations.httpGetFileNamesFromDir.url:', chalk.cyan(`Url "${url}" does not exist!`));
    } else {
      console.log(chalk.red('error:'), 'http-operations.httpGetFileNamesFromDir.url:', chalk.cyan(`${error.message}!`));
    }
  }
  if (isDebug && fileList.length) inspector('httpGetFileNamesFromDir.fileList:', fileList);
  if (pattern) {
    fileList = minimatch.match(fileList, pattern, options);
    if (isDebug && fileList.length) inspector('httpGetFileNamesFromDir.minimatch.fileList:', fileList);
  }
  return fileList;
};

/**
 * @method httpGetFileFromUrl
 * @param {Object} params 
 * e.g. {
  url: 'http://bit.ly/2mTM3nY', 
  method: 'get',
  responseType: 'stream'
}
`url` is the server URL that will be used for the request
e.g.  url: '/user',
`method` is the request method to be used when making the request
options are -> axios#create([config]); axios#request(config); axios#get(url[, config]); axios#delete(url[, config]); axios#head(url[, config]); 
axios#options(url[, config]); axios#post(url[, data[, config]]); axios#put(url[, data[, config]]); axios#patch(url[, data[, config]])
e.g. method: 'get', // default
`responseType` indicates the type of data that the server will respond with
options are -> 'arraybuffer', 'blob', 'document', 'json', 'text', 'stream'
e.g. responseType: 'json', // default
e.g. responseType: 'stream' -> response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
 * @returns {Object}
 */
const httpGetFileFromUrl = async function (params = {}) {
  let result = null, response, url;
  //-----------------------
  try {
    // Get url
    params.url = stripSlashes(params.url);
    await urlExists(params.url);
    // Get data
    response = await axios(params);
    result = response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('error:'), 'http-operations.httpGetFileFromUrl.url:', chalk.cyan(`Url "${url}" does not exist!`));
    } else {
      console.log(chalk.red('error:'), 'http-operations.httpGetFileFromUrl.url:', chalk.cyan(`${error.message}!`));
    }
  }
  return result;
};

module.exports = {
  getProxy,
  connectToProxy,
  getHttp,
  reqHttp,
  getHttps,
  reqHttps,
  urlExists,
  isUrlExists,
  httpGetNewFileFromDir,
  httpGetFileNamesFromDir,
  httpGetFileFromUrl
};
