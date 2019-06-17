var express = require('express');
var router = express.Router();
var passport = require('passport');
const { check, validationResult } = require('express-validator/check');
const { sanitizeParam } = require('express-validator/filter');

router.get('/', function(req, res){
    // console.log(`flash message: ${req.flash('error')}`);
    var errMsg = req.flash('error');
    // console.log(errMsg);
    var autoFill = req.flash('autoFill')[0];
    var redirectTo = req.session.oldUrl;
    
    // users cant see login/signup page if they have signed in
    if(res.locals.user || res.locals.login ){
        if(redirectTo){
            res.redirect(redirectTo);
        }else{
            res.redirect('/')
        }
    }else{
        // console.log(autoFill)
        res.render('sign-in', {page:'Account', 
                                message: errMsg, 
                                autoFill: autoFill
                            }
                );
    }
});

router.post('/signin', passport.authenticate('signin', {failureRedirect: '/account#signin',
    failureFlash: true}), 
    function(req, res) {
        if (req.session.oldUrl) {
            var redirectTo = req.session.oldUrl;
            res.redirect(redirectTo);
            // req.session.oldUrl = null;
        } else{
            res.redirect('/account/profile');
        }
    }
);

router.post('/signup', passport.authenticate('signup', {failureRedirect: '/account#signup',
    failureFlash: true}), 
    function(req, res, next) {
        if (req.session.oldUrl) {
            var redirectTo = req.session.oldUrl;
            res.redirect(redirectTo);
            // req.session.oldUrl = null;
        } else {
            res.redirect('/account/profile');
        }
    }
);


var states_and_lgas = require('../models/states_and_lgas');

var User = require('../models/users').User;

var Address = require('../models/users').Address; 

var Store = require('../models/store').Store;

var storeAddr = require('../models/store').Address;

var storeRoute = require('./store');

// define local variables for stores
// user must be signed in and must have privilleges to access this route
router.use('/store', isLoggedIn, function(req, res, next){ 
    const hasStores = req.user.stores;
    if(!hasStores){
        res.redirect('/account/profile#createstore') ;
        return;      
    }
    // res.locals.storeData = undefined;    
    return next();
}
, storeRoute);

router.get('/profile/store/search', isLoggedIn, function(req, res, next){
    var queryString = req.query.q
    // res.json(queryString);
    Store.findOne({url: queryString},'url', function(err, doc){
        if(doc){
            console.log('success');
            console.log(doc);
            return res.json({url: queryString, found: true});
        }else{
            return res.json({url: queryString, found: false});
        }
    });
});

router.get('/profile', isLoggedIn, function(req, res, next){
        Address.findById(req.user.address, function(err, addr){
            // console.log(addr)
            res.render('profile', {page:'profile', errors: undefined,
                                    // statestr: states_and_lgas[addr.state].state.name,
                                    // lgastr: states_and_lgas[addr.state].state.locals[addr.LGA].name,
                                    addr: addr, form: undefined,
                                    location: states_and_lgas});
        })
    }
);

router.post('/profile/user', isLoggedIn, [ 
    check('Fname').optional({checkFalsy: true}).trim().escape(),
    check('Lname').optional({checkFalsy: true}).trim().escape(),
    
    // Current password validation 
    check('PassCurr')
    .optional({checkFalsy: true})
    .custom((value, {req})=>{
        return new Promise(function(resolve, reject){
            req.user.checkPassword(value, (err, isMatch)=>{
                if(isMatch){
                    return resolve('isMatch')
                }
                else{
                    return reject('the password you have entered in current password is incorrect');
                }
            })
        })}
        
    ),

    // New Password validation
    check('PassConf', 'New Password field and confirm Password field dont match')
    .optional({checkFalsy: true})
    .custom((passwordConfirmation, {req})=>passwordConfirmation === req.body.PassNew),

    check('Tel').optional({checkFalsy: true})
    .isLength({min: 11, max: 11})
    .withMessage('Phone number should be 11 characters')
    .trim()
    .escape()
    ], function(req, res, next){
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            Address.findById(req.user.address, function(err, addr){
                console.log(errors.array())
                res.render('profile', {page:'profile', 
                                        // statestr: states_and_lgas[addr.state].state.name,
                                        // lgastr: states_and_lgas[addr.state].state.locals[addr.LGA].name,
                                        addr: addr,
                                        location: states_and_lgas, form: req.body, errors: errors.array() });
            })
            return;
        }else{
            var newFname = req.body.Fname;
            var newLname = req.body.Lname;
            var newTel = req.body.Tel;
            var newPass = req.body.PassNew;
            console.log(newFname, newLname, newTel, req.user);
            if(newPass){
                User.where({email:req.user.email})
                    .updateOne({$set:
                                    {name:
                                        {first:newFname, 
                                        last:newLname
                                        }, 
                                    telephone: newTel, 
                                    password: newPass
                                    }
                                }, 
                function(err, writeOpResult){
                    if(err){
                        console.log(err);
                        next(err);
                    }
                    if(writeOpResult){
                        console.log(writeOpResult);
                        res.redirect('/account/profile');
                    }
                })
            }else{
                User.where({email:req.user.email})
                    .updateOne({$set:{name:
                                        {first:newFname, 
                                        last:newLname
                                    }, 
                                    telephone:newTel
                                    }
                                }, 
                function(err, writeOpResult){
                    if(err){
                        console.log(err);
                        next(err);
                    }
                    if(writeOpResult){
                        console.log(writeOpResult);
                        res.redirect('/account/profile');
                    }
                })
            }
        }
    }
);

// the user is creating a new delivery address
router.use('/profile/address', isLoggedIn, [
    check('state', 'state should be an integer representaion states in the range 1-36')
    .optional({checkFalsy: true})
    .isInt({min:1, max:36})
    .trim()
    .escape(),
    check('lga', 'LGA should be an integer representaion LGA')
    .optional({checkFalsy: true})
    .isInt({min:1})
    .trim()
    .escape(),
    check('streetAddress')
    .optional({checkFalsy: true})
    .isLength({min: 3})
    .withMessage('please enter a valid street address')
    .trim()
    .escape(),
    check('city')
    .optional({checkFalsy: true})
    .isLength({min: 1})
    .withMessage('please enter a valid street address')
    .trim()
    .escape(),    
    check('postalCode').optional({checkFalsy: true}).isInt().withMessage('please enter a valid postal code').trim().escape(),
    check('closestLandmark').optional({checkFalsy: true}).trim().escape()

], function(req, res, next){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        Address.findById(req.user.address, function(err, addr){
            console.log(errors.array())
            res.render('profile', {page:'profile', 
                                    // statestr: states_and_lgas[addr.state].state.name,
                                    // lgastr: states_and_lgas[addr.state].state.locals[addr.LGA].name,
                                    hashpath: 'deliveryaddress',
                                    addr: addr,
                                    location: states_and_lgas, form: req.body, errors: errors.array() });
        })
        return;
    }else{
        next();
    }
});

router.post('/profile/address', isLoggedIn, function(req, res, next){
    var state = req.body.state;
    var lga = req.body.lga;
    var city = req.body.city;
    var streetAddress = req.body.streetAddress;
    var postalCode = req.body.postalCode;
    var closestLandmark = req.body.closestLandmark;
    var newAddr = new Address({state: state, city: city, LGA:lga, streetAddress: streetAddress, 
        postalCode: postalCode, closestLandmark: closestLandmark, user: req.user._id});

    newAddr.save(function(err, addr){
        if(err){
            return next(err)
        };
        User.where({email: req.user.email})
            .updateOne({$set:{address: addr._id}}, 
            function(err, writeOpResult){
                if(err){
                    console.log(err);
                    next(err);
                }
                if(writeOpResult){
                    // console.log(writeOpResult);
                    // req.session.userAddress = addr;
                    res.redirect('/account/profile#deliveryaddress');
                }
            }
        );
    });
    
    // res.render('profile', {page:'profile'});
    }
);

// var mongoose = require('mongoose');
// console.log('mongoose object id ', mongoose.ObjectId())
// the user is updating their delivery address
router.post('/profile/address/:id',isLoggedIn, function(req, res){
    var state = req.body.state;
    var lga = req.body.lga;
    var city = req.body.city;
    var streetAddress = req.body.streetAddress;
    var postalCode = req.body.postalCode;
    var closestLandmark = req.body.closestLandmark;
    Address.where({_id: req.params.id}).updateOne({$set:{state: state, city: city, LGA:lga, streetAddress: streetAddress, 
        postalCode: postalCode, closestLandmark: closestLandmark}}, function(err, writeOpResult){
        if(err){
            console.log(err);
            next(err);
        }
        if(writeOpResult){
            console.log(writeOpResult);
            // req.session.userAddress = addr;
            res.redirect('/account/profile#deliveryaddress');
        }
    })
});

router.post('/profile/store', isLoggedIn, [check('bizUrl').isLength({min: 1})
    .withMessage('the store url field should not be left blank')
    .custom(value => {  
        if(value && value.split(' ')>1){
            return Promise.reject('store URLs should not contain space character');
        }  
        return new Promise((resolve, reject)=>{
            Store.findOne({url: value},'url', function(err, doc){
                if(doc){
                    console.log('success');
                    console.log(doc);
                    return reject('the store url you\'ve enterd is not available');
                }else{
                    return resolve();
                }
            });
        })
    })
    .trim()
    .escape()
    ,   check('bizEmail','the value you entered for email is not valid')
        .isEmail()
        .normalizeEmail()
        ,
        check('bizTel')
        .isLength({min: 11, max: 11})
        .withMessage('Phone number should be 11 characters')
        .trim()
        .escape()
        ,
        check('storeState', 'state should be an integer representaion of states in the range 1-36')
        .isInt({min:1, max:36})
        .trim()
        .escape(),
        check('storeLga', 'LGA should be an integer representaion LGA')
        .isInt({min:1})
        .trim()
        .escape(),
        check('bizAddr')
        .isLength({min: 3})
        .withMessage('please enter a valid street address')
        .trim()
        .escape(),
        check('storeCity')
        .isLength({min: 1})
        .withMessage('please enter a valid street address')
        .trim()
        .escape(),
        check('bizName')
        .isLength({min: 1})
        .withMessage('please enter a valid business name')
        .trim()
        .escape()    
    ], 
    function(req, res, next){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        Address.findById(req.user.address, function(err, addr){
            console.log('errors array', errors.array())
            console.log('errors obj', errors)
            res.render('profile', {page:'profile', 
                                    // statestr: states_and_lgas[addr.state].state.name,
                                    // lgastr: states_and_lgas[addr.state].state.locals[addr.LGA].name,
                                    // hashpath: 'deliveryaddress',
                                    addr: addr,
                                    location: states_and_lgas, form: req.body, errors: errors.array() });
        })
        return;
    }
    var bizName = req.body.bizName;
    var bizTel = req.body.bizTel;
    var bizEmail = req.body.bizEmail;
    var bizState = req.body.storeState;
    var bizLga = req.body.storeLga;
    var bizCity = req.body.storeCity;
    var bizStreet = req.body.bizAddr;
    var bizUrl = req.body.bizUrl;

    if(validateSelectFields(bizState) && validateSelectFields(bizLga)){
        var newStore = new Store({name: bizName, vendor: req.user._id, url: bizUrl, email: bizEmail});
        newStore.business_phone.push(bizTel);

        var newStoreAddr = new storeAddr({state: bizState, 
                                          city: bizCity, 
                                          LGA: bizLga, 
                                          streetAddress: bizStreet, 
                                          store: newStore._id,
                                          created_on: new Date()});
        newStore.business_address.push(newStoreAddr._id);
        newStore.save(function(err){    // save new store document
            if(!err){
                newStoreAddr.save(function(err){    // save stores address
                    if(!err){

                        User.findById(req.user._id, function(err, doc){
                            if(doc.stores===undefined){
                                doc.stores = []
                            }
                            doc.stores.push({storeid: newStore._id, storename: newStore.name, role: 'vendor'});
                            
                            doc.save(function(err){
                                if(!err){
                                    res.redirect('/account/store/'+newStore._id);
                                }else{next(err)}
                            })
                        })
                        
                    }else{
                        next(err);
                    }
                })
            }else{
                next(err)
            }
        })
    }else{next()}
});

// router.get('/profile/store/:storeid', isLoggedIn, function(req, res, next){
//     const storeid = req.param.storeid;
//     console.log(storeid)
//     res.render('store', {page: 'store'});
// });

router.get('/logout', isLoggedIn, function(req, res, next) {
    // req.session.destroy();
    console.log(req.logOut)
    req.logOut();
    res.redirect(req.session.oldUrl||'/');
});


// validate select fields
function validateSelectFields(val){
    return !!(typeof(val)==='string' && !val.match(/-+Select \w+-+/)); 
}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/account');
}

module.exports = router;