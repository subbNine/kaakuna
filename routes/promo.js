var express = require('express');
var router = express.Router();

var Product = require('../models/products');
var Promo = require('../models/promo');

/* GET home page. */
router.get('/all', isStaff, promo, product, function(req, res, next) {
    var errMsg = req.flash('error');
    var sucMsg = req.flash('success');

    res.render('promo/index', {
        title: 'Promotions',
        errMsg: errMsg,
        hasError: errMsg.length > 0,
        sucMsg: sucMsg,
        hasSuccess: sucMsg.length > 0
    });
});

// Create
router.post('/', isStaff, promo, function(req, res, next) {
    var promo = new Promo(req.body);
    promo.save((err, result) => {
        if (err) {
            next(err);
        }
        req.flash('success', `Promo "${result.title} had been created!"`);
        res.redirect('/promo/all');
    });
});

// Delete
router.post('/del', isStaff, function(req, res, next) {
    var promoId = req.body.id;
    Promo.findByIdAndRemove(promoId, (err, result) => {
        if (err) {
            return next(err);
        }
        req.flash('success', `Promo "${result.title}" had been deleted`);
        res.redirect('/dashboard');
    });
});

// Get by Id
router.get('/:id', isStaff, promo, product, function(req, res, next) {
    var errMsg = req.flash('error');
    var sucMsg = req.flash('success');

    var checked = [],
        unchecked = [];
    res.locals.products.forEach(function(product) {
        if (res.locals.promos.products.indexOf(product._id) == -1) {
            unchecked.push(product);
        } else {
            checked.push(product);
        }
    });

    res.render('promo/description', {
        title: 'Description',
        checked,
        unchecked,
        errMsg: errMsg,
        hasError: errMsg.length > 0,
        sucMsg: sucMsg,
        hasSuccess: sucMsg.length > 0
    });
});

// Update
router.post('/:id', isStaff, function(req, res, next) {
    var promoId = req.params.id;
    var newPromo = req.body;
    Promo.findByIdAndUpdate(promoId, newPromo, (err, result) => {
        if (err) {
            return next(err);
        }
        req.flash('success', `Promo "${result.title}" had been updated!`);
        res.redirect('/promo' + req.url);
    });
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        req.session.oldUrl = null;
        return next();
    }
    req.session.oldUrl = '/shop' + req.url;
    res.redirect('/user/signin');
}

function isStaff(req, res, next) {
    if (res.locals.staff || res.locals.admin) {
        return next();
    }
    req.flash('error', 'You should be login and you must be a staff');
    res.redirect('/');
}

function filter(products, body, field) {
    products = products.filter(function(prod) {
        console.log(typeof body[field] != 'string');
        console.log(prod[field]);
        if (typeof body[field] != 'string') {
            var bool = true;
            body[field].forEach(function(platform) {
                if (prod[field].indexOf(platform) == -1) {
                    bool = false;
                }
            }, this);
            return bool;
        } else {
            console.log(prod[field].indexOf(body[field]) != -1);
            return prod[field].indexOf(body[field]) != -1;
        }
    });
    console.log(`filtered by ${field}`);
    return products;
}

function data(str, err, data, req, res, next) {
    if (err) {
        return next(err);
    }
    res.locals[str] = data;
    res.status(200);
    return next();
}

function promo(req, res, next) {
    if (req.params.id) {
        Promo.findById(req.params.id, (err, promos) => data('promos', err, promos, req, res, next));
    } else {
        Promo.find((err, promos) => data('promos', err, promos, req, res, next));
    }
}

function product(req, res, next) {
    Product.find(function(err, products) {
        data('products', err, products, req, res, next);
    });
}





router.get('/promo/:id', isLoggedIn, isStaff, function(req, res, next) {
    var promoId = req.params.id;
    res.locals.promos = res.locals.promos.filter(PROMO => {
        return PROMO._id.toString() == promoId.toString();
    })[0];
    console.log(res.locals.promos);
    res.render('dashboard/promo', {
        title: 'Promo'
    });
});

router.post('/promo/del', isLoggedIn, isStaff, function(req, res, next) {
    var promoId = req.body.id;
    Promo.findByIdAndRemove(promoId, (err, result) => {
        if (err) {
            next(err);
        }
        console.log("Delete");
    });
    res.redirect('/dashboard');
});

router.get('/newpromo', isLoggedIn, isStaff, function(req, res, next) {
    res.render('dashboard/newpromo', {
        title: 'New Promo'
    });
});

router.post('/newpromo', isLoggedIn, isStaff, function(req, res, next) {
    var promo = new Promo(req.body);
    promo.save((err, result) => {
        if (err) {
            next(err);
        }
        console.log(result);
    });
    res.redirect('/dashboard');
});