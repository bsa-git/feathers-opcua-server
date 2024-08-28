//--- User messages notifier ---//
const {inspector, AuthServer} = require('../../plugins');
const errors = require('@feathersjs/errors');
const {detectLang, getLangMessages} = require('../../plugins/lib/lang-helpers');
const debug = require('debug')('app:service.authManagement.notifier');
const isDebug = false;

module.exports = function(app) {

  /**
   * Get link
   * @param type
   * @param hash
   * @return {string}
   */
  function getLink(type, hash) {
    const url = `${process.env.BASE_URL}/user/${type}?token=${hash}`;
    if(isDebug) debug('getLink.url:', url);
    return url;
  }

  /**
   * Send email
   * @param email
   */
  async function sendEmail(email) {
    try {
      const mailer = app.service('mailer');
      if(isDebug) debug('sendEmail.email:', email);
      const result = await mailer.create(email);
      if(isDebug) inspector('app:service.authManagement.notifier.sendEmail.result:', result);
    }catch(err){
      if(isDebug) inspector('app:service.authManagement.notifier.sendEmail.error:', err);
      new errors.BadRequest(`Error while sending email: ${err.message}`);
    }
  }

  return {
    notifier: async function(type, user) {// notifier: function(type, user, notifierOptions
      let tokenLink, email, lang, fullName, verifyToken, verifyShortToken, resetToken, langMsgs, langMsg, idField, senderId;
      fullName = `${user.firstName} ${user.lastName}`;
      idField = user? 'id' in user ? 'id' : '_id' : '_id';
      senderId = user? user[idField] : null;

      switch (type) {
      case 'resendVerifySignup': //sending the user the verification email
        if(isDebug) inspector('auth-management.notifier.user:', user);
        verifyToken = user.verifyToken;
        verifyShortToken = user.verifyShortToken;

        tokenLink = getLink('verify', verifyToken);
        // Detect lang message
        lang = await detectLang(fullName);
        langMsgs = getLangMessages(lang);
        langMsg = langMsgs['authManagement']['mailResendVerifySignUp'].replace('{tokenLink}', tokenLink).replace('{shortToken}', verifyShortToken);
        email = {
          senderId,
          from: process.env.FROM_EMAIL,
          to: user.email,
          subject: 'Verify SignUp',
          html: langMsg
        };
        sendEmail(email);
        return email;
      case 'verifySignup': // confirming verification
        // Detect lang message
        lang = await detectLang(fullName);
        langMsgs = getLangMessages(lang);
        langMsg = langMsgs['authManagement']['mailVerifySignUp'];
        email = {
          senderId,
          from: process.env.FROM_EMAIL,
          to: user.email,
          subject: 'Confirm SignUp',
          html: langMsg
        };
        sendEmail(email);
        return email;
      case 'sendResetPwd':
        if(isDebug) inspector('auth-management.notifier.user:', user);
        resetToken = user.resetToken;
        // resetShortToken = user.resetShortToken;

        tokenLink = getLink('forgot', resetToken);
        // Detect lang message
        lang = await detectLang(fullName);
        langMsgs = getLangMessages(lang);
        langMsg = langMsgs['authManagement']['mailSendResetPwd'].replace('{tokenLink}', tokenLink);
        email = {
          senderId,
          from: process.env.FROM_EMAIL,
          to: user.email,
          subject: 'Password Reset',
          html: langMsg
        };
        sendEmail(email);
        return email;
      case 'resetPwd':
        // Detect lang message
        lang = await detectLang(fullName);
        langMsgs = getLangMessages(lang);
        langMsg = langMsgs['authManagement']['mailResetPwd'];
        email = {
          senderId,
          from: process.env.FROM_EMAIL,
          to: user.email,
          subject: 'Confirm Password Reset',
          html: langMsg
        };
        sendEmail(email);
        return email;
      case 'passwordChange':
        // Detect lang message
        lang = await detectLang(fullName);
        langMsgs = getLangMessages(lang);
        langMsg = langMsgs['authManagement']['mailPasswordChange'];
        email = {
          senderId,
          from: process.env.FROM_EMAIL,
          to: user.email,
          subject: 'Confirm Password Change',
          html: langMsg
        };
        if(AuthServer.isAuthManager()){
          sendEmail(email);
        }
        return email;
      case 'identityChange':
        if(isDebug) inspector('auth-management.notifier.user:', user);
        verifyToken = user.verifyToken;
        verifyShortToken = user.verifyShortToken;

        tokenLink = getLink('change', verifyToken);
        // Detect lang message
        lang = await detectLang(fullName);
        langMsgs = getLangMessages(lang);
        langMsg = langMsgs['authManagement']['mailResendVerifySignUp'].replace('{tokenLink}', tokenLink).replace('{shortToken}', verifyShortToken);
        email = {
          senderId,
          from: process.env.FROM_EMAIL,
          to: user.verifyChanges.email,
          subject: 'Verify Changes',
          html: langMsg
        };
        sendEmail(email);
        return email;
      default:
        break;
      }
    }
  };
};
