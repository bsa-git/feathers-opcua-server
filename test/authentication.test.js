const assert = require('assert');
const app = require('../src/app');
const debug = require('debug')('app:authentication.test');

const isDebug = false;

describe('<<=== Authentication Tests (authentication.test.js) ===>>', () => {
  
  it('#1 Registered the authentication service', () => {
    assert.ok(app.service('authentication'));
  });
  
  describe('<<--- Local strategy --->>', () => {
    const userInfo = {
      email: 'authenticationTest@example.com',
      password: 'supersecret'
    };

    before(async () => {
      try {
        const newUser =  await app.service('users').create(userInfo);
        if(isDebug) debug('newUser:', newUser);
      } catch (error) {
        // Do nothing, it just means the user already exists and can be tested
      }
    });

    it('#2 Authenticates user and creates accessToken', async () => {
      const { user, accessToken } = await app.service('authentication').create({
        strategy: 'local',
        ...userInfo
      });
      assert.ok(accessToken, 'Created access token for user');
      assert.ok(user, 'Includes user in authentication data');
    });
  });
});
