var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var mongoose = require('mongoose');
var session = require('express-session');
var validator = require('express-validator');
var passport = require('passport');
var flash = require('connect-flash');
var MongoDBStore = require('connect-mongodb-session')(session);
var debug = require('debug')('mongoose');
var port = process.env.PORT || 30000;

// kaakuna modules
var home = require('./routes/home');
var account = require('./routes/account');
var mall = require('./routes/mall')
const Cart = require('./models/cart');
const cartRoute = require('./routes/cart');

var app = express();

var env = app.get('env');
var db = require('./config/app.config')[env].db.url();

mongoose.set('useNewUrlParser', true);
mongoose.connect(db, {autoIndex: false}, () => {
   debug(`Connected with DataBase: %s`, db);
});

// view engine setup
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

// session db
var sessStore = new MongoDBStore({ uri: db, collection: 'sessStore' });
// Catch errors
sessStore.on('error', function(error) {
    // console.log(error);
  });

// session options
var sess = {
        resave: false,
        saveUninitialized: false,
        secret: '7hbt72E1nJ5ob4VmPEI1659',
        store: sessStore,
        cookie: { maxAge: 180 * 60 * 1000 } // Maximum Time Session: Minutes * Seconds * Miliseconds
    }

if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sess.cookie.secure = false; // serve secure cookies
}

// middlewares
app.use(pathToDataDirectory(path.join(__dirname, 'data', 'kaakuna')))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(validator());
app.use(session(sess));
require('./config/passportSetup')();
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('./public'));

app.use(function(req, res, next) {
    // data for all views
    // res.locals.notProd = env !== 'production';
    res.locals.loggedIn = req.isAuthenticated();
    res.locals.session = req.session;
    res.locals.user = req.user;
    // res.locals.hashpath = undefined;
    res.locals.storeData = undefined;
    // console.log(res.locals)
    if(req.session.cart){
        var cart = new Cart(req.session.cart);
        res.locals.cartItems = cart.generateArray()
        res.locals.cartTotalPrice = cart.totalPrice;
    }else{
        res.locals.cartItems = null;
        res.locals.cartTotalPrice = null;
    }
    next();
});

app.use(function(req, res, next){
    // get last page user visits before visiting the login/signup page
    var url = req.originalUrl;

    // match(/\/\b[^/]+\/assets\b/);
    // match(/\/\b[^/]*\/*assets\b/);
    
    // e.g /home/assets
    var staticRoute = url.match(/\/\b[^/]*\/*assets\b/);    
    
    // login page route
    var loginRoute = url.startsWith('/account');    
    
    // neglects routes like /a/b/c/assets but looks out for routes like
    // /a/assets (whose url we failed to make absolute) or /assets (static route)
    var isReallyStaticRoute = staticRoute? staticRoute.index===0: false;     

    // dont get urls of assets routes that miraculously bypassed the static middleware
    if(url && !(loginRoute || (staticRoute && isReallyStaticRoute) || url.indexOf('/images/')>0)){
        req.session.oldUrl = url;
    }
    next();
});

app.use('/cart', cartRoute)
app.use('/', home);
app.use('/account', account);
// app.use('/category', store);
app.use('/detail.html', function(req, res, next){
    res.render('detail')
})
app.use('/wishlist', function(req, res, next){
    res.render('my-wishlist')
})
app.use('/shopping-cart', function(req, res, next){
    res.render('shopping-cart')
})
app.use('/checkout.html', function(req, res, next){
    res.render('checkout')
})

const {
    Store: Store,  
    itemCategory: ProductCategory, 
    itemSubCategory: ProductSubCategory} = require('./models/store');

app.use('/:store_url_name', function(req, res, next){
    var storeUrlName = req.params.store_url_name.toLowerCase();;
    Store.findOne({url: storeUrlName}, 
        function(err, store){
            if(err) return next(err)
            
            if(store && store.url){
                console.log(store.url)
                res.locals.storeData = store;
                
                // fetch categories
                ProductCategory.find({store: store._id}, 
                    (err, cats)=>{
                        if(err) return next(err);
                        
                        res.locals.categories = cats;
                        var products = res.locals.products;
                        next();
                    }
                );                
            }
            else{
                // res.redirect('/')
                res.send(`404 PAGE`)
            }
        }
    );    
}, mall);


// catch 404
app.use('*', function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    
    // render the error page
    res.status(404);
    res.render('error', {
        title: `Error ${res.statusCode}`,
        message: err.message,
        error: err
    });
});

app.listen(port);

// a middleware function that will enable the user
// to set a path where to save user's data
function pathToDataDirectory(dataRoot){
    return function(req, res, next){
        req.dataDirectoryRoot = dataRoot;
        res.locals.dataDirectoryRoot = dataRoot;
        next();
    }
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/account');
}