'use strict'
let express = require('express');
let app = express();
app.get('/sign-in', function(req, res){
    res.render('sign-in');
});

app.get('/sign-in.html', function(req, res){
    res.render('sign-in');
});
