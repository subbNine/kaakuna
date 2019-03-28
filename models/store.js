var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var userSchema = require('users').Users

const storeAddress = new Schema({
    state: String,
    city: String,
    LGA: String,
    streetAddress: String,
    store: {type: Schema.Types.ObjectId, ref: 'store'}
});

const store = new Schema({
    name: String,
    url: {type: String, unique: true, lowercase: true},
    email: String,
    vendor: {type: Schema.Types.ObjectId, ref:'userSchema'},
    business_address: [{type: Schema.Types.ObjectId, ref: 'storeAddress'}],
    business_phone: [{type: String}],
    store_manager: [{type: Schema.Types.ObjectId, ref: 'userSchema'}],
    banner_image: {type:[{path: String}], default: undefined},
    logo_path: String,
    description: String,
    tags:[{type: String}]
});

// store.virtuals('bannerI').get

const storeItemSubCategory = new Schema({
    category: {type: Schema.Types.ObjectId, ref: 'storeItemCategory'},
    store: {type: Schema.Types.ObjectId, ref: 'store'},
    name: {type: String, lowercase: true}
});

const storeItemCategory = new Schema({
    category_name: {type: String, lowercase: true},
    image_path: String,
    icon_class: String,
    store: {type:Schema.Types.ObjectId, ref: 'store'},
    subCategories:{type:[ storeItemSubCategory
            // {subcategory:{
            //     type:Schema.Types.ObjectId, 
            //     ref: 'storeItemSubCategory'
            //     }, 
            // subcategory_name: String
            // }
        ]
    }
});

const storeItem = new Schema({
    name: String,
    description: String,
    category: {type: Schema.Types.ObjectId, ref: 'StoreItemSubCategory'},
    price: Number,
    manufacturer: String,
    color: String,
    image_path: String,
    store: {type: Schema.Types.ObjectId, ref: 'store'}
});

const itemCategory = mongoose.model('storeItemCategory', storeItemCategory)
const itemSubCategory = mongoose.model('storeItemSubCategory', storeItemSubCategory)
const item = mongoose.model('storeItem', storeItem)
const address = mongoose.model('storeAddress', storeAddress)
const Store =  mongoose.model('store', store);

module.exports = {};
module.exports.Store = Store;
module.exports.Address = address;
module.exports.item = item;
module.exports.itemCategory = itemCategory;
module.exports.itemSubCategory = itemSubCategory;