var connection =require('./db');
var MD5 =require('md5.js');
var session = require('express-session');
var randomstring = require("randomstring");
var randomize = require('randomatic');
var fs = require("fs");
var config = require('./config');
var jwt = require('jsonwebtoken');
module.exports = {
	


    insert:function(table,data,fn){
    
        connection.query('INSERT INTO '+table+' SET ?',data, function (error, results, fields) {
			  console.log(error);
			  console.log(results);
				fn(error,results,fields);

		});
    },
    update:function(table,data,cond,fn){
    	connection.query('UPDATE  '+table+' SET ? Where ?',[data,cond], function (error, results, fields) {
    			console.log(this.sql);
				fn(error,results,fields);
		});
    },
      // select  record from  database 


    selectdata: function(table,fn){
		connection.query('SELECT * FROM  '+table, function(error, results, fields){
	             fn(error,results,fields);
		  });

    },

     //return data from database according to the condition

    conditional_where:function(table,cond,cond_val,fn){
    		
		  connection.query('select * from '+ table + ' where '+ cond +' = ?',[cond_val],function(error,results,fields){
		  	console.log(this.sql);
		    var response_array=new Array();
		    if (error) {
		      response_array['code']=400;
		      response_array['msg']='Error Occured';
		    }else{

		      if(results.length != 0){
		        response_array['code']=200;
		        response_array['msg']='data found';
		        response_array['data']=results;
		      }
		      else{
		        response_array['code']=204;
		        response_array['msg']='No Data Found';
		      }
		    }
		   // console.log(response_array);
		      fn(null,response_array);
		  });
	},
	column_conditional_where:function(table,cond,cond_val,fields,fn){
		connection.query('select '+fields+' from '+ table + ' where '+ cond +' = ?',[cond_val],function(error,results,fields){
		  	
		    var response_array=new Array();
		    if (error) {
		      response_array['code']=400;
		      response_array['msg']='Error Occured';
		    }else{

		      if(results.length != 0){
		        response_array['code']=200;
		        response_array['msg']='data found';
		        response_array['data']=results;
		      }
		      else{
		        response_array['code']=204;
		        response_array['msg']='No Data Found';
		      }
		    }
		   // console.log(response_array);
		      fn(null,response_array);
		  });
	},
	fetchData:function(table,fn){
		//console.log('fetched');
		connection.query('SELECT * FROM  '+ table, function (error, results, fields) {
	    var response_array=new Array();
	    if (error) {
	      response_array['code']=400;
	      response_array['msg']='Error Occured';
	    }else{

	          if(results.length != 0){
	          response_array['code']=200;
	          response_array['msg']='data found';
	          response_array['data']=results;
	      }
	      else{
	        response_array['code']=204;
	        response_array['msg']='No Data Found';
	      }
	    }

	      fn(null,response_array);
	    });
	},

   // function will verify user by email, password etc.


	verifycol:function(table,column,value,fn){
         console.log("SELECT id FROM "+ table +" where "+ column +"='"+value+"'");
		  connection.query('SELECT id FROM '+ table +' where '+ column +'="'+value+'"', function (error, results, fields) {
		  	console.log(this.sql);
          console.log(results);
		    if(results.length==0){
		      return fn(true);
		    }
		    else{
		      return fn(false);
		    }

      })
    },
    // function will check user is logged in or not 

     authenticate:function(req,res, fn){
		var email= req.body.email;
		var password = new MD5().update(req.body.password).digest('hex');
		connection.query('SELECT * FROM  users WHERE LOWER(email) = ?',[email], function (error, results, fields) {
			console.log(this.sql);
		    var response_array=new Array();
		    if (error) {
		      response_array['code']=400;
		      response_array['msg']='Error Occured';
		      fn(1,response_array);
		    }
		    else if(results.length == 1 ){
				if(results[0].password == password){
                   
    					response_array['code']=200;
				        response_array['msg']='Login Successful';
				        response_array['id']=results[0].id;
				        response_array['name']=results[0].name;
				        response_array['user_type']=results[0].user_type;
					
				}
			}
		    else{
		        response_array['code']=204;
		        response_array['msg']='Login Credentials incorrect';
		   	}
		   	setTimeout(function(){
				fn(null,response_array);
		    },100)
		})
		
	},
     checkApiAuth:function checkApiAuth(req,res,next){
	//next();
		var token = req.headers['x-access-token'];
		var user = req.headers['user'];

		  if (token) {
		  	if(user){
		  		console.log(config.secret);
			    // verifies secret and checks exp
			    jwt.verify(token, config.secret, function(err, decoded) {      
			      if (err) {
			        return res.status(403).send({ success: false, message: 'Failed to authenticate token.' });    
			      } else {
			        // if everything is good, save to request for use in other routes
			        //return res.status(200).send({'asd':'asdas'}); 
			        
			        if(decoded.id==user){
			        	next();
			        }else{
			        	return res.status(403).send({ success: false, message: 'Failed to authenticate token.' });
			        }
			      }
			    });
		  	}else{
		  		return res.status(403).send({ success: false, message: 'Headers Missing.' }); 
		  	}
		  	

		  } else {

		    // if there is no token
		    // return an error
		    return res.status(403).send({ 
		        success: false, 
		        message: 'No token provided.' 
		    });

		  } 
	},



}
