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

// kaakuna modules
var home = require('./routes/home');

var app = express();
var env = app.get('env');
var db = require('./config/app.config')[env].db.url();

/*if (env !== 'production') {
    // config app
}*/

mongoose.set('useNewUrlParser', true);
mongoose.connect(db, {autoIndex: false}, () => {
   console.log(`Connected with DataBase: %s`, db);
});

// view engine setup
app.set('view engine', 'ejs');
app.set("views", path.resolve(__dirname, "views"));

// middlewares
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validator());

var sessStore = new MongoDBStore({ uri: db, collection: 'sessStore' });
// Catch errors
sessStore.on('error', function(error) {
    console.log(error);
  });
var sess = {
        resave: false,
        saveUninitialized: false,
        secret: '7hbt72E1nJ5ob4VmPEI1659',
        store: sessStore,
        cookie: { maxAge: 180 * 60 * 1000 } // Maximum Time Session: Minutes * Seconds * Miliseconds
    }

if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sess.cookie.secure = auto; // serve secure cookies
}

require('./config/passportSetup')();

app.use(session(sess));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
    res.locals.notProd = env !== 'production';
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session;
    if (res.locals.login) {
        res.locals.user = req.user;
        res.locals.vendor = req.user.status === 'vendor';
        res.locals.store_mgr = req.user.status === 'store-manager';
    }
    console.log(res.locals)
    next();
});

app.use("/", home);

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

app.listen(3000, function(){console.log('Listening on 3000')});
// module.exports = app;