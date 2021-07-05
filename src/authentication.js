const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { expressOauth, OAuthStrategy } = require('@feathersjs/authentication-oauth');
const hooks = require('./services/authentication/authentication.hooks');
const debug = require('debug')('app:authentication');

const isDebug = false;

class GitHubStrategy extends OAuthStrategy {
  async getEntityData(profile) {
    const baseData = await super.getEntityData(profile);
    if(isDebug) debug('GitHubStrategy.getEntityData.baseData:', baseData);
    if(isDebug) debug('GitHubStrategy.getEntityData.profile:', profile);
    return {
      ...baseData,
      // You can also set the display name to profile.name
      name: profile.name,
      // The GitHub profile image
      avatar: profile.avatar_url,
      // The user email address (if available)
      email: profile.email,
      // The githubId
      githubId: baseData.githubId
    };
  }
}

class GoogleStrategy extends OAuthStrategy {
  async getEntityData(profile) {
    const baseData = await super.getEntityData(profile);
    if(isDebug) debug('GoogleStrategy.getEntityData.baseData:', baseData);
    if(isDebug) debug('GoogleStrategy.getEntityData.profile:', profile);
    return {
      ...baseData,
      // You can also set the display name to profile.name
      name: profile.name,
      // The GitHub profile image
      avatar: profile.picture,
      // The user email address (if available)
      email: profile.email,
      // The githubId
      googleId: baseData.googleId
    };
  }
}

module.exports = app => {
  const authentication = new AuthenticationService(app);

  authentication.register('jwt', new JWTStrategy());
  authentication.register('local', new LocalStrategy());
  authentication.register('github', new GitHubStrategy());
  authentication.register('google', new GoogleStrategy());

  app.use('/authentication', authentication);
  
  // Get our initialized service so that we can register hooks
  const service = app.service('authentication');
  service.hooks(hooks);
  
  // Configure express Oauth
  app.configure(expressOauth());
};
