var mysql      = require('mysql');
var connection = mysql.createConnection({
	
	host     : 'gator3080.hostgator.com',
	user     : 'redcrix_dev',
	password : 'redcrix123',
	database : 'redcrix_redcart',
	    timezone: 'utc' ,
	  multipleStatements:true
	});
module.exports = {
  'secret': 'supersecret',
 
};
