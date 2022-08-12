/* eslint-disable no-unused-vars */
const assert = require('assert');
const {
  appRoot,
  inspector,
  logger,
  objectHash,
  AuthServer,
  checkServicesRegistered,
  saveFakesToServices,
  fakeNormalize,
} = require('../../src/plugins');

const {
  dbNullIdValue,
  getCountItems,
  createItem,
  getMaxValuesStorage,
  getStorePeriod
} = require('../../src/plugins/db-helpers');

const constraints = require(`${appRoot}/src/hooks/constraints`);
const app = require(`${appRoot}/src/app`);
const debug = require('debug')('app:constraints.test');

const isDebug = false;
const isLog = false;
const isTest = true;
const isSeed = true;

// Get generated fake data
const fakes = fakeNormalize();
const roleGuest = fakes['roles'].find(role => role.alias === 'isGuest');

// Get max rows for log-messages service
let maxLogRows = process.env.LOGMSG_MAXROWS;
maxLogRows = Number.isInteger(maxLogRows) ? maxLogRows : Number.parseInt(maxLogRows);

describe('<<=== Constraints Hook Test (constraints.unit.test.js) ===>>', () => {

  if (!isTest) {
    debug('<< Test /hooks/constraints.unit.test.js - NOT >>');
    return;
  }

  // eslint-disable-next-line no-unused-vars
  let contextBefore, contextAfterPaginated,
    // eslint-disable-next-line no-unused-vars
    contextAfter, contextAfterMultiple;

  beforeEach(() => {
    contextBefore = {
      app,
      type: 'before',
      params: { provider: 'socketio' },
      data: {}
    };

    contextAfter = {
      app,
      type: 'after',
      params: { provider: 'socketio' },
      result: {}
    };

    contextAfterMultiple = {
      app,
      type: 'after',
      params: { provider: 'socketio' },
      result: []
    };

    contextAfterPaginated = {
      app,
      type: 'after',
      method: 'find',
      params: { provider: 'socketio' },
      result: {
        data: []
      }
    };
    contextAfterPaginated.result.total = contextAfterPaginated.result.data.length;
  });

  describe('<--- Save fake data to services --->', function () {
    if (isSeed) {
      it('#1: Registered the all services', () => {
        const errPath = checkServicesRegistered(app);
        assert.ok(errPath === '', `Service '${errPath}' not registered`);
      });

      it('#2: Save fakes to services', async () => {
        const errPath = await saveFakesToServices(app);
        assert.ok(errPath === '', `Not save fakes to services - '${errPath}'`);
      });
    }
  });

  describe('<--- Run constraints.unit.test --->', function () {
    it('#3: Constraints hook exists', () => {
      assert(typeof constraints === 'function', 'Hook is not a function.');
    });

    it('#4: Relationship error while deleting record from \'user-profiles\' service', async () => {
      try {

        const rec = fakes['users'][0];
        const idFieldUser = 'id' in rec ? 'id' : '_id';
        const profileId = rec.profileId;
        const service = app.service('user-profiles');

        contextBefore.path = 'user-profiles';
        contextBefore.method = 'remove';
        contextBefore.service = service;
        contextBefore.id = {
          [idFieldUser]: profileId
        };
        await constraints(true)(contextBefore);
        assert.ok(false, 'Protection did not work to write the data to service');
      } catch (ex) {
        if (isDebug) debug('Relationship error while deleting record from \'user-profiles\' service:', ex);
        // debug('Relationship error while deleting record from \'user-profiles\' service:', ex);
        // assert.ok(true);
        assert.strictEqual(ex.code, 400, 'unexpected error.code');
        assert.strictEqual(ex.message, 'Error deleting item from \'user-profiles\' service. You can not delete an item if it is referenced by other services.');
        assert.strictEqual(ex.name, 'BadRequest', 'unexpected error.name');
      }
    });

    it('#5: Error creating unique values for \'userTeams\' service', async () => {
      try {
        const rec = fakes['userTeams'][0];
        const service = app.service('user-teams');

        contextBefore.path = 'user-teams';
        contextBefore.method = 'create';
        contextBefore.service = service;
        contextBefore.data = {
          teamId: rec['teamId'],
          userId: rec['userId']
        };
        await constraints(true)(contextBefore);
        assert.ok(false, 'Protection did not work to write the unique data to service');
      } catch (ex) {
        if (isDebug) debug('Error unique values for \'userTeams\' service:', ex);
        assert.strictEqual(ex.code, 400, 'unexpected error.code');
        assert.strictEqual(ex.message, 'Values must be unique', 'unexpected error.message');
        assert.strictEqual(ex.name, 'BadRequest', 'unexpected error.name');
      }
    });

    it('#6: Relationship error while creating record for \'userTeams\' service', async () => {
      try {

        const rec = fakes['teams'][0];
        const idFieldTeam = 'id' in rec ? 'id' : '_id';
        const teamId = rec[idFieldTeam];
        const userId = dbNullIdValue();
        const service = app.service('user-teams');

        contextBefore.path = 'user-teams';
        contextBefore.method = 'create';
        contextBefore.service = service;
        contextBefore.data = {
          teamId: teamId,
          userId: userId
        };
        await constraints(true)(contextBefore);
        assert.ok(false, 'Protection did not work to write the data to service');
      } catch (ex) {
        if (isDebug) debug('Relationship error while creating record for \'userTeams\' service:', ex);
        const userId = dbNullIdValue();
        assert.strictEqual(ex.code, 404, 'unexpected error.code');
        assert.strictEqual(ex.message, `No record found for id '${userId}'`);
        assert.strictEqual(ex.name, 'NotFound', 'unexpected error.name');
      }
    });

    it('#7: Relationship error while creating record for \'userTeams\' service', async () => {
      try {

        const rec = fakes['users'][0];
        const idFieldUser = 'id' in rec ? 'id' : '_id';
        const userId = rec[idFieldUser];
        const teamId = dbNullIdValue();
        const service = app.service('user-teams');

        contextBefore.path = 'user-teams';
        contextBefore.method = 'create';
        contextBefore.service = service;
        contextBefore.data = {
          teamId: teamId,
          userId: userId
        };
        await constraints(true)(contextBefore);
        assert.ok(false, 'Protection did not work to write the data to service');
      } catch (ex) {
        if (isDebug) debug('Relationship error while creating record for \'userTeams\' service:', ex);
        const teamId = dbNullIdValue();
        assert.strictEqual(ex.code, 404, 'unexpected error.code');
        assert.strictEqual(ex.message, `No record found for id '${teamId}'`);
        assert.strictEqual(ex.name, 'NotFound', 'unexpected error.name');
      }
    });

    it('#8: Relationship error while patching record for \'users\' service', async () => {
      try {

        const rec = fakes['users'][0];
        const idFieldUser = 'id' in rec ? 'id' : '_id';
        const userId = rec[idFieldUser];
        const roleId = dbNullIdValue();
        const service = app.service('users');

        contextBefore.path = 'users';
        contextBefore.method = 'patch';
        contextBefore.service = service;
        contextBefore.data = {
          [idFieldUser]: userId,
          roleId: roleId
        };
        await constraints(true)(contextBefore);
        assert.ok(false, 'Protection did not work to write the data to service');
      } catch (ex) {
        if (isDebug) debug('Relationship error while patching record for \'users\' service:', ex);
        const roleId = dbNullIdValue();
        assert.strictEqual(ex.code, 404, 'unexpected error.code');
        assert.strictEqual(ex.message, `No record found for id '${roleId}'`);
        assert.strictEqual(ex.name, 'NotFound', 'unexpected error.name');
      }
    });

    it('#9: Error when removing a base record from \'roles\' service', async () => {

      const recAdmin = fakes['roles'].find(function (role) {
        return (role.name === AuthServer.getRoles('isAdministrator'));
      });

      const recGuest = fakes['roles'].find(function (role) {
        return (role.name !== AuthServer.getRoles('isGuest'));
      });

      const idFieldRole = 'id' in recAdmin ? 'id' : '_id';
      const roleAdminId = recAdmin[idFieldRole];
      const roleGuestId = recGuest[idFieldRole];

      try {
        contextBefore.path = 'roles';
        contextBefore.method = 'remove';
        contextBefore.service = app.service('roles');
        contextBefore.id = {
          [idFieldRole]: roleAdminId
        };
        await constraints(true)(contextBefore);
        assert.ok(false, 'Protection did not work to remove the data from service');
      } catch (ex) {
        if (isDebug) debug('Error when removing a Admin base record from \'roles\' service', ex);
        assert.strictEqual(ex.code, 400, 'unexpected error.code');
        assert.strictEqual(ex.message, 'Error deleting item from \'roles\' service. You can not delete an item if it is base role.');
        assert.strictEqual(ex.name, 'BadRequest', 'unexpected error.name');
      }

      try {
        contextBefore.path = 'roles';
        contextBefore.method = 'remove';
        contextBefore.service = app.service('roles');
        contextBefore.id = {
          [idFieldRole]: roleGuestId
        };
        await constraints(true)(contextBefore);
        assert.ok(false, 'Protection did not work to remove the data from service');
      } catch (ex) {
        if (isDebug) debug('Error when removing a Guest base record from \'roles\' service', ex);
        assert.strictEqual(ex.code, 400, 'unexpected error.code');
        assert.strictEqual(ex.message, 'Error deleting item from \'roles\' service. You can not delete an item if it is base role.');
        assert.strictEqual(ex.name, 'BadRequest', 'unexpected error.name');
      }
    });

    it('#10: Set contextBefore.alias while creating record for \'roles\' service', async () => {
      const service = app.service('roles');
      contextBefore.path = 'roles';
      contextBefore.method = 'create';
      contextBefore.service = service;
      contextBefore.data = {
        name: 'My super role',
        description: 'Description for my super role',
      };
      await constraints(true)(contextBefore);
      if (isDebug) debug('Set contextBefore.alias while creating record for \'roles\' service.contextBefore:', contextBefore.data);
      assert.ok(contextBefore.data.alias, 'Protection did not work to write the data to service');
    });

    it('#11: Set contextBefore.alias while creating record for \'teams\' service', async () => {
      const service = app.service('roles');
      contextBefore.path = 'teams';
      contextBefore.method = 'create';
      contextBefore.service = service;
      contextBefore.data = {
        name: 'My super team',
        description: 'Description for my super team',
      };
      await constraints(true)(contextBefore);
      if (isDebug) debug('Set contextBefore.alias while creating record for \'teams\' service.contextBefore:', contextBefore.data);
      assert.ok(contextBefore.data.alias, 'Protection did not work to write the data to service');
    });

    it('#12: Set contextBefore.roleId while creating record for \'users\' service', async () => {
      const service = app.service('users');
      contextBefore.path = 'users';
      contextBefore.method = 'create';
      contextBefore.service = service;
      contextBefore.data = {
        email: 'my_email@test.com',
        password: 'my_email',
        firstName: 'myFirstName',
        lastName: 'myLastName'
      };
      await constraints(true)(contextBefore);
      if (isDebug) debug('Set contextBefore.roleId while creating record for \'users\' service.contextBefore:', contextBefore.data);
      assert.ok(contextBefore.data.roleId, 'Protection did not work to write the data to service');
    });

    it('#13: Set contextBefore.profileId while creating record for \'users\' service', async () => {
      const service = app.service('users');
      contextBefore.path = 'users';
      contextBefore.method = 'create';
      contextBefore.service = service;
      contextBefore.data = {
        email: 'my_email@test.com',
        password: 'my_email',
        firstName: 'myFirstName',
        lastName: 'myLastName'
      };
      await constraints(true)(contextBefore);
      if (isDebug) debug('Set contextBefore.profileId while creating record for \'users\' service.contextBefore:', contextBefore.data);
      assert.ok(contextBefore.data.profileId, 'Protection did not work to write the data to service');
    });

    it('#14: Set contextAfter.roleAlias while creating record for \'users\' service', async () => {
      const idField = 'id' in roleGuest ? 'id' : '_id';
      const service = app.service('users');
      contextAfter.path = 'users';
      contextAfter.method = 'create';
      contextAfter.service = service;
      contextAfter.result = {
        email: 'my_email@test.com',
        password: 'my_email',
        firstName: 'myFirstName',
        lastName: 'myLastName',
        roleId: roleGuest[idField]
      };
      await constraints(true)(contextAfter);
      if (isDebug) debug('Set contextAfter.roleAlias while creating record for \'users\' service.contextAfter:', contextAfter.result);
      assert.ok(contextAfter.result.roleAlias, 'Protection did not work to write the data to service');
    });

    it('#15: Data integrity when removing a record from \'roles\' service', async () => {
      const rec = fakes['roles'].find(function (role) {
        return (role.name !== AuthServer.getRoles('isAdministrator')) && (role.name !== AuthServer.getRoles('isGuest'));
      });

      // const rec = fakes['roles'][0];
      const idFieldRole = 'id' in rec ? 'id' : '_id';
      const roleId = rec[idFieldRole];
      const users = app.service('users');
      const chatMessages = app.service('chat-messages');
      let findUserBefore = await users.find({ query: { roleId: roleId } });
      findUserBefore = findUserBefore.data;
      if (isLog) inspector('Data integrity when removing a record from \'roles\' service.findResultsBefore:', findUserBefore);
      let findChatMessagesBefore = await chatMessages.find({ query: { roleId: roleId } });
      findChatMessagesBefore = findChatMessagesBefore.data;
      if (isLog) inspector('Data integrity when removing a record from \'roles\' service.findChatMessagesBefore:', findChatMessagesBefore);

      // Run constraints hook
      contextAfter.path = 'roles';
      contextAfter.method = 'remove';
      contextAfter.service = app.service('roles');
      contextAfter.result = {
        [idFieldRole]: roleId
      };
      await constraints(true)(contextAfter);

      // Check constraints for 'users'
      let findUserAfter = await users.find({ query: { roleId: roleId } });
      findUserAfter = findUserAfter.data;
      if (isLog) inspector('Data integrity when removing a record from \'roles\' service.findResultsAfter:', findUserAfter);
      assert.ok(findUserBefore.length > findUserAfter.length, 'Protection did not work to removing the data from service');

      // Check constraints for 'chat-messages'
      let findChatMessagesAfter = await chatMessages.find({ query: { roleId: roleId } });
      findChatMessagesAfter = findChatMessagesAfter.data;
      if (isLog) inspector('Data integrity when removing a record from \'roles\' service.findChatMessagesAfter:', findChatMessagesAfter);
      assert.ok(findChatMessagesBefore.length > findChatMessagesAfter.length, 'Protection did not work to removing the data from service');
    });

    it('#16: Data integrity when removing a record from \'teams\' service', async () => {
      let teamId = null;
      let findUserTeamsBefore = null;
      let findChatMessagesBefore = null;
      const rec = fakes['teams'][0];
      const idFieldTeam = 'id' in rec ? 'id' : '_id';
      const userTeams = app.service('user-teams');
      const chatMessages = app.service('chat-messages');

      // Team handle
      const _teamHandle = async team => {
        const _teamId = team[idFieldTeam];
        const _findUserTeamsBefore = await userTeams.find({ query: { teamId: _teamId } });
        const _findChatMessagesBefore = await chatMessages.find({ query: { teamId: _teamId } });
        if (!teamId && _findUserTeamsBefore.data.length && _findChatMessagesBefore.data.length) {
          teamId = _teamId;
          findUserTeamsBefore = _findUserTeamsBefore;
          if (isLog && _findUserTeamsBefore.data.length) inspector('Data integrity when removing a record from \'teams\' service.findResultsBefore:', _findUserTeamsBefore.data);
          findChatMessagesBefore = _findChatMessagesBefore;
          if (isLog && _findChatMessagesBefore.data.length) inspector('Data integrity when removing a record from \'teams\' service.findChatMessagesBefore:', _findChatMessagesBefore.data);

          // Run constraints hook
          contextAfter.path = 'teams';
          contextAfter.method = 'remove';
          contextAfter.service = app.service('teams');
          contextAfter.result = {
            [idFieldTeam]: teamId
          };

          await constraints(true)(contextAfter);

          // Check constraints
          const findUserTeamsAfter = await userTeams.find({ query: { teamId: teamId } });
          if (isLog) inspector('Data integrity when removing a record from \'teams\' service.findResultsAfter:', findUserTeamsAfter.data);
          assert.ok(findUserTeamsBefore.data.length > findUserTeamsAfter.data.length, 'Protection did not work to removing the data from service');
          const findChatMessagesAfter = await chatMessages.find({ query: { teamId: teamId } });
          if (isLog) inspector('Data integrity when removing a record from \'teams\' service.findChatMessagesAfter:', findChatMessagesAfter.data);
          assert.ok(findChatMessagesBefore.data.length > findChatMessagesAfter.data.length, 'Protection did not work to removing the data from service');
        }
      };

      // Find a team that is present in userTeams service
      for (let i = 0; i < fakes['teams'].length; i++) {
        const team = fakes['teams'][i];
        await _teamHandle(team);
      }
      if (!teamId) {
        assert.ok(false, 'Was not found \'userTeams\' for any team');
      }
    });

    it('#17: Data integrity when removing a record from \'users\' service', async () => {
      const index = fakes['users'].length - 1;
      const rec = fakes['users'][index];
      const idFieldUser = 'id' in rec ? 'id' : '_id';
      const userId = rec[idFieldUser];
      const profileId = rec.profileId;
      // Get services
      const userTeams = app.service('user-teams');
      const userProfiles = app.service('user-profiles');
      const chatMessages = app.service('chat-messages');

      // Get before services
      const findUserTeamsBefore = await userTeams.find({ query: { userId: userId } });
      if (isLog) inspector('Data integrity for \'user-teams\' service, when removing a record from \'users\' service.findUserTeamsBefore:', findUserTeamsBefore.data);
      const findUserProfilesBefore = await userProfiles.find({ query: { [idFieldUser]: profileId } });
      if (isLog) inspector('Data integrity for \'user-profiles\' service, when removing a record from \'users\' service.findUserProfilesBefore:', findUserProfilesBefore.data);
      const findChatMessagesBefore = await chatMessages.find({ query: { $or: [{ ownerId: userId }, { userId: userId }] } });
      if (isLog) inspector('Data integrity for \'chat-messages\' service, when removing a record from \'users\' service.findChatMessagesBefore:', findChatMessagesBefore.data);

      // Run constraints hook
      contextAfter.path = 'users';
      contextAfter.method = 'remove';
      contextAfter.service = app.service('users');
      contextAfter.result = {
        [idFieldUser]: userId,
        profileId: profileId,
        roleAlias: roleGuest.alias
      };
      await constraints(true)(contextAfter);

      // Check constraints
      const findUserTeamsAfter = await userTeams.find({ query: { userId: userId } });
      if (isLog) inspector('Data integrity for \'user-teams\' service, when removing a record from \'users\' service.findUserTeamsAfter:', findUserTeamsAfter.data);
      assert.ok(findUserTeamsBefore.data.length > findUserTeamsAfter.data.length, 'Protection did not work to removing the data from service');
      const findUserProfilesAfter = await userProfiles.find({ query: { [idFieldUser]: profileId } });
      if (isLog) inspector('Data integrity for \'user-profiles\' service, when removing a record from \'users\' service.findUserProfilesAfter:', findUserProfilesAfter.data);
      assert.ok(findUserProfilesBefore.data.length > findUserProfilesAfter.data.length, 'Protection did not work to removing the data from service');
      const findChatMessagesAfter = await chatMessages.find({ query: { $or: [{ ownerId: userId }, { userId: userId }] } });
      if (isLog) inspector('Data integrity for \'chat-messages\' service, when removing a record from \'users\' service.findChatMessagesAfter:', findChatMessagesAfter.data);
      assert.ok(findChatMessagesBefore.data.length > findChatMessagesAfter.data.length, 'Protection did not work to removing the data from service');
    });

    it('#18.1: Set contextBefore.tagId while creating record for \'opcua-values\' service', async () => {
      // Get opcuaTag
      const groupTag = fakes['opcuaTags'].find(t => t.browseName === 'CH_M51::ValueFromFile');
      const storeTag = fakes['opcuaTags'].find(t => t.ownerGroup === groupTag.browseName);
      const idField = 'id' in groupTag ? 'id' : '_id';
      const tagId = groupTag[idField];

      const service = app.service('opcua-values');
      contextBefore.path = 'opcua-values';
      contextBefore.method = 'create';
      contextBefore.service = service;
      contextBefore.data = {
        tagName: groupTag.browseName,
        opcuaData: [
          {
            key: storeTag.browseName,
            value: 123
          }
        ]
      };
      await constraints(true)(contextBefore);
      if (isDebug && contextBefore) debug('Set contextBefore.tagId while creating record for \'opcua-values\' service.contextBefore:', contextBefore.data);
      assert.ok(contextBefore.data.tagId === tagId, 'Protection did not work to write the data to service');
    });

    it('#19: Restrict max rows when add a group value to \'opcua-values\' service', async () => {
      let opcuaValuesCount = 0, serviceName = '', serviceResult = {};
      //--------------------------------------------------------------
      // Get opcua tags
      const opcuaTags = fakes['opcuaTags'];
      // Get group tag 
      const groupTag = opcuaTags.find(t => t.group);
      const idField = 'id' in groupTag ? 'id' : '_id';
      const tagId = groupTag[idField];
      const tagName = groupTag['browseName'];
      // Get child group tags
      const childGroupTags = opcuaTags.filter(t => t.ownerGroup === groupTag.browseName);
      const childGroupTag1 = childGroupTags[0];
      const tagName1 = childGroupTag1.browseName;
      const unitRange1 = childGroupTag1.valueParams.engineeringUnitsRange;
      const tagvalue1 = (unitRange1.high - unitRange1.low) / 2;
      const childGroupTag2 = childGroupTags[1];
      const tagName2 = childGroupTag2.browseName;
      const unitRange2 = childGroupTag2.valueParams.engineeringUnitsRange;
      const tagvalue2 = (unitRange2.high - unitRange2.low) / 2;
      // Get value data 
      const valueData = {
        tagId, tagName, opcuaData: [
          {
            key: tagName1,
            value: tagvalue1
          },
          {
            key: tagName2,
            value: tagvalue2
          }
        ]
      };
      // Get count items
      serviceName = 'opcua-values';
      opcuaValuesCount = await getCountItems(app, serviceName, { tagId });
      if (isDebug && opcuaValuesCount) debug('BeforeAdding.opcuaValuesCount:', opcuaValuesCount);
      // Create items
      const maxOpcuaValuesRows = await getMaxValuesStorage(app, tagId);
      for (let index = 0; index < maxOpcuaValuesRows + 1; index++) {
        await createItem(app, serviceName, valueData);
      }
      // Get count items
      opcuaValuesCount = await getCountItems(app, serviceName, { tagId });
      if (isDebug && opcuaValuesCount) debug('AfterAdding.opcuaValuesCount:', opcuaValuesCount);

      // Run constraints hook
      contextAfter.path = serviceName;
      contextAfter.method = 'create';
      contextAfter.service = app.service(serviceName);
      contextAfter.result = valueData;
      await constraints(true)(contextAfter);

      // Get count items
      opcuaValuesCount = await getCountItems(app, serviceName, { tagId });
      if (isDebug && opcuaValuesCount) debug('AfterConstraintsHook.opcuaValuesCount:', opcuaValuesCount);

      assert.ok(opcuaValuesCount === maxOpcuaValuesRows, `Restrict max rows when add a group value to 'opcua-values' service:(${opcuaValuesCount}=${maxOpcuaValuesRows})`);
    });

    it('#20: Restrict max rows when add a store value to \'opcua-values\' service', async () => {
      let opcuaValuesCount = 0, serviceName = '', serviceResult = {};
      //--------------------------------------------------------------
      // Get opcua tags
      const opcuaTags = fakes['opcuaTags'];
      // Get group tag 
      const groupTag = opcuaTags.find(t => t.group && !!t.store);
      if (isDebug && groupTag) inspector('Restrict max rows when add a store value to \'opcua-values\' service.groupTag:', groupTag);
      const idField = 'id' in groupTag ? 'id' : '_id';
      // Get store tags
      const storeTags = opcuaTags.filter(t => (t.ownerGroup === groupTag.browseName));
      for (let index = 0; index < storeTags.length; index++) {
        const storeTag = storeTags[index];
        if (isDebug && storeTag) inspector('Restrict max rows when add a store value to \'opcua-values\' service.storeTag:', storeTag);
        const tagId = storeTag[idField];
        const tagName = storeTag['browseName'];
        const unitRange = storeTag.valueParams.engineeringUnitsRange;
        const tagValue = (unitRange.high - unitRange.low) / 2;

        // Get value data 
        let valueData = {
          tagId,
          tagName,
          storeStart: '2022-01-01',
          storeEnd: '2022-01-01',
          opcuaData: [
            {
              key: '2022-01-01',
              value: tagValue
            }
          ]
        };

        // Get count items
        serviceName = 'opcua-values';
        opcuaValuesCount = await getCountItems(app, serviceName, { tagId });
        if (isDebug && opcuaValuesCount) debug('BeforeAdding.opcuaValuesCount:', opcuaValuesCount);
        // Create items
        let maxOpcuaValuesRows = 10;
        for (let index = 3; index < maxOpcuaValuesRows + 1; index++) {
          const day = (index >= 10)? `${index}` : `0${index}`; 
          valueData.storeStart = `2022-01-${day}`;
          valueData.storeEnd = `2022-01-${day}`;
          valueData.opcuaData[0]['key'] = `2022-01-${day}`;
          const createdItem = await createItem(app, serviceName, valueData, { $select: ['tagName', 'storeStart', 'storeEnd'] });
          if (isDebug && createdItem) inspector('Restrict max rows when add a store value to \'opcua-values\' service.createdItem:', createdItem);
        }
        // Get count items
        opcuaValuesCount = await getCountItems(app, serviceName, { tagId });
        if (isDebug && opcuaValuesCount) debug('AfterAdding.opcuaValuesCount:', opcuaValuesCount);
        // Get real max opcua value rows
        maxOpcuaValuesRows = await getMaxValuesStorage(app, tagId);

        // Run constraints hook
        contextAfter.path = serviceName;
        contextAfter.method = 'create';
        contextAfter.service = app.service(serviceName);
        contextAfter.result = valueData;
        await constraints(true)(contextAfter);

        // Get count items
        opcuaValuesCount = await getCountItems(app, serviceName, { tagId });
        if (isDebug && opcuaValuesCount) debug('AfterConstraintsHook.opcuaValuesCount:', opcuaValuesCount);

        assert.ok(opcuaValuesCount === maxOpcuaValuesRows, `Restrict max rows when add a store value to 'opcua-values' service:(${opcuaValuesCount}=${maxOpcuaValuesRows})`);
      }
    });

    it('#21: Data integrity when removing a record from \'opcua-tags\' service', async () => {
      const index = fakes['opcuaTags'].length - 1;
      const rec = fakes['opcuaTags'][index];
      const idField = 'id' in rec ? 'id' : '_id';
      const tagId = rec[idField];
      // Get service
      const opcuaValues = app.service('opcua-values');

      // Get before services
      const findOpcuaValuesBefore = await opcuaValues.find({ query: { tagId: tagId } });
      if (isLog) inspector('Data integrity for \'opcua-values\' service, when removing a record from \'opcua-tags\' service.findOpcuaValuesBefore:', findOpcuaValuesBefore.data);

      // Run constraints hook
      contextAfter.path = 'opcua-tags';
      contextAfter.method = 'remove';
      contextAfter.service = app.service('opcua-tags');
      contextAfter.result = {
        ...rec
      };
      await constraints(true)(contextAfter);

      // Check constraints
      const findOpcuaValuesAfter = await opcuaValues.find({ query: { tagId: tagId } });
      if (isLog) inspector('Data integrity for \'opcua-values\' service, when removing a record from \'opcua-tags\' service.findOpcuaValuesAfter:', findOpcuaValuesAfter.data);
      assert.ok(findOpcuaValuesBefore.data.length > findOpcuaValuesAfter.data.length, 'Protection did not work to removing the data from service');
    });
  });
});
