let express = require('express');
let router = express.Router();

// home route
router.get("/", function(req, res, next){
    res.locals.page = 'Home';
    res.render('home');
});

module.exports = router;