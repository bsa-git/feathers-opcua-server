/* eslint-disable no-unused-vars */
const {getItems, replaceItems} = require('feathers-hooks-common');
const {isTrue, HookHelper, inspector} = require('../plugins');
const debug = require('debug')('app:hooks.log');

const isDebug = false;

module.exports = function (isTest = false) {
  return async context => {

    // Get the record(s) from context.data (before), context.result.data or context.result (after).
    // getItems always returns an array to simplify your processing.
    let records = getItems(context);

    // Create HookHelper object
    const hh = new HookHelper(context);
    // Show debug info
    hh.showDebugInfo('', isDebug);
    hh.showDebugError();

    // if(hh.isMask('messages.create.before')){
    //   hh.showDebugInfo('messages.create.before', true);
    //   // inspector('hh.showDebugInfo.context:', context.params.authentication);
    // }

    // hh.showDebugInfo('authentication', true);
    // hh.showDebugInfo('messages', true);
    // hh.showDebugInfo('messages.create', true);
    // hh.showDebugInfo('users', true);
    // hh.showDebugInfo('users.get.before', true, true); // isConn = true (show connect and headers)


    // Is log msg enable
    const isDebugMsgEnable = isTest ||
        isTrue(process.env.LOGMSG_ENABLE) &&
        hh.app.get('env') !== 'test' &&
        (!!hh.contextProvider ||
          hh.isMask('authentication.remove.after') ||
          !!hh.contextError
        );

    if(isDebug) debug('isDebugMsgEnable:', isDebugMsgEnable);    

    if(isDebugMsgEnable){
      // // Get log message
      // const logMsg = await getLogMessage(context);
      // // Save log message
      // if(logMsg){
      //   if(isDebug) debug('logMsg:', logMsg);
      //   await hookHelper.createItem('log-messages', logMsg);
      // }
    }
    // Place the modified records back in the context.
    replaceItems(context, records);
    // Best practice: hooks should always return the context.
    return context;
  };
};
