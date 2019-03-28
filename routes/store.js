// store.js contains logic to manage stores and store owners
// and setup stores
const fs = require('fs');
const path = require('path');
let express = require('express');
let router = express.Router();
var mongoose = require('mongoose')
const { check, validationResult } = require('express-validator/check');
const { sanitizeParam } = require('express-validator/filter');
const formidable = require('formidable');
const serveStoreImgs = express.Router();
// const Store = require('../models/store').Store;

const {
    Store: Store, 
    Address: StoreAddress, 
    item: Product, 
    itemCategory: ProductCategory, 
    itemSubCategory: ProductSubCategory} = require('../models/store');

// console.log(Product)

// this middleware will restrict users who arent store owners
// from having admin access to a store page
router.use('/:storeid', 
    function(req, res, next){

        const storeid = req.params.storeid;
        const stores = req.user.stores;
        
        // the owner of a store is one who has storeid equal to
        // the storeid retrived in params he is about to access
        store = stores.find((store)=>store.storeid == storeid)
        if(store != undefined){
            Store.findById(store.storeid, function(err, storeRes){
                if(err) return next(err);
                // complete refernce object to the store object 
                res.locals.store = storeRes;
                // console.log('HUGE', res.locals)
            });
            // user's refernce object to the store object 
            // contains => storeid, storename, role
            // res.locals.currentStore = store;
            return next();
        }
    
    // 404 error page
    res.status(404).send('page not found');
    return;
    // 
    }
);

// this route will handle serving every image required on the store
// serveStoreImgs.get('/:imageName', function(req, res,next){
    

// });

router.get('/:storeid/images/:imageName', function(req, res, next){
    var imageName = req.params.imageName;
    var store = req.params.storeid
    console.log('HUGE', store)
    var dataDirectoryRoot = req.dataDirectoryRoot;
    res.sendFile(path.join(dataDirectoryRoot, store, imageName))
});

router.get('/:storeid', function(req, res, next){
    const storeid = req.params.storeid;
    res.locals.products = undefined;
    
    // get store information
    

    Product.where('store').equals(storeid).exec(function(err, products){
        if(err){
            return next(err)
        }

        // something in products?
        if(products.length){
            // console.log('products: ', {page: 'store', products}, typeof products)
            res.render('vendor-store', {page: 'store', products, storeid})
        }
        else{
            res.render('vendor-store', {page: 'store', storeid})
        }
        
    })
})

// router.get('/:storeid/image/:imagepath', function(req, res, next){

// });

router.post('/:storeid/logo', function(req, res, next){
    var dataDirectoryRoot = req.dataDirectoryRoot;  // root directory for storing images

    var form  = new formidable.IncomingForm();

    var storeid =  req.params.storeid;

    // console.log(storeid)
    var storeDataDir = ''+storeid
    // console.log(storeDataDir)
    if(!fs.existsSync(path.join(dataDirectoryRoot, storeDataDir))){
        fs.mkdirSync(path.join(dataDirectoryRoot, storeDataDir));
    }

    form.parse(req, (err, fields, files) => {
        console.log(req.params.storeid)
        if (err) {
          console.error('Error', err);
          throw err;
        } 
                
        var newImgName = storeid+'_logo'
        var newImgPath = path.join(dataDirectoryRoot, storeDataDir, newImgName);
        var oldImgPath = files.file.path;
        fs.rename(oldImgPath, newImgPath, (err) => {
            if (err){return next(err)};
            console.log('Rename complete!');
            Store.findByIdAndUpdate(storeid, {logo_path: newImgName}, function(err){
                if(err){ return next(err)};
                return res.redirect(`/account/store/${storeid}`);
            })
        })
    });
});

// create or add store banner
router.post('/:storeid/banner', function(req, res){
    var dataDirectoryRoot = req.dataDirectoryRoot;  // root directory for storing images

    var form  = new formidable.IncomingForm();

    var storeid =  req.params.storeid;

    var response = {}

    // store files are saved in a directory named after the store's id
    // and images are named after the mongoose-objectid assigned to them
    var storeDataDir = ''+storeid

    // console.log(storeDataDir)
    if(!fs.existsSync(path.join(dataDirectoryRoot, storeDataDir))){
        fs.mkdirSync(path.join(dataDirectoryRoot, storeDataDir), {recursive: true});
    }

    form.parse(req, (err, fields, files) => {
        console.log(req.params.storeid)
        if (err) {
            response.success = false;
            response.message = 'something went wrong, please try again';
            return res.json(response);
        } 
        
        var storeDataDir = ''+storeid
        var newImgName = ''+mongoose.Types.ObjectId() // .Schema.Types.ObjectId;
        var newImgPath = path.join(dataDirectoryRoot, storeDataDir, newImgName);
        var oldImgPath = files.file.path;
        fs.rename(oldImgPath, newImgPath, (err) => {
            if (err){
                response.success = false;
                response.message = 'something went wrong, please try again';
                return res.json(response);
            };
            console.log('Rename complete!');
            Store.findById(storeid, function(err, doc){
                if(err){
                    response.success = false;
                    response.message = 'something went wrong, please try again';
                    return res.json(response);
                }
                if(doc.banner_image === undefined){
                    doc.banner_image = [];
                }
                doc.banner_image.push({path:newImgName});
                
                doc.save(function(err){
                    if(err){
                        response.success = false;
                        response.message = 'something went wrong, please try again';
                        return res.json(response);
                    }
                    response.success = true;
                    response.message = 'success'
                    res.json(response);
                })
            })    
        })
    });
});

module.exports = router;