const fs = require('fs');
const path = require('path');
const express = require('express');
const mallRouter = express.Router();
const serveStoreImgs = express.Router();

mallRouter.get('/', function(req, res, next){
    var storeUrlName = res.locals.storeData.url
    res.render('store', {page: storeUrlName});
});

serveStoreImgs.get('/:imageName', function(req, res,next){
    var imageName = req.params.imageName;
    var storeData = res.locals.storeData
    var store = storeData._id;
    var dataDirectoryRoot = req.dataDirectoryRoot;
    res.sendFile(path.join(dataDirectoryRoot, ''+store, imageName))

});

mallRouter.use('/images', serveStoreImgs)

module.exports = mallRouter