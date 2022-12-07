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
 * @method getTagInfoFromChAsoduDB
 * @param {Object} db 
 * @param {Object} queryParams 
 * @returns {Object}
 */
const getTagInfoFromChAsoduDB = async function (db, queryParams) {
  const params = [];
  const sql = `
  SELECT sh.Value, sh.Time, tInfo.TagName, tInfo.ScanerName, tInfo.TagGroup, tInfo.KIPname
  FROM dbMonitor.dbo.SnapShot AS sh
  JOIN dbConfig.dbo.TagsInfo AS tInfo ON sh.TagID = tInfo.ID
  WHERE sh.ScanerName = @scanerName AND tInfo.OnOff = 1
  `;
  // SELECT TagName, ID FROM dbConfig.dbo.TagsInfo WHERE OnOff=1 AND ScanerName='{0}
  //---------------------------------------------------
  db.buildParams(params, 'scanerName', TYPES.Char, queryParams.scanerName);

  let rows = await db.query(params, sql);
  if (isDebug && rows.length) inspector('selectValuesFromChAsoduDB.query.rows:', rows);
  if (rows.length) {
    rows = convertArray2Object(rows, 'TagName', 'Value');
    if (isDebug) inspector('selectValuesFromChAsoduDB.convertArray2Object.rows:', rows);
  } else { rows = null; }
  return rows;
};

/**
 // Работаем с таблицей SnapShot
		public void WriteSnapShotToDB(string scanerID, ref Dictionary<int, SnapShotRecords> snapShot, ref int updCounter, ref int insCounter, ref int delCounter)
		{
			_err = "";
			using (var cn = new SqlConnection(_cnString)) {
				cn.Open();
				string sqlQuery = string.Format("SELECT TagID FROM dbMonitor.dbo.SnapShot WHERE ScanerName='{0}'", scanerID);
				var dbSnapShots = new List<int>();
				using (var commSQL = new SqlCommand(sqlQuery, cn)) {
					using (SqlDataReader reader = commSQL.ExecuteReader()) {
			  			while (reader.Read()) { 
							dbSnapShots.Add(reader.GetInt32(0));
						}
				  	}
				}
				foreach(int tagID in dbSnapShots) {
					if(!snapShot.ContainsKey(tagID)) {
						try {
							DeleteTagFromSnapShots(cn, scanerID, tagID); 
							delCounter++;
						} catch (Exception err) { _err += err.Message + " (Delete);"; continue; }
					} else {
						try {
							UpdateTagInSnapShots(cn, scanerID, tagID, snapShot[tagID]); 
							snapShot.Remove(tagID);
							updCounter++;
						} catch (Exception err) { _err += err.Message + " (Update);"; continue; }
					}
				}
				foreach(int tagID in snapShot.Keys) {
					try {
						InsertTagToSnapShots(cn, scanerID, tagID, snapShot[tagID]); insCounter++;
					} catch (Exception err) { _err += err.Message + " (Insert);"; continue; }
				}
				snapShot.Clear();
			}
		}

		private void DeleteTagFromSnapShots(SqlConnection cn, string scanerID, int tagID) 
		{
			string sql = string.Format("DELETE FROM dbMonitor.dbo.SnapShot WHERE ScanerName='{0}' AND TagID={1}", scanerID, tagID);
			using (var commSQL = new SqlCommand(sql, cn)) {commSQL.ExecuteNonQuery();}
		}
		private void UpdateTagInSnapShots(SqlConnection cn, string scanerID, int tagID, SnapShotRecords rec) 
		{
			string _Time = rec.Time.ToString("yyyy-MM-dd HH:mm:ss");
			string _dtYear = rec.Time.Year.ToString();
			string _dtDofY = rec.Time.DayOfYear.ToString();
			string _dtTotalS = ((int)(rec.Time.TimeOfDay.TotalSeconds)).ToString();
			string _Value = GetTagValue(rec.Value);
			string sql = string.Format("UPDATE dbMonitor.dbo.SnapShot SET Time='{0}',dtYear={1},dtDofY={2},dtTotalS={3},Value={4} " +
			                           "WHERE ScanerName='{5}' AND TagID={6}",_Time,_dtYear,_dtDofY,_dtTotalS,_Value,scanerID,tagID);
			using (var cmdSQL = new SqlCommand(sql,cn)) { cmdSQL.ExecuteNonQuery(); }
		}
		private void InsertTagToSnapShots(SqlConnection cn, string scanerID, int tagID, SnapShotRecords rec) 
		{
			string _Time = rec.Time.ToString("yyyy-MM-dd HH:mm:ss");
			string _dtYear = rec.Time.Year.ToString();
			string _dtDofY = rec.Time.DayOfYear.ToString();
			string _dtTotalS = ((int)(rec.Time.TimeOfDay.TotalSeconds)).ToString();
			string _Value = GetTagValue(rec.Value);
			string sql = string.Format("INSERT INTO dbMonitor.dbo.SnapShot (ScanerName,TagID,Time,dtYear,dtDofY,dtTotalS,Value) " +
			                           "VALUES ('{0}',{1},'{2}',{3},{4},{5},{6})",scanerID,tagID,_Time,_dtYear,_dtDofY,_dtTotalS,_Value);
			using (var cmdSQL = new SqlCommand(sql,cn)) { cmdSQL.ExecuteNonQuery(); }
		}
    
    private string GetTagValue(double d) 
		{
			var nfi = new NumberFormatInfo(); nfi.NumberDecimalSeparator = ".";
			if(double.IsNaN(d)) return "null";
			if(d.CompareTo(double.MaxValue) == 0) return float.MaxValue.ToString(nfi);
			if(d.CompareTo(double.MinValue) == 0) return float.MinValue.ToString(nfi);
			return d.ToString(nfi);
		}
 */

module.exports = getTagInfoFromChAsoduDB;
