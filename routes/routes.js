let express = require('express');
let router = express.Router();

// home route
router.get("/", function(req, res, next){
    console.log(`req.url is ${req.url}`);
    res.locals.page = 'Home';
    res.render('home');
});

var passport = require('passport')

router.get('/account', function(req, res){
    res.locals.page = 'Account';
    console.log(`req.url`);
    console.log(`${req.session.oldUrl}`)
    var redirectTo = req.session.oldUrl;
    if(res.locals.user && res.locals.login){
        res.redirect(redirectTo);
    }else{
        res.render('sign-in');
    }
});

router.post('/account/signin', passport.authenticate('local', {failureRedirect: '/account',
    failureFlash: true}), 
    function(req, res, next) {
        if (req.session.oldUrl) {
            var redirectTo = req.session.oldUrl;
            res.redirect(redirectTo);
            req.session.oldUrl = null;
        } else {
            res.redirect('/');
        }
    }
);

module.exports = router;