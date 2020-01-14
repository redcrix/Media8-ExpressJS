// var mysql = require('mysql');

// var connection = mysql.createConnection({

// 	});

	var mysql = require('mysql');
var pool  = mysql.createPool({
	host     : 'gator3080.hostgator.com',
	user     : 'redcrix_dev',
	password : 'redcrix123',
	database : 'redcrix_redcart',
	    timezone: 'utc' ,
	  multipleStatements:true
});

pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});





// connection.connect(function(err) {
//     if (err)
//      throw err;
//     console.log("Error="+err);
// });





module.exports = pool;

