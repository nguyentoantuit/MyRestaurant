var express = require('express');
var router = express.Router();
var {check, validationResult} = require('express-validator');
var auth = require("../config/auth");
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var path = require('path')
var isAdmin = auth.isAdmin;

var Page = require('../models/page');

/* GET admin page. */
router.get('/', isAdmin, function(req, res) {
  Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
    res.render('admin/pages', {
      pages: pages 
    });
  });
});

/* GET add page. */
router.get('/add-page', isAdmin,  function(req, res, next) {
  var title = "";
  var slug = "";
  var content = "";
  res.render('admin/add_page', {
    title: title,
    slug: slug,
    content: content
  });

});

/* GET edit page. */
router.get('/edit-page/:id', isAdmin,   function(req, res, next) {
  Page.findById(req.params.id, function(err, page) {
    if (err) 
      return console.log(err);
  res.render('admin/edit_page', {
      title: page.title,
      slug: page.slug,
      content: page.content,
      id: page._id
    });
  });

});


/* POST add page. */
router.post("/add-page", [
        check('title', 'Tiêu đề phải có một giá trị.').notEmpty(),
        check('content', 'Nội dung phải có một giá trị.').notEmpty()
    ],
function(req, res, next) {
  console.log('req', req.files);
  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if (slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;
  var image = req.files !== null ? req.files.image.name : '';
  const errors = validationResult(req).errors;
  if (errors.length != 0) {
    res.render('admin/add_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content,
    });
  }
  else {
    Page.findOne({ slug: slug }, function (err, page) {
      if (page) {
        req.flash('danger', 'Trang sắp xếp đa tồn tại, hãy chọn trang khác.');
        res.render('admin/add_page', { title, slug, content });
      } else {
        var page = new Page({
          title: title,
          slug: slug,
          content: content,
          sorting: 100,
          image: image
        });
        page.save(function (err) {
          if (err) {
            return console.log(err);
          }
          var mypath = 'public/product_images/' + page._id;

          mkdirp.sync(mypath + '/gallery/thumbs');
          if (image != '') {
            var pageImage = req.files.image;
            var tmp = mypath + '/' + image;
            pageImage.mv(tmp, function (err) {
              if (err)
                return console.log(err);
            });
          }
          Page.find({}).exec(function(err,pages) {
            if (err) {
              console.log(err);
            } else {
              req.app.locals.pages = pages;
            }
          });
          req.flash('Success', 'Thêm trang thành công!');
          res.redirect('/admin/pages');
        });
      }
    });
  }
});


/* POST Edit page. */
router.post('/edit-page/:id', [
        check('title', 'Tiêu đề phải có một giá trị.').notEmpty(),
        check('content', 'Nội dung phải chứa một giá trị.').notEmpty()
    ],
function(req, res, next) {
  var title = req.body.title;
  var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
  if (slug == "") slug = title.replace(/\s+/g, '-').toLowerCase();
  var content = req.body.content;
  var id = req.params.id;
  var pimage = req.body.pimage;
  var imageFile = req.files !== null ? req.files.image.name : '';

  const errors = validationResult(req).errors;

  if (errors.length != 0) {
    res.render('admin/edit_page', {
      errors: errors,
      title: title,
      slug: slug,
      content: content,
      id: id
    });
  }
  else {
    Page.findOne({ slug: slug, _id:{'$ne}':id}}, function (err, page) {
      if (page) {
        req.flash('danger', 'Trang sắp xếp đã tồn tại, hãy chọn trang khác.');
        res.render('admin/edit_page', { 
            title: title, 
            slug: slug, 
            content: content,
            id: id
          });
      } else {

          Page.findById(id, function(err, page){
            if (err){
              return console.log(err);
            }
            page.title = title;
            page.slug = slug;
            page.content = content;

            if (imageFile != '') { page.image = imageFile; }

            page.save(function (err) {
              if (err) {
                return console.log(err);
              }
              if (imageFile != '') {
                if (pimage != '') {
                  fs.remove('public/product_images/' + id + '/' + pimage, function (err) { if (err) console.log(err); });
                }
                var pageImage = req.files.image;
                var tmp = 'public/product_images/' + id + '/' + imageFile;
                pageImage.mv(tmp, function (err) {
                  if (err)
                    return console.log(err);
                });
              }
              Page.find({}).exec(function(err,pages) {
                if (err) {
                  console.log(err);
                } else {
                  req.app.locals.pages = pages;
                }
              });  
              req.flash('Success', 'Chỉnh sửa trang!');
              res.redirect('/admin/pages');
            });
          });
      }
    });
  }
});

/* GET delete page. */
router.get('/delete-page/:id', isAdmin, function(req, res, next) {
  Page.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      return console.log(err)
    }
    Page.find({}).exec(function(err,pages) {
      if (err) {
        console.log(err);
      } else {
        req.app.locals.pages = pages;
      }
    });  
    req.flash('Success', 'Trang đã bị xóa!');
    res.redirect('/admin/pages/');
  });
}); 


module.exports = router;
