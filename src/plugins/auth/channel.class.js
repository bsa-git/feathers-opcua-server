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
    // Get connection.authenticated
    this.authenticated = this.connection && this.connection.authenticated? this.connection.authenticated : undefined;
    // Get connection.payload
    this.payload = this.connection && this.connection.payload? this.connection.payload : null;
    // Get connection.accessToken
    this.accessToken = this.connection && this.connection.accessToken? this.connection.accessToken : '';
    // Get connection.provider
    this.provider = this.connection && this.connection.provider ? this.connection.provider : '';
    // Get payload.userId
    this.userId = this.payload && this.payload.userId? this.payload.userId.toString() : '';
    // Get role name
    this.roleName = this.payload? this.payload.role : '';
    // Get roleId
    this.roleId = this.user && this.user.roleId? this.user.roleId.toString() : '';
    if(isDebug) debug('Channel.constructor OK; connection:', this.connection);
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
    debug(`${comment}::showChanelInfo:`, info);
  }

  /**
   * Show connections info
   * @param app {Object}
   * @param aChannelName {String}
   */
  static showConnectionsInfo(app, aChannelName = '', aComment = '') {
    let info = {};
    //-------------------------------------------------------
    const connections = (channelName) => app.channel(channelName).connections.map(connect => Object.assign({}, {
      provider: connect.provider,
      user: connect.user? connect.user : null
    }));    
    
    if(aChannelName && app.channels.includes(aChannelName)){
      info[aChannelName] = connections(aChannelName);
    } else {
      app.channels.map(channelName => {//  || channelName === 'anonymous'
        info[channelName] = connections(channelName);
      });
    }
    aComment? debug(`${aComment}::showConnectionsInfo:`, info) :  debug('showConnectionsInfo:', info);
  }

  /**
   * @method getAllChannelNames
   *  Returns a list of all existing channel names
   * @returns {String[]}
   */
  getAllChannelNames() {
    return this.app.channels;
  }

  /**
   * @method getChannel
   * Will return a channel with all connections
   * @param  {...String} names 
   * e.g. app.channel(name1, name2, ... nameN) -> Channel
   * @returns {Object}
   */
  getChannel(...names) {
    return (names === undefined)? this.app.channel(this.app.channels) : this.app.channel(names);
  }

  /**
   * @method getChannelConnections
   * Contains a list of all connections in this channel
   * @param  {...String} names 
   * e.g. channel.connections -> [ object ]
   * @returns {Object[]}
   */
  getChannelConnections(...names) {
    return (names === undefined)? this.app.channel(this.app.channels).connections : this.app.channel(names).connections;
  }

  /**
   * @method getChannelLength
   * Integer returns the total number of connections in this channel
   * @param  {...String} names 
   * e.g. channel.length -> Number
   * @returns {Number}
   */
  getChannelLength(...names) {
    return (names === undefined)? this.app.channel(this.app.channels).length : this.app.channel(names).length;
  }

  /**
   * @method channelJoin
   * Adds a connection to this channel
   * @param {Object} connection 
   * @param  {...String} names 
   */
  channelJoin(connection, ...names) {
    (names === undefined)? this.app.channel(this.app.channels).join(connection) : this.app.channel(names).join(connection);
  }

  /**
   * @method channelLeave
   * Removes a connection from this channel
   * @param {Object|Function} leaveArg 
   * e.g. leaveValue -> connection|fn
   * e.g. app.channel('admins').leave(connection);
   * e.g. app.channel('admins').leave(connection => { return connection.user._id === 5; });
   * @param  {...String} names 
   */
  channelLeave(leaveArg, ...names) {
    (names === undefined)? this.app.channel(this.app.channels).leave(leaveArg) : this.app.channel(names).leave(leaveArg);
  }

  /**
   * @method channelJoin
   * Returns a new channel filtered by a given function which gets passed the connection.
   * @param {Function} fn
   * e.g. const userFive = app.channel(app.channels).filter(connection => connection.user._id === 5);
   * @param  {...String} names 
   */
  channelFilter(fn, ...names) {
    return (names === undefined)? this.app.channel(this.app.channels).filter(fn) : this.app.channel(names).filter(fn);
  }

  /**
   * @method channelSend
   * Returns a copy of this channel with customized data that should be sent for this event
   * @param {Object} data
   * e.g. app.service('users').publish('created', data => { return app.channel('anonymous').send({ name: data.name }); });
   * @param  {...String} names 
   */
  channelSend(data, ...names) {
    return (names === undefined)? this.app.channel(this.app.channels).send(data) : this.app.channel(names).send(data);
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
   * @return {null}
   */
  getAuthUser() {
    return this.isAuth() ? this.user : null;
  }

  /**
   * Get role
   * @param id
   * @return {Promise.<*>}
   */
  async getRole(id) {
    const role = await this.app.service('roles').get(id);
    if (isDebug) inspector('Channel.getRole:', role);
    return role;
  }

  /**
   * Get role name
   * @return {Promise.<*>}
   */
  async getRoleName() {
    if (!this.roleName) {
      const user = this.getAuthUser();
      const myRole = (this.isAuth() && user) ? await this.getRole(user.roleId) : null;
      this.roleName = myRole ? myRole.name : '';
    }
    return this.roleName;
  }

  /**
   * Get roleId
   * @param isRole
   * @return {Promise.<string>}
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
   * e.g. { isAdministrator: 'Administrator', isUser: 'User', isSuperRole: 'superRole' }
   * @param isRole
   * @return {Object||String}
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
