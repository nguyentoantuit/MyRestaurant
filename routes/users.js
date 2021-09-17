var express = require('express');
var router = express.Router();
var passport = require ('passport');
var bcrypt = require('bcryptjs');

var User = require('../models/user');

const { check, validationResult } = require('express-validator');

/* GET register */
router.get('/register', function(req, res, next) {
  res.render('register', {
    title: 'Register'
  });
});

/* POST register */
const checkFormRegister = [
  check('name', 'Bắt buộc nhập tên !').notEmpty(),
  check('email', 'Bắt buộc nhập email !').isEmail(),
  check('username', 'Bắt buộc nhập tên tài khoản !').notEmpty(),
  check('password', 'Bắt buộc nhập mật khẩu !').notEmpty(),
  check('password2').custom((value, {req})=> {
    if (value !== req.body.password) {
      throw new Error('Mật khẩu không trùng khớp !');
    }
    return true;
  })
]
router.post('/register', checkFormRegister ,function(req, res, next) {
  var name = req.body.name;
  var email = req.body.email;
  var username = req.body.username;
  var password = req.body.password;
  const errors = validationResult(req).errors;
  if (errors.length != 0) {
    res.render('register', {
      errors: errors,
      user: null,
      title: 'Register'
    });
  } else {
    User.findOne({username : username }, function(err, user){
      if (err) {
        console.log(err);
      }
      if (user) {
        req.flash('danger', 'Tên người dùng đã tồn tại, hãy chọn tên khác !');
        res.redirect('/users/register');
      } else {
        var user = new User ({
          name: name,
          email: email,
          username: username,
          password: password,
          admin: 1
        });
        bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(user.password, salt, function(err, hash){
            if (err) {
              console.log(err);
            }
            user.password = hash;
            user.save(function (err) {
              if (err) {
                console.log(err);
              } else {
                req.flash('Success', 'Bạn đã đăng kí thành công !');
                res.redirect('/users/login');
              }
            });
          });
        });
      }
    });
  }
});

/* GET login */
router.get('/login', function(req, res, next) {
  if (res.locals.user) res.redirect('/');
  res.render('login', {
    title: 'Log in'
  });
});

/* POST login */
router.post('/login', function(req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

/* GET logout */
router.get('/logout', function(req, res, next) {
  req.logout();
  req.flash('Success', 'Bạn đã đăng xuất !');
  res.redirect('/users/login');
});
module.exports = router;
