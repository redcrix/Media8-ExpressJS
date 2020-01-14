var express = require('express');
var router = express.Router();
var connection =require('../db');
var common =require('../common');
var session = require('express-session');
var async = require('async');
var apn = require('apn');
var common =require('../common');
var MD5 =require('md5.js');
var jwt = require('jsonwebtoken');
var config = require('../config');

module.exports = {
 signup:function(req,res){
    var name=req.body.name;
    var email=req.body.email;
    var password=req.body.password;
    var md5password = new MD5().update(req.body.password).digest('hex');
    common.verifycol('users', 'email', req.body.email, function(verified){
        if(!verified){
          res.send({
            "status":0,
            "msg":'Email already registered'
          });
        }
        else{
          var insert_data = {
          "email":req.body.email,
          "name":req.body.name,
          "password":md5password,
          "user_type":req.body.type
          }
          var response = common.insert('users',insert_data,function(error, results, fields){
            if(error){
              res.send({
                "status":0,
                "msg":'Something went wrong'
              });
            }
            else{
              if(req.body.type=='1'){
                var insert_data_details = {
                  "customer_id":results.insertId
                }
                var response = common.insert('customer_details',insert_data_details,function(error, results, fields){
                  if(error){
                    res.send({
                        "status":0,
                        "msg":'Something went wrong'
                    });
                  }
                  else{
                     res.send({
                        "status":1,
                        "msg":'Successfully Registered'
                      });
                  }
                });

              }
             
            }
          });
        }
    });
 },
 login:function(req,res){
  var email=req.body.email;
  var password=req.body.password;
  var device_token=req.body.device_token;
  var device_type=req.body.device_type;
  var os_version=req.body.os_version;
  var imei_number=req.body.imei_number;
 
  common.authenticate(req,res, function(err, user){  
      console.log(user);            
            if(user['code']==200){
               var token = jwt.sign({ id: user['id'] }, config.secret, {
                //expiresIn: 86400 // expires in 24 hours
              });
              var query_update='UPDATE users set auth_token="'+token+'",device_token="'+device_token+'",device_type="'+device_type+'",imei_number="'+imei_number+'",os_version="'+os_version+'" where id="'+user['id']+'"';
              connection.query(query_update,function(error,results,fields){
                if(error){
                  console.log(error);
                   res.send({
                    "status":0,
                    "msg":'Something went wrong'
                  });
                }
                else{
                   res.send({
                    "status":1,
                    "msg":'Login Successful',
                    "name":user['name'],
                    "email":user['email'],
                    "id":user['id'],
                    "auth_token":token,
                    "type":user['user_type']
                  });
                }
              })
            }
            else{
                 res.send({
                "status":0,
                "msg":'Please check your credentials'
              });
            }
  });
 },
 addProduct:function(req,res){
    var product_data={
      "product_name":req.body.product_name,
      "price":req.body.price,
      "in_stock":'1',
      "description_1":req.body.description_1,
      "description_2":req.body.description_2,
      "description_3":req.body.description_3,
      "category_id":req.body.category_id,
      "price2":req.body.price2,
      "requiredVarient":req.body.requiredVarient
    }
    var response = common.insert('products',product_data,function(error, results, fields){
        if(error){
            res.send({
                    "status":0,
                    "msg":'Something went wrong'
            });
        }
        else{
            if(req.files){
              for(var i=0;i<req.files.length;i++){
                  var insert_data = {
                    "product_id":results.insertId,
                    "product_image":req.files[i].filename
                  } 
                  var response = common.insert('product_images',insert_data,function(error, results, fields){
                    if(error){
                      res.send({
                        "status":0,
                        "msg":"Something went wrong"
                      })
                    }
                    else{
                      res.send({
                        "status":1,
                        "msg":"Product has been added successfully"
                      })
                    }
                  });
              }
            }
        }
    });

 },
 getProducts:function(req,res){
    var category_id=req.params.category_id;
    var data_array=[];
    var query='select * from products where category_id="'+category_id+'"';
    connection.query(query,function(error,results,fields){
       if(error){
        res.send({
          "status":0,
          "msg":"Something went wrong"
        })
       }
       else{
        results.forEach(function(value,index){
          var query1 = 'select product_image from product_images where product_id="'+value.product_id+'"';
          console.log(query1);
          connection.query(query1, function (err2, result2, fields2) 
          {
            var new_array = new Object();
            new_array.product_id=value.product_id;
            new_array.product_name=value.product_name;
            new_array.description_1=value.description_1;
            new_array.description_2=value.description_2;
            new_array.description_3=value.description_3;
            new_array.price=value.price;
            new_array.price2=value.price2;
            new_array.requiredVarient=value.requiredVarient;
            new_array.in_stock=value.in_stock;
            new_array.product_image=result2;
            data_array.push(new_array);
            
          });
     
       })
        setTimeout( function(){
           res.send({
          "status":1,
          "products":data_array
        })
         },1000);
    }
 })
  },
  deleteProduct:function(req,res){
    var product_id=req.params.product_id;
    var query='delete from products where product_id="'+product_id+'"';
    var query1='delete from product_images where product_id="'+product_id+'"';
    connection.query(query,function(error,results,fields){
      if(error){
        res.send({"status":0,"msg":"Something went wrong"})
      }
      else{
        connection.query(query1,function(error,results,fields){
          if(error){
            res.send({
              "status":0,
              "msg":"Something went wrong"
            })
          }
          else{
            res.send({
              "status":1,
              "msg":"Product has been deleted successfully"
            })
          }
        })
      }
    })
  },
  getAllProducts:function(req,res){
    var data_array=[];
    var query='select * from products';
    connection.query(query,function(error,results,fields){
       if(error){
        res.send({
          "status":0,
          "msg":"Something went wrong"
        })
       }
       else{
        results.forEach(function(value,index){
          var query1 = 'select * from product_images where product_id="'+value.product_id+'"';
          console.log(query1);
          connection.query(query1, function (err2, result2, fields2) 
          {
            var new_array = new Object();
            new_array.category_id=value.category_id;
            new_array.product_id=value.product_id;
            new_array.product_name=value.product_name;
            new_array.description_1=value.description_1;
            new_array.description_2=value.description_2;
            new_array.description_3=value.description_3;
            new_array.price=value.price;
            new_array.price2=value.price2;
            new_array.requiredVarient=value.requiredVarient;
            new_array.in_stock=value.in_stock;
            new_array.product_image=result2;
            data_array.push(new_array);
            
          });
     
       })
        setTimeout( function(){
           res.send({
          "status":1,
          "products":data_array
        })
         },1000);
    }
 })

  },
  getSaved_address:function(req,res){

    var customer_id=req.params.customer_id;
    var query='select * from customer_details where customer_id="'+customer_id+'"';
    connection.query(query,function(error,results,fields){
      if(error){
        res.send({
          "status":0,
          "msg":"Something went wrong"
        })
      }
      else{
        res.send({
          "status":1,
          "msg":"Success",
          "products":results
        })
      }
    })
  },
  saveCustomerAddress:function(req,res){

    var new_delivery_address_details={
      "customer_id":req.body.customer_id,
      "delivery_address":req.body.delivery_address,
      
      "pincode" : req.body.pincode,
      "house" : req.body.house,
      "area" : req.body.area,
      "city": req.body.city,
      "state":req.body.state,
      "country": req.body.country,
      "name" :req.body.name,
      "phone" : req.body.phone,
      "phone2" :req.body.phone2,
    }
    var response = common.insert('customer_details',new_delivery_address_details,function(error, results, fields){
      if(error){
        res.send({
          "status":0,
          "msg":"Something went wrong"
        })
      }
      else{
         res.send({
          "status":1,
          "msg":"Your customer_details has been updated"
        })
      }
    });
      

  },
  checkout:function(req,res){
    var customer_id=req.body.customer_id;
    var product_info=req.body.product_info;
    var txnid=req.body.txnid;
    var amount=req.body.amount;
    var payment_response=req.body.payment_response; // '0'->failure '1'->success
    var payment_details={
      'customer_id':customer_id,
      'product_info':product_info,
 
      'txnid':txnid,
      'amount':amount,
      'payment_response':payment_response
    }
    var response = common.insert('payments',payment_details,function(error, results, fields){
            if(error){
              res.send({"status":0,"msg":"Something went wrong"})
            }
            else{
              res.send({
                "status":1,
                "msg":"Payment details have been saved"
              })
            }
    });
  },
  editProduct:function(req,res){
    var product_id=req.body.product_id;
     common.update("products",{
      "product_name":req.body.product_name,
      "in_stock":req.body.in_stock,
      "price":req.body.price,
      "description_3":req.body.description_3,
      "description_2":req.body.description_2,
      "description_1":req.body.description_1,
      "price2":req.body.price2,
      "requiredVarient":req.body.requiredVarient
      },{"product_id":product_id},function(error1,result1,fields1){
        if(error1){
          console.log(error1);
          res.send({"status":0,"msg":"Some error occured"});
        }
        else{
          res.send({"status":1,"msg":"Product has been updated","product_id":product_id});
        }
      });
  },
  socialLogin:function(req,res){
    var name=req.body.name;
    var email=req.body.email;
    var social_image=req.body.social_image;
    var social_type=req.body.social_type; // 0->facebook 1->google
    var query="select id,name,user_type,device_token,device_type,imei_number,os_version from users where email='"+email+"'";
    connection.query(query,function(error,results,fields){
      if(error){
        res.send({
          "status":0,
          "msg":"Something went wrong"
        })
      }
      else{
        if(results.length!=0){
          var id = results[0].id;
          var token = jwt.sign({ id: id }, config.secret, {
            //expiresIn: 86400 // expires in 24 hours
          });
          var device_type=req.body.device_type;
          var device_token=req.body.device_token;
          var imei_number=req.body.imei_number;
          var os_version=req.body.os_version;
          var update_data = 'update users set social_type="'+social_type+'" ,social_image="'+social_image+'" ,device_type = "'+device_type+'" ,device_token="'+device_token+'" ,auth_token="'+token+'",imei_number = "'+imei_number+'",os_version="'+os_version+'" where email= "'+email+'"';
          connection.query(update_data,function(error,results,fields){
            if(error){
              res.send({
                "status":0,
                "msg":"Something went wrong"
              })
            }
            else{
               res.send({
                "auth_token":token,
                "status":1,
                "msg":"Login Successfully",
                "user_status": "Old User"
                })
            }
          })
        }
        else{
          var md5password = new MD5().update(req.body.password).digest('hex');
          var insert_data = {
            "email":req.body.email,
            "name":req.body.name,
            "password":md5password,
            "user_type":req.body.type,
            "device_token":device_token,
            "device_type":device_type,
            "imei_number":imei_number,
            "social_image":social_image,
            "social_type":social_type,
            "os_version":os_version,
            "auth_token":token
          }
          var response = common.insert('users',insert_data,function(error, results, fields){
            if(error){
              res.send({"status":0,"msg":"Something went wrong"})
            }
            else{
              if(req.body.type=='1'){
                  var insert_data_details = {
                    "customer_id":results.insertId
                  }
                  var response = common.insert('customer_details',insert_data_details,function(error, results, fields){
                    if(error){
                      res.send({"status":0,"msg":"Something went wrong"})
                    }
                    else{
                       res.send({
                        "auth_token":token,
                        "status":1,
                        "msg":"Registered Successfully",
                        "user_status": "New User"
                        })
                    }
                  });
              }
            }
          });

        }
      }
    })  
},
editProductImage:function(req,res){
  var image_id=req.body.image_id;
     common.update("product_images",{
      "product_image":req.file.filename
      },{"id":image_id},function(error1,result1,fields1){
        if(error1){
          console.log(error1);
          res.send({"status":0,"msg":"Some error occured"});
        }
        else{
          res.send({"status":1,"msg":"Image has been updated","image_id":image_id});
        }
      });
},
addToCart:function(req,res){
  var product_id=req.body.product_id;
  var product_name=req.body.product_name;
  var product_qty=req.body.product_qty;
  var product_image=req.body.product_image;
  var product_size=req.body.product_size;
  var product_price=req.body.product_price;
  var requiredVarient = req.body.requiredVarient;
  var cart_id=0;
  var user_id=req.body.user_id;
  var query="select * from user_cart_map where user_id='"+user_id+"'";
  connection.query(query,function(error,results,fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
      if(results.length!=0){
        //cart id already exists
        var cart_id=results[0]['cart_id'];
      }
      else{
        //cart not exists, create cart
        var details_cart={
          "user_id":user_id
        }
        var response = common.insert('user_cart_map',details_cart,function(error, results11, fields){
          if(error){
            res.send({
              "status":0,
              "msg":"Something went wrong"
            })
          }
          else{
            cart_id=results11.insertId
          }

        });
      }
      setTimeout(function(){
        var cart_details={
          "cart_id":cart_id,
          "product_id":product_id,
          "product_qty":product_qty,
          "product_size":product_size,
          "user_id":user_id,
          "product_name":product_name,
          "product_image":product_image,
          "product_price":product_price,
          "requiredVarient":requiredVarient

        }
         var response = common.insert('cart',cart_details,function(error, results, fields){
          if(error){
            res.send({
              "status":0,
              "msg":"Some error occured"
            })
          }
          else{
            var query_amount="SELECT c.product_id,SUM(c.product_qty * p.price) AS grand_total FROM cart as c join products as p on p.product_id=c.product_id WHERE user_id='"+user_id+"' group by c.cart_id";
            connection.query(query_amount,function(error,results111,fields){
              if(error){
                res.send({
                  "status":0,
                  "msg":"Something went wrong"
                })
              }
              else{
                   res.send({
                    "status":1,
                    "msg":"Product has been added to the cart",
                    "total_amount_of_cart":results111[0]['grand_total']
                  })
              }
            })
         
          }
         });
      },1000);

    }
  })
  
},
addToWishlist:function(req,res){
  var customer_id=req.body.customer_id;
  var product_id=req.body.product_id;
  var wishlist_details={
    "product_id":req.body.product_id,
    "customer_id":req.body.customer_id,
    "product_name":req.body.product_name,
    "product_price":req.body.product_price,
    "product_image":req.body.product_image,

  }
  var response = common.insert('wishlist',wishlist_details,function(error, results, fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
       res.send({
        "status":1,
        "msg":"Your wishlist has been updated"
      })
    }
  });

},
getWishlist_byCustomer:function(req,res){
  var customer_id=req.params.customer_id;
  var query='select * from wishlist where customer_id="'+customer_id+'"';
  connection.query(query,function(error,results,fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
      res.send({
        "status":1,
        "msg":"Success",
        "data":results
      })
    }
  })
},
deleteCart:function(req,res){
  var user_id=req.body.user_id;
  var query='select cart_id from user_cart_map where user_id="'+user_id+'"';
  connection.query(query,function(error,results,fields){
    if(results.length==0){
      res.send({
        "status":0,
        "msg":"The cart is already empty"
      })
    }
    else{
    cart_id=results[0]['cart_id'];
    var query1='delete from cart where cart_id="'+cart_id+'"';
    var query2='delete from user_cart_map where cart_id="'+cart_id+'"';
    connection.query(query1,function(err,ress,fieldss){
      if(err){
        res.send({
          "status":0,
          "msg":"Something went wrong"
        })
      }
      else{
        connection.query(query2,function(errr,ress1,fields1){
          if(errr){
            res.send({
              "status":0,
              "msg":"Something went wrong"
            })
          }
          else{
            res.send({
              "status":1,
              "msg":"Cart deleted",
              "cart_id":cart_id
            })
          }
        })
      }
    })
  }

  })

},
editCart:function(req,res){
  var cart_product_id=req.body.cart_product_id;
  var product_id = req.body.product_id;
  if(product_id==''){
    var query2='delete from cart where id="'+cart_product_id+'"';
    connection.query(query2,function(errors,resultss,fields){
      if(errors){
        res.send({
          "status":0,
          "msg":"Something went wrong"
        })
      }
      else{
         res.send({
            "status":1,
            "msg":"Product removed from cart"
          })
      }
    })
   
  }
  else{
    common.update("cart",{
        "product_qty":req.body.product_qty,
        "product_size":req.body.product_size
    },{"id":cart_product_id},function(error1,result1,fields1){
      if(error1){
        res.send({
          "status":0,
          "msg":"Something went wrong"
        })
      }
      else{
        res.send({
          "status":1,
          "msg":"Cart has been edited"
        })
      }
    });
  }
},
forgotPassword:function(req,res){
  common.verifycol('users', 'email', req.body.email, function(verified){
        if(!verified){
            var otp=randomstring.generate({
            length: 4,
            charset: 'numeric'
          });
          var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: '',
            pass: ''
          }
          });

          var mailOptions = {
            from: '',
            to: req.body.email,
            subject: 'Redcrix: Forgot Password',
            text: 'Your OTP is: '+otp
          };
          var update_otp='update users set otp="'+otp+'" where email="'+req.body.email+'"';
          connection.query(update_otp,function(error,results,fieldss){

          })
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              res.send({
                "status":0,
                "msg":"Something went wrong"
              })
            } else {
              res.send({
                "status":1,
                "msg":"OTP has been sent through mail"
              })
            }
          });
        }
 
  else{
    res.send({
      "status":0,
      "msg":"Enter a registered email only"
    })
  }
   });
},
getProductsInCart:function(req,res){
  var user_id=req.params.user_id;
  var query='select * from cart where user_id="'+user_id+'"';
  connection.query(query,function(error,results,fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
      res.send({
        "status":1,
        "msg":"Success",
        "products":results
      })
    }
  })
},
confirm_otp:function(req,res){
 var query='select otp from users where email="'+req.body.email+'"';
 connection.query(query,function(error,results,fields){
  if(error){
    res.send({
      "status":0,
      "msg":"Something went wrong"
    })
  }
  else{
    var entered_otp=req.body.entered_otp;
    var actual_otp=results[0]['otp'];
    if(entered_otp==actual_otp){
      res.send({
        "status":1,
        "msg":"Otp matched"
      })
    }
    else{
      res.send({
        "status":0,
        "msg":"OTP did not match"
      })
    }
  }
 })
},
reset_password:function(req,res){
  var md5password = new MD5().update(req.body.new_password).digest('hex');
  var sel_query='update users set password="'+md5password+'" where email="'+req.body.email+'"';
  connection.query(sel_query,function(erorr,result,fields){
    if(erorr){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
      res.send({
        "status":1,
        "msg":"Password has been reset successfully"
      })
    }
  })
},
getProductDetails:function(req,res){
  var product_id=req.params.product_id;
  var query='select * from products where product_id="'+product_id+'"';
  connection.query(query,function(error,results,fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
      res.send({
        "status":1,
        "msg":"Success",
        "data":results
      })
    }
  })
},

add_review:function(req,res){
  var review_details={
   "product_id":req.body.product_id,
   "user_id":req.body.user_id,
   "message":req.body.message
 }
 var response = common.insert('reviews',review_details,function(error, results, fields){
   if(error){
     res.send({
       "status":0,
       "msg":"Something went wrong"
     })
   }
   else{
      res.send({
       "status":1,
       "msg":"Your review has been added"
     })
   }
 });
},
confirm_order:function(req,res){

 var qty=0; var price=0;
 var products=req.body.products;

 var order_details={
   "order_status":"1",
   "user_id":req.body.user_id
 }
 var response = common.insert('orders',order_details,function(error, results, fields){

   if(error){
     res.send({
       "status":0,
       "msg":"Something went wrong"
     })
   }
   else{
     for(var i=0;i<products.length;i++)
     {
       var mapping_details={
         "order_id":results.insertId,
         "product_id":products[i]['product_id'],
         "product_name":products[i]['product_name'],
        
         "product_qty":products[i]['product_qty'],
         "product_price":products[i]['price'],

         "delivery_address":req.body.delivery_address,
      
         "pincode" : req.body.pincode,
         "house" : req.body.house,
         "area" : req.body.area,
         "city": req.body.city,
         "state":req.body.state,
         "country": req.body.country,
         "name" :req.body.name,
         "phone" : req.body.phone,
         "phone2" :req.body.phone2,

      
       }
       var response_map = common.insert('order_product_map',mapping_details,function(error, results, fields){
       });

     }
     res.send({
       "status":1,
       "msg":"Order added successfully",
       "order_id":results.insertId       
     })
   }
 });

},
changeOrderStatus:function(req,res){
 var order_id=req.body.order_id;
 var status=req.body.status;
 var query='update orders set order_status="'+status+'" where order_id="'+order_id+'"';
 connection.query(query,function(error,results,fields){
   if(error){
     res.send({
       "status":0,
       "msg":"Something went wrong"
     })
   }
   else{
     res.send({
       "status":1,
       "msg":"Order status has been updated successfully"
     })
   }
 })

},
getOrderDetails:function(req,res){
 var order=req.params.order_id;
 var query='select * from order_product_map where order_id="'+order+'"';
 connection.query(query,function(error,results,fields){
   if(error){
     res.send({
       "status":0,
       "msg":"Something went wrong"
     })
   }
   else{
     res.send({
       "status":1,
       "msg":"Success",
       "data":results
     })
   }
 })
},
editOrder:function(req,res){
 var id=req.body.id;
 var product_id=req.body.product_id;
 var product_qty=req.body.product_qty;
 if(product_qty==0){
   var query='delete from order_product_map where id="'+id+'"'
   connection.query(query,function(error,results,fields){
     if(error){
       res.send({
         "status":0,
         "msg":"Something went wrong"
       })
     }
     else{
        res.send({
         "status":1,
         "msg":"Product has been deleted from the order"
       })
     }
   })
 }
 else{
   var query='update order_product_map set product_qty="'+product_qty+'" where id="'+id+'"';
   connection.query(query,function(error,results,fields){
     if(error){
       res.send({
         "status":0,
         "msg":"Something went wrong"
       })
     }
     else{
       res.send({
         "status":1,
         "msg":"Product quantity updated in the order"
       })
     }

   })
 }
},
getAllOrders:function(req,res){
 var query='select * from orders';
 connection.query(query,function(error,results,fields){
   if(error){
     res.send({
       "status":0,
       "msg":"Something went wrong"
     })
   }
   else{
     res.send({
       "status":1,
       "msg":"Success",
       "data":results
     })
   }
 })
},
getUserOrders:function(req,res){
 var user_id=req.params.user_id;
 var query='select * from orders where user_id="'+user_id+'"';
 connection.query(query,function(error,results,fields){
   if(error){
     res.send({
       "status":0,
       "msg":"Something went wrong"
     })
   }
   else{
     res.send({
       "status":1,
       "msg":"Success",
       "data":results
     })
   }
 })
},
getUserDetails:function(req,res){
 var user_id=req.params.user_id;
 var data_array=[];
 var flag=1;
 var query='select u.name as customer_name,u.email as customer_email from users as u where u.id="'+user_id+'"';
 console.log(query);
 connection.query(query,function(error,results,fields){
   if(error){
     res.send({
       "status":0,
       "msg":"Something went wrong"
     })
    
   }
   else{
     var query2='select o.order_id,o.order_status from orders as o where o.user_id="'+user_id+'"';
     console.log(query2);
     connection.query(query2,function(error1,results1,fields){
       if(error1){
         res.send({
           "status":0,
           "msg":"Something went wrong"
         })
       }
       else{
         results1.forEach(function(value,index){
         var query3='select opm.*,p.product_name from order_product_map as opm left join orders as o on o.order_id=opm.order_id left join products as p on p.product_id=opm.product_id where o.order_id="'+value.order_id+'"';
         console.log(query3);
         connection.query(query3, function (err2, result2, fields2) 
         { 
           if (err2){
             flag=0;
           }
           else{
                       console.log(query3);

             console.log(result2);
             var new_array = new Object();
             var sample = new Array();
             sample.push(new_array);
             new_array.order_id=value.order_id;
               // sample.push(new Object());
             for(var i=0;i<result2.length;i++){
               var new_array = new Object();
               sample.push(new_array);
               new_array.product_name=result2[i].product_name;
               new_array.product_qty=result2[i].product_qty;
               new_array.product_price=result2[i].product_price;
             }
             
             data_array.push(sample);
          
           }
      
                      
         });         
       });

              setTimeout( function(){
           if(flag==0){
             res.send({
               "status":0,
               "msg":"Failure"
             });
           }
           else{
              res.send({
               "status":1,
               "msg":"Success",
               "user_details":results[0],
               "order_details":data_array
             })   
           }
         },1000);
       }
     })
   }
 })
},
getProductReviews:function(req,res){
 var product_id=req.params.product_id;
 var query='SELECT u.name,r.message from reviews as r left join users as u on u.id=r.user_id where r.product_id="'+product_id+'"';
 connection.query(query,function(error,result,fields){
   if(error){
     res.send({
       "status":0,
       "msg":"Something went wrong"
     })
   }
   else{
     res.send({
       "status":1,
       "msg":"Success",
       "reviews_data":result
     })
   }
 })
},
contact_us_redcrix:function(req,res){

  var new_details={
    "Name":req.body.Name,
    "Email":req.body.Email,
    "ServiceInfo" : req.body.ServiceInfo,
    "Phone" : req.body.Phone,
    "Message" : req.body.Message,
   
  }
  var response = common.insert('contact_redcrix',new_details,function(error, results, fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
       res.send({
        "status":1,
        "msg":"Your contact_redcrix has been updated"
      })
    }
  });
    

},

get_contact_us_redcrix:function(req,res){
  var product_id=req.params.product_id;
  var query='select * from contact_redcrix';
  connection.query(query,function(error,results,fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
      res.send({
        "status":1,
        "msg":"Success",
        "data":results
      })
    }
  })
},

contact_us_redcart:function(req,res){

  var new__details={
    "Name":req.body.Name,
    "Email":req.body.Email,
    "OrderId" : req.body.OrderId,
    "Phone" : req.body.Phone,
    "Message" : req.body.Message,
  }
  var response = common.insert('contact_redcart',new__details,function(error, results, fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
       res.send({
        "status":1,
        "msg":"Your contact_redcart has been updated"
      })
    }
  });
    

},

get_contact_us_redcart:function(req,res){

  var query='select * from contact_redcart';
  connection.query(query,function(error,results,fields){
    if(error){
      res.send({
        "status":0,
        "msg":"Something went wrong"
      })
    }
    else{
      res.send({
        "status":1,
        "msg":"Success",
        "data":results
      })
    }
  })
},

}