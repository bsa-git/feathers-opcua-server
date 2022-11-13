const assert = require('assert');
const axios = require('axios');
const app = require('../../src/app');
const port = app.get('port') || 3030;
const { getURL } = require('../../src/plugins');

const debug = require('debug')('app:app.test');
const isDebug = false;

describe('<<=== Feathers Application Tests (app.test.js) ===>>', () => {
  let server;

  before(function (done) {
    server = app.listen(port);
    server.once('listening', () => done());
    debug('before: done');
  });

  after(function (done) {
    server.close(done);
    debug('after: done');
  });

  it('#1: Starts and shows the index page', async () => {
    const { data } = await axios.get(getURL());
    assert.ok(data.indexOf('<html lang="en">') !== -1);
  });

  describe('<<--- 404 --->>', function () {
    it('#2: Shows a 404 HTML page', async () => {
      try {
        await axios.get(getURL('path/to/nowhere'), {
          headers: {
            'Accept': 'text/html'
          }
        });
        assert.fail('Should never get here');
      } catch (error) {
        const { response } = error;
        if (isDebug) debug('Shows a 404 HTML page.response:', response);
        assert.strictEqual(response.status, 404);
        assert.ok(response.data.indexOf('<html>') !== -1);
      }
    });

    it('#3: Shows a 404 JSON error without stack trace', async () => {
      try {
        await axios.get(getURL('path/to/nowhere'), {
          json: true
        });
        assert.fail('Should never get here');
      } catch (error) {
        const { response } = error;
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.data.code, 404);
        assert.strictEqual(response.data.message, 'Page not found');
        assert.strictEqual(response.data.name, 'NotFound');
      }
    });
  });

  describe('<<--- Test authentication config --->>', function () {
    const config = app.get('authentication');
    it('#4: Set config.authentication.local.usernameField = "email"', () => {
      assert.ok(config.local.usernameField === 'email', 'config.local.usernameField does not match the value "email"');
    });
    it('#5: Set config.authentication.google.clientID', () => {
      assert.ok(config.oauth.google.key === process.env.GOOGLE_ID, 'config.authentication.google.clientID does not match the value "process.env.GOOGLE_ID"');
    });
    it('#6: Set config.authentication.google.clientSecret', () => {
      assert.ok(config.oauth.google.secret === process.env.GOOGLE_SECRET, 'config.authentication.google.clientSecret does not match the value "process.env.GOOGLE_SECRET"');
    });
    it('#7: Set config.authentication.github.clientID', () => {
      assert.ok(config.oauth.github.key === process.env.GITHUB_ID, 'config.authentication.github.clientID does not match the value "process.env.GITHUB_ID"');
    });
    it('#8: Set config.authentication.github.clientSecret', () => {
      assert.ok(config.oauth.github.secret === process.env.GITHUB_SECRET, 'config.authentication.github.clientSecret does not match the value "process.env.GITHUB_SECRET"');
    });
  });
});
