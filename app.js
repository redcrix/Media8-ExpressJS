var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
var multer = require('multer');
var async = require('async');
var config = require('./config'); 
var session = require('express-session');
var upload = multer({dest:'./public/uploads/'});
var MD5 =require('md5.js');
var fs = require("fs");
var async = require('async');
var cookieParser = require('cookie-parser');
var http = require('http').Server(app);
var request = require('request');
var flash = require('connect-flash');
const connection = require('./db');
var common =require('./common');
var api =require('./routes/api');
var partials = require('express-partials');
app.use(bodyParser.json());
var apiRoutes = express.Router();
var logger = require('morgan');
var randomstring = require("randomstring");
var dateTime = require('node-datetime');
var urlencodedParser=bodyParser.urlencoded({ extended: false });
var cors = require('cors');


//enables cors
app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'exposedHeaders': ['sessionId'],
  'origin': '*',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false
}));


app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: true,
    saveUninitialized: true
}));
app.use(flash());
app.use(partials());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
var apns = require("apns"), apns_options, apns_connection, apns_notification;
app.use('/api', apiRoutes);

var appRootPath = require('app-root-path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


apiRoutes.post('/signup',function(req,res){
  api.signup(req,res);
})
apiRoutes.post('/login',function(req,res){
  api.login(req,res);
})
apiRoutes.post('/addProduct',upload.array('images', 12),function(req,res){
  api.addProduct(req,res);
 // console.log(req.files[0]);
 // console.log(req.body);
 // res.send("gdfg");
})
apiRoutes.get('/getProducts/:category_id',function(req,res){
  api.getProducts(req,res);
})
apiRoutes.get('/deleteProduct/:product_id',function(req,res){
  api.deleteProduct(req,res);
})
apiRoutes.get('/getAllProducts',function(req,res){
  api.getAllProducts(req,res);
})
apiRoutes.post('/saveCustomerAddress',function(req,res){
  api.saveCustomerAddress(req,res);
})
apiRoutes.get('/getSaved_address/:customer_id',function(req,res){
  api.getSaved_address(req,res);
})
apiRoutes.post('/socialLogin',function(req,res){
  api.socialLogin(req,res);
})
apiRoutes.post('/editProduct',function(req,res){
  api.editProduct(req,res);
})
apiRoutes.post('/editProductImage',upload.single('image'),function(req,res){
 api.editProductImage(req,res);
})
apiRoutes.post('/addToCart',function(req,res){
  api.addToCart(req,res);
})
apiRoutes.post('/checkout',function(req,res){
  api.checkout(req,res);
})
apiRoutes.post('/addToWishlist',function(req,res){
  api.addToWishlist(req,res);
})
apiRoutes.post('/deleteCart',function(req,res){
  api.deleteCart(req,res);
})
apiRoutes.post('/editCart',function(req,res){
  api.editCart(req,res);
})
apiRoutes.post('/forgotPassword',function(req,res){
  api.forgotPassword(req,res);
})
apiRoutes.get('/getProductsInCart/:user_id',function(req,res){
  api.getProductsInCart(req,res);
})
apiRoutes.post('/confirm_otp',function(req,res){
  api.confirm_otp(req,res);
})
apiRoutes.post('/resend_otp',function(req,res){
  api.forgotPassword(req,res);
})
apiRoutes.post('/reset_password',function(req,res){
  api.reset_password(req,res);
})
apiRoutes.get('/getProductDetails/:product_id',function(req,res){
  api.getProductDetails(req,res);
})
apiRoutes.get('/getWishlist_byCustomer/:customer_id',function(req,res){
  api.getWishlist_byCustomer(req,res);
})
apiRoutes.get('/getImage/:image_name',function(req,res){
    res.sendFile(path.join(__dirname, "./public/uploads/"+req.params.image_name));
})
apiRoutes.post('/contact_us_redcrix',function(req,res){
  api.contact_us_redcrix(req,res);
})
apiRoutes.get('/get_contact_us_redcrix',function(req,res){
  api.get_contact_us_redcrix(req,res);
})
apiRoutes.post('/contact_us_redcart',function(req,res){
  api.contact_us_redcart(req,res);
})
apiRoutes.get('/get_contact_us_redcart',function(req,res){
  api.get_contact_us_redcart(req,res);
})

// == NEW


apiRoutes.post('/add_review',function(req,res){
  api.add_review(req,res);
})
apiRoutes.post('/confirm_order',function(req,res){
  api.confirm_order(req,res);
})

apiRoutes.post('/changeOrderStatus',function(req,res){
  api.changeOrderStatus(req,res);
})
apiRoutes.get('/getOrderDetails/:order_id',function(req,res){
  api.getOrderDetails(req,res);
})
apiRoutes.post('/editOrder',function(req,res){
  api.editOrder(req,res);
})
apiRoutes.get('/getAllOrders',function(req,res){
  api.getAllOrders(req,res);
})
apiRoutes.get('/getUserOrders/:user_id',function(req,res){
  api.getUserOrders(req,res);
})
apiRoutes.get('/getUserDetails/:user_id',function(req,res){
  api.getUserDetails(req,res);
})
apiRoutes.get('/getProductReviews/:product_id',function(req,res){
  api.getProductReviews(req,res);
})


// development error handler
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
app.use(function(err, req, res, next) {
console.log("req"+req.url);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



// var port = process.env.PORT || 3000;

// app.listen(port);

// app.listen(process.env.PORT || 3000);

// var server = app.listen(8086,function () {

//   var host = server.address().address
//   var port = server.address().port

//  console.log("Redcrix is listening at http://%s:%s", host, port);


// })
// app.use(bodyParser.json());
// var server = app.listen(process.env.PORT || 8080, function () {
//   var port = server.address().port;
//   console.log("App now running on port", port);
// });

var server = app.listen(process.env.PORT || 3000, function(){ 
  var host = server.address().address
  var port = server.address().port
  console.log('listening on', host, port);
});



module.exports = app;