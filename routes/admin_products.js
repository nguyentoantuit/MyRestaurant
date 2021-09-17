var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');
var path = require('path')
var auth = require("../config/auth");
var isAdmin = auth.isAdmin;

var Category = require('../models/category');

var Product = require('../models/product');
const e = require('express');

/* GET product index */
router.get('/', isAdmin, function (req, res) {
  var count;

  Product.countDocuments(function (err, c) {
    count = c;
  });

  Product.find(function (err, products) {
    res.render('admin/products', { products, count });
  });
});

/* GET add product. */
router.get('/add-product', isAdmin, function (req, res, next) {
  var title = "";
  var slug = "";
  var desc = "";
  var price = "";
  Category.find(function (err, categories) {
    res.render('admin/add_product', {
      title: title,
      slug: slug,
      desc: desc,
      categories: categories,
      price: price
    });
  });
});

/* GET edit product */
router.get("/edit-product/:id", isAdmin, function (req, res, next) {
  var errors;
  if (req.session.errors) errors = req.session.errors;
  req.session.errors = null;

  Category.find(function (err, categories) {
    Product.findById(req.params.id, function (err, p) {
      if (err) {
        console.log(err);
        res.redirect('/admin/products');
      } else {
        var galleryDir = 'public/product_images/' + p._id + '/gallery';
        var galleryImages = null;
        fs.readdir(galleryDir, function (err, files) {
          if (err) {
            console.log(err);
          } else {
            galleryImages = files;
            res.render('admin/edit_product', {
              title: p.title,
              slug: p.slug,
              errors: errors,
              desc: p.desc,
              categories: categories,
              category: p.category.replace(/\s+/g, '-').toLowerCase(),
              price: parseFloat(p.price).toFixed(2),
              image: p.image,
              galleryImages: galleryImages,
              id: p._id
            });
          }
        });
      }
    });
  });
});

function isImage(value, { req }) {
  var filename = req.files !== null ? req.files.image.name : '';
  var extension = (path.extname(filename)).toLowerCase();
  switch (extension) {
    case '.jpg': return '.jpg';
    case '.jpeg': return '.jpeg';
    case '.png': return '.png';
    case '': return '.jpg';
    default: return false;
  }
}

const isValidator = [
  check('title', 'Tiêu đề phải chứa một dữ liệu.').notEmpty(),
  check('desc', 'Mô tả phải chứa một dữ liệu.').notEmpty(),
  check('price', 'Giá phải chứa dữ liệu.').isDecimal(),
  check('image', 'Bạn phải tải lên một hình ảnh.').custom(isImage)
];
/* POST add product */
router.post("/add-product", isValidator,
  function (req, res, next) {
    console.log('req', req.files);
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var image = req.files !== null ? req.files.image.name : '';

    const errors = validationResult(req).errors;
    // Array.isArray(errors) && errors.length
    if (errors.length != 0) {
      Category.find(function (err, categories) {
        res.render('admin/add_product', { errors, title, desc, categories, price });
      });
    } else {
      Product.findOne({ slug: slug }, function (err, product) {
        if (product) {
          req.flash('danger', 'Tiêu đề sản phẩm đã tồn tại, hãy chọn một tiêu đề khác.');

          Category.find(function (err, categories) {
            res.render('admin/add_product', { title, desc, categories, price });
          });
        } else {
          var price2 = parseFloat(price).toFixed(2);
          var product = new Product({
            title: title,
            slug: slug,
            desc: desc,
            category: category,
            price: price2,
            image: image
          });
          product.save(function (err) {
            if (err)
              return console.log(err)
            var mypath = 'public/product_images/' + product._id;

            mkdirp.sync(mypath + '/gallery/thumbs');
            if (image != '') {
              var productImage = req.files.image;
              var tmp = mypath + '/' + image;
              productImage.mv(tmp, function (err) {
                if (err)
                  return console.log(err);
              });
            }
            req.flash('Success', 'Sản phẩm đã được thêm vào !');
            res.redirect('/admin/products');
            // console.log('dirname', __dirname);
            // var sampleFile = req.files.image
            // // var mypath = `${__dirname}/../public/product_images/${product.id}-${sampleFile.name}`
            // var pathImage = `/product_images/${product.id}-${sampleFile.name}`
            // var mypath = `public${pathImage}`
            // sampleFile.mv(mypath, function (err) {
            //   if (err)
            //     return console.log(err);
            //   product.image = pathImage
            //   product.save(() => {
            //     console.log('upload xog r ne', product);
            //     req.flash('Success', 'Product added!');
            //     res.redirect('/admin/products');
            //   })
            // })
          });
        }
      });
    }
  });


/* POST Edit product */
router.post("/edit-product/:id", isValidator,
  function (req, res, next) {
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;
    var imageFile = req.files !== null ? req.files.image.name : '';

    const errors = validationResult(req).errors;
    if (errors.length != 0) {
      req.session.errors = errors;
      res.redirect('/admin/products/edit-product/' + id);
    } else {
      Product.findOne({ slug: slug, _id: { '$ne': id } }, function (err, p) {
        if (err)
          console.log(err);
        if (p) {
          req.flash('danger', 'Tiêu đề sản phẩm đã tồn tại, hãy chọn một tiêu đề khác.');
          res.redirect('/admin/products/edit-product/' + id);
        } else {
          Product.findById(id, function (err, p) {
            if (err) {
              console.log(err);
            }
            p.title = title;
            p.slug = slug;
            p.desc = desc;
            p.price = parseFloat(price).toFixed(2 );
            p.category = category;

            if (imageFile != '') { p.image = imageFile; }

            p.save(function (err) {
              if (err) console.log(err);
              if (imageFile != '') {
                if (pimage != '') {
                  fs.remove('public/product_images/' + id + '/' + pimage, function (err) { if (err) console.log(err); });
                }
                var productImage = req.files.image;
                var tmp = 'public/product_images/' + id + '/' + imageFile;
                productImage.mv(tmp, function (err) {
                  if (err)
                    return console.log(err);
                });
              }
              req.flash('success', 'Sản phẩm đã được tồn tại!');
              res.redirect('/admin/products/');
            });
          });
        }
      });
    }
  });

/*POST product gallery */
router.post("/product-gallery/:id", function (req, res, next) {
  var productImage = req.files.file;
  var id = req.params.id;
  var mypath = 'public/product_images/' + id + '/gallery/' + req.files.file.name;

  var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

  productImage.mv(mypath, function (err) {
    if (err)
      console.log(err);
    resizeImg(fs.readFileSync(mypath), { width: 100, height: 100 }).then(function (buf) {
      fs.writeFileSync(thumbsPath, buf)
    });
  });
  res.sendStatus(200);
});

/* GET delete image gallery */
router.get("/delete-image/:image", isAdmin, function (req, res, next) {
  var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
  var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

  fs.remove(originalImage, function (err) {
    if (err) {
      console.log(err);
    } else {
      fs.remove(thumbImage, function (err) {
        if (err) {
          console.log(err);
        } else {
          req.flash('succes', 'Hình ảnh đã bị xóa!');
          res.redirect('/admin/products/edit-product/' + req.query.id);
        }
      });
    }
  });
});
/* GET delete product. */
router.get('/delete-product/:id', isAdmin, function (req, res, next) {
  var id = req.params.id;
  var mypath = 'public/product_images/' + id;
  fs.remove(mypath, function (err) {
    if (err) {
      console.log(err);
    } else {
      Product.findByIdAndRemove(id, function (err) {
        console.log(err);
      });
      req.flash('succes', 'Sản phẩm đã bị xóa!');
      res.redirect('/admin/products');
    }
  });
});


module.exports = router;
