let express = require('express');
let router = express.Router();

// home route
router.get("/", function(req, res, next){
    console.log(`req.url is ${req.url}`);
    res.locals.page = 'Home';
    res.render('home');
});

module.exports = router;