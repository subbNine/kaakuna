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
    tags:[{type: String}],
    created_on: Date
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
    name: {type: String, lowercase: true},
    description: String,
    category: {subcategory:{type: Schema.Types.ObjectId, ref: 'storeItemSubCategory'}, 
                category:{type: Schema.Types.ObjectId, ref: 'storeItemCategory'}},
    manufacturer: String,
    color: {type: String, lowercase: true},
    image_path: String,
    store: {type: Schema.Types.ObjectId, ref: 'store'},
    quantity: { type: Number, min: 0, default: 0 },
    price: { type: Number, min: 0, required: [true, 'Product should have a price!'] },
    // addons: { type: [addon], default: [] },
    sold: { type: Number, min: 0, default: 0 },
    purchases: { type: Number, min: 0, default: 0 },
    created_on: Date
    // discount: { type: Number, min: 0, max: 99, default: null }, // discount = promoArray[n] == productId && (start <= Date.now <= end)? num: null
    // reviews: { type: [review], default: [] }, // rating of product
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