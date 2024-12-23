/* eslint-disable no-unused-vars */
const errors = require('@feathersjs/errors');
const {inspector } = require('../lib');
const AuthServer = require('./auth-server.class');

const debug = require('debug')('app:channel.class');
const isDebug = false;

class Channel {
  /**
   * Constructor
   * @param context
   */
  constructor(app, connection) {
    this.connection = Object.assign({}, connection);
    this.app = Object.assign({}, app);
    // Get connection.user
    this.user = (this.connection && this.connection.user)? this.connection.user : null;
    this.idField = this.user? 'id' in this.user ? 'id' : '_id' : '';
    // Get connection.authenticated
    this.authenticated = this.connection && this.connection.authenticated? this.connection.authenticated : undefined;
    // Get connection.payload
    this.payload = this.connection && this.connection.payload? this.connection.payload : null;
    // Get connection.accessToken
    this.accessToken = this.connection && this.connection.accessToken? this.connection.accessToken : '';
    // Get connection.provider
    this.provider = this.connection && this.connection.provider ? this.connection.provider : '';
    // Get payload.userId
    this.userId = this.user? this.user[this.idField].toString() : '';
    // Get role alias
    this.roleAlias = this.user? this.user.roleAlias : '';
    // Get roleId
    this.roleId = this.user? this.user.roleId.toString() : '';
  }

  /**
   * Show channel info
   * @param app {Object}
   * @param comment {String}
   */
  static showChannelInfo(app, comment = 'ChanelClass') {
    let info = [];
    //------------
    info = app.channels.map(channelName => `${channelName}(${app.channel(channelName).length})`);
    debug(`${comment}`, info);
  }

  /**
   * Show connections info
   * @param app {Object}
   * @param aChannelName {String}
   * @param aComment {String}
   */
  static showConnectionsInfo(app, aChannelName = '', aComment = '') {
    const info = Channel.getConnectionsInfo(app, aChannelName);
    aComment? inspector(`${aComment}`, info) :  inspector('showConnectionsInfo:', info);
  }

  /**
   * Get connections info
   * @param app {Object}
   * @param aChannelName {String}
   * @returns {Object}
   */
  static getConnectionsInfo(app, aChannelName = '') {
    let info = {};
    //-------------------------------------------------------
    const connections = (channelName) => app.channel(channelName).connections.map(connect => Object.assign({}, {
      provider: connect.provider,
      user: connect.user? connect.user : null,
      ability: connect.ability? connect.ability : null
    }));    
    
    if(aChannelName && app.channels.includes(aChannelName)){
      info[aChannelName] = connections(aChannelName);
    } else {
      app.channels.map(channelName => {//  || channelName === 'anonymous'
        info[channelName] = connections(channelName);
      });
    }
    return info;
  }

  /**
   * @method getAllChannelNames
   *  Returns a list of all existing channel names
   * @param app {Object}
   * @returns {String[]}
   */
  static getAllChannelNames(app) {
    return app.channels;
  }

  /**
   * @method getChannel
   * Will return a channel with all connections
   * @param app {Object}
   * @param  {...String} names 
   * e.g. app.channel(name1, name2, ... nameN) -> Channel
   * @returns {Object}
   */
  static getChannel(app, ...names) {
    return (names === undefined)? app.channel(app.channels) : app.channel(names);
  }

  /**
   * @method getChannelConnections
   * Contains a list of all connections in this channel
   * @param app {Object}
   * @param  {...String} names 
   * e.g. channel.connections -> [ object ]
   * @returns {Object[]}
   */
  static getChannelConnections(app, ...names) {
    return (names === undefined)? app.channel(app.channels).connections : app.channel(names).connections;
  }

  /**
   * @method getChannelLength
   * Integer returns the total number of connections in this channel
   * @param app {Object}
   * @param  {...String} names 
   * e.g. channel.length -> Number
   * @returns {Number}
   */
  static getChannelLength(app, ...names) {
    return (names === undefined)? app.channel(app.channels).length : app.channel(names).length;
  }

  /**
   * @method channelJoin
   * Adds a connection to this channel
   * @param app {Object}
   * @param {Object} connection 
   * @param  {...String} names 
   */
  static channelJoin(app, connection, ...names) {
    (names === undefined)? app.channel(app.channels).join(connection) : app.channel(names).join(connection);
  }

  /**
   * @method channelLeave
   * Removes a connection from this channel
   * @param app {Object}
   * @param {Object|Function} leaveArg 
   * e.g. leaveValue -> connection|fn
   * e.g. app.channel('admins').leave(connection);
   * e.g. app.channel('admins').leave(connection => { return connection.user._id === 5; });
   * @param  {...String} names 
   */
  static channelLeave(app, leaveArg, ...names) {
    (names === undefined)? app.channel(app.channels).leave(leaveArg) : app.channel(names).leave(leaveArg);
  }

  /**
   * @method channelJoin
   * Returns a new channel filtered by a given function which gets passed the connection.
   * @param app {Object}
   * @param {Function} fn
   * e.g. const userFive = app.channel(app.channels).filter(connection => connection.user._id === 5);
   * @param  {...String} names 
   */
  static channelFilter(app, fn, ...names) {
    return (names === undefined)? app.channel(app.channels).filter(fn) : app.channel(names).filter(fn);
  }

  /**
   * @method channelSend
   * Returns a copy of this channel with customized data that should be sent for this event
   * @param app {Object}
   * @param {Object} data
   * e.g. app.service('users').publish('created', data => { return app.channel('anonymous').send({ name: data.name }); });
   * @param  {...String} names 
   */
  static channelSend(app, data, ...names) {
    return (names === undefined)? app.channel(app.channels).send(data) : app.channel(names).send(data);
  }

  /**
   * isAuth
   * @return {boolean}
   */
  isAuth() {
    return !!this.authenticated;
  }

  /**
   * Get auth user
   * @return {Object|null}
   */
  getAuthUser() {
    return this.isAuth() ? this.user : null;
  }

  /**
   * Get role
   * @async
   * @param id
   * @return {Object}
   */
  async getRole(id) {
    const role = await this.app.service('roles').get(id);
    if (isDebug) inspector('Channel.getRole:', role);
    return role;
  }

  /**
   * Get role name
   * @async
   * @return {String}
   */
  async getRoleName() {
    const myRole = this.roleId? await this.getRole(this.roleId) : null;
    return myRole ? myRole.name : '';
  }

  /**
   * Get roleId
   * @async
   * @param {String} isRole 
   * @return {String}
   */
  async getRoleId(isRole = '') {
    let roleId = '';
    const service = this.app.service('roles');
    if (service) {
      const roleName = AuthServer.getRoles(isRole);
      let findResults = await service.find({query: {name: roleName}});
      findResults = findResults.data;
      if(findResults.length){
        let idField = 'id' in findResults[0] ? 'id' : '_id';
        roleId = findResults[0][idField];
      }
      return roleId;
    } else {
      throw new errors.BadRequest('There is no service for the path - "roles"');
    }
  }

  /**
   * Get roles
   * @param isRole
   * @return {Object||String}
   * e.g. { isAdministrator: 'Administrator', isUser: 'User', isSuperRole: 'superRole' }
   * e.g. 'Administrator'
   */
  static getRoles(isRole = '') {
    return AuthServer.getRoles(isRole);
  }

  /**
   * Get IsRole for roleName
   * e.g. for Administrator => isAdministrator
   * @param roleName
   * @return {String}
   */
  static getEnvAliaseForRoleName(roleName = '') {
    return AuthServer.getEnvAliaseForRoleName(roleName);
  }

  /**
   * isAdmin
   * @return {boolean}
   */
  async isAdmin() {
    const roleName = await this.getRoleName();
    return roleName === AuthServer.getRoles('isAdministrator');
  }

  /**
   * Determine if environment allows test
   * @return {boolean}
   */
  static isTest() {
    return AuthServer.isTest();
  }

  /**
   * Get id field
   * @param items {Array || Object}
   * @return {string}
   */
  static getIdField(items) {
    return AuthServer.getIdField(items);
  }

  /**
   * Get service fields
   * @param serviceName
   * @param isId
   * @return {Array.<*>}
   */
  static serviceFields(serviceName = '', isId = false) {
    return AuthServer.serviceFields(serviceName, isId);
  }

  /**
   * Get service paths
   * @return {Array}
   */
  static getServicePaths() {
    return AuthServer.getServicePaths();
  }

  /**
   * Get teams for user
   * @return {Promise<*>}
   */
  async getTeamsForUser(){
    const loPick = require('lodash/pick');
    let teamIdsForUser, teamsForUser;
    const idField = AuthServer.getIdField(this.user);
    const userTeams = this.app.service('user-teams');
    const teams = this.app.service('teams');
    if (userTeams && teams && this.userId) {
      teamIdsForUser = await userTeams.find({query: {userId: this.userId, $sort: {teamId: 1}}});
      teamIdsForUser = teamIdsForUser.data;
      teamIdsForUser = teamIdsForUser.map(row => row.teamId.toString());
      if(teamIdsForUser.length){
        teamsForUser = await teams.find({query: {[idField]: {$in: teamIdsForUser}, $sort: {name: 1}}});
        teamsForUser = teamsForUser.data;
        teamsForUser = teamsForUser.map(team => {
          const id = team[idField].toString();
          team = loPick(team, AuthServer.serviceFields('teams'));
          team.id = id;
          return team;
        });
      }
    }
    if(isDebug)debug('getTeamsForUser:', teamsForUser? teamsForUser : 'Not teamsForUser');
    return  teamsForUser;
  }
}

module.exports = Channel;
