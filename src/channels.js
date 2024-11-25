/* eslint-disable no-unused-vars */
const Channel = require('./plugins/auth/channel.class');
const Auth = require('./plugins/auth/auth-server.class');
const { dbNullIdValue } = require('./plugins/lib');
const {
  getChannelsWithReadAbility,
  makeOptions
} = require('feathers-casl').channels;
const loConcat = require('lodash/concat');

const debug = require('debug')('app:channels');
const isDebug = true;

module.exports = function (app) {
  if (typeof app.channel !== 'function' || Channel.isTest()) {
    // If no real-time functionality has been configured just return
    return;
  }

  const caslOptions = makeOptions(app);

  /**
   * Join a channel given a user and connection
   * @param connection
   * @return {Promise<void>}
   */
  const joinChannels = async (connection) => {

    if (connection && connection.user) {

      // Get object of Channel
      const channel = new Channel(app, connection);

      // Join connection for authenticated users
      app.channel('authenticated').join(connection);

      // Join connection for admins
      if (channel.isAdmin()) {
        app.channel('admins').join(connection);
      }

      // Join connection for user.email
      app.channel(`emails/${channel.user.email}`).join(connection);

      // Join connection for user.id
      app.channel(`userIds/${channel.userId}`).join(connection);

      // Join connection for role
      app.channel(`roles/${channel.roleId}`).join(connection);

      // Join connection for teams
      const teamsForUser = await channel.getTeamsForUser();
      if (teamsForUser && teamsForUser.length) {
        teamsForUser.forEach(team => {
          app.channel(`teams/${team.id}`).join(connection);
        });
      }
    }


  };

  /**
   * Leave all channels for this user
   * @param user
   */
  const leaveChannels = user => {
    const idField = Channel.getIdField(user);
    app.channel(app.channels).leave(connection => {
      if (connection && connection.user) {
        const userId = user[idField].toString();
        const userIdConnection = connection.user[idField].toString();
        return userIdConnection === userId;
      } else {
        return false;
      }

    });
  };

  /**
   * Leave and re-join all channels with new user information
   * @param user
   * @return {Promise<void>}
   */
  const updateChannels = async user => {
    const idField = Channel.getIdField(user);
    // Find all connections for this user
    const { connections } = app.channel(app.channels).filter(connection => {
      if (connection && connection.user) {
        const userId = user[idField].toString();
        const userIdConnection = connection.user[idField].toString();
        return userIdConnection === userId;
      } else {
        return false;
      }
    });

    // Leave all channels
    leaveChannels(user);

    const _joinChannels = async (connection) => await joinChannels(connection);

    // Re-join all channels with the updated user information
    if (connections && connections.length) {
      for (let i = 0; i < connections.length; i++) {
        await _joinChannels(connections[i]);
      }
    }
  };

  app.on('connection', (connection) => {
    // On a new real-time connection, add it to the anonymous channel
    if (connection) {
      // app.channel('anonymous').leave(connection);
      app.channel('anonymous').join(connection);
      // if (isDebug && connection) debug('app.on(\'connection\') for SocketIo transport');
      if (isDebug && connection) Channel.showChannelInfo(app, 'app.on(\'connection\')');
    } else {
      if (isDebug && connection) debug('app.on(\'connection\') for Rest transport');
    }
  });

  app.on('login', async (payload, { connection }) => {
    // connection can be undefined if there is no
    // real-time connection, e.g. when logging in via REST
    if (connection && connection.user) {

      // The connection is no longer anonymous, remove it
      app.channel('anonymous').leave(connection);

      // Join channels for user
      await joinChannels(connection);

      // if (isDebug && connection) debug('app.on(\'login\') for SocketIo transport');
      if (isDebug && connection) Channel.showChannelInfo(app, 'app.on(\'login\')');

    } else {
      if (isDebug && connection) debug('app.on(\'login\') for Rest transport');
    }
  });

  app.on('logout', (payload, { connection }) => {
    if (connection) {
      app.channel('anonymous').join(connection);

      // if (isDebug && connection) debug('app.on(\'logout\') for SocketIo transport');
      if (isDebug && connection) Channel.showChannelInfo(app, 'app.on(\'logout\')');
    } else {
      if (isDebug) debug('app.on(\'logout\') for Rest transport');
    }
  });

  app.publish(async (data, hook) => {
    let publishChannels = [];
    let paths = Channel.getServicePaths();
    let idField, userId, roleId, teamId, user, users, userIds, userTeams;
    let aboutPublish = '';
    //-----------------------------------------------------------------------
    const auth = new Auth(hook);
    const contextPath = auth.contextPath;
    const contextMethod = auth.contextMethod;
    const contextType = auth.contextType;
    
    const publishChannelsPush = (channelName) => {
      if(Channel.getAllChannelNames.includes(channelName) && Channel.getChannelLength(app, channelName)){
        publishChannels.push(app.channel(channelName));
      }
    }

    if (!paths.includes(contextPath)) return;

    aboutPublish = `app.publish::"${contextPath}".${contextMethod}.${contextType})`;
    // if (isDebug && auth) debug(aboutPublish);



    // Publish events to admins channel
    if (contextPath !== 'chat-messages') {
      // publishChannels.push(app.channel('admins'));
      publishChannelsPush('admins');
    }

    // Publish events to users channel
    switch (`${contextPath}`) {
    case 'users':
      if (contextMethod === 'patch') {
        await updateChannels(data);
        idField = Auth.getIdField(data);
        userId = data[idField].toString();
        // publishChannels.push(app.channel(`userIds/${userId}`));
        publishChannelsPush(`userIds/${userId}`);
        // aboutPublish = 'app.service("users").on("patched")';
        // if (isDebug) Channel.showChannelInfo(app, 'app.service(\'users\').on(\'patched\')');
      }
      if (contextMethod === 'remove') {
        leaveChannels(data);
        // aboutPublish = 'app.service("users").on("removed")';
        // if (isDebug) Channel.showChannelInfo(app, 'app.service(\'users\').on(\'removed\')');
      }
      break;
    case 'user-profiles':
      user = auth.getAuthUser();
      idField = Auth.getIdField(user);
      userId = user[idField].toString();
      // publishChannels.push(app.channel(`userIds/${userId}`));
      publishChannelsPush(`userIds/${userId}`);
      // aboutPublish = 'app.service("user-profiles").on("all")';
      break;
    case 'user-teams':
      if (contextMethod === 'create') {
        const user = await app.service('users').get(data.userId);
        await updateChannels(user);
        // if (isDebug) Channel.showChannelInfo(app, 'app.service(\'user-teams\').on(\'created\')');
        // aboutPublish = 'app.service("user-teams").on("created")';
      }
      if (contextMethod === 'remove') {
        const user = await app.service('users').get(data.userId);
        await updateChannels(user);
        if (isDebug) Channel.showChannelInfo(app, 'app.service(\'user-teams\').on(\'removed\')');
        // aboutPublish = 'app.service("user-teams").on("removed")';
      }
      userId = data.userId.toString();
      // publishChannels.push(app.channel(`userIds/${userId}`));
      publishChannelsPush(`userIds/${userId}`);
      break;
    case 'roles':
      if (contextMethod === 'patch') {
        idField = Auth.getIdField(data);
        roleId = data[idField].toString();
        users = await app.service('users').find({ query: { roleId: roleId } });
        userIds = users.data.map(user => user[idField].toString());
        userIds.forEach(userId => publishChannelsPush(`userIds/${userId}`));
        // aboutPublish = 'app.service("roles").on("patch")';
      }
      break;
    case 'teams':
      idField = Auth.getIdField(data);
      teamId = data[idField].toString();
      // debug('app.publish.teams.teamId:', teamId);
      userTeams = await app.service('user-teams').find({ query: { teamId: teamId, $sort: { userId: 1 } } });
      userIds = userTeams.data.map(userTeam => userTeam.userId.toString());
      userIds.forEach(userId => publishChannelsPush(`userIds/${userId}`));
      // aboutPublish = 'app.service("teams").on("all")';
      break;
    case 'log-messages':
      userId = data.userId.toString();
      // publishChannels.push(app.channel(`userIds/${userId}`));
      publishChannelsPush(`userIds/${userId}`);
      // aboutPublish = 'app.service("log-messages").on("all")';
      break;
    case 'chat-messages':
      if (data.userId !== dbNullIdValue()) {
        userId = data.userId.toString();
        // publishChannels.push(app.channel(`userIds/${userId}`));
        publishChannelsPush(`userIds/${userId}`);
      }
      if (data.teamId !== dbNullIdValue()) {
        teamId = data.teamId.toString();
        // publishChannels.push(app.channel(`teams/${teamId}`));
        publishChannelsPush(`teams/${teamId}`);
      }
      if (data.roleId !== dbNullIdValue()) {
        roleId = data.roleId.toString();
        // publishChannels.push(app.channel(`roles/${roleId}`));
        publishChannelsPush(`roles/${roleId}`);
      }
      // aboutPublish = 'app.service("chat-messages").on("all")';
      break;
    default:
      break;
    }
    const channelsWithReadAbility = getChannelsWithReadAbility(app, data, hook, caslOptions);
    // if(isDebug && channelsWithReadAbility) debug('app.publish.channelsWithReadAbility:', channelsWithReadAbility);
    // if (isDebug && publishChannels.length) debug('app.publish.publishChannels:', publishChannels);
    // return loConcat(publishChannels, channelsWithReadAbility);
    if (isDebug && publishChannels.length) Channel.showChannelInfo(app, aboutPublish);
    return publishChannels;
  });
};
