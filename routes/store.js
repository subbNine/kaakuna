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

            if(!files.file.size){
                response.success = false;
                response.message = 'You have not uploaded any file';
                return res.json(response);  
            }
            if (err) {
                response.success = false;
                response.message = 'something went wrong, please try again';
                return res.json(response);
            } 

            // we dont want a store to have two or more categories with the same name
            ProductCategory.find({store: storeid, category_name: catName.toLowerCase()}, 'category_name', 
                function(err, cat){
                    if(cat && cat.length){
                        // console.log(cat)
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

router.get('/:storeid/subcat', 
    function(req, res, next){
        var query = req.query;
        // console.log('got query: ', query);
        ProductCategory.findById(query.category, 'subCategories', function(err, prodcat){
            if(prodcat && prodcat.subCategories){
                console.log(prodcat);
                if(prodcat.subCategories.length){
                    var subcats = prodcat.subCategories.map((subcat, subcatidx, subcats)=>{
                                    return {name:subcat.name, id: subcat._id}
                                }
                        );
                    console.log('subcat', subcats)
                    return res.json({success: true, data: subcats});
                }
                
                return res.json({success: true, data: []});
                
            }
            return res.json({success: false, data: []})
        });
    }
);

router.post('/:storeid/addprod', 
    function(req, res, next){
        var form = formidable.IncomingForm();
        var dataDirectoryRoot = req.dataDirectoryRoot;  // root directory for storing images
        var storeid = req.params.storeid;
        var storeDataDir = ''+storeid
        var response = {};

        if(!fs.existsSync(path.join(dataDirectoryRoot, storeDataDir))){
            fs.mkdirSync(path.join(dataDirectoryRoot, storeDataDir), {recursive: true});
        }

        form.parse(req, function(err, fields, files){
            var itemName = fields.itemName;
            var prodImg = files.prodImgInp;
            if(!itemName) return res.json({success: false, message: 'dont leave the <b>product name</b> field blank'})
        
            var itemPrice = fields.itemPrice;
            if(!itemPrice) return res.json({success: false, message: 'dont leave the <b>Price of Product</b> field blank'})

            var prodManf = fields.prodManf;
            if(!prodManf) return res.json({success: false, message: 'dont leave the <b>manufacturer of product</b> field blank'})

            var prodColor = fields.prodColor;
            if(!prodColor) return res.json({success: false, message: 'dont leave the <b>color of product</b> field blank'})

            var itemQty = fields.itemQty;
            if(!itemQty) return res.json({success: false, message: 'dont leave the <b>Item Quantity</b> field blank'});

            // console.log(files)
            var productDescription = fields.productDesc;
            if(!productDescription) return res.json({success: false, message: 'dont leave the <b>Product description</b> field blank'});

            var productCategoryId = fields.prodCategory;
            if(!productCategoryId) return res.json({success: false, message: 'dont leave the <b>Product Category</b> field blank'});
            
            // console.log({prodsubcat: req.checkBody('prodSubCategory')})
            // console.log({prodsubcatbody: req.body})

            var productSubCategoryId = fields.prodSubCategory;
            if(!productSubCategoryId){ 
                return res.json({success: false, message: 'dont leave the <b>Product sub category</b> field blank'});
            } else{

                // ensure that the subcategoryid from form field is valid and is registered  
                // under the category id found in the database
                ProductSubCategory.findOne({_id: productSubCategoryId, category: productCategoryId}, function(err, subcat){
                    if(subcat && subcat._id){
                        // this route serve product update and new product 
                        Product.findOne({name: itemName.toLowerCase(), 
                            category: productSubCategoryId, 
                            store: storeid, 
                            }, 
                            function(err, prod){
                                if (err){
                                    response.success = false;
                                    response.message = 'something went wrong, please try again';
                                    return res.json(response);
                                   
                                };
                                var storeDataDir = ''+storeid
                                var newImgName = ''+mongoose.Types.ObjectId() // .Schema.Types.ObjectId;
                                var newImgPath = path.join(dataDirectoryRoot, storeDataDir, newImgName);
                                var oldImgPath = prodImg.path;
                                if(prod && prod._id){
                                    // if an image is uploaded
                                    if(prodImg && prodImg.size){
                                        fs.rename(oldImgPath, newImgPath, (err) => {
                                            if (err){
                                                response.success = false;
                                                response.message = 'something went wrong, please try again';
                                                return res.json(response);
                                            
                                            }
                                            Product.where({name: itemName.toLowerCase(), 
                                                category: productSubCategoryId,
                                                store: storeid,
                                                })
                                                .updateOne(
                                                    {
                                                        name: itemName,
                                                        description: productDescription,
                                                        category: productSubCategoryId,
                                                        price: itemPrice,
                                                        manufacturer: prodManf,
                                                        color: prodColor,
                                                        image_path: newImgName,
                                                        quantity: itemQty,
                                                        store: storeid
                                                        
                                                    }, 
                                                    function(err, writeopres){
                                                        response.success = true;
                                                        response.message = 'product updated';
                                                        return res.json(response);
                                                    }
                                                )
                                            }
                                        )
                                    }else{
                                        Product.where({name: itemName.toLowerCase(), 
                                            category: productSubCategoryId,
                                            store: storeid,
                                            })
                                            .updateOne(
                                                {
                                                    name: itemName,
                                                    description: productDescription,
                                                    category: productSubCategoryId,
                                                    price: itemPrice,
                                                    manufacturer: prodManf,
                                                    color: prodColor,
                                                    quantity: itemQty,
                                                    store: storeid
                                                 
                                                }, 
                                                function(err, writeopres){
                                                    if(err) return res.json({success: false, message: 'something went wrong'})
                                                    console.log(writeopres)
                                                    if(writeopres.nModified){
                                                        response.success = true;
                                                        response.message = 'product updated';
                                                        return res.json(response);
                                                    }else{
                                                        response.success = false;
                                                        response.message = 'update not successful';
                                                        return res.json(response);
                                                    }
                                                }
                                            )
                                    }
                                    
                                }else{
                                    if(!(prodImg && prodImg.size && prodImg.type.match(/image\/[jpg|png|JPEG]/))){
                                        return res.json({success: false, message: 'You have not uploaded a product image'}); 
                                    }
            
                                    fs.rename(oldImgPath, newImgPath, (err) => {
                                        if (err){
                                            response.success = false;
                                            response.message = 'something went wrong, please try again';
                                            return res.json(response);
                                           
                                        };
                                        
                                        var product = new Product({
                                            name: itemName,
                                            description: productDescription,
                                            category: productSubCategoryId,
                                            price: itemPrice,
                                            manufacturer: prodManf,
                                            color: prodColor,
                                            image_path: newImgName,
                                            quantity: itemQty,
                                            store: storeid
                                            }
                                        );
                                        
                                        product.save(function(err, category){
                                            if(err) {
                                                response.success = false;
                                                response.message = 'something went wrong, please try again';
                                                return res.json(response);
                                               
                                            }
                                            response.success = true;
                                            response.message = 'success'
                                            // response.data = {}
                                            // response.data.value = category._id
                                            // response.data.innerHtml = category.category_name
                                            return res.json(response);
                                            
                                        });    
                                    })
                                }
                            }
                        );
                    }
                    else{
                        res.json({success: false, message: 'invalid category or sub category '});
                    }
                });
            }
        });
});

module.exports = router;