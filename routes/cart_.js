var express = require('express');
var router = express.Router();
var Cart = require('../models/cart');

// var Product = require('../models/products');
// var Order = require('../models/order');

/* GET Cart page. */
router.get('/', function(req, res, next) {
    if (!req.session.cart) {
        return res.render('shop/shopping-cart', {
            products: null,
            title: 'Cart'
        });
    }
    var cart = new Cart(req.session.cart);
    res.render('shop/shopping-cart', {
        products: cart.generateArray(),
        totalPrice: cart.totalPrice,
        title: 'Cart'
    });
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
    // res.redirect('/cart');
});

/* Remove Product from Cart. */
router.get('/remove/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeItem(productId);
    if (cart.totalQty <= 0) {
        req.session.cart = null;
    } else {
        req.session.cart = cart;
    }
    // res.redirect('/cart');
});

/* GET Checkout page. */
router.get('/checkout' /*, isLoggedIn*/ , function(req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/cart');
    }
    if (req.user) {
        var name = req.user.username;
        var address = req.user.address;
        if (address.city != '') {
            address = `${address.building} ${address.street} str., ${address.appartament} ${address.city}/${address.region} ${address.zip} ${address.country}`;
        } else {
            address = null;
        }
    } else {
        var name = 'Guest';
        var address = null;
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    res.render('shop/checkout', {
        total: cart.totalPrice,
        title: 'Checkout',
        errMsg: errMsg,
        noErrors: !errMsg,
        address: address,
        name: name
    });
});

/* POST Checkout page. */
router.post('/checkout' /*, isLoggedIn*/ , function(req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/cart');
    }
    var cart = new Cart(req.session.cart);

    var stripe = require("stripe")(
        "sk_test_Zob6eWLmep5SIgaJiij1W0SD"
    );

    var items = cart.generateArray();
    var productIds = cart.productIds();

    Product.find({
        _id: {
            $in: productIds
        },
        stock: { 
            $gt: cart.minQty() - 1 
        }
    }, (err, result) => {
        if (err) {
            return next(err);
        }
        var qtyAvailableProducts = result.length;
        var qtyNeedsProducts = cart.productIds().length;
        /**
         * Check available qty of each product in cart
         * May be someone bought all products faster
         */
        if (qtyAvailableProducts == qtyNeedsProducts) {
            stripe.charges.create({
                amount: Math.round(cart.totalPrice * 100),
                currency: "usd",
                source: req.body.stripeToken, // obtained with Stripe.js
                description: "Charge for sofia.taylor@example.com"
            }, function(err, charge) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect('/cart/checkout');
                }
                console.log(charge);

                var order = new Order({
                    userId: req.user ? req.user._id : null,
                    cart: cart,
                    address: req.body.address,
                    username: req.user ? req.user.username : req.body.name,
                    userStatus: req.user ? req.user.status : 'guest',
                    paymentId: charge.id
                });
                order.save((err, result) => {
                    if (err) {
                        next(err);
                    }
                    console.log(err);
                    console.log(result);
                    var items = result.cart.generateArray();
                    var i = items.length;

                    var timerId = setInterval(function() {
                        if (i > 0) {
                            var productId = items[i - 1].item._id;
                            var newProduct = items[i - 1].item;
                            console.log('Stock was: ' + newProduct.stock);
                            newProduct.stock -= items[i - 1].qty;
                            console.log('Stock is now: ' + newProduct.stock);
                            newProduct.purchases++;
                            console.log(`Total purchases of ${result.title} is: ${newProduct.purchases}`);
                            newProduct.sold += items[i - 1].qty;
                            console.log(`Total sold of ${result.title} is: ${newProduct.sold}`);
                            Product.findByIdAndUpdate(productId, newProduct, (err, result) => {
                                if (err) {
                                    next(err);
                                }
                                console.log(`Stock of ${result.title} updated!`);
                            });
                            i--;
                        } else {
                            clearInterval(timerId);
                            console.log(`Update completed!`);
                        }
                    }, 1);

                    req.flash('success', 'Successfully bought product!');
                    req.session.cart = null;
                    res.redirect('/shop');
                });
            });
        } else {
            if (qtyNeedsProducts > 1) {
                result.forEach(function(product) {
                    if (productIds.indexOf(product._id) == -1) {
                        req.flash('error', `Sorry, someone was faster then you and bought ${product.title}. Now available qty this product: ${product.stock}`)
                    }
                });
            } else {
                req.flash('error', `Sorry, someone was faster then you and bought ${result.title}. Now available qty this product: ${result.stock}`);
            }
            res.redirect('/cart');
        }
    });
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        req.session.oldUrl = null;
        return next();
    }
    req.session.oldUrl = '/cart' + req.url;
    res.redirect('/user/signin');
}
