var passport = require('passport');
var User = require('../models/users').User;
var LocalStrategy = require('passport-local').Strategy;

module.exports = function(){
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
}

passport.use('signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
    }, function(req, email, password, done) {
    req.checkBody('fname', 'Please enter a value into the first name field').notEmpty().trim().escape().isLength({min:1})
    req.checkBody('lname', 'Please enter a value into the last name field').notEmpty().trim().escape().isLength({min:1})
    req.checkBody('email', 'Invalid email').notEmpty().isEmail().normalizeEmail();
    req.checkBody('phone', 'phone number should be 11 characters').notEmpty().trim().escape().isLength({min:11, max:11})
    req.checkBody('password', 'password should be atleast 6 characters long').notEmpty().isLength({ min: 6 });
    var errors = req.validationErrors();
    if (errors) {
        var messages = [];
        errors.forEach(function(error) {
            // console.log('error is:   ', error)
            // console.log(`errors signup:  ${error}`);
    
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }
    User.findOne({ 'email': email }, function(err, user) {
        if (err) {
            return done(err);
        }
        if (user) {
            // autofill input fields when signup fails
            req.flash('autoFill', {signUpAutoFill: req.body});

            return done(null, false, { message: `Email is already in use.` });
        }
        var fname = req.body.fname;
        var lname = req.body.lname;
        var telephone = req.body.phone;
        console.log(fname, lname, telephone)
        var newUser = new User({email:email.toLowerCase(), password:password, name:{first:fname, last:lname}, telephone:telephone});
        // newUser.email = email;
        // newUser.password = password;
        newUser.save(function(err, user) {
            if (err) {
                return done(err);
            }
            return done(null, user);
        });
    });
}));


// console.log('config passport module');
passport.use('signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
 }, function(req, email, password, done) {
    req.checkBody('email', 'email you entered is invalid').notEmpty().isEmail().normalizeEmail();
    req.checkBody('password', 'you have entered a wrong password').notEmpty().isLength({ min: 6 });
    var errors = req.validationErrors();
    // console.log(`errors: ${errors}`);
    if (errors) {
        var messages = [];
        errors.forEach(function(error) {
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }
    User.findOne({ 'email': email }, function(err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            // req.flash('error', 'No user found.');
            return done(null, false, { message: `No user found.` });
        }
        user.checkPassword(password, function(err, isMatch) {
            if (err) { return done(err); }

            if (isMatch) {
                return done(null, user); 
            } else {
                // autofill input fields when signin fails
                req.flash('autoFill', {signInAutoFill: req.body});
                return done(null, false,{ message: "you have entered a wrong password"}); 
            }
        })
    });
}));
// module.exports = passport;