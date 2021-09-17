var express = require('express');
var router = express.Router();

var Page = require('../models/page');

/* GET page home */
router.get('/', function(req, res, next) {
  Page.findOne({ slug: 'home'}, function(err, page) {
    if (err) {
      console.log(err);
    }
    res.render("index", {
     title: page.title,
      content: page.content,
     image: page.image,
      _id: page._id
    });
  })
});

/* GET a page */
router.get('/:slug', function(req, res, next) {
  var slug = req.params.slug;

  Page.findOne({ slug: slug }, function(err, page) {
    if (err)
      console.log(err);
    if (!page) {
      res.redirect('/');
    } else {
    res.render("index", {
      title: page.title,
      content: page.content,
      image: page.image,
      _id: page._id
      });
    }
  })
});

module.exports = router;
