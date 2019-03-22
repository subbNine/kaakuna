

var express = require('express');

var app = express();

app.set('view engine', 'ejs')

app.use('/', require('./routes/home'));



app.listen(33000);