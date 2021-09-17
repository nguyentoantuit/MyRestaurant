var express = require('express');
var router = express.Router();
var {check, validationResult} = require('express-validator');
var auth = require("../config/auth");
var isAdmin = auth.isAdmin;

var Category = require('../models/category');

/* GET admin categories */
router.get('/',isAdmin, function(req, res) {
  Category.find(function(err, categories) {
    if (err) return console.log(err);
    res.render('admin/categories', {
      categories: categories
    });
  });
});

/* GET add categories. */
router.get('/add-category',isAdmin, function(req, res, next) {
  var title = "";
  
  res.render('admin/add_category', {
    title: title,
  });

});

/* GET edit categories */
router.get('/edit-category/:id',isAdmin, function(req, res, next) {
  Category.findById(req.params.id, function(err, category) {
    if (err) 
      return console.log(err);
  res.render('admin/edit_category', {
      title: category.title,
      id: category._id
    });
  });

});


/* GET POST add categories */
router.post("/add-category", [
        check('title', 'Tiêu đề phải có một dữ liệu.').notEmpty(),
    ],
function(req, res, next) {
  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();

  const errors = validationResult(req).errors;

  if (errors.length != 0) {
    res.render('admin/add_category', {
      errors: errors,
      title: title,
    });
  }
  else {
    Category.findOne({ slug: slug }, function (err, category) {
      if (category) {
        req.flash('danger', 'Tiêu đề danh mục đã tồn tại, hãy chọn một danh mục khác.');
        res.render('admin/add_category', { title });
      } else {
        var category = new Category({
          title: title,
          slug: slug,
        });
        category.save(function (err) {
          if (err) {
            return console.log(err);
          }
          Category.find(function(err, categories) {
            if (err) {
              console.log(err);
            } else {
              req.app.locals.categories = categories;
            }
          });  
          req.flash('Success', 'Đã thêm một danh mục !');
          res.redirect('/admin/categories');
        });
      }
    });
  }
});


/*POST Edit categories */
router.post('/edit-category/:id', [
        check('title', 'Tiêu đề phải có một dữ liệu.').notEmpty(),
    ],
function(req, res, next) {
  var title = req.body.title;
  var slug = title.replace(/\s+/g, '-').toLowerCase();
  var id = req.params.id;

  const errors = validationResult(req).errors;

  if (errors.length != 0) {
    res.render('admin/edit_category', {
      errors: errors,
      title: title,
      id: id
    });
  }
  else {
    Category.findOne({ slug: slug, _id:{'$ne':id}}, function (err, category) {
      if (category) {
        req.flash('danger', 'Tiêu đề danh mục đã tồn tại, hãy chọn một danh mục khác.');
        res.render('admin/edit_category', { 
            title: title, 
            id: id
          });
      } else {

          Category.findById(id, function(err, category){
            if (err)
              return console.log(err);
            
            category.title = title;
            category.slug = slug

            category.save(function (err) {
              if (err) {
                return console.log(err);
              }
              Category.find(function(err, categories) {
                if (err) {
                  console.log(err);
                } else {
                  req.app.locals.categories = categories;
                }
              });
              req.flash('Success', 'Đã sửa đổi danh mục!');
              res.redirect('/admin/categories');
            });
          });
      }
    });
  }
});

/* GET delete page. */
router.get('/delete-category/:id', isAdmin, function(req, res, next) {
  Category.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      return console.log(err);
    }
    Category.find(function(err, categories) {
      if (err) {
        console.log(err);
      } else {
        req.app.locals.categories = categories;
      }
    });
    req.flash('Success', 'Danh mục đã bị xóa!');
    res.redirect('/admin/categories');
  });
}); 


module.exports = router;
