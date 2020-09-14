const assert = require('assert');
const axios = require('axios');
const url = require('url');
const app = require('../src/app');
const debug = require('debug')('app:app.test');

const isDebug = false;

const port = app.get('port') || 3030;
const getUrl = pathname => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

describe('Feathers application tests', () => {
  let server;

  before(function(done) {
    server = app.listen(port);
    server.once('listening', () => done());
    debug('before: done')
  });

  after(function(done) {
    server.close(done);
    debug('after: done')
  });

  it('starts and shows the index page', async () => {
    const { data } = await axios.get(getUrl());

    assert.ok(data.indexOf('<html lang="en">') !== -1);
  });

  describe('404', function() {
    it('shows a 404 HTML page', async () => {
      try {
        await axios.get(getUrl('path/to/nowhere'), {
          headers: {
            'Accept': 'text/html'
          }
        });
        assert.fail('should never get here');
      } catch (error) {
        const { response } = error;
        if(isDebug) debug('shows a 404 HTML page.response:', response);
        assert.strictEqual(response.status, 404);
        assert.ok(response.data.indexOf('<html>') !== -1);
      }
    });

    it('shows a 404 JSON error without stack trace', async () => {
      try {
        await axios.get(getUrl('path/to/nowhere'), {
          json: true
        });
        assert.fail('should never get here');
      } catch (error) {
        const { response } = error;
        assert.strictEqual(response.status, 404);
        assert.strictEqual(response.data.code, 404);
        assert.strictEqual(response.data.message, 'Page not found');
        assert.strictEqual(response.data.name, 'NotFound');
      }
    });
  });
});
