/* eslint-disable no-unused-vars */
const assert = require('assert');
const app = require('../../src/app');
const port = app.get('port') || 3030;

const {
  inspector,
  startListenPort,
  stopListenPort,
  getLocalIpAddress,
  getIpAddresses,
  getHostname,
  getMyIp,
  getMyEnvPort,
  checkPort,
  dnsLookup
} = require('../../src/plugins');

const chalk = require('chalk');

const isDebug = false;

describe('<<=== NetOperations: (net-operations.test) ===>>', () => {

  before(function (done) {
    startListenPort(app, done);
  });

  after(function (done) {
    stopListenPort(done);
  });

  it('#1: NET Operations: (getLocalIpAddress)', async () => {
    const localIpAddress = getLocalIpAddress();
    if (isDebug && localIpAddress) inspector('NET Operations: (getLocalIpAddress):localIpAddress', localIpAddress);
    assert.ok(localIpAddress, 'NET Operations: (getLocalIpAddress) not localIpAddress');
  });

  it('#2: NET Operations: (getIpAddresses)', async () => {
    const ipAddress = getIpAddresses();
    if (isDebug && ipAddress) inspector('NET Operations: (getIpAddresses):ipAddress', ipAddress);
    assert.ok(ipAddress, 'NET Operations: (getIpAddresses) not ipAddress');
  });

  it('#3: NET Operations: (getHostname)', async () => {
    const hostname = getHostname();
    if (isDebug && hostname) inspector('NET Operations: (getHostname):hostname', hostname);
    assert.ok(hostname, 'NET Operations: (getHostname) not hostname');
  });

  it('#4: NET Operations: (getMyIp)', async () => {
    const myIp = getMyIp();
    if (isDebug && myIp) inspector('NET Operations: (getMyIp):myIp', myIp);
    assert.ok(myIp, 'NET Operations: (getMyIp) not myIp');
  });

  it('#5: NET Operations: (getMyEnvPort)', async () => {
    const myEnvPort = getMyEnvPort();
    if (isDebug && myEnvPort) inspector('NET Operations: (getMyEnvPort):myEnvPort', myEnvPort);
    assert.ok(myEnvPort, 'NET Operations: (getMyEnvPort) not myEnvPort');
  });

  it('#6: NET Operations: (checkPort)', async () => {

    const portsToCheck = [80, 443, 3030]; 
    const host = 'localhost'; 

    for (const port of portsToCheck) {
      try {
        const openPort = await checkPort(port, host);
        if(isDebug && openPort) console.log(`Port ${openPort} used on the host "${host}"`);
        assert.ok(openPort, 'NET Operations: (checkPort) not myListeningPort');
      } catch (error) {
        if(isDebug && error) console.error(error.message);
        assert.ok(error, `Port ${port} not used on the host ${host}`);
      }
    }
  });

  it('#7: NET Operations: (dnsLookup)', async () => {
    const hostName = getHostname();
    const dnsInfo = await dnsLookup(hostName);
    if (isDebug && dnsInfo) inspector('NET Operations: (dnsLookup):dnsInfo', dnsInfo);
    assert.ok(dnsInfo, 'NET Operations: (dnsLookup) not dnsInfo');
  });
});
