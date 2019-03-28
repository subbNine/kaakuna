// store.js contains logic to manage stores and store owners
// and setup stores
const fs = require('fs');
const path = require('path');
let express = require('express');
let router = express.Router();
var mongoose = require('mongoose')
const formidable = require('formidable');
// const Store = require('../models/store').Store;

const {
    Store: Store, 
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
            Store.findById(store.storeid, function(err, store){
                if(err) return next(err);
                // complete refernce object to the store object 
                res.locals.store = store;
            });

            ProductCategory.find({store: storeid}, 'category_name _id', function(err, cat){
                if(err) return next(err);
                // console.log(cat)
                res.locals.categories = cat;
                
            });

            return next();
        }
    
    // 404 error page
    res.status(404).send('page not found');
    return;
    // 
    }
);

router.get('/:storeid/images/:imageName', function(req, res){
    var imageName = req.params.imageName;
    var store = req.params.storeid
    var dataDirectoryRoot = req.dataDirectoryRoot;
    res.sendFile(path.join(dataDirectoryRoot, store, imageName))
});

router.get('/:storeid', function(req, res, next){
    const storeid = req.params.storeid;
    res.locals.products = undefined;
    // console.log(res.locals)
    
    Product.where('store').equals(storeid).exec(function(err, products){
        if(err){
            return next(err)
        }

        ProductCategory.find({store: storeid}, 'category_name _id', function(err, cat){
            if(err) return next(err);
            // console.log(cat)
            categories = cat;
            // console.log(cat)
            // something in products?
            if(products.length){
                // console.log('products: ', {page: 'store', products}, typeof products)
                res.render('vendor-store', {page: 'store', categories: categories, products, storeid})
            }
            else{
                res.render('vendor-store', {page: 'store', categories: categories, storeid})
            }
            
        });
        
    })
})

// create or change store logo
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

router.post('/:storeid/cat',
    function(req, res){
        // console.log(res.locals)
        var dataDirectoryRoot = req.dataDirectoryRoot;  // root directory for storing images

        var form  = new formidable.IncomingForm();

        var storeid =  req.params.storeid;
        
        var response = {};

        // console.log(res.locals)
        var storeDataDir = ''+storeid
        // console.log(storeDataDir)
        if(!fs.existsSync(path.join(dataDirectoryRoot, storeDataDir))){
            fs.mkdirSync(path.join(dataDirectoryRoot, storeDataDir), {recursive: true});
        }

        form.parse(req, (err, fields, files) => {
            var catName = fields.catName;
            if(!catName){
                response.success = false;
                response.message = 'please do not leave the category name field blank';
                return res.json(response);
            }

            // console.log(catName)
            if (err) {
                response.success = false;
                response.message = 'something went wrong, please try again';
                return res.json(response);
            } 

            // we dont want a store to have two or more categories with the same name
            ProductCategory.find({store: storeid, category_name: catName.toLowerCase()}, 'category_name', 
                function(err, cat){
                    if(cat && cat.length){
                        console.log(cat)
                        response.success = false;
                        response.message = "you already a category with that name";
                        return res.json(response);
                    }else{
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
                            // console.log('Rename complete!');
                            var productCategory = new ProductCategory({category_name: catName, image_path: newImgName, store: storeid});
                            
                            productCategory.save(function(err, category){
                                if(err) {
                                    response.success = false;
                                    response.message = 'something went wrong, please try again';
                                    return res.json(response);
                                   
                                }
                                response.success = true;
                                response.message = 'success'
                                response.data = {}
                                response.data.value = category._id
                                response.data.innerHtml = category.category_name
                                return res.json(response);
                                
                            });    
                        })
                    }
                }
            );
        });
    }
);

router.post('/:storeid/subcat',
    function(req, res){
        var categoryId = req.body.subcatCategory;
        var subCategoryName = req.body.subCatName;
        var storeid = req.params.storeid;
        var response = {};

        var form  = new formidable.IncomingForm();
        form.parse(req, (err, fields) => {
            categoryId = fields.subcatCategory;
            subCategoryName = fields.subCatName;
            console.log(categoryId, subCategoryName)
            if(!subCategoryName){
                response.success = false;
                response.message = 'please do not leave the sub category name field blank';
                return res.json(response);
            }
            
            ProductSubCategory.find({category: categoryId, name: subCategoryName.toLowerCase()}, function(err, subcats){
                if(err) return res.json({success: false, message: 'something went wrong please try again'});
                
                if(subcats && subcats.length){
                   return res.json({success: false, message: 'this category already has a sub category of name '+ subCategoryName}) 
                }
                ProductCategory.findById(categoryId, function(err, cat){
                    console.log('cat', cat)
                    if(cat && cat._id){
                        var productSubCategory = new ProductSubCategory({category: categoryId, store: storeid, name: subCategoryName})
                        productSubCategory.save(function(err, subcat){
                            cat.subCategories.push(subcat);
                            cat.save(function(){
                                response.success = true;
                                response.message = 'success';
                                return res.json(response)
                            });
                        });
                    }
                    else{
                        response.success = false;
                        response.message = 'category does not exist';
                        return res.json(response)
                    }
                });
            });
        })
    }
);

module.exports = router;