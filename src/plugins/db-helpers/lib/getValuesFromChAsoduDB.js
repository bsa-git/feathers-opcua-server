/* eslint-disable no-unused-vars */
const {
  inspector,
  convertArray2Object,
} = require('../../lib');

const { TYPES } = require('tedious');

const debug = require('debug')('app:getValuesFromChAsoduDB');
const isDebug = false;

//=============================================================================
/**
 * @method getValuesFromChAsoduDB
 * @param {Object} db 
 * @param {Object} queryParams 
 * @returns {Object}
 */
const getValuesFromChAsoduDB = async function (db, queryParams) {
  const params = [];
  const sql = `
  SELECT sh.Value, sh.Time, tInfo.TagName, tInfo.ScanerName, tInfo.TagGroup, tInfo.KIPname
  FROM dbMonitor.dbo.SnapShot AS sh
  JOIN dbConfig.dbo.TagsInfo AS tInfo ON sh.TagID = tInfo.ID
  WHERE sh.ScanerName = @scanerName AND tInfo.OnOff = 1
  `;
  //---------------------------------------------------
  db.buildParams(params, 'scanerName', TYPES.VarChar, queryParams.scanerName);

  let { rows } = await db.query(params, sql);
  if (isDebug && rows.length) inspector('selectValuesFromChAsoduDB.query.rows:', rows);
  if (rows.length) {
    rows = convertArray2Object(rows, 'TagName', 'Value');
    if (isDebug) inspector('selectValuesFromChAsoduDB.convertArray2Object.rows:', rows);
  } else { 
    rows = null; 
  }
  return { rows };
};

module.exports = getValuesFromChAsoduDB;
