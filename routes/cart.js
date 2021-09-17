var express = require('express');
var router = express.Router();

var Product = require('../models/product');


/* GET add product to cart */
router.get('/add/:product', function(req, res, next) {
  var slug = req.params.product;

  Product.findOne({ slug }, function(err, p) {
    if (err) {
      console.log(err);
    };
    if (typeof req.session.cart === "undefined") {
      // Nếu giỏ hàng rỗng thì khởi tạo mới
      req.session.cart = []; // Khởi tạo mảng
      // Thêm hàng vào giỏ hàng
      req.session.cart.push({
        title: slug,
        qty: 1, // Số lượng
        price: parseFloat(p.price).toFixed(2),
        image: '/product_images/' + p._id + '/' + p.image
      })
    } else { // Nếu có hàng trong giỏ thì thêm vô nữa
      var cart = req.session.cart;
      var newItem = true;
      for (var i = 0; i < cart.length; i++) { // Nếu hàng đã có thì tăng số lượng thôi
        if (cart[i].title == slug) {
          cart[i].qty++;
          newItem = false; // Đánh dấu không phải là hàng mới
          break;
        }
      }
      // Nếu hàng mới thì thêm vô giỏ hàng (đang có hàng)
      if (newItem) {
        cart.push({
          title: slug,
          qty: 1,
          price: parseFloat(p.price).toFixed(2),
          image: '/product_images/' + p._id + '/' + p.image
        });
      }
    }
    console.log(req.session.cart);
    req.flash('success', 'Sản phẩm đã được thêm vào!')
    res.redirect('back');
  });
});

// Get checkout page
router.get('/checkout', function(req, res, next) {
  if (req.session.cart && req.session.cart.length == 0) {
    delete req.session.cart;
    res.redirect('/cart/checkout');
  } else {
    res.render('checkout', {
      title: 'Checkout',
      cart: req.session.cart
    });
  }
});

// Get update product

router.get('/update/:product', function(req, res, next) {

  var slug = req.params.product;
  var cart = req.session.cart;
  var action = req.query.action;

  for (let i = 0; i < cart.length; i++) {
    if(cart[i].title == slug) {
      switch (action) {
        case "add":
          cart[i].qty++;
          break;
        case "remove":
          cart[i].qty--;
          if(cart[i].qty < 1 ) cart.splice(i, 1);
          break;
        case "clear":
          cart.splice(i, 1);
          if(cart.length == 0) delete req.session.cart;
          break;
        default:
          console.log('Cập nhật có vấn đề.');
          break;
      }
      break;
    }
  }

  req.flash('success', 'Đã cập nhật giỏ hàng thành công!');
  res.redirect('/cart/checkout');
});

// Get clear cart
router.get('/clear', function(req, res, next) {
  delete req.session.cart;

  req.flash('success', 'Đã xóa giỏ hàng !');
  res.redirect('/cart/checkout');

});

router.get('/buynow', function(req, res, next) {
  delete req.session.cart;

 res.sendStatus(200);
});

module.exports = router;
