exports.isUser = function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash('danger', 'Vui lòng hãy đăng nhập.');
        res.redirect('/users/login');
    }
}

exports.isAdmin = function(req, res, next) {
    if (req.isAuthenticated() && res.locals.user.admin==1) {
        next();
    } else {
        req.flash('danger', 'Vui lòng hãy đăng nhập.');
        res.redirect('/users/login');
    }
}

