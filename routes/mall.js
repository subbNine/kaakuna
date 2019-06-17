const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const serveStoreImgs = express.Router();
const formidable = require('formidable')

const Cart = require('../models/cart');
const Promo = require('../models/promo');
const Order = require('../models/order');
const {item: Product} = require('../models/store')
const Review = require('../models/review');


router.get('/', product, function(req, res, next){
    var storeUrlName = res.locals.storeData.url;
    if(!req.session.cart){
        return res.render('store', {page: storeUrlName, cartItems: undefined, cartTotalPrice: undefined});
    }
    var cart = new Cart(req.session.cart);
    console.log(cart.generateArray())
    // [ { item:
    //     { category: 5ca34b6e98a83532b46599f6,
    //       quantity: 8,
    //       sold: 0,
    //       purchases: 0,
    //       _id: 5ca34c9d98a83532b46599fc,
    //       name: 'floral print button',
    //       description: 'free',
    //       price: 15,
    //       manufacturer: 'nexus',
    //       color: 'black',
    //       image_path: '5ca3a234f6de883868b9f470',
    //       store: 5ca34a2698a83532b46599ef,
    //       __v: 0 },
    //    qty: 61,
    //    price: 915 } ]

    return res.render('store', {page: storeUrlName, cartItems: cart.generateArray(), cartTotalPrice: cart.totalPrice})
});

router.use('/images', serveStoreImgs);

serveStoreImgs.get('/:imageName', function(req, res,next){
    var imageName = req.params.imageName;
    var storeData = res.locals.storeData
    var store = storeData._id;
    var dataDirectoryRoot = req.dataDirectoryRoot;
    res.sendFile(path.join(dataDirectoryRoot, ''+store, imageName))
    // console.log('mall')

});

router.post('/cart/:id', promo, product, addFields, function(req, res, next) {
    // console.log(res.locals);
    var form  = new formidable.IncomingForm();
    form.parse(req, (err, fields) => {
        // console.log(fields);
        var qty = fields.qty;
        var cart = new Cart(req.session.cart ? req.session.cart : {});
        cart.add(res.locals.product, res.locals.product._id, qty||1, res.locals.storeData.url);
        req.session.cart = cart;
        // console.log(req.session.cart)
        console.log(fields)
        return res.json({success: true})
    })
});

function data(str, err, data, req, res, next) {
    if (err) {
        return next(err);
    }
    res.locals[str] = data;
    // res.status(200);
    return next();
}

function addFields(req, res, next){
    var now = Date.now();
    if (res.locals.product) {
        // console.log(res.locals.product);
        var newArray = res.locals.product;
    } else {
        var newArray = res.locals.products;
    }
    newArray.forEach(function(product) {
        // indexOf would be better
        res.locals.promos.forEach(function(promo) {
            if (promo.products.indexOf(product._id) != -1) {
                if (promo.start <= now && promo.end >= now) {
                    product.discount = promo.discount;
                }
            }
        }, this);
        
        if (product.discount) {
            product.newPrice = +((product.price * ((100 - product.discount) / 100).toFixed(2)).toFixed(2));
        }
        if (res.locals.reviews && res.locals.reviews.length) {
            product.reviews = res.locals.reviews.filter(review => {
                return review.productId.toString() == product._id.toString();
            });
            if (product.reviews.length) {
                var rating = 0,
                    length = 0;
                product.reviews.forEach(function(review) {
                    if (review.total >= 0) {
                        rating += review.rating;
                        length += 1;
                    }
                }, this);
                if (length) {
                    product.rating = (rating / length).toFixed(1);
                }
            }
        }
    });
    if (res.locals.product) {
        res.locals.product = newArray[0];
    } else {
        res.locals.products = newArray;
    }
    // res.status(200);
    return next();
}

function promo(req, res, next) {
    Promo.find((err, promos) => data('promos', err, promos, req, res, next));
}

function review(req, res, next) {
    if (req.params.id) {
        Review.find({ productId: req.params.id }, (err, reviews) => data('reviews', err, reviews, req, res, next));
    } else {
        Review.find((err, reviews) => data('reviews', err, reviews, req, res, next));
    }
}

function product(req, res, next) {
    if (req.params.id) {
        Product.find({ _id: req.params.id }, function(err, products) {
            data('product', err, products, req, res, next);
        });
    } else {
        Product.find({store: res.locals.storeData._id}, function(err, products) {
            data('products', err, products, req, res, next);
        });
    }
}

module.exports = router