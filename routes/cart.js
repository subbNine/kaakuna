const express = require('express');
const router = express.Router();

const Cart = require('../models/cart');

router.get('/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart.increaseByOne(productId);
    req.session.cart = cart;
    return res.json({success: true});
});

/* Reduce Products Qty by One from Cart. */
router.get('/reduce/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.reduceByOne(productId);
    if (cart.totalQty <= 0) {
        req.session.cart = null;
    } else {
        req.session.cart = cart;
    }
    return res.json({success: true});
    // res.redirect('/cart');
});

/* Remove Product from Cart. */
router.get('/remove/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    var item = cart.items[productId];
    cart.removeItem(productId);
    if (cart.totalQty <= 0) {
        req.session.cart = null;
    } else {
        req.session.cart = cart;
    }
    return res.json({item});
    // res.redirect('/cart');
});

module.exports = router