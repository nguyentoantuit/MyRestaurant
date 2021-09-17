var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var pages = require('./routes/pages');
var products = require('./routes/products');
var cart = require('./routes/cart');
var users = require('./routes/users');
var adminRouter = require('./routes/admin_pages');
var categoriesRouter = require('./routes/admin_categories');
var productsRouter = require('./routes/admin_products');
var passport = require('passport');
// var expressValidator = require('express-validator');
// fileUpload
var fileUpload = require ("express-fileupload");

// Session
var session = require('express-session');

// Validator
const { body, validationResult } = require('express-validator');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

// App local
app.locals.errors = null;

// Get Page model
var Page = require("./models/page");

// Page switch header
Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
  if (err) {
    console.log(err);
  } else {
    app.locals.pages = pages;
  }
});

// Get Category model
var Category = require("./models/category");

// Category switch header
Category.find(function (err, categories) {
  if (err) {
    console.log(err);
  } else {
    app.locals.categories = categories;
  }
});

// fileupload
app.use(fileUpload());

// Express-session
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}))
// // Express Validator middleware
// app.use(expressValidator({
//   errorFormater: function(param,msg,value) {
//       var namespace = param.split('.')
//       , root = namespace.shift()
//       , formParam = root;
  
//       while(namespace.length){
//           formParam += '[' + namespace.shift() + ']';
//       }
//       return{
//           param : formParam,
//           msg : msg,
//           value: value
//       };
//   },
//   customValidators: {
//       isImage: function (value, filename) {
//           var extension = (path.extname(filename)).toLowerCase();
//           switch(extension) {
//               case '.jpg':
//                   return '.jpg';
//               case '.jpeg':
//                   return '.jpeg';
//               case '.png':
//                   return '.png';
//               case '':
//                   return '.jpg';
//               default: 
//                   return false;
//           }
//       }
//   }
// }));
// Express Validator
app.post(
  '/user',
  // username must be an email
  body('username').isEmail(),
  // password must be at least 5 chars long
  body('password').isLength({ min: 5 }),
  (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    User.create({
      username: req.body.username,
      password: req.body.password,
    }).then(user => res.json(user));
  },
);

// Express Messages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Passport config
require('./config/passport')(passport);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next) {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
});

// Routers admin.
app.use('/admin/pages', adminRouter);  
app.use('/admin/categories', categoriesRouter);  
app.use('/admin/products', productsRouter);
// Routers client.  
app.use('/products', products);  
app.use('/cart', cart);
app.use('/users', users);  
app.use('/', pages);  

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const config = require("./config/database");

// kết nối đến database.
const mongoose = require ("mongoose");
const { CustomValidation } = require('express-validator/src/context-items');
const { param } = require('express-validator');
mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Kết nối thành công");
});

module.exports = app;
