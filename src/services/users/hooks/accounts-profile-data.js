// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const { checkContext, getItems, replaceItems } = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const { inspector } = require('../../../plugins/lib');
const debug = require('debug')('app:service.hook.accounts-profile-data');

const isDebug = false;

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {

  // Return the actual hook.
  return (context) => {
    // Throw if the hook is being called from an unexpected location.
    checkContext(context, null, ['find', 'get', 'create', 'update', 'patch', 'remove']);

    // Get the authenticated user.
    // eslint-disable-next-line no-unused-vars
    const { user } = context.params;
    // Get the record(s) from context.data (before), context.result.data or context.result (after).
    // getItems always returns an array to simplify your processing.
    let records = getItems(context);
    let isAccount = false;

    /*
    Modify records and/or context.
    */
    /**
     * getProfileData
     * @param record {Object}
     * @returns {Object}
     */
    const getProfileData = (record) => {
      let newRecord = {};
      let profile;

      if (isDebug) inspector('hook.accounts-profile-data.getProfileData.record:', record);

      // Google account
      if (record.google) {
        if (isDebug) debug(`${context.type} app.service('${context.path}').${context.method}().`, 'Google account');
        isAccount = true;
        profile = record.google.profile;
        newRecord.googleId = record.googleId;
        let _email = profile.emails.find(email => {
          const type = email.type ? email.type.toLowerCase() : '';
          return (type === 'account');
        });
        if (_email) {
          newRecord.email = _email.value;
        } else {
          throw new errors.BadRequest('Google account email address not found');
        }
        // newRecord.email = profile.emails.find(email => {
        //   return email.type === 'account';
        // }).value;
        newRecord.firstName = profile.name.givenName;
        newRecord.lastName = profile.name.familyName;
        newRecord.avatar = profile._json.image.url;
        newRecord.googleAccessToken = record.google.accessToken;
        if (record.google.refreshToken) {
          newRecord.googleRefreshToken = record.google.refreshToken;
        }
        if (context.method === 'create') {
          newRecord.roleId = record.roleId;
          newRecord.profileId = record.profileId;
          newRecord.isVerified = true;
          newRecord.active = true;
        }
        if (context.method === 'patch') {
          newRecord.isVerified = true;
        }
        return newRecord;

        // GitHub account
      } else if (record.github) {
        if (isDebug) debug(`${context.type} app.service('${context.path}').${context.method}(). `, 'Github account');
        isAccount = true;
        newRecord.githubId = record.githubId;
        profile = record.github.profile;
        newRecord.email = profile._json.email;
        const names = profile.displayName.trim().split(' ');
        newRecord.firstName = names[0];
        if (names.length > 1) {
          newRecord.lastName = names[1];
        }
        newRecord.avatar = profile._json.avatar_url;
        newRecord.githubAccessToken = record.github.accessToken;
        if (record.github.refreshToken) {
          newRecord.githubRefreshToken = record.github.refreshToken;
        }
        if (context.method === 'create') {
          newRecord.roleId = record.roleId;
          newRecord.profileId = record.profileId;
          newRecord.isVerified = true;
          newRecord.active = true;
        }
        if (context.method === 'patch') {
          newRecord.isVerified = true;
        }
        return newRecord;

        // No accounts
      } else {
        if (isDebug) debug(`${context.type} app.service('${context.path}').${context.method}(). `, 'No accounts');
        return record;
      }
    };

    let newRecords = [];

    if (Array.isArray(records)) {
      records.forEach(record => {
        newRecords.push(getProfileData(record));
      });
      if (isDebug && isAccount) inspector('hook.accounts-profile-data.newRecords:', newRecords);
      replaceItems(context, newRecords);
    } else {
      const newRecord = getProfileData(records);
      if (isDebug && isAccount) inspector('hook.accounts-profile-data.newRecord:', newRecord);
      replaceItems(context, newRecord);
    }

    // Place the modified records back in the context.
    // replaceItems(context, newRecords);
    // Best practice: hooks should always return the context.
    return context;
  };
};
